import type { SQLInputValue } from 'node:sqlite';
import Database from './sqlite';
import path from 'path';
import { app } from 'electron';
import { migrateProductivity, migrateHabitEngine } from './migrations';
import { runModuleMigrations } from './migrationRegistry';
import { localDate } from '../../shared/productivity';
import {
  habitStats,
  isDue,
  isComplete,
  aggregateDay,
  dayOutcome,
  dateRange,
  shiftDay,
  logFor,
  canFreeze,
  canPause,
  periodSummary,
  validDate,
  type EngineHabit,
  type EngineLog,
  type FreezeReason,
} from '../../shared/habits';
import { normalizeHabit, engineFields, type HabitInput } from '../../shared/habitValidation';

let db: Database;

export function initDatabase(): Database {
  const dbPath = path.join(app.getPath('userData'), 'habits.db');
  db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly')),
      time_of_day TEXT CHECK(time_of_day IN ('morning', 'afternoon', 'evening', 'anytime')),
      days_of_week TEXT DEFAULT 'mon,tue,wed,thu,fri,sat,sun',
      scheduled_time TEXT,
      created_at TEXT NOT NULL,
      is_archived INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      log_date TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      note TEXT,
      missed_reason TEXT,
      FOREIGN KEY (habit_id) REFERENCES habits(id),
      UNIQUE(habit_id, log_date)
    );

    CREATE INDEX IF NOT EXISTS idx_logs_date ON habit_logs(log_date);
    CREATE INDEX IF NOT EXISTS idx_logs_habit ON habit_logs(habit_id);
    CREATE INDEX IF NOT EXISTS idx_logs_habit_date ON habit_logs(habit_id, log_date);
  `);

  // for older databases where these columns are missing
  const columns = db.prepare('PRAGMA table_info(habits)').all() as any[];
  const colNames = columns.map((c: any) => c.name);
  if (!colNames.includes('days_of_week')) {
    db.exec(
      "ALTER TABLE habits ADD COLUMN days_of_week TEXT DEFAULT 'mon,tue,wed,thu,fri,sat,sun'",
    );
  }
  if (!colNames.includes('scheduled_time')) {
    db.exec('ALTER TABLE habits ADD COLUMN scheduled_time TEXT');
  }

  migrateProductivity(db);
  if (!db.prepare('SELECT version FROM schema_migrations WHERE version=3').get()) {
    // SQLite's own consistent snapshot, before any habit-engine schema changes.
    const safety = `${dbPath}.before-habit-engine-${Date.now()}.bak`;
    db.exec(`VACUUM INTO '${safety.replace(/'/g, "''")}'`);
    migrateHabitEngine(db);
  }
  runModuleMigrations(db);
  return db;
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function getAllHabits(includeArchived = false) {
  const rows = getDb()
    .prepare(
      `SELECT * FROM habits ${includeArchived ? '' : 'WHERE is_archived=0'} ORDER BY created_at DESC`,
    )
    .all() as unknown as EngineHabit[];
  const pauses = getDb().prepare('SELECT * FROM habit_pauses ORDER BY start_date').all() as any[];
  return rows.map((h) => ({ ...h, pauses: pauses.filter((p) => p.habit_id === h.id) }));
}
function validateAnchor(data: ReturnType<typeof normalizeHabit>, id?: number) {
  if (!data.after_habit_id) return;
  const habits = getAllHabits();
  const anchor = habits.find((h) => h.id === data.after_habit_id);
  if (!anchor || anchor.time_of_day !== data.time_of_day || anchor.id === id)
    throw new Error('Choose another habit in the same time section.');
  const seen = new Set<number>(id ? [id] : []);
  let cursor: EngineHabit | undefined = anchor;
  while (cursor) {
    if (seen.has(cursor.id)) throw new Error('Habit stacking cannot contain a cycle.');
    seen.add(cursor.id);
    cursor = habits.find((h) => h.id === cursor!.after_habit_id);
  }
}
export function addHabit(input: HabitInput) {
  const data = normalizeHabit(input);
  validateAnchor(data);
  const columns = [
    'name',
    'description',
    'frequency',
    'time_of_day',
    'days_of_week',
    'scheduled_time',
    'created_at',
    ...engineFields,
  ];
  const values = {
    ...data,
    description: data.description || null,
    scheduled_time: data.scheduled_time || null,
    created_at: new Date().toISOString(),
  } as unknown as Record<string, SQLInputValue>;
  const result = getDb()
    .prepare(`INSERT INTO habits(${columns.join(',')}) VALUES(${columns.map(() => '?').join(',')})`)
    .run(...columns.map((k) => values[k]));
  return { ...data, id: Number(result.lastInsertRowid) };
}
export function editHabit(input: HabitInput & { id: number }) {
  const original = getAllHabits(true).find((h) => h.id === input.id);
  if (!original) throw new Error('Habit not found.');
  const data = normalizeHabit({ ...original, ...input });
  validateAnchor(data, input.id);
  const columns = [
    'name',
    'description',
    'frequency',
    'time_of_day',
    'days_of_week',
    'scheduled_time',
    ...engineFields,
  ];
  const values = {
    ...data,
    description: data.description || null,
    scheduled_time: data.scheduled_time || null,
  } as unknown as Record<string, SQLInputValue>;
  getDb().transaction(() => {
    getDb()
      .prepare(`UPDATE habits SET ${columns.map((k) => k + '=?').join(',')} WHERE id=?`)
      .run(...columns.map((k) => values[k]), input.id);
    // Moving an anchor to a different section detaches its children; no cyclic/stale ordering.
    getDb()
      .prepare('UPDATE habits SET after_habit_id=NULL WHERE after_habit_id=? AND time_of_day<>?')
      .run(input.id, data.time_of_day);
  })();
  return data;
}

