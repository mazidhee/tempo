import type { SQLInputValue } from 'node:sqlite';
import type Database from '../database/sqlite';
import { mergeThoughtLibraries } from '../../shared/thoughts';
import { mergeWorkProjects } from '../../shared/work';
import {
  validProductivity,
  localDate,
  defaultProductivity,
  newTimer,
  type Productivity,
} from '../../shared/productivity';
import { normalizeHabit, engineFields } from '../../shared/habitValidation';
import { validDate } from '../../shared/habits';
import { validOccurrence, type HabitEvent } from '../../shared/habitEvents';
import {
  exportModuleData,
  validateModuleData,
  mergeModuleData,
  type BackupLinks,
} from '../database/moduleBackup';
function readProductivity(db: Database): Productivity {
  return JSON.parse(
    (db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as { json: string }).json,
  );
}
/** Version 3 adds independent module payloads; original habits and productivity stay compatible. */
export function exportBackup(db: Database) {
  return {
    format: 'tempo-backup',
    version: 3,
    modules: exportModuleData(db),
    exportedAt: new Date().toISOString(),
    habits: db.prepare('SELECT * FROM habits').all(),
    logs: db.prepare('SELECT * FROM habit_logs').all(),
    pauses: db.prepare('SELECT * FROM habit_pauses').all(),
    habitEvents: db.prepare("SELECT name FROM sqlite_master WHERE name='habit_events'").get() ? db.prepare('SELECT * FROM habit_events').all() : [],
    productivity: JSON.parse(
      (db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as { json: string }).json,
    ),
  };
}
export async function importBackup(db: Database, input: unknown) {
  const data = input as {
    format: string;
    version: number;
    habits: any[];
    logs: any[];
    pauses?: any[];
    productivity: Productivity;
    modules?: unknown;
    habitEvents?: HabitEvent[];
  };
  if (
    !data ||
    data.format !== 'tempo-backup' ||
    ![1, 2, 3].includes(data.version) ||
    !validProductivity(data.productivity) ||
    !Array.isArray(data.habits) ||
    !Array.isArray(data.logs)
  )
    throw new Error('This is not a valid Tempo backup.');
  const ids = new Set(data.habits.map((h) => h?.id));
  if (ids.size !== data.habits.length)
    throw new Error('Duplicate habit IDs in backup. Nothing was changed.');
  if (
    data.habits.some(
      (h) =>
        !h ||
        !Number.isInteger(h.id) ||
        h.id <= 0 ||
        typeof h.name !== 'string' ||
        !h.name.trim() ||
        !['daily', 'weekly'].includes(h.frequency) ||
        !['morning', 'afternoon', 'evening', 'anytime'].includes(h.time_of_day) ||
        !Number.isFinite(Date.parse(h.created_at)),
    ) ||
    data.logs.some(
      (l) =>
        !l || !ids.has(l.habit_id) || !validDate(l.log_date) || ![0, 1].includes(l.is_completed),
    )
  )
    throw new Error('Invalid habit records in backup. Nothing was changed.');
  const normalized = data.habits.map((h) =>
    normalizeHabit({
      ...h,
      start_date: h.start_date || localDate(new Date(h.created_at)),
      habit_type: data.version === 1 ? 'check' : h.habit_type,
      schedule_type: data.version === 1 ? 'daily' : h.schedule_type,
    }),
  );
  const events=data.habitEvents ?? [];
  if(!Array.isArray(events) || events.length>100000 || events.some(e=>!e || !ids.has(e.habit_id) || !validOccurrence(e.occurred_at) || typeof e.note!=='string' || e.note.length>10000 || typeof e.source!=='string' || e.source.length>120 || !Number.isFinite(Date.parse(e.imported_at))))
    throw Error('Invalid habit event history. Nothing was changed.');
  const pauses = data.pauses || [];
  if (
    !Array.isArray(pauses) ||
    pauses.some(
      (p) =>
        !ids.has(p.habit_id) ||
        !validDate(p.start_date) ||
        !validDate(p.end_date) ||
        p.end_date < p.start_date ||
        !p.reason?.trim(),
    ) ||
    data.logs.some(
      (l) =>
        data.version >= 2 &&
        (!Number.isFinite(l.quantity) ||
          l.quantity < 0 ||
          !['pending', 'done', 'clean', 'slip', 'freeze'].includes(l.outcome) ||
          (l.outcome === 'slip' && !l.slip_reason?.trim()) ||
          (l.outcome === 'freeze' &&
            !['sick', 'travel', 'rest', 'other'].includes(l.freeze_reason))),
    )
  )
    throw new Error('Invalid habit-engine records in backup. Nothing was changed.');
  const modules = data.version === 3 ? validateModuleData(data.modules) : {};
  // Keep a full SQLite safety copy before an atomic, non-destructive merge.
  const backupPath = `${db.name}.before-import-${Date.now()}.bak`;
  await db.backup(backupPath);
  db.transaction(() => {
    const original = readProductivity(db);
    const defaults = defaultProductivity();
    const pristine =
      !db.prepare('SELECT id FROM habits LIMIT 1').get() &&
      !original.tasks.length &&
      !original.sessions.length &&
      original.timer.startedAt === null &&
      JSON.stringify({ ...defaults.settings, ...original.settings }) ===
        JSON.stringify(defaults.settings) &&
      JSON.stringify(original.presets) === JSON.stringify(defaults.presets);

    const map = new Map<number, number>();
    const newlyAdded = new Set<number>();
    for (let i = 0; i < data.habits.length; i++) {
      const h = data.habits[i],
        normalizedHabit = normalized[i];
      const byId = db.prepare('SELECT * FROM habits WHERE id=?').get(h.id) as any;
      const identity = (row: any) =>
        row && ['name', 'frequency', 'time_of_day', 'created_at'].every((k) => row[k] === h[k]);
      const existing = identity(byId)
        ? byId
        : (db
            .prepare(
              'SELECT * FROM habits WHERE name=? AND frequency=? AND time_of_day=? AND created_at=?',
            )
            .get(h.name, h.frequency, h.time_of_day, h.created_at) as any);
      if (
        existing &&
        ['name', 'frequency', 'time_of_day', 'created_at'].every((k) => existing[k] === h[k])
      )
        map.set(h.id, existing.id);
      else {
        const columns = [
          'name',
          'description',
          'frequency',
          'time_of_day',
          'days_of_week',
          'scheduled_time',
          'created_at',
          'is_archived',
          ...engineFields,
        ];
        const fields = {
          ...normalizedHabit,
          created_at: h.created_at,
          description: h.description ?? null,
          scheduled_time: h.scheduled_time ?? null,
          is_archived: h.is_archived ? 1 : 0,
          after_habit_id: null,
        } as unknown as Record<string, SQLInputValue>;
        const result = db
          .prepare(
            `INSERT INTO habits(${columns.join(',')}) VALUES(${columns.map(() => '?').join(',')})`,
          )
          .run(...columns.map((k) => fields[k]));
        map.set(h.id, Number(result.lastInsertRowid));
        newlyAdded.add(h.id);
      }
    }
    for (const h of data.habits)
      if (newlyAdded.has(h.id) && h.after_habit_id && map.has(h.after_habit_id))
        db.prepare('UPDATE habits SET after_habit_id=? WHERE id=?').run(
          map.get(h.after_habit_id)!,
          map.get(h.id)!,
        );
    for (const l of data.logs)
      db.prepare(
        `INSERT OR IGNORE INTO habit_logs(habit_id,log_date,is_completed,note,missed_reason,quantity,outcome,slip_reason,freeze_reason,freeze_note,freeze_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        map.get(l.habit_id)!,
        l.log_date,
        l.is_completed,
        l.note ?? null,
        l.missed_reason ?? null,
        l.quantity ?? 0,
        l.outcome || (l.is_completed ? 'done' : 'pending'),
        l.slip_reason ?? null,
        l.freeze_reason ?? null,
        l.freeze_note ?? null,
        l.freeze_at ?? null,
      );
    for(const e of events)db.prepare('INSERT OR IGNORE INTO habit_events(habit_id,occurred_at,note,source,imported_at) VALUES(?,?,?,?,?)').run(map.get(e.habit_id)!,e.occurred_at,e.note,e.source,e.imported_at);
    for (const p of pauses) {
      const existing = db
        .prepare('SELECT id FROM habit_pauses WHERE habit_id=? AND start_date<=? AND end_date>=?')
        .get(map.get(p.habit_id)!, p.end_date, p.start_date);
      if (!existing)
        db.prepare(
          'INSERT INTO habit_pauses(habit_id,start_date,end_date,reason) VALUES(?,?,?,?)',
        ).run(map.get(p.habit_id)!, p.start_date, p.end_date, p.reason);
    }
    const old = readProductivity(db);
    const links: BackupLinks = {
      activeTimer: old.timer.startedAt !== null,
      habits: map,
      studyTopics: new Map(),
      studyCurricula: new Map(),
    };
    mergeModuleData(db, modules, links);
    const merge = <T extends { id: string }>(a: T[], b: T[]) => [
      ...a,
      ...b.filter((x) => !a.some((y) => y.id === x.id)),
    ];
    const imported = data.productivity;
    const relink = <T extends { link: Productivity['timer']['link'] }>(x: T): T => ({
      ...x,
      link:
        x.link?.type === 'habit'
          ? { ...x.link, id: String(map.get(Number(x.link.id)) ?? x.link.id) }
          : x.link?.type === 'study'
            ? {
                ...x.link,
                id: links.studyTopics.get(x.link.id) ?? x.link.id,
                ...(x.link.curriculumId
                  ? {
                      curriculumId:
                        links.studyCurricula.get(x.link.curriculumId) ?? x.link.curriculumId,
                    }
                  : {}),
              }
            : x.link,
    });
    const next = {
      ...old,
      tasks: merge(old.tasks, imported.tasks),
      presets: pristine ? imported.presets : merge(old.presets, imported.presets),
      settings: pristine ? imported.settings : { ...old.settings,
        thoughtLibrary: mergeThoughtLibraries(old.settings.thoughtLibrary, imported.settings.thoughtLibrary),
        workProjects: mergeWorkProjects(old.settings.workProjects, imported.settings.workProjects) },
      timer: pristine
        ? newTimer(
            imported.presets.find((p) => p.id === imported.timer.presetId) ?? imported.presets[0],
          )
        : old.timer,
      sessions: merge(old.sessions, imported.sessions.map(relink)),
    };
    if (!validProductivity(next)) throw new Error('The combined backup exceeds supported library limits or contains invalid records. Nothing was changed.');
    db.prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(next));
  })();
  return { success: true, backupPath };
}
