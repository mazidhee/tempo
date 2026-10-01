import type Database from './sqlite';
import { defaultProductivity } from '../../shared/productivity';
import { localDate } from '../../shared/productivity';
// Additive migration: no legacy habit/log rows are rewritten or dropped.
export function migrateProductivity(db: Database) {
  db.transaction(() => {
    db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS productivity_state (id INTEGER PRIMARY KEY CHECK(id = 1), json TEXT NOT NULL);`);
    db.prepare('INSERT OR IGNORE INTO productivity_state(id,json) VALUES(1,?)').run(
      JSON.stringify(defaultProductivity()),
    );
    db.prepare('INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(2,?)').run(
      new Date().toISOString(),
    );
  })();
}

/** Version 3 leaves every original column and log untouched. New defaults
 * deliberately convert existing habits to Check + daily as requested. */
export function migrateHabitEngine(db: Database) {
  if (db.prepare('SELECT version FROM schema_migrations WHERE version=3').get()) return;
  const fields: Record<string, string> = {
    habit_type: "TEXT NOT NULL DEFAULT 'check'",
    schedule_type: "TEXT NOT NULL DEFAULT 'daily'",
    quantity_target: 'REAL NOT NULL DEFAULT 1',
    quantity_unit: "TEXT NOT NULL DEFAULT ''",
    completion_threshold: 'REAL NOT NULL DEFAULT 100',
    weekly_target: 'INTEGER NOT NULL DEFAULT 3',
    interval_days: 'INTEGER NOT NULL DEFAULT 2',
    start_date: "TEXT NOT NULL DEFAULT ''",
    week_start: 'INTEGER NOT NULL DEFAULT 1',
    freeze_cap: 'INTEGER NOT NULL DEFAULT 3',
    pause_cap: 'INTEGER NOT NULL DEFAULT 14',
    non_negotiable: 'INTEGER NOT NULL DEFAULT 0',
    after_habit_id: 'INTEGER',
  };
  const logFields: Record<string, string> = {
    quantity: 'REAL NOT NULL DEFAULT 0',
    outcome: "TEXT NOT NULL DEFAULT 'pending'",
    slip_reason: 'TEXT',
    freeze_reason: 'TEXT',
    freeze_note: 'TEXT',
    freeze_at: 'TEXT',
  };
  db.transaction(() => {
    for (const [table, additions] of [
      ['habits', fields],
      ['habit_logs', logFields],
    ] as const) {
      const existing = new Set(
        (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name),
      );
      for (const [field, sql] of Object.entries(additions))
        if (!existing.has(field)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${field} ${sql}`);
    }
    for (const h of db.prepare('SELECT id,created_at FROM habits').all() as {
      id: number;
      created_at: string;
    }[]) {
      db.prepare('UPDATE habits SET start_date=? WHERE id=?').run(
        localDate(new Date(h.created_at)),
        h.id,
      );
    }
    db.exec(
      "UPDATE habit_logs SET outcome=CASE WHEN is_completed=1 THEN 'done' ELSE 'pending' END",
    );
    db.exec(`CREATE TABLE habit_pauses (
      id INTEGER PRIMARY KEY AUTOINCREMENT, habit_id INTEGER NOT NULL,
      start_date TEXT NOT NULL, end_date TEXT NOT NULL, reason TEXT NOT NULL,
      FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE);
      CREATE INDEX idx_pauses_habit ON habit_pauses(habit_id);`);
    db.prepare('INSERT INTO schema_migrations(version,applied_at) VALUES(3,?)').run(
      new Date().toISOString(),
    );
  })();
}