export function archiveHabit(id: number) {
  const d = getDb();
  d.prepare('UPDATE habits SET is_archived = 1 WHERE id = ?').run(id);
  return { id, archived: true };
}

export function restoreHabit(id: number) {
  const d = getDb();
  d.prepare('UPDATE habits SET is_archived = 0 WHERE id = ?').run(id);
  return { id, restored: true };
}

export function deleteHabit(id: number) {
  const d = getDb();
  d.transaction(() => {
    d.prepare('UPDATE habits SET after_habit_id=NULL WHERE after_habit_id=?').run(id);
    d.prepare('DELETE FROM habit_pauses WHERE habit_id=?').run(id);
    d.prepare('DELETE FROM habit_logs WHERE habit_id = ?').run(id);
    d.prepare('DELETE FROM habits WHERE id = ?').run(id);
  })();
  return { id, deleted: true };
}

export function getLogsByDate(date: string) {
  const d = getDb();
  return d
    .prepare(
      `SELECT hl.*, h.name as habit_name, h.frequency, h.time_of_day, h.description
       FROM habit_logs hl
       JOIN habits h ON hl.habit_id = h.id
       WHERE hl.log_date = ?
       ORDER BY h.name`,
    )
    .all(date);
}

export function getLogsByHabit(habitId: number) {
  const d = getDb();
  return d
    .prepare(`SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY log_date DESC`)
    .all(habitId);
}

