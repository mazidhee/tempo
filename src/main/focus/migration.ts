import { defaultFocusSettings } from '../../shared/focus';
import type { Migration } from '../database/migrationRegistry';
export const focusMigration: Migration = {
  version: 100,
  name: 'main-process focus ownership and opt-in guard',
  apply(db) {
    db.exec(`CREATE TABLE IF NOT EXISTS focus_settings(id INTEGER PRIMARY KEY CHECK(id=1),json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS focus_break_events(id TEXT PRIMARY KEY,run_id TEXT NOT NULL,at TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('attempt','emergency')),target TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS focus_break_at ON focus_break_events(at);`);
    db.prepare('INSERT OR IGNORE INTO focus_settings(id,json) VALUES(1,?)').run(
      JSON.stringify(defaultFocusSettings()),
    );
  },
};
