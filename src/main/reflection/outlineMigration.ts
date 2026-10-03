import type { Migration } from '../database/migrationRegistry';
import type { JournalDocument } from '../../shared/journalDocument';
/** Version the optional fold attribute without changing journal text or structure. */
export const outlineMigration: Migration = {
  version: 205,
  name: 'journal-outline-fold-state',
  apply(db) {
    const visit = (node: JournalDocument) => {
      if (node.type === 'listItem') node.attrs = { collapsed: false, ...node.attrs };
      node.content?.forEach(visit);
    };
    for (const row of db
      .prepare('SELECT date,document FROM reflection_journal WHERE document IS NOT NULL')
      .all() as { date: string; document: string }[]) {
      const document = JSON.parse(row.document) as JournalDocument;
      visit(document);
      db.prepare('UPDATE reflection_journal SET document=? WHERE date=?').run(
        JSON.stringify(document),
        row.date,
      );
    }
  },
};