export function toggleLog(habitId: number, logDate: string, isCompleted: boolean, note?: string) {
  return recordHabit({ habitId, logDate, action: isCompleted ? 'complete' : 'uncheck', note });
}
export interface HabitRecord {
  habitId: number;
  logDate: string;
  action:
    | 'complete'
    | 'uncheck'
    | 'quantity'
    | 'set_quantity'
    | 'clean'
    | 'slip'
    | 'freeze'
    | 'undo_freeze';
  amount?: number;
  reason?: string;
  note?: string;
}
export function recordHabit(data: HabitRecord) {
  const d = getDb();
  return d.transaction(() => {
    const h = getAllHabits().find((h) => h.id === data.habitId);
    if (!h || !validDate(data.logDate)) throw new Error('Habit or date not found.');
    const today = localDate();
    const logs = getLogsByHabit(h.id) as unknown as EngineLog[];
    const previous = logFor(logs, h, data.logDate);
    if (data.action !== 'freeze' && data.logDate !== today)
      throw new Error('This day is locked. Only eligible retroactive freezes are allowed.');
    if (!isDue(h, data.logDate, logs)) throw new Error('This habit is not due on that date.');
    const next = {
      ...previous,
      habit_id: h.id,
      log_date: data.logDate,
      is_completed: previous?.is_completed || 0,
      quantity: previous?.quantity || 0,
      outcome: previous?.outcome || 'pending',
      note: ['freeze', 'undo_freeze'].includes(data.action)
        ? (previous?.note ?? null)
        : (data.note ?? previous?.note ?? null),
    } as EngineLog;
    if (data.action === 'freeze') {
      if (!canFreeze(h, logs, data.logDate))
        throw new Error(
          'Freeze unavailable: completed/slipped day, expired window, or monthly limit reached.',
        );
      if (
        !['sick', 'travel', 'rest', 'other'].includes(data.reason || '') ||
        (data.reason === 'other' && !data.note?.trim())
      )
        throw new Error('Choose a freeze reason and add a short note for Other.');
      next.outcome = 'freeze';
      next.is_completed = 0;
      next.freeze_reason = data.reason as FreezeReason;
      next.freeze_note = data.note?.trim() || null;
      next.freeze_at = new Date().toISOString();
    } else if (data.action === 'undo_freeze') {
      if (previous?.outcome !== 'freeze') throw new Error('There is no freeze to remove.');
      next.outcome = 'pending';
      next.freeze_reason = null;
      next.freeze_note = null;
      next.freeze_at = null;
    } else {
      if (previous?.outcome === 'freeze')
        throw new Error('Remove today’s freeze before checking in.');
      if (h.habit_type === 'quantity' && ['quantity', 'set_quantity'].includes(data.action)) {
        if (!Number.isFinite(data.amount) || data.amount! < 0 || data.amount! > 1e12)
          throw new Error('Enter a non-negative finite quantity.');
        next.quantity = data.action === 'quantity' ? next.quantity! + data.amount! : data.amount!;
        if (!Number.isFinite(next.quantity) || next.quantity! > 1e12)
          throw new Error('Quantity is too large.');
        next.outcome = isComplete(h, next) ? 'done' : 'pending';
      } else if (h.habit_type === 'avoid' && ['clean', 'slip'].includes(data.action)) {
        if (previous?.outcome === 'slip' && data.action === 'clean')
          throw new Error('A logged slip cannot be replaced with Stayed clean.');
        if (data.action === 'slip' && !data.reason?.trim()) throw new Error('Add a slip reason.');
        next.outcome = data.action as 'clean' | 'slip';
        next.slip_reason = data.action === 'slip' ? data.reason!.trim() : null;
      } else if (
        (!h.habit_type || h.habit_type === 'check') &&
        ['complete', 'uncheck'].includes(data.action)
      ) {
        next.outcome = data.action === 'complete' ? 'done' : 'pending';
        next.is_completed = data.action === 'complete' ? 1 : 0;
      } else throw new Error('Use the check-in control for this habit type.');
      next.is_completed = isComplete(h, next) ? 1 : 0;
    }
    d.prepare(
      `INSERT INTO habit_logs(habit_id,log_date,is_completed,quantity,outcome,note,slip_reason,freeze_reason,freeze_note,freeze_at)
      VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(habit_id,log_date) DO UPDATE SET is_completed=excluded.is_completed,quantity=excluded.quantity,outcome=excluded.outcome,note=excluded.note,slip_reason=excluded.slip_reason,freeze_reason=excluded.freeze_reason,freeze_note=excluded.freeze_note,freeze_at=excluded.freeze_at`,
    ).run(
      h.id,
      data.logDate,
      next.is_completed,
      next.quantity!,
      next.outcome!,
      next.note ?? null,
      next.slip_reason ?? null,
      next.freeze_reason ?? null,
      next.freeze_note ?? null,
      next.freeze_at ?? null,
    );
    return next;
  })();
}
export function addPause(data: {
  habitId: number;
  start_date: string;
  end_date: string;
  reason: string;
}) {
  const d = getDb();
  return d.transaction(() => {
    const h = getAllHabits().find((h) => h.id === data.habitId);
    if (
      !h ||
      data.start_date < localDate() ||
      !data.reason?.trim() ||
      !canPause(h, data.start_date, data.end_date)
    )
      throw new Error('Pause must start today or later and fit the yearly cap.');
    if (
      (h.pauses || []).some((p) => data.start_date <= p.end_date && data.end_date >= p.start_date)
    )
      throw new Error('Pause ranges cannot overlap.');
    const logs = getLogsByHabit(h.id) as unknown as EngineLog[];
    if (
      logs.some(
        (l) =>
          l.log_date >= data.start_date &&
          l.log_date <= data.end_date &&
          (isComplete(h, l) || ['freeze', 'slip'].includes(l.outcome || '')),
      )
    )
      throw new Error('Pause range contains a completed, frozen or slipped check-in.');
    return d
      .prepare('INSERT INTO habit_pauses(habit_id,start_date,end_date,reason) VALUES(?,?,?,?)')
      .run(h.id, data.start_date, data.end_date, data.reason.trim());
  })();
}
export function removePause(id: number) {
  const p = getDb().prepare('SELECT * FROM habit_pauses WHERE id=?').get(id) as
    { start_date: string } | undefined;
  if (!p || p.start_date < localDate()) throw new Error('Past pause ranges are locked.');
  getDb().prepare('DELETE FROM habit_pauses WHERE id=?').run(id);
  return { success: true };
}
export function habitSnapshot() {
  return { habits: getAllHabits(true), logs: getDb().prepare('SELECT * FROM habit_logs').all() };
}

