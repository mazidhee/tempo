import type Database from '../database/sqlite';
import {
  defaultReflectionSettings,
  type ReflectionData,
  type WeeklyReview,
} from '../../shared/reflection';
import { ReflectionStore } from './store';
import {
  day,
  list,
  number,
  object,
  text,
  timestamp,
  validateGoal,
  validateJournal,
  validatePlan,
  validateSettings,
} from './validation';
import { shiftDay, weekStart } from '../../shared/habits';
export interface ReflectionBackup extends ReflectionData {
  deliveries: { key: string; deliveredAt: string }[];
}
function validateReview(value: unknown): WeeklyReview {
  const v = object(value),
    start = day(v.start);
  if (weekStart(start, 1) !== start || day(v.end) !== shiftDay(start, 6))
    throw new Error('Invalid review period.');
  timestamp(v.generatedAt);
  if (v.editedAt !== null) timestamp(v.editedAt);
  text(v.obstacle, 'obstacle', 20000, true);
  text(v.change, 'change', 20000, true);
  const s = object(v.summary);
  list(s.habits).forEach((value) => {
    const h = object(value);
    number(h.id, 1, Number.MAX_SAFE_INTEGER, true);
    text(h.name, 'habit name', 500);
    for (const key of ['hits', 'target', 'misses', 'freezes', 'streakBefore', 'streakAfter'])
      number(h[key], 0, 100000, true);
  });
  const counts = (value: unknown) => {
    for (const [key, count] of Object.entries(object(value))) {
      text(key, 'summary label', 20000);
      number(count, 0, Number.MAX_SAFE_INTEGER);
    }
  };
  counts(s.reasons);
  const f = object(s.focus);
  number(f.seconds, 0, Number.MAX_SAFE_INTEGER);
  number(f.previousSeconds, 0, Number.MAX_SAFE_INTEGER);
  counts(f.byProject);
  counts(f.byCurriculum);
  counts(f.byPreset);
  if (f.daily !== undefined && f.daily !== null) {
    const daily = list(f.daily, 7);
    if (daily.length !== 7) throw new Error('A review trend must cover seven days.');
    let total = 0;
    let unobserved = false;
    daily.forEach((value, i) => {
      const point = object(value);
      if (day(point.date) !== shiftDay(start, i)) throw new Error('Invalid review trend date.');
      if (point.seconds === null) unobserved = true;
      else {
        if (unobserved) throw new Error('Review observations must be consecutive.');
        total += number(point.seconds, 0, Number.MAX_SAFE_INTEGER);
      }
    });
    if (Math.abs(total - (f.seconds as number)) > 0.000001)
      throw new Error('Review trend total does not match saved focus.');
  }
  if (f.bestDay !== null) day(f.bestDay);
  const study = object(s.study);
  for (const key of ['topicsLearned', 'reviews', 'retained']) number(study[key], 0, 100000, true);
  if ((study.retained as number) > (study.reviews as number))
    throw new Error('Invalid recall totals.');
  if (study.retentionPercent !== null) number(study.retentionPercent, 0, 100);
  text(study.retentionLabel, 'recall metric', 500);
  list(study.progress).forEach((x) => {
    const p = object(x);
    text(p.id, 'curriculum ID', 100);
    text(p.title, 'curriculum title', 500);
    number(p.learned, 0, 100000, true);
    number(p.total, 0, 100000, true);
    if ((p.learned as number) > (p.total as number)) throw new Error('Invalid study progress.');
  });
  const tasks = object(s.tasks);
  number(tasks.completed, 0, 100000, true);
  number(tasks.created, 0, 100000, true);
  const plans = object(s.plans);
  for (const k of ['done', 'total', 'evenings']) number(plans[k], 0, 100000, true);
  if ((plans.done as number) > (plans.total as number)) throw new Error('Invalid plan totals.');
  list(s.journal, 7).forEach(validateJournal);
  list(s.correlations, 10).forEach((x) => text(x, 'correlation', 2000));
  return value as WeeklyReview;
}
export function validateReflectionBackup(value: unknown): asserts value is ReflectionBackup {
  const v = object(value);
  for (const [key, validator, id] of [
    ['plans', validatePlan, 'date'],
    ['journal', validateJournal, 'date'],
    ['reviews', validateReview, 'start'],
    ['goals', validateGoal, 'id'],
  ] as const) {
    const rows = list(v[key]);
    rows.forEach(validator);
    const keys = rows.map((x) => object(x)[id]);
    if (new Set(keys).size !== keys.length) throw new Error(`Duplicate reflection ${key}.`);
  }
  validateSettings(v.settings);
  const keys = list(v.deliveries).map((x) => {
    const d = object(x),
      key = text(d.key, 'reminder delivery key', 100);
    if (!/^(morning|evening|weekly):\d{4}-\d{2}-\d{2}:([01]\d|2[0-3]):[0-5]\d$/.test(key))
      throw new Error('Invalid delivery key.');
    day(key.slice(key.indexOf(':') + 1, key.indexOf(':') + 11));
    timestamp(d.deliveredAt);
    return key;
  });
  if (new Set(keys).size !== keys.length) throw new Error('Duplicate delivery keys.');
}
/** merge must run inside the integrator's transaction; no nested transactions. */
export const reflectionBackup = {
  key: 'reflection',
  export(db: Database): ReflectionBackup {
    return {
      ...new ReflectionStore(db).data(),
      deliveries: db
        .prepare('SELECT key,delivered_at AS deliveredAt FROM reflection_reminder_deliveries')
        .all() as unknown as ReflectionBackup['deliveries'],
    };
  },
  validate(value: unknown) {
    validateReflectionBackup(value);
  },
  merge(
    db: Database,
    value: unknown,
    links: {
      habits: Map<number, number>;
      studyTopics?: Map<string, string>;
      studyCurricula?: Map<string, string>;
    },
  ) {
    validateReflectionBackup(value);
    const habit = (id: string) => String(links.habits.get(Number(id)) ?? Number(id));
    const topic = (id: string) => links.studyTopics?.get(id) || id;
    for (const p of value.plans) {
      const next = {
        ...p,
        priorities: p.priorities.map((q) => ({
          ...q,
          linkId:
            q.linkId === null
              ? null
              : q.kind === 'habit'
                ? habit(q.linkId)
                : q.kind === 'study'
                  ? topic(q.linkId)
                  : q.linkId,
        })),
        studyTopicIds: p.studyTopicIds.map(topic),
      };
      db.prepare('INSERT OR IGNORE INTO reflection_plans(date,json) VALUES(?,?)').run(
        p.date,
        JSON.stringify(next),
      );
    }
    for (const j of value.journal)
      db.prepare(
        'INSERT OR IGNORE INTO reflection_journal(date,text,document,updated_at) VALUES(?,?,?,?)',
      ).run(j.date, j.text, j.document ? JSON.stringify(j.document) : null, j.updatedAt);
    for (const g of value.goals) {
      const next = {
        ...g,
        linkId:
          g.linkType === 'habit'
            ? habit(g.linkId)
            : g.linkType === 'chapter'
              ? topic(g.linkId)
              : g.linkType === 'curriculum'
                ? links.studyCurricula?.get(g.linkId) || g.linkId
                : g.linkId,
      };
      db.prepare('INSERT OR IGNORE INTO reflection_goals(id,json) VALUES(?,?)').run(
        g.id,
        JSON.stringify(next),
      );
    }
    for (const r of value.reviews) {
      const next = {
        ...r,
        summary: {
          ...r.summary,
          habits: r.summary.habits.map((h) => ({ ...h, id: links.habits.get(h.id) || h.id })),
          study: {
            ...r.summary.study,
            progress: r.summary.study.progress.map((c) => ({
              ...c,
              id: links.studyCurricula?.get(c.id) || c.id,
            })),
          },
        },
      };
      db.prepare('INSERT OR IGNORE INTO reflection_reviews(start,json) VALUES(?,?)').run(
        r.start,
        JSON.stringify(next),
      );
    }
    const settingsRow = db.prepare('SELECT json FROM reflection_settings WHERE id=1').get() as
      { json: string } | undefined;
    const current = settingsRow ? validateSettings(JSON.parse(settingsRow.json)) : null;
    const defaults = defaultReflectionSettings();
    // An initialized default row is still an unconfigured device. Compare fields
    // rather than JSON order, and preserve any device with custom times or flags.
    const unconfigured =
      !current ||
      (Object.keys(current).length === 3 &&
        (['morning', 'evening', 'weekly'] as const).every(
          (kind) =>
            Object.keys(current[kind]).length === (kind === 'weekly' ? 3 : 2) &&
            current[kind].enabled === defaults[kind].enabled &&
            current[kind].time === defaults[kind].time,
        ) &&
        current.weekly.day === defaults.weekly.day);
    if (unconfigured)
      db.prepare(
        'INSERT INTO reflection_settings(id,json) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json',
      ).run(JSON.stringify(value.settings));
    for (const d of value.deliveries)
      db.prepare(
        'INSERT OR IGNORE INTO reflection_reminder_deliveries(key,delivered_at) VALUES(?,?)',
      ).run(d.key, d.deliveredAt);
  },
};
