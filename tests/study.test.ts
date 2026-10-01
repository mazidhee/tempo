import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from '../src/main/database/sqlite';
import { StudyStore } from '../src/main/study/store';
import { runModuleMigrations, migrations } from '../src/main/database/migrationRegistry';
import { nextStudyReview, curriculumProgress } from '../src/shared/study';
function fixture() {
  const db = new Database(':memory:');
  db.exec(
    "PRAGMA foreign_keys=ON; CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT); CREATE TABLE legacy(id INTEGER PRIMARY KEY, value TEXT); INSERT INTO legacy VALUES(17,'original log');",
  );
  runModuleMigrations(db);
  return { db, store: new StudyStore(db) };
}
test('Study migration is additive and idempotent', () => {
  const { db, store } = fixture();
  store.saveCurriculum({ title: 'Foundations', description: '' });
  runModuleMigrations(db);
  assert.equal(store.snapshot().curricula.length, 1);
  assert.equal(
    (db.prepare('SELECT value FROM legacy WHERE id=17').get() as { value: string }).value,
    'original log',
  );
  assert.equal(db.prepare('SELECT * FROM schema_migrations').all().length, 1);
  db.close();
});
test('failed migration rolls schema and marker back together', () => {
  const { db } = fixture();
  migrations.push({
    version: 99,
    name: 'test-only',
    apply: (connection) => {
      connection.exec('CREATE TABLE must_rollback(id INTEGER)');
      throw new Error('fixture failure');
    },
  });
  try {
    assert.throws(() => runModuleMigrations(db), /fixture failure/);
    assert.equal(
      db.prepare("SELECT name FROM sqlite_master WHERE name='must_rollback'").get(),
      undefined,
    );
    assert.equal(
      db.prepare('SELECT version FROM schema_migrations WHERE version=99').get(),
      undefined,
    );
  } finally {
    migrations.pop();
    db.close();
  }
});
test('Study progress, nested topics, grading and history preservation', () => {
  const { db, store } = fixture();
  const curriculum = store.saveCurriculum({ title: 'Mathematics', description: '' });
  const parent = store.saveTopic({ curriculumId: curriculum.id, title: 'Chapter 1' });
  const child = store.saveTopic({
    curriculumId: curriculum.id,
    title: 'Numbers',
    parentId: parent.id,
  });
  assert.throws(() => store.saveTopic({ ...parent, parentId: child.id }), /cycle/);
  assert.throws(() => store.grade({ id: child.id, grade: 2 }), /Learn/);
  store.learn({ id: child.id, learned: true });
  assert.equal(curriculumProgress(store.snapshot(), curriculum.id).percent, 50);
  assert.equal(store.grade({ id: child.id, grade: 2 }).interval, 2);
  assert.equal(store.snapshot().reviews.length, 1);
  assert.throws(() => store.deleteTopic(child.id), /Archive/);
  store.saveCurriculum({ ...curriculum, archived: true });
  assert.throws(() => store.grade({ id: child.id, grade: 3 }), /restore/);
  assert.throws(() => store.learn({ id: child.id, learned: true }), /Restore/);
  assert.equal(store.snapshot().reviews.length, 1);
  db.close();
});
test('spaced review grades use local calendar days across DST', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    const before = new Date('2026-03-07T12:00:00-05:00');
    assert.deepEqual(nextStudyReview({ interval: 5 }, 0, before), {
      interval: 1,
      reviewDue: '2026-03-08',
    });
    assert.deepEqual(nextStudyReview({ interval: 5 }, 1, before), {
      interval: 6,
      reviewDue: '2026-03-13',
    });
    assert.equal(nextStudyReview({ interval: 5 }, 2, before).interval, 10);
    assert.equal(nextStudyReview({ interval: 5 }, 3, before).interval, 15);
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
