import type { Migration } from '../database/migrationRegistry';
/** Keep every legacy text value unchanged; new rich content is optional. */
export const documentMigration: Migration = {
  version: 204,
  name: 'rich-journal-and-local-covers',
  apply(db) {
    db.exec('ALTER TABLE reflection_journal ADD COLUMN document TEXT');
    for (const row of db.prepare('SELECT id,json FROM study_curricula').all() as {
      id: string;
      json: string;
    }[])
      db.prepare('UPDATE study_curricula SET json=? WHERE id=?').run(
        JSON.stringify({ coverImage: null, ...JSON.parse(row.json) }),
        row.id,
      );
  },
};