export function addNote(habitId: number, logDate: string, note: string) {
  const d = getDb();
  const existing = d
    .prepare('SELECT * FROM habit_logs WHERE habit_id = ? AND log_date = ?')
    .get(habitId, logDate) as any;

  if (existing) {
    d.prepare('UPDATE habit_logs SET note = ? WHERE id = ?').run(note, existing.id);
  } else {
    d.prepare(
      'INSERT INTO habit_logs (habit_id, log_date, is_completed, note) VALUES (?, ?, 0, ?)',
    ).run(habitId, logDate, note);
  }
  return { habitId, logDate, note };
}

export function addMissedReason(habitId: number, logDate: string, reason: string) {
  const d = getDb();
  const existing = d
    .prepare('SELECT * FROM habit_logs WHERE habit_id = ? AND log_date = ?')
    .get(habitId, logDate) as any;

  if (existing) {
    d.prepare('UPDATE habit_logs SET missed_reason = ? WHERE id = ?').run(reason, existing.id);
  } else {
    d.prepare(
      'INSERT INTO habit_logs (habit_id, log_date, is_completed, missed_reason) VALUES (?, ?, 0, ?)',
    ).run(habitId, logDate, reason);
  }
  return { habitId, logDate, reason };
}

export function getStreaks() {
  const habits = getAllHabits(),
    logs = habitSnapshot().logs as unknown as EngineLog[],
    today = localDate();
  let overall = 0;
  const earliest =
    habits.map((h) => h.start_date || localDate(new Date(h.created_at))).sort()[0] || today;
  for (let day = today; day >= earliest; day = shiftDay(day, -1)) {
    const outcomes = habits
      .map((h) => dayOutcome(h, logs, day, today))
      .filter((o) => !['paused', 'not_due'].includes(o));
    if (!outcomes.length || outcomes.every((o) => o === 'freeze')) continue;
    if (outcomes.every((o) => ['done', 'freeze'].includes(o))) overall++;
    else if (day !== today) break;
  }
  return {
    habits: habits.map((h) => {
      const s = habitStats(h, logs, today);
      return { habitId: h.id, habitName: h.name, currentStreak: s.current, bestStreak: s.longest };
    }),
    overallStreak: overall,
  };
}
export function getCompletionRates() {
  const habits = getAllHabits(),
    logs = habitSnapshot().logs as unknown as EngineLog[],
    today = localDate(),
    periods = [7, 30, 90];
  return {
    habits: habits.map((h) => ({
      habitId: h.id,
      habitName: h.name,
      rates: Object.fromEntries(
        periods.map((n) => [n + 'd', habitStats(h, logs, today, shiftDay(today, 1 - n)).rate]),
      ),
    })),
    overall: Object.fromEntries(
      periods.map((n) => {
        const stats = habits.map((h) => habitStats(h, logs, today, shiftDay(today, 1 - n)));
        const possible = stats.reduce((n, s) => n + s.possible, 0);
        return [
          n + 'd',
          possible ? Math.round((stats.reduce((n, s) => n + s.done, 0) / possible) * 100) : 0,
        ];
      }),
    ),
  };
}
export function getHeatmapData() {
  const { habits, logs } = habitSnapshot(),
    today = localDate();
  return {
    days: dateRange(shiftDay(today, -364), today).map((day) => {
      const a = aggregateDay(
        habits.filter((h) => !h.is_archived),
        logs as unknown as EngineLog[],
        day,
        today,
      );
      return { ...a, log_date: day, completed_count: a.done };
    }),
    totalHabits: habits.filter((h) => !h.is_archived).length,
  };
}
export function getBestWorstDay() {
  const { habits, logs } = habitSnapshot(),
    today = localDate();
  const groups = Array.from({ length: 7 }, (_, day_num) => ({
    day_num,
    day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
      day_num
    ],
    done: 0,
    due: 0,
  }));
  const start =
    habits.map((h) => h.start_date || localDate(new Date(h.created_at))).sort()[0] || today;
  for (const day of dateRange(start, today)) {
    const a = aggregateDay(
      habits.filter((h) => !h.is_archived),
      logs as unknown as EngineLog[],
      day,
      today,
    );
    const g = groups[new Date(day + 'T12:00:00').getDay()];
    g.done += a.done;
    g.due += a.due;
  }
  const all = groups
    .filter((g) => g.due)
    .map((g) => ({
      day_num: g.day_num,
      day_name: g.day_name,
      avg_rate: g.done / g.due,
      total_logs: g.due,
    }))
    .sort((a, b) => b.avg_rate - a.avg_rate);
  return { best: all[0] || null, worst: all.at(-1) || null, all };
}
export function getHabitTrend(habitId: number) {
  const h = getAllHabits(true).find((h) => h.id === habitId);
  if (!h) return [];
  const today = localDate(),
    logs = getLogsByHabit(habitId) as unknown as EngineLog[];
  const result = dateRange(shiftDay(today, -30), today).map((date) => {
    const s = dayOutcome(h, logs, date, today);
    return {
      date,
      completed: s === 'done' ? 1 : 0,
      average: 0,
      due: !['paused', 'not_due', 'freeze'].includes(s),
    };
  });
  return result.map((p, i) => {
    const window = result.slice(Math.max(0, i - 6), i + 1).filter((d) => d.due);
    return {
      ...p,
      average: window.length ? window.reduce((n, d) => n + d.completed, 0) / window.length : 0,
    };
  });
}
export function getWeeklyData(startDate: string, endDate: string) {
  return getDb()
    .prepare(
      `SELECT hl.*,h.name as habit_name,h.frequency,h.time_of_day,h.days_of_week FROM habit_logs hl JOIN habits h ON h.id=hl.habit_id WHERE hl.log_date>=? AND hl.log_date<=? AND h.is_archived=0 ORDER BY h.name,hl.log_date`,
    )
    .all(startDate, endDate);
}
export function getHistoryData() {
  return getDb()
    .prepare(
      'SELECT hl.*,h.name as habit_name,h.frequency,h.time_of_day FROM habit_logs hl JOIN habits h ON h.id=hl.habit_id WHERE h.is_archived=0 ORDER BY hl.log_date DESC,h.name',
    )
    .all();
}

