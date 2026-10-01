import type { Migration } from '../database/migrationRegistry';
export const reflectionMigration: Migration = {
  version: 200,
  name: 'Reflection plans, FTS journal, reviews, goals and reminders',
  apply(db) {
    db.exec(`CREATE TABLE reflection_plans(date TEXT PRIMARY KEY,json TEXT NOT NULL);
    CREATE TABLE reflection_journal(date TEXT PRIMARY KEY,text TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE VIRTUAL TABLE reflection_journal_fts USING fts5(date UNINDEXED,text,tokenize='unicode61');
    CREATE TRIGGER reflection_journal_insert AFTER INSERT ON reflection_journal BEGIN INSERT INTO reflection_journal_fts(date,text) VALUES(new.date,new.text); END;
    CREATE TRIGGER reflection_journal_delete AFTER DELETE ON reflection_journal BEGIN DELETE FROM reflection_journal_fts WHERE date=old.date; END;
    CREATE TRIGGER reflection_journal_update AFTER UPDATE ON reflection_journal BEGIN DELETE FROM reflection_journal_fts WHERE date=old.date; INSERT INTO reflection_journal_fts(date,text) VALUES(new.date,new.text); END;
    CREATE TABLE reflection_reviews(start TEXT PRIMARY KEY,json TEXT NOT NULL);
    CREATE TABLE reflection_goals(id TEXT PRIMARY KEY,json TEXT NOT NULL);
    CREATE TABLE reflection_settings(id INTEGER PRIMARY KEY CHECK(id=1),json TEXT NOT NULL);
    CREATE TABLE reflection_reminder_deliveries(key TEXT PRIMARY KEY,delivered_at TEXT NOT NULL);`);
  },
};
