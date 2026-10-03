import type Database from '../database/sqlite';
import { StudyStore } from '../study/store';
import {
  day,
  flag,
  list,
  number,
  object,
  text,
  validateGoal,
  validatePlan,
  validateSettings,
} from './validation';
import { chapterTopics, goalProgress, weeklySummary, type Sources } from './aggregate';
import {
  defaultReflectionSettings,
  type DailyPlan,
  type Goal,
  type JournalEntry,
  type ReflectionData,
  type ReflectionSnapshot,
  type WeeklyReview,
} from '../../shared/reflection';
import { defaultProductivity, localDate, type Productivity } from '../../shared/productivity';
import {
  validateJournalDocument,
  journalDocumentText,
  plainJournalDocument,
  type JournalDocument,
} from '../../shared/journalDocument';
import {
  shiftDay,
  weekStart,
  type EngineHabit,
  type EngineLog,
  type PauseRange,
} from '../../shared/habits';
export class ReflectionStore {
  constructor(
    public db: Database,
    private now = () => new Date(),
  ) {}
  data(): ReflectionData {
    const rows = <T>(table: string) =>
      (this.db.prepare(`SELECT json FROM ${table}`).all() as { json: string }[]).map(
        (r) => JSON.parse(r.json) as T,
      );
    return {
      plans: rows<DailyPlan>('reflection_plans').sort((a, b) => b.date.localeCompare(a.date)),
      journal: this.db
        .prepare(
          'SELECT date,text,document,updated_at AS updatedAt FROM reflection_journal ORDER BY date DESC',
        )
        .all()
        .map((row) => ({
          ...row,
          document: row.document ? JSON.parse(String(row.document)) : null,
        })) as unknown as JournalEntry[],
      reviews: rows<WeeklyReview>('reflection_reviews').sort((a, b) =>
        b.start.localeCompare(a.start),
      ),
      goals: rows<Goal>('reflection_goals'),
      settings:
        rows<ReflectionData['settings']>('reflection_settings')[0] || defaultReflectionSettings(),
    };
  }
  source(): Sources {
    const state = this.db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as
      { json: string } | undefined;
    const pauses = this.db.prepare('SELECT * FROM habit_pauses').all() as unknown as PauseRange[];
    return {
      habits: (this.db.prepare('SELECT * FROM habits').all() as unknown as EngineHabit[]).map(
        (h) => ({ ...h, pauses: pauses.filter((p) => p.habit_id === h.id) }),
      ),
      logs: this.db.prepare('SELECT * FROM habit_logs').all() as unknown as EngineLog[],
      productivity: state ? (JSON.parse(state.json) as Productivity) : defaultProductivity(),
      study: new StudyStore(this.db).snapshot(),
    };
  }
  snapshot(): ReflectionSnapshot {
    const data = this.data(),
      source = this.source();
    return {
      ...data,
      source,
      goalProgress: data.goals
        .filter((g) => !g.archived)
        .map((g) => goalProgress(g, source, localDate(this.now()))),
    };
  }
  private write(
    table: 'reflection_plans' | 'reflection_goals' | 'reflection_reviews',
    key: string,
    value: unknown,
  ) {
    const column =
      table === 'reflection_plans' ? 'date' : table === 'reflection_goals' ? 'id' : 'start';
    this.db
      .prepare(
        `INSERT INTO ${table}(${column},json) VALUES(?,?) ON CONFLICT(${column}) DO UPDATE SET json=excluded.json`,
      )
      .run(key, JSON.stringify(value));
  }
  savePlan(input: unknown): DailyPlan {
    const v = object(input),
      date = day(v.date),
      previous = this.data().plans.find((p) => p.date === date),
      source = this.source();
    const plan = validatePlan({
      date,
      priorities: v.priorities,
      studyTopicIds: v.studyTopicIds,
      evening: previous?.evening || { completedAt: null, sleep: null, energy: null },
      updatedAt: this.now().toISOString(),
    });
    for (const p of plan.priorities) {
      if (
        p.kind === 'habit' &&
        !source.habits.some((h) => String(h.id) === p.linkId && !h.is_archived)
      )
        throw new Error('Choose an active habit.');
      if (p.kind === 'task' && !source.productivity.tasks.some((t) => t.id === p.linkId))
        throw new Error('Task no longer exists.');
      if (p.kind === 'study' && !source.study.topics.some((t) => t.id === p.linkId && !t.archived))
        throw new Error('Choose an active study topic.');
    }
    for (const id of plan.studyTopicIds)
      if (
        !source.study.topics.some(
          (t) =>
            t.id === id &&
            !t.archived &&
            source.study.curricula.some((c) => c.id === t.curriculumId && !c.archived),
        )
      )
        throw new Error('Choose active study topics.');
    this.write('reflection_plans', date, plan);
    return plan;
  }
  evening(input: unknown): DailyPlan {
    const v = object(input),
      date = day(v.date),
      previous = this.data().plans.find((p) => p.date === date) || {
        date,
        priorities: [],
        studyTopicIds: [],
        evening: { completedAt: null, sleep: null, energy: null },
        updatedAt: this.now().toISOString(),
      },
      ids = list(v.doneIds, 3).map((x) => text(x, 'priority ID', 100));
    if (ids.some((id) => !previous.priorities.some((p) => p.id === id)))
      throw new Error('Choose a priority in this plan.');
    const plan: DailyPlan = {
      ...previous,
      priorities: previous.priorities.map((p) => ({ ...p, done: ids.includes(p.id) })),
      evening: {
        completedAt: this.now().toISOString(),
        sleep: v.sleep === null ? null : number(v.sleep, 0, 24),
        energy: v.energy === null ? null : number(v.energy, 1, 5, true),
      },
      updatedAt: this.now().toISOString(),
    };
    const journal = v.journal === undefined ? undefined : text(v.journal, 'journal', 200000, true);
    this.db.transaction(() => {
      this.write('reflection_plans', date, plan);
      if (journal !== undefined) this.writeJournal(date, journal);
    })();
    return plan;
  }
  private writeJournal(date: string, value: string, document?: JournalDocument): JournalEntry {
    const previous = this.lookup(date);
    const rich =
      document ??
      (previous?.text === value
        ? (previous.document ?? null)
        : previous?.document
          ? plainJournalDocument(value)
          : null);
    const entry = { date, text: value, document: rich, updatedAt: this.now().toISOString() };
    this.db
      .prepare(
        'INSERT INTO reflection_journal(date,text,document,updated_at) VALUES(?,?,?,?) ON CONFLICT(date) DO UPDATE SET text=excluded.text,document=excluded.document,updated_at=excluded.updated_at',
      )
      .run(date, value, rich ? JSON.stringify(rich) : null, entry.updatedAt);
    return entry;
  }
  saveJournal(input: unknown) {
    const v = object(input);
    if (v.document !== undefined) validateJournalDocument(v.document);
    const document = v.document as JournalDocument | undefined;
    return this.writeJournal(
      day(v.date),
      text(document ? journalDocumentText(document) : v.text, 'journal', 200000, true),
      document,
    );
  }
  lookup(input: unknown): JournalEntry | null {
    const row = this.db
      .prepare(
        'SELECT date,text,document,updated_at AS updatedAt FROM reflection_journal WHERE date=?',
      )
      .get(day(input));
    return row
      ? ({
          ...row,
          document: row.document ? JSON.parse(String(row.document)) : null,
        } as unknown as JournalEntry)
      : null;
  }
  lookupDates(input: unknown) {
    const dates = list(input, 1000).map(day),
      result: Record<string, string> = {};
    if (!dates.length) return result;
    for (const row of this.db
      .prepare(
        `SELECT date,text FROM reflection_journal WHERE date IN (${dates.map(() => '?').join(',')})`,
      )
      .all(...dates) as { date: string; text: string }[])
      result[row.date] = row.text;
    return result;
  }
  search(input: unknown): JournalEntry[] {
    const v = object(input),
      query = text(v.query, 'search', 500, true),
      start = v.start === undefined ? '1900-01-01' : day(v.start),
      end = v.end === undefined ? '2200-12-31' : day(v.end);
    const terms = query.match(/[\p{L}\p{N}_]+/gu) || [];
    if (!terms.length)
      return this.db
        .prepare(
          'SELECT date,text,updated_at AS updatedAt FROM reflection_journal WHERE date>=? AND date<=? ORDER BY date DESC LIMIT 500',
        )
        .all(start, end) as unknown as JournalEntry[];
    const match = terms.map((t) => `"${t.replace(/"/g, '""')}"*`).join(' AND ');
    return this.db
      .prepare(
        'SELECT j.date,j.text,j.updated_at AS updatedAt FROM reflection_journal j JOIN reflection_journal_fts f ON j.date=f.date WHERE reflection_journal_fts MATCH ? AND j.date>=? AND j.date<=? ORDER BY rank,j.date DESC LIMIT 500',
      )
      .all(match, start, end) as unknown as JournalEntry[];
  }
  generate(input: unknown): WeeklyReview {
    const v = object(input),
      start = weekStart(day(v.date), 1),
      data = this.data(),
      previous = data.reviews.find((r) => r.start === start);
    if (v.refresh !== undefined) flag(v.refresh);
    if (previous && !v.refresh) return previous;
    const summary = weeklySummary(this.source(), data, start, localDate(this.now()));
    const review: WeeklyReview = {
      start,
      end: shiftDay(start, 6),
      generatedAt: this.now().toISOString(),
      summary,
      obstacle: previous?.editedAt
        ? previous.obstacle
        : Object.entries(summary.reasons)
            .sort((a, b) => b[1] - a[1])
            .map(([reason, count]) => `${reason} (${count})`)
            .join('\n'),
      change: previous?.change || '',
      editedAt: previous?.editedAt || null,
    };
    this.write('reflection_reviews', start, review);
    return review;
  }
  saveReview(input: unknown) {
    const v = object(input),
      start = day(v.start),
      previous = this.data().reviews.find((r) => r.start === start);
    if (!previous) throw new Error('Generate this review first.');
    const review = {
      ...previous,
      obstacle: text(v.obstacle, 'reflection', 20000, true),
      change: text(v.change, 'next-week change', 20000, true),
      editedAt: this.now().toISOString(),
    };
    this.write('reflection_reviews', start, review);
    return review;
  }
  saveGoal(input: unknown): Goal {
    const v = object(input),
      data = this.data(),
      previous =
        v.id === undefined
          ? undefined
          : data.goals.find((g) => g.id === text(v.id, 'goal ID', 100));
    if (v.id !== undefined && !previous) throw new Error('Goal not found.');
    const goal = validateGoal({
      ...v,
      id: previous?.id || crypto.randomUUID(),
      createdAt: previous?.createdAt || this.now().toISOString(),
    });
    const s = this.source();
    if (goal.kind === 'habit' && !s.habits.some((h) => String(h.id) === goal.linkId))
      throw new Error('Choose an existing habit.');
    if (goal.linkType === 'curriculum' && !s.study.curricula.some((c) => c.id === goal.linkId))
      throw new Error('Choose an existing curriculum.');
    if (goal.linkType === 'chapter' && !chapterTopics(s.study, goal.linkId).length)
      throw new Error('Choose an existing chapter.');
    this.write('reflection_goals', goal.id, goal);
    return goal;
  }
  archiveGoal(input: unknown): Goal {
    const v = object(input),
      goal = this.data().goals.find((g) => g.id === text(v.id, 'goal ID', 100));
    if (!goal) throw new Error('Goal not found.');
    const next = { ...goal, archived: flag(v.archived) };
    this.write('reflection_goals', next.id, next);
    return next;
  }
  saveSettings(input: unknown) {
    const settings = validateSettings(input);
    this.db
      .prepare(
        'INSERT INTO reflection_settings(id,json) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json',
      )
      .run(JSON.stringify(settings));
    return settings;
  }
}
