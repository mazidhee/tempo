import { validateNote, validFolder, type KnowledgeNote } from '../../shared/knowledge';
import type { ModuleBackupAdapter } from '../database/moduleBackup';
type Payload = { notes: KnowledgeNote[]; folders: string[] };
export const knowledgeBackup: ModuleBackupAdapter = {
  key: 'knowledge',
  export: (db) => ({
    notes: (db.prepare('SELECT json FROM knowledge_notes').all() as { json: string }[]).map((r) =>
      JSON.parse(r.json),
    ),
    folders: (db.prepare('SELECT path FROM knowledge_folders').all() as { path: string }[]).map(
      (r) => r.path,
    ),
  }),
  validate(value) {
    const p = value as Payload;
    if (
      !p ||
      !Array.isArray(p.notes) ||
      p.notes.length > 100000 ||
      !Array.isArray(p.folders) ||
      p.folders.length > 10000 ||
      p.folders.some((f) => !validFolder(f)) ||
      new Set(p.notes.map((n) => n?.id)).size !== p.notes.length
    )
      throw Error('Invalid notes backup. Nothing was changed.');
    p.notes.forEach(validateNote);
  },
  merge(db, value, links) {
    const p = value as Payload;
    // Existing local notes win; restoring never overwrites more recent writing.
    for (const n of p.notes) {
      const remapped = n.links.map((id) => {
        if (id.startsWith('topic:'))
          return `topic:${links.studyTopics.get(id.slice(6)) || id.slice(6)}`;
        if (id.startsWith('curriculum:'))
          return `curriculum:${links.studyCurricula.get(id.slice(11)) || id.slice(11)}`;
        return id;
      });
      db.prepare('INSERT OR IGNORE INTO knowledge_notes(id,json,dirty) VALUES(?,?,1)').run(
        n.id,
        JSON.stringify({ ...n, links: remapped }),
      );
    }
    for (const folder of p.folders)
      db.prepare('INSERT OR IGNORE INTO knowledge_folders(path) VALUES(?)').run(folder);
  },
};