export function exportCSV(): string {
  const { habits, logs } = habitSnapshot();
  const columns = [
    'date',
    'habit_name',
    'frequency',
    'time_of_day',
    'is_completed',
    'note',
    'missed_reason',
    'habit_type',
    'schedule_type',
    'quantity',
    'quantity_unit',
    'outcome',
    'slip_reason',
    'freeze_reason',
    'freeze_note',
  ];
  const escape = (value: unknown) => {
    const s = String(value ?? '');
    return /[,"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const rows = (logs as unknown as EngineLog[])
    .sort((a, b) => b.log_date.localeCompare(a.log_date))
    .map((l) => {
      const h = habits.find((h) => h.id === l.habit_id)!;
      return [
        l.log_date,
        h.name,
        (h as any).frequency,
        h.time_of_day,
        isComplete(h, l) ? 1 : 0,
        l.note,
        l.missed_reason,
        h.habit_type,
        h.schedule_type,
        l.quantity,
        h.quantity_unit,
        l.outcome,
        l.slip_reason,
        l.freeze_reason,
        l.freeze_note,
      ]
        .map(escape)
        .join(',');
    });
  return [columns.join(','), ...rows].join('\n');
}

export function getIncompleteCount(date: string): number {
  const logs = habitSnapshot().logs as unknown as EngineLog[];
  return getAllHabits().filter(
    (h) =>
      isDue(h, date, logs) &&
      !isComplete(h, logFor(logs, h, date)) &&
      logFor(logs, h, date)?.outcome !== 'freeze' &&
      (h.schedule_type !== 'weekly_target' || !periodSummary(h, logs, date).met),
  ).length;
}
