import type Database from '../database/sqlite';
/** Version 201 adds import provenance and local appearance preferences. */
export const personalMigration = {
  version: 201,
  name: 'study-import-and-personalization',
  apply(db: Database) {
    db.exec(
      'CREATE TABLE study_imports (id TEXT PRIMARY KEY, curriculum_id TEXT NOT NULL REFERENCES study_curricula(id), json TEXT NOT NULL)',
    );
    if (!db.prepare("SELECT name FROM sqlite_master WHERE name='productivity_state'").get()) return;
    const row = db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as
      { json: string } | undefined;
    if (row) {
      const state = JSON.parse(row.json);
      state.settings = {
        accent: 'lavender',
        avatar: null,
        greetingStyle: 'mixed',
        ...state.settings,
      };
      db.prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(state));
    }
  },
};
