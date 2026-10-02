import type { Migration } from './migrationRegistry';
/** Add a preference; retain all records and every existing appearance choice. */
export const appearanceMigration: Migration = {
  version: 202,
  name: 'workspace-surface-palettes',
  apply(db) {
    if (!db.prepare("SELECT name FROM sqlite_master WHERE name='productivity_state'").get()) return;
    const row = db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as
      { json: string } | undefined;
    if (!row) return;
    const state = JSON.parse(row.json);
    state.settings = { themePalette: 'default', ...state.settings };
    db.prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(state));
  },
};
