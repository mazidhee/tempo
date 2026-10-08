import type { Migration } from '../database/migrationRegistry';
export const knowledgeMigration: Migration = {
  version: 211,
  name: 'Local Markdown notes and folder index',
  apply(db) {
    db.exec(`CREATE TABLE knowledge_notes(id TEXT PRIMARY KEY,json TEXT NOT NULL,mirror_hash TEXT NOT NULL DEFAULT '',dirty INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE knowledge_folders(path TEXT PRIMARY KEY);`);
  },
};
