import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db: Database.Database;

export function initDatabase(): Database.Database {
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
  const columns = db.prepare("PRAGMA table_info(habits)").all() as any[];
  const colNames = columns.map((c: any) => c.name);
  if (!colNames.includes('days_of_week')) {
    db.exec("ALTER TABLE habits ADD COLUMN days_of_week TEXT DEFAULT 'mon,tue,wed,thu,fri,sat,sun'");
  }
  if (!colNames.includes('scheduled_time')) {
    db.exec('ALTER TABLE habits ADD COLUMN scheduled_time TEXT');
  }

  return db;
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function getAllHabits(includeArchived = false) {
  const d = getDb();
  if (includeArchived) {
    return d.prepare('SELECT * FROM habits ORDER BY created_at DESC').all();
  }
  return d.prepare('SELECT * FROM habits WHERE is_archived = 0 ORDER BY created_at DESC').all();
}

export function addHabit(data: {
  name: string;
  description?: string;
  frequency: string;
  time_of_day: string;
  days_of_week?: string;
  scheduled_time?: string;
}) {
  const d = getDb();
  const stmt = d.prepare(
    'INSERT INTO habits (name, description, frequency, time_of_day, days_of_week, scheduled_time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
    data.name,
    data.description || null,
    data.frequency,
    data.time_of_day,
    data.days_of_week || 'mon,tue,wed,thu,fri,sat,sun',
    data.scheduled_time || null,
    new Date().toISOString()
  );
  return { id: result.lastInsertRowid, ...data };
}

export function editHabit(data: {
  id: number;
  name: string;
  description?: string;
  frequency: string;
  time_of_day: string;
  days_of_week?: string;
  scheduled_time?: string;
}) {
  const d = getDb();
  const stmt = d.prepare(
    'UPDATE habits SET name = ?, description = ?, frequency = ?, time_of_day = ?, days_of_week = ?, scheduled_time = ? WHERE id = ?'
  );
  stmt.run(
    data.name,
    data.description || null,
    data.frequency,
    data.time_of_day,
    data.days_of_week || 'mon,tue,wed,thu,fri,sat,sun',
    data.scheduled_time || null,
    data.id
  );
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
  d.prepare('DELETE FROM habit_logs WHERE habit_id = ?').run(id);
  d.prepare('DELETE FROM habits WHERE id = ?').run(id);
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
       ORDER BY h.name`
    )
    .all(date);
}

export function getLogsByHabit(habitId: number) {
  const d = getDb();
  return d
    .prepare(
      `SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY log_date DESC`
    )
    .all(habitId);
}

export function toggleLog(habitId: number, logDate: string, isCompleted: boolean, note?: string) {
  const d = getDb();
  const existing = d
    .prepare('SELECT * FROM habit_logs WHERE habit_id = ? AND log_date = ?')
    .get(habitId, logDate) as any;

  if (existing) {
    d.prepare(
      'UPDATE habit_logs SET is_completed = ?, note = ? WHERE id = ?'
    ).run(isCompleted ? 1 : 0, note || existing.note || null, existing.id);
  } else {
    d.prepare(
      'INSERT INTO habit_logs (habit_id, log_date, is_completed, note) VALUES (?, ?, ?, ?)'
    ).run(habitId, logDate, isCompleted ? 1 : 0, note || null);
  }
  return { habitId, logDate, isCompleted };
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
      'INSERT INTO habit_logs (habit_id, log_date, is_completed, note) VALUES (?, ?, 0, ?)'
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
      'INSERT INTO habit_logs (habit_id, log_date, is_completed, missed_reason) VALUES (?, ?, 0, ?)'
    ).run(habitId, logDate, reason);
  }
  return { habitId, logDate, reason };
}

// TODO: need to improve performance here later
export function getStreaks() {
  const d = getDb();
  const habits = d.prepare('SELECT * FROM habits WHERE is_archived = 0').all() as any[];
  const today = new Date().toISOString().split('T')[0];

  const results = habits.map((habit) => {
    const logs = d
      .prepare(
        'SELECT log_date, is_completed FROM habit_logs WHERE habit_id = ? ORDER BY log_date DESC'
      )
      .all(habit.id) as any[];

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let streakBroken = false;

    const completedDates = new Set(
      logs.filter((l) => l.is_completed).map((l) => l.log_date)
    );

    const d2 = new Date(today);
    for (let i = 0; i < 365; i++) {
      const dateStr = d2.toISOString().split('T')[0];
      if (completedDates.has(dateStr)) {
        if (!streakBroken) currentStreak++;
        tempStreak++;
      } else {
        streakBroken = true;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
        tempStreak = 0;
      }
      d2.setDate(d2.getDate() - 1);
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;

    return {
      habitId: habit.id,
      habitName: habit.name,
      currentStreak,
      bestStreak,
    };
  });

  // will optimize this part later
  let overallCurrent = 0;
  const d3 = new Date(today);
  for (let i = 0; i < 365; i++) {
    const dateStr = d3.toISOString().split('T')[0];
    const activeHabits = d
      .prepare(
        "SELECT COUNT(*) as cnt FROM habits WHERE is_archived = 0 AND created_at <= ? AND frequency = 'daily'"
      )
      .get(dateStr + 'T23:59:59.999Z') as any;
    const completed = d
      .prepare(
        'SELECT COUNT(*) as cnt FROM habit_logs hl JOIN habits h ON hl.habit_id = h.id WHERE hl.log_date = ? AND hl.is_completed = 1 AND h.is_archived = 0'
      )
      .get(dateStr) as any;

    if (activeHabits.cnt > 0 && completed.cnt >= activeHabits.cnt) {
      overallCurrent++;
    } else {
      break;
    }
    d3.setDate(d3.getDate() - 1);
  }

  return { habits: results, overallStreak: overallCurrent };
}

export function getCompletionRates() {
  const d = getDb();
  const habits = d.prepare('SELECT * FROM habits WHERE is_archived = 0').all() as any[];
  const today = new Date();

  const periods = [
    { label: '7d', days: 7 },
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
  ];

  const results = habits.map((habit) => {
    const rates: Record<string, number> = {};
    for (const period of periods) {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - period.days);
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = today.toISOString().split('T')[0];

      const total = d
        .prepare(
          'SELECT COUNT(DISTINCT log_date) as cnt FROM habit_logs WHERE habit_id = ? AND log_date >= ? AND log_date <= ?'
        )
        .get(habit.id, startStr, endStr) as any;

      const completed = d
        .prepare(
          'SELECT COUNT(*) as cnt FROM habit_logs WHERE habit_id = ? AND log_date >= ? AND log_date <= ? AND is_completed = 1'
        )
        .get(habit.id, startStr, endStr) as any;

      rates[period.label] = period.days > 0 ? Math.round((completed.cnt / period.days) * 100) : 0;
    }
    return { habitId: habit.id, habitName: habit.name, rates };
  });

  const overallRates: Record<string, number> = {};
  for (const period of periods) {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - period.days);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];

    const totalPossible = habits.length * period.days;
    const completed = d
      .prepare(
        `SELECT COUNT(*) as cnt FROM habit_logs hl
         JOIN habits h ON hl.habit_id = h.id
         WHERE hl.log_date >= ? AND hl.log_date <= ? AND hl.is_completed = 1 AND h.is_archived = 0`
      )
      .get(startStr, endStr) as any;

    overallRates[period.label] = totalPossible > 0 ? Math.round((completed.cnt / totalPossible) * 100) : 0;
  }

  return { habits: results, overall: overallRates };
}

export function getHeatmapData() {
  const d = getDb();
  const today = new Date();
  const startDate = new Date(today);
  startDate.setFullYear(startDate.getFullYear() - 1);
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = today.toISOString().split('T')[0];

  const totalHabits = (
    d.prepare('SELECT COUNT(*) as cnt FROM habits WHERE is_archived = 0').get() as any
  ).cnt;

  const data = d
    .prepare(
      `SELECT log_date, COUNT(*) as completed_count
       FROM habit_logs hl
       JOIN habits h ON hl.habit_id = h.id
       WHERE hl.log_date >= ? AND hl.log_date <= ? AND hl.is_completed = 1 AND h.is_archived = 0
       GROUP BY log_date
       ORDER BY log_date`
    )
    .all(startStr, endStr) as any[];

  return { days: data, totalHabits };
}

export function getBestWorstDay() {
  const d = getDb();
  const data = d
    .prepare(
      `SELECT
         CASE CAST(strftime('%w', log_date) AS INTEGER)
           WHEN 0 THEN 'Sunday'
           WHEN 1 THEN 'Monday'
           WHEN 2 THEN 'Tuesday'
           WHEN 3 THEN 'Wednesday'
           WHEN 4 THEN 'Thursday'
           WHEN 5 THEN 'Friday'
           WHEN 6 THEN 'Saturday'
         END as day_name,
         CAST(strftime('%w', log_date) AS INTEGER) as day_num,
         AVG(CASE WHEN is_completed = 1 THEN 1.0 ELSE 0.0 END) as avg_rate,
         COUNT(*) as total_logs
       FROM habit_logs hl
       JOIN habits h ON hl.habit_id = h.id
       WHERE h.is_archived = 0
       GROUP BY day_num
       ORDER BY avg_rate DESC`
    )
    .all() as any[];

  if (data.length === 0) {
    return { best: null, worst: null, all: [] };
  }

  return {
    best: data[0],
    worst: data[data.length - 1],
    all: data,
  };
}

export function getHabitTrend(habitId: number) {
  const d = getDb();
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 30);
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = today.toISOString().split('T')[0];

  const logs = d
    .prepare(
      `SELECT log_date, is_completed FROM habit_logs
       WHERE habit_id = ? AND log_date >= ? AND log_date <= ?
       ORDER BY log_date`
    )
    .all(habitId, startStr, endStr) as any[];

  const logMap = new Map(logs.map((l: any) => [l.log_date, l.is_completed]));
  const result: { date: string; completed: number; average: number }[] = [];

  const cursor = new Date(startDate);
  while (cursor <= today) {
    const dateStr = cursor.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      completed: logMap.get(dateStr) === 1 ? 1 : 0,
      average: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // calculating rolling average
  for (let i = 0; i < result.length; i++) {
    const windowStart = Math.max(0, i - 6);
    const window = result.slice(windowStart, i + 1);
    const avg = window.reduce((sum, d) => sum + d.completed, 0) / window.length;
    result[i].average = Math.round(avg * 100) / 100;
  }

  return result;
}

export function getWeeklyData(startDate: string, endDate: string) {
  const d = getDb();
  const data = d
    .prepare(
      `SELECT hl.log_date, hl.habit_id, hl.is_completed, hl.note, hl.missed_reason,
              h.name as habit_name, h.frequency, h.time_of_day
       FROM habit_logs hl
       JOIN habits h ON hl.habit_id = h.id
       WHERE hl.log_date >= ? AND hl.log_date <= ? AND h.is_archived = 0
       ORDER BY h.name, hl.log_date`
    )
    .all(startDate, endDate) as any[];

  // attaching schedule details also
  return data.map((row) => ({
    ...row,
    days_of_week: (d.prepare('SELECT days_of_week FROM habits WHERE id = ?').get(row.habit_id) as any)?.days_of_week || 'mon,tue,wed,thu,fri,sat,sun',
  }));
}

export function getHistoryData() {
  const d = getDb();
  return d
    .prepare(
      `SELECT hl.*, h.name as habit_name, h.frequency, h.time_of_day
       FROM habit_logs hl
       JOIN habits h ON hl.habit_id = h.id
       WHERE h.is_archived = 0
       ORDER BY hl.log_date DESC, h.name`
    )
    .all();
}

export function exportCSV(): string {
  const d = getDb();
  const rows = d
    .prepare(
      `SELECT hl.log_date as date, h.name as habit_name, h.frequency, h.time_of_day,
              hl.is_completed, hl.note, hl.missed_reason
       FROM habit_logs hl
       JOIN habits h ON hl.habit_id = h.id
       ORDER BY hl.log_date DESC, h.name`
    )
    .all() as any[];

  const header = 'date,habit_name,frequency,time_of_day,is_completed,note,missed_reason';
  const csvRows = rows.map((r) => {
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    return [
      r.date,
      escapeCsv(r.habit_name),
      r.frequency,
      r.time_of_day,
      r.is_completed,
      escapeCsv(r.note),
      escapeCsv(r.missed_reason),
    ].join(',');
  });

  return [header, ...csvRows].join('\n');
}

export function getIncompleteCount(date: string): number {
  const d = getDb();
  const totalActive = (
    d
      .prepare(
        "SELECT COUNT(*) as cnt FROM habits WHERE is_archived = 0 AND frequency = 'daily'"
      )
      .get() as any
  ).cnt;

  const completedToday = (
    d
      .prepare(
        `SELECT COUNT(*) as cnt FROM habit_logs hl
         JOIN habits h ON hl.habit_id = h.id
         WHERE hl.log_date = ? AND hl.is_completed = 1 AND h.is_archived = 0`
      )
      .get(date) as any
  ).cnt;

  return totalActive - completedToday;
}
