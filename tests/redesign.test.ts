import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from '../src/main/database/sqlite';
import { migrateHabitEngine, migrateProductivity } from '../src/main/database/migrations';
import { runModuleMigrations, migrations } from '../src/main/database/migrationRegistry';
import { reflectionBackup } from '../src/main/reflection/backup';
import { ReflectionStore } from '../src/main/reflection/store';
import { StudyStore } from '../src/main/study/store';
import { studyBackup, validateStudySnapshot } from '../src/main/study/backup';
import { encryptBackup, decryptBackup } from '../src/main/backup/crypto';
import { GitHubBackup } from '../src/main/backup/github';
import {
  plainJournalDocument,
  validateJournalDocument,
  journalDocumentText,
} from '../src/shared/journalDocument';
import { activeStudyTopics, isStudyFocus, studyContinuation } from '../src/shared/studyContinuity';
import { defaultProductivity } from '../src/shared/productivity';
import { validCover } from '../src/shared/localImage';
import { outlineMigration } from '../src/main/reflection/outlineMigration';
const password = 'a long private test password';

test('a completed later resume point advances before returning to earlier gaps', () => {
  const { db, study } = fixture();
  const c = study.saveCurriculum({ title: 'SWE' });
  const earlier = study.saveTopic({ curriculumId: c.id, title: 'Earlier gap', order: 0 });
  const current = study.saveTopic({ curriculumId: c.id, title: 'Functions', order: 10 });
  const next = study.saveTopic({ curriculumId: c.id, title: 'Return values', order: 11 });
  study.saveCurriculum({ ...c, currentTopicId: current.id });
  study.learn({ id: current.id, learned: true });
  const curriculum = study.snapshot().curricula[0];
  assert.equal(studyContinuation(study.snapshot(), curriculum, []).topic?.id, next.id);
  study.learn({ id: next.id, learned: true });
  assert.equal(studyContinuation(study.snapshot(), curriculum, []).topic?.id, earlier.id);
  db.close();
});

