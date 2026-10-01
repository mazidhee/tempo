import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from '../src/main/database/sqlite';
import { runModuleMigrations } from '../src/main/database/migrationRegistry';
import {
  exportModuleData,
  mergeModuleData,
  validateModuleData,
  type BackupLinks,
} from '../src/main/database/moduleBackup';
import { StudyStore } from '../src/main/study/store';
function fixture() {
  const db = new Database(':memory:');
  db.exec(
    'PRAGMA foreign_keys=ON; CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT)',
  );
  runModuleMigrations(db, false);
  return { db, store: new StudyStore(db) };
}
const links = (): BackupLinks => ({
  habits: new Map(),
  studyTopics: new Map(),
  studyCurricula: new Map(),
});
test('module backup restores Study history and repeats without duplicates', () => {
  const source = fixture(),
    target = fixture();
  try {
    const c = source.store.saveCurriculum({ title: 'Physics', description: '' });
    const p = source.store.saveTopic({ title: 'Chapter', curriculumId: c.id });
    const t = source.store.saveTopic({ title: 'Units', curriculumId: c.id, parentId: p.id });
    source.store.learn({ id: t.id, learned: true });
    source.store.grade({ id: t.id, grade: 3 });
    const data = validateModuleData(exportModuleData(source.db));
    for (let n = 0; n < 2; n++)
      target.db.transaction(() => mergeModuleData(target.db, data, links()))();
    assert.deepEqual(target.store.snapshot(), source.store.snapshot());
  } finally {
    source.db.close();
    target.db.close();
  }
});
test('module backup validates all records and rejects unknown future modules', () => {
  const { db, store } = fixture();
  try {
    const c = store.saveCurriculum({ title: 'Original', description: '' });
    store.saveTopic({ title: 'Topic', curriculumId: c.id });
    const data = exportModuleData(db) as { study: ReturnType<StudyStore['snapshot']> };
    data.study.topics[0].parentId = data.study.topics[0].id;
    assert.throws(() => validateModuleData(data), /Invalid Study/);
    assert.throws(() => validateModuleData({ newFutureModule: {} }), /newer app/);
    assert.equal(store.snapshot().topics[0].parentId, null);
  } finally {
    db.close();
  }
});
test('Study import remaps colliding curriculum and topic identities together', () => {
  const source = fixture(),
    target = fixture();
  try {
    const c = source.store.saveCurriculum({ title: 'Imported', description: '' });
    const t = source.store.saveTopic({ title: 'Imported topic', curriculumId: c.id });
    const data = exportModuleData(source.db);
    target.db
      .prepare('INSERT INTO study_curricula(id,json) VALUES(?,?)')
      .run(
        c.id,
        JSON.stringify({ ...c, title: 'Existing', createdAt: '2000-01-01T00:00:00.000Z' }),
      );
    target.db
      .prepare('INSERT INTO study_topics(id,curriculum_id,json) VALUES(?,?,?)')
      .run(t.id, c.id, JSON.stringify({ ...t, title: 'Existing topic' }));
    const mapping = links();
    target.db.transaction(() => mergeModuleData(target.db, validateModuleData(data), mapping))();
    target.db.transaction(() => mergeModuleData(target.db, validateModuleData(data), links()))();
    assert.equal(target.store.snapshot().curricula.length, 2);
    assert.equal(target.store.snapshot().topics.length, 2);
    assert.notEqual(mapping.studyCurricula.get(c.id), c.id);
    assert.notEqual(mapping.studyTopics.get(t.id), t.id);
    assert.equal(
      target.store.snapshot().topics.find((topic) => topic.id === mapping.studyTopics.get(t.id))!
        .curriculumId,
      mapping.studyCurricula.get(c.id),
    );
  } finally {
    source.db.close();
    target.db.close();
  }
});
