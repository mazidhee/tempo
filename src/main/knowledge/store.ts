import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  existsSync,
  lstatSync,
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
} from 'node:fs';
import type Database from '../database/sqlite';
import {
  noteMarkdown,
  validateNote,
  validFolder,
  type KnowledgeNote,
  type KnowledgeSnapshot,
} from '../../shared/knowledge';
const hash = (content: string) => createHash('sha256').update(content).digest('hex');
type Row = { id: string; json: string; mirror_hash: string; dirty: number };
export class KnowledgeStore {
  error = '';
  constructor(
    private db: Database,
    readonly directory: string,
  ) {}
  private location(n: KnowledgeNote) {
    validateNote(n);
    mkdirSync(this.directory, { recursive: true });
    if (lstatSync(this.directory).isSymbolicLink())
      throw Error('Notes directory must not be a symbolic link.');
    let folder = this.directory;
    for (const segment of n.folder.split('/').filter(Boolean)) {
      folder = path.join(folder, segment);
      if (existsSync(folder) && lstatSync(folder).isSymbolicLink())
        throw Error('Note folders must not be symbolic links.');
      mkdirSync(folder, { recursive: true });
    }
    const file = path.join(folder, `${n.id}.md`);
    if (existsSync(file) && lstatSync(file).isSymbolicLink())
      throw Error('Note file must not be a symbolic link.');
    return file;
  }
  private mirror(row: Row) {
    const n = JSON.parse(row.json) as KnowledgeNote,
      file = this.location(n),
      content = noteMarkdown(n),
      nextHash = hash(content);
    if (existsSync(file)) {
      const existing = hash(readFileSync(file, 'utf8'));
      if (existing !== nextHash && existing !== row.mirror_hash)
        throw Error(
          `The Markdown file for “${n.title}” changed outside Tempo. Your external file is preserved; move it aside before retrying the save.`,
        );
    }
    const temporary = file + `.${crypto.randomUUID()}.tmp`;
    try {
      writeFileSync(temporary, content, { flag: 'wx', mode: 0o600 });
      renameSync(temporary, file);
    } finally {
      if (existsSync(temporary)) unlinkSync(temporary);
    }
    this.db
      .prepare('UPDATE knowledge_notes SET mirror_hash=?,dirty=0 WHERE id=?')
      .run(nextHash, n.id);
  }
  reconcile() {
    this.error = '';
    for (const row of this.db.prepare('SELECT * FROM knowledge_notes').all() as Row[]) {
      try {
        if (row.dirty || !existsSync(this.location(JSON.parse(row.json)))) this.mirror(row);
      } catch (e) {
        this.error = (e as Error).message;
      }
    }
  }
  snapshot(): KnowledgeSnapshot {
    return {
      notes: (this.db.prepare('SELECT json FROM knowledge_notes').all() as { json: string }[]).map(
        (r) => JSON.parse(r.json),
      ),
      folders: (
        this.db.prepare('SELECT path FROM knowledge_folders ORDER BY path').all() as {
          path: string;
        }[]
      ).map((r) => r.path),
      directory: this.directory,
      error: this.error,
    };
  }
  save(input: unknown) {
    validateNote(input);
    const n = { ...input, updatedAt: new Date().toISOString() };
    const previous = this.db.prepare('SELECT * FROM knowledge_notes WHERE id=?').get(n.id) as
      Row | undefined;
    let previousHash = previous?.mirror_hash || '';
    if (previous) {
      const old = JSON.parse(previous.json) as KnowledgeNote,
        file = this.location(old);
      if (
        existsSync(file) &&
        hash(readFileSync(file, 'utf8')) !== previous.mirror_hash &&
        hash(readFileSync(file, 'utf8')) !== hash(noteMarkdown(old))
      )
        throw Error(
          'This note’s Markdown file changed outside Tempo. Your external file is preserved.',
        );
      n.createdAt = old.createdAt;
      if (existsSync(file)) previousHash = hash(readFileSync(file, 'utf8'));
    }
    const file = this.location(n),
      oldNote = previous ? (JSON.parse(previous.json) as KnowledgeNote) : undefined;
    if ((!previous || oldNote?.folder !== n.folder) && existsSync(file))
      throw Error('A Markdown file already exists at this destination. Choose another folder.');
    this.db.transaction(() => {
      if (n.folder)
        this.db.prepare('INSERT OR IGNORE INTO knowledge_folders(path) VALUES(?)').run(n.folder);
      this.db
        .prepare(
          'INSERT INTO knowledge_notes(id,json,mirror_hash,dirty) VALUES(?,?,?,1) ON CONFLICT(id) DO UPDATE SET json=excluded.json,mirror_hash=excluded.mirror_hash,dirty=1',
        )
        .run(n.id, JSON.stringify(n), oldNote?.folder === n.folder ? previousHash : '');
    })();
    // SQLite retains a recovery copy if a disk write fails; reconciliation retries safely.
    this.error = '';
    try {
      this.mirror(this.db.prepare('SELECT * FROM knowledge_notes WHERE id=?').get(n.id) as Row);
      if (oldNote && oldNote.folder !== n.folder) {
        const oldFile = this.location(oldNote);
        if (existsSync(oldFile) && hash(readFileSync(oldFile, 'utf8')) === previous?.mirror_hash)
          unlinkSync(oldFile);
      }
    } catch (e) {
      this.error = (e as Error).message;
    }
    return this.snapshot();
  }
  folder(input: unknown) {
    if (!validFolder(input) || !input) throw Error('Enter a folder path such as Engineering/SQL.');
    this.db.prepare('INSERT OR IGNORE INTO knowledge_folders(path) VALUES(?)').run(input);
    return this.snapshot();
  }
}