test('journal fold-state migration preserves nested words, formatting and timestamps', () => {
  const { db, reflection } = fixture();
  const document = {
    type: 'doc',
    content: [
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Parent', marks: [{ type: 'bold' }] }],
              },
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
  };
  const before = reflection.saveJournal({ date: '2026-10-02', text: '', document });
  outlineMigration.apply(db);
  const after = reflection.lookup(before.date)!;
  assert.equal(after.text, before.text);
  assert.equal(after.updatedAt, before.updatedAt);
  assert.equal(after.document!.content![0].content![0].attrs!.collapsed, false);
  assert.deepEqual(after.document!.content![0].content![0].content![0].content![0].marks, [
    { type: 'bold' },
  ]);
  after.document!.content![0].content![0].attrs!.collapsed = true;
  validateJournalDocument(after.document);
  reflection.saveJournal({ date: before.date, text: '', document: after.document });
  assert.equal(reflection.search({ query: 'Child' })[0].date, before.date);
  assert.throws(() =>
    validateJournalDocument({
      type: 'doc',
      content: [{ type: 'listItem', attrs: { collapsed: 'true' } }],
    }),
  );
  db.close();
});
test('203 and 204 upgrade an actual prior schema without changing saved records', () => {
  const db = new Database(':memory:');
  db.exec(
    'CREATE TABLE habits(id INTEGER PRIMARY KEY,name TEXT,created_at TEXT,days_of_week TEXT,is_archived INTEGER DEFAULT 0);CREATE TABLE habit_logs(id INTEGER PRIMARY KEY,habit_id INTEGER,log_date TEXT,is_completed INTEGER,note TEXT,missed_reason TEXT);',
  );
  migrateProductivity(db);
  migrateHabitEngine(db);
  for (const m of migrations.filter((m) => m.version <= 202)) {
    m.apply(db);
    db.prepare('INSERT INTO schema_migrations VALUES(?,?)').run(m.version, '2026-10-01');
  }
  const original = {
    id: 'swe',
    title: 'Software engineering',
    description: 'Existing curriculum',
    createdAt: '2026-10-01T00:00:00Z',
    archived: false,
  };
  db.prepare('INSERT INTO study_curricula(id,json) VALUES(?,?)').run(
    original.id,
    JSON.stringify(original),
  );
  db.prepare('INSERT INTO reflection_journal(date,text,updated_at) VALUES(?,?,?)').run(
    '2026-10-01',
    'Original words\nKeep every line',
    '2026-10-01T00:00:00Z',
  );
  const originalState = db.prepare('SELECT json FROM productivity_state').all();
  runModuleMigrations(db, false);
  runModuleMigrations(db, false);
  const c = new StudyStore(db).snapshot().curricula[0];
  assert.equal(c.id, original.id);
  assert.equal(c.description, original.description);
  assert.equal(c.studyFocus, true);
  assert.equal(c.coverImage, null);
  assert.equal(
    db.prepare('SELECT text FROM reflection_journal').get()?.text,
    'Original words\nKeep every line',
  );
  assert.deepEqual(db.prepare('SELECT json FROM productivity_state').all(), originalState);
  assert.equal(
    db.prepare('SELECT COUNT(*) AS n FROM schema_migrations WHERE version IN (203,204)').get()?.n,
    2,
  );
  db.close();
});
function fixture() {
  const db = new Database(':memory:');
  db.exec(
    'CREATE TABLE habits(id INTEGER PRIMARY KEY,name TEXT,created_at TEXT,days_of_week TEXT,is_archived INTEGER DEFAULT 0);CREATE TABLE habit_logs(id INTEGER PRIMARY KEY,habit_id INTEGER,log_date TEXT,is_completed INTEGER,note TEXT,missed_reason TEXT);',
  );
  migrateProductivity(db);
  migrateHabitEngine(db);
  runModuleMigrations(db, false);
  return {
    db,
    study: new StudyStore(db),
    reflection: new ReflectionStore(db, () => new Date('2026-10-03T12:00:00')),
  };
}
test('rich journal migration, search and evening save preserve existing words and formatting', () => {
  const { db, reflection } = fixture();
  const old = reflection.saveJournal({
    date: '2026-10-01',
    text: 'An existing memory\nSecond line',
  });
  assert.equal(old.document, null);
  runModuleMigrations(db, false);
  assert.equal(reflection.lookup(old.date)?.text, old.text);
  const document = {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'My wins' }] },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Finished Python', marks: [{ type: 'bold' }] }],
      },
    ],
  };
  reflection.saveJournal({ date: old.date, document, text: 'ignored stale text' });
  reflection.evening({ date: old.date, doneIds: [], sleep: 8, energy: 4 });
  assert.deepEqual(reflection.lookup(old.date)?.document, document);
  assert.equal(reflection.search({ query: 'Python' })[0].date, old.date);
  assert.equal(reflection.lookup(old.date)?.text, 'My wins\nFinished Python');
  db.close();
});
test('journal validation rejects executable, remote and oversized content; plain lines round trip', () => {
  assert.equal(journalDocumentText(plainJournalDocument('first\n\nlast')), 'first\n\nlast');
  for (const content of [
    { type: 'image', attrs: { src: 'https://example.com' } },
    { type: 'paragraph', attrs: { onclick: 'script' } },
    { type: 'text', text: 'link', marks: [{ type: 'link' }] },
  ])
    assert.throws(() => validateJournalDocument({ type: 'doc', content: [content] }));
  assert.throws(() =>
    validateJournalDocument({ type: 'doc', content: [{ type: 'text', text: 'x'.repeat(200001) }] }),
  );
});
test('study continuation respects selected leaf, duplicate order, completed and archived parents', () => {
  const { db, study } = fixture();
  const c = study.saveCurriculum({
    title: 'Software engineering',
    studyFocus: true,
    focusUntil: '2026-10-03',
  });
  const parent = study.saveTopic({ curriculumId: c.id, title: 'Python', order: 0 });
  const a = study.saveTopic({
    curriculumId: c.id,
    parentId: parent.id,
    title: 'Functions',
    order: 1,
  });
  const b = study.saveTopic({
    curriculumId: c.id,
    parentId: parent.id,
    title: 'Return values',
    order: 1,
  });
  study.saveCurriculum({ ...c, currentTopicId: a.id });
  const current = study.snapshot().curricula[0];
  assert.equal(studyContinuation(study.snapshot(), current, []).topic?.id, a.id);
  assert.equal(studyContinuation(study.snapshot(), current, []).next?.id, b.id);
  assert.equal(isStudyFocus(current, '2026-10-03'), true);
  assert.equal(isStudyFocus(current, '2026-10-04'), false);
  study.learn({ id: a.id, learned: true });
  assert.equal(studyContinuation(study.snapshot(), current, []).topic?.id, b.id);
  study.saveTopic({ ...parent, archived: true });
  assert.equal(activeStudyTopics(study.snapshot(), c.id).length, 0);
  db.close();
});
test('deleting a selected untimed topic clears its pointer and backup stays valid', () => {
  const { db, study } = fixture();
  const c = study.saveCurriculum({ title: 'Math' }),
    t = study.saveTopic({ curriculumId: c.id, title: 'Numbers' });
  study.saveCurriculum({ ...c, currentTopicId: t.id });
  study.deleteTopic(t.id);
  assert.equal(study.snapshot().curricula[0].currentTopicId, null);
  validateStudySnapshot(study.snapshot());
  db.close();
});
test('curriculum collision remaps current topic and preserves cover and focus selection', () => {
  const target = fixture(),
    source = fixture();
  const c = source.study.saveCurriculum({
      title: 'Math',
      studyFocus: true,
      coverImage: 'data:image/jpeg;base64,YQ==',
    }),
    t = source.study.saveTopic({ curriculumId: c.id, title: 'Numbers' });
  source.study.saveCurriculum({ ...c, currentTopicId: t.id });
  target.db
    .prepare('INSERT INTO study_curricula(id,json) VALUES(?,?)')
    .run(c.id, JSON.stringify({ ...c, createdAt: '2020-01-01T00:00:00Z' }));
  target.db
    .prepare('INSERT INTO study_topics(id,curriculum_id,json) VALUES(?,?,?)')
    .run(t.id, c.id, JSON.stringify({ ...t, title: 'Original' }));
  const links = {
    habits: new Map(),
    tasks: new Map(),
    sessions: new Map(),
    studyTopics: new Map<string, string>(),
    studyCurricula: new Map<string, string>(),
  };
  studyBackup.merge(target.db, source.study.snapshot(), links);
  const imported = target.study.snapshot().curricula.find((item) => item.id !== c.id)!;
  assert.equal(imported.currentTopicId, links.studyTopics.get(t.id));
  assert.equal(imported.coverImage, c.coverImage);
  assert.equal(imported.studyFocus, true);
  validateStudySnapshot(target.study.snapshot());
  target.db.close();
  source.db.close();
});
test('local covers reject remote URLs, SVG and excessive data', () => {
  assert.equal(validCover(null), true);
  assert.equal(validCover('data:image/jpeg;base64,YQ=='), true);
  assert.equal(validCover('https://example.com/cover.jpg'), false);
  assert.equal(validCover('data:image/svg+xml;base64,YQ=='), false);
  assert.equal(validCover('data:image/png;base64,' + 'a'.repeat(700001)), false);
});
test('rich journal backup imports formatting and repeats without erasing existing entries', () => {
  const source = fixture(),
    target = fixture(),
    document = plainJournalDocument('Preserve this memory');
  document.content![0].content![0].marks = [{ type: 'bold' }];
  source.reflection.saveJournal({ date: '2026-10-01', text: '', document });
  const data = reflectionBackup.export(source.db);
  reflectionBackup.validate(data);
  const links = {
    habits: new Map<number, number>(),
    studyCurricula: new Map<string, string>(),
    studyTopics: new Map<string, string>(),
  };
  reflectionBackup.merge(target.db, data, links);
  assert.deepEqual(target.reflection.lookup('2026-10-01')?.document, document);
  target.reflection.saveJournal({ date: '2026-10-01', text: 'Newer local writing' });
  reflectionBackup.merge(target.db, data, links);
  assert.equal(target.reflection.lookup('2026-10-01')?.text, 'Newer local writing');
  source.db.close();
  target.db.close();
});
test('portable encrypted backups authenticate all content and use fresh randomness', async () => {
  const data = { private: 'My sensitive journal', productivity: defaultProductivity() };
  const first = await encryptBackup(data, password),
    second = await encryptBackup(data, password);
  assert.notEqual(first, second);
  assert.equal(first.includes(data.private), false);
  assert.deepEqual(await decryptBackup(first, password), data);
  await assert.rejects(decryptBackup(first, 'a different password'));
  const tampered = JSON.parse(first);
  tampered.tag = Buffer.alloc(16).toString('base64');
  await assert.rejects(decryptBackup(JSON.stringify(tampered), password));
  await assert.rejects(encryptBackup(data, 'short'));
});
test('GitHub backup checks privacy before writes, uses separate branch, uploads ciphertext only', async () => {
  const encrypted = await encryptBackup({ private: 'secret' }, password),
    calls: { url: string; init: RequestInit }[] = [];
  const request = (async (url: unknown, init: RequestInit) => {
    calls.push({ url: String(url), init });
    const suffix = String(url).split('/repos/owner/tempo')[1];
    if (suffix === '') return Response.json({ private: true, default_branch: 'main' });
    if (suffix === '/git/ref/heads/tempo-backups') return new Response('', { status: 404 });
    if (suffix === '/git/ref/heads/main') return Response.json({ object: { sha: 'abc' } });
    if (suffix === '/git/refs') return Response.json({});
    return Response.json({ commit: { sha: 'saved' } });
  }) as typeof fetch;
  const result = await new GitHubBackup(request).upload('owner/tempo', 'private-token', encrypted);
  assert.equal(result.branch, 'tempo-backups');
  const write = calls.find((c) => c.init.method === 'PUT')!;
  const body = JSON.parse(String(write.init.body));
  assert.equal(Buffer.from(body.content, 'base64').toString(), encrypted);
  assert.equal(body.branch, 'tempo-backups');
  assert.equal(write.init.redirect, 'error');
  const publicCalls: string[] = [];
  const publicRequest = (async (_url: unknown, init: RequestInit) => {
    publicCalls.push(init.method!);
    return Response.json({ private: false });
  }) as typeof fetch;
  await assert.rejects(
    new GitHubBackup(publicRequest).upload('owner/tempo', 'token', encrypted),
    /private repository/,
  );
  assert.deepEqual(publicCalls, ['GET']);
  await assert.rejects(
    new GitHubBackup(request).upload(
      'owner/tempo',
      'token',
      JSON.stringify({ private: 'plaintext' }),
    ),
    /Only encrypted/,
  );
});
test('GitHub errors hide credentials and raw server responses', async () => {
  const encrypted = await encryptBackup({}, password);
  const request = (async () =>
    new Response('private-token server dump', { status: 403 })) as typeof fetch;
  await assert.rejects(
    new GitHubBackup(request).upload('owner/tempo', 'private-token', encrypted),
    (error) => !String(error).includes('private-token') && String(error).includes('denied access'),
  );
});
