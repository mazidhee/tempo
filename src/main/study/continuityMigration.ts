import type { Migration } from '../database/migrationRegistry';
/** Add optional study continuity metadata without replacing topic IDs or progress. */
export const continuityMigration: Migration = {
  version: 203,
  name: 'study-continuity',
  apply(db) {
    for (const row of db.prepare('SELECT id,json FROM study_curricula').all() as {
      id: string;
      json: string;
    }[]) {
      const curriculum = JSON.parse(row.json);
      const next = {
        studyFocus: /software|mathematics|\bswe\b/i.test(curriculum.title),
        focusUntil: null,
        currentTopicId: null,
        ...curriculum,
      };
      db.prepare('UPDATE study_curricula SET json=? WHERE id=?').run(JSON.stringify(next), row.id);
    }
  },
};
