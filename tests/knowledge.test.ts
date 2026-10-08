import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from '../src/main/database/sqlite';
import { knowledgeMigration } from '../src/main/knowledge/migration';
import { KnowledgeStore } from '../src/main/knowledge/store';
import { knowledgeBackup } from '../src/main/knowledge/backup';
import {
  validFolder,
  documentMarkdown,
  buildKnowledgeGraph,
  type KnowledgeNote,
} from '../src/shared/knowledge';
import { plainJournalDocument } from '../src/shared/journalDocument';
import { defaultProductivity, validProductivity } from '../src/shared/productivity';
import { widgetOpacity } from '../src/shared/focusWidget';
import { createGraphLayout } from '../src/shared/graphLayout';
const note = (): KnowledgeNote => ({
  id: crypto.randomUUID(),
  title: 'Pipeline notes',
  folder: 'Engineering/SQL',
  tags: ['sql'],
  links: [],
  document: plainJournalDocument('Validate inputs.'),
  createdAt: '2026-10-08T09:00:00Z',
  updatedAt: '2026-10-08T09:00:00Z',
  archived: false,
});
function fixture() {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'tempo-notes-test-')),
    db = new Database(path.join(directory, 'fixture.db'));
  knowledgeMigration.apply(db);
  return {
    db,
    directory,
    store: new KnowledgeStore(db, path.join(directory, 'notes')),
    close() {
      db.close();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
test('notes persist as nested Markdown, survive database reopening, move safely and keep an external edit', () => {
  const f = fixture();
  try {
    const n = note(),
      s = f.store.save(n);
    assert.equal(s.error, '');
    const file = path.join(s.directory, n.folder, `${n.id}.md`);
    assert.match(readFileSync(file, 'utf8'), /# Pipeline notes/);
    assert.match(readFileSync(file, 'utf8'), /Validate inputs\./);
    f.db.close();
    const reopened = new Database(path.join(f.directory, 'fixture.db')),
      store = new KnowledgeStore(reopened, s.directory);
    assert.equal(store.snapshot().notes[0].id, n.id);
    const moved = store.save({ ...n, folder: 'Work/Data' });
    assert.equal(moved.error, '');
    assert.ok(!existsSync(file));
    const nextFile = path.join(s.directory, 'Work/Data', `${n.id}.md`);
    writeFileSync(nextFile, 'External writing');
    assert.throws(
      () => store.save({ ...n, folder: 'Work/Data', title: 'Updated' }),
      /outside Tempo/,
    );
    assert.equal(readFileSync(nextFile, 'utf8'), 'External writing');
    assert.equal(store.snapshot().notes[0].title, n.title);
    reopened.close();
  } finally {
    rmSync(f.directory, { recursive: true, force: true });
  }
});
test('Markdown mirror recovery retries pending writes and never replaces conflicting files', () => {
  const f = fixture();
  try {
    const n = note();
    f.db
      .prepare('INSERT INTO knowledge_notes(id,json,dirty) VALUES(?,?,1)')
      .run(n.id, JSON.stringify(n));
    f.store.reconcile();
    assert.equal(f.store.error, '');
    const file = path.join(f.store.directory, n.folder, `${n.id}.md`);
    assert.ok(existsSync(file));
    f.db.prepare('UPDATE knowledge_notes SET dirty=1 WHERE id=?').run(n.id);
    writeFileSync(file, 'outside edit');
    f.store.reconcile();
    assert.match(f.store.error, /outside Tempo/);
    assert.equal(readFileSync(file, 'utf8'), 'outside edit');
  } finally {
    f.close();
  }
});
test('folder validation rejects Windows traversal, device names and absolute paths', () => {
  for (const p of [
    '../escape',
    'C:/secret',
    '\\server\\folder',
    'Engineering/..',
    'Engineering/NUL',
    'SQL.',
    '/root',
    'A//B',
    'A/CON.txt',
  ])
    assert.equal(validFolder(p), false, p);
  assert.ok(validFolder('Engineering/SQL'));
  assert.ok(validFolder('Personal thoughts'));
});
test('notes backup restores new notes idempotently, preserves local versions and rejects invalid documents', () => {
  const source = fixture(),
    target = fixture();
  try {
    const n = note();
    source.store.save(n);
    const payload = knowledgeBackup.export(source.db);
    knowledgeBackup.validate(payload);
    const links = { habits: new Map(), studyTopics: new Map(), studyCurricula: new Map() };
    target.db.transaction(() => knowledgeBackup.merge(target.db, payload, links))();
    target.store.reconcile();
    assert.equal(target.store.snapshot().notes.length, 1);
    target.store.save({ ...n, title: 'My newer writing' });
    target.db.transaction(() => knowledgeBackup.merge(target.db, payload, links))();
    assert.equal(target.store.snapshot().notes[0].title, 'My newer writing');
    assert.throws(
      () => knowledgeBackup.validate({ notes: [{ ...n, folder: '../bad' }], folders: [] }),
      /Invalid note/,
    );
  } finally {
    source.close();
    target.close();
  }
});
test('portable Markdown preserves code fences, headings and nested lists', () => {
  const md = documentMarkdown({
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Boundary' }] },
      {
        type: 'codeBlock',
        attrs: { language: 'python' },
        content: [{ type: 'text', text: 'print("```")' }],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'Parent' }] },
              {
                type: 'bulletList',
                content: [
                  {
                    type: 'listItem',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Child' }] }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
  assert.match(md, /## Boundary/);
  assert.match(md, /````python\nprint\("```"\)\n````/);
  assert.match(md, /- Parent\n\s+- Child/);
});
test('restoring notes follows remapped study identities rather than linking unrelated local records', () => {
  const f = fixture();
  try {
    const n = note();
    n.links = ['topic:old-topic', 'curriculum:old-curriculum', 'project:work'];
    knowledgeBackup.merge(
      f.db,
      { notes: [n], folders: [] },
      {
        habits: new Map(),
        studyTopics: new Map([['old-topic', 'restored-topic']]),
        studyCurricula: new Map([['old-curriculum', 'restored-curriculum']]),
      },
    );
    assert.deepEqual(f.store.snapshot().notes[0].links, [
      'topic:restored-topic',
      'curriculum:restored-curriculum',
      'project:work',
    ]);
  } finally {
    f.close();
  }
});
test('graph uses only saved record identities and declared relationships, including isolated notes', () => {
  const n = note();
  n.links = ['topic:t', 'topic:t', 'note:missing'];
  const graph = buildKnowledgeGraph(
    [n],
    {
      curricula: [
        { id: 'c', title: 'SWE', description: '', createdAt: n.createdAt, archived: false },
      ],
      topics: [
        {
          id: 't',
          title: 'SQL',
          curriculumId: 'c',
          parentId: null,
          order: 0,
          learnedAt: null,
          reviewDue: null,
          interval: 0,
          archived: false,
        },
      ],
      reviews: [],
    },
    defaultProductivity(),
  );
  assert.equal(graph.nodes.length, 3);
  assert.equal(graph.edges.length, 2);
  assert.equal(graph.nodes.find((x) => x.id === 'topic:t')?.route, '/study/c?topic=t');
  const layout = createGraphLayout(graph);
  for (let i = 0; i < 150; i++) layout.step();
  assert.ok(layout.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));
});
test('sidebar order is validated and widget opacity cannot become invisible', () => {
  const state = defaultProductivity();
  state.settings.sidebarOrder = ['notes', 'home'];
  assert.ok(validProductivity(state));
  state.settings.sidebarOrder = ['home', 'home'];
  assert.ok(!validProductivity(state));
  assert.equal(widgetOpacity(0.35), 0.35);
  assert.throws(() => widgetOpacity(0));
  assert.throws(() => widgetOpacity(NaN));
});
test('interface scale validates finite readable bounds and old backups remain valid', () => {
  const state = defaultProductivity();
  assert.ok(validProductivity(state));
  for (const scale of [0.8, 0.9, 1, 1.25]) {
    state.settings.interfaceScale = scale;
    assert.ok(validProductivity(state));
  }
  for (const scale of [0, 0.79, 1.26, Infinity, NaN]) {
    state.settings.interfaceScale = scale;
    assert.ok(!validProductivity(state));
  }
});
