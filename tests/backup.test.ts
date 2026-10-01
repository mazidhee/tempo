import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from '../src/main/database/sqlite';
import { migrateProductivity, migrateHabitEngine } from '../src/main/database/migrations';
import { runModuleMigrations } from '../src/main/database/migrationRegistry';
import { exportBackup, importBackup } from '../src/main/ipc/backup';
import { StudyStore } from '../src/main/study/store';
import { ReflectionStore } from '../src/main/reflection/store';
import {
  defaultProductivity,
  newTimer,
  startTimer,
  type Productivity,
} from '../src/shared/productivity';
import { defaultFocusSettings } from '../src/shared/focus';
function fixture() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'tempo-backup-test-'));
  const db = new Database(path.join(dir, 'habits.db'));
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE habits(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,description TEXT,frequency TEXT,time_of_day TEXT,days_of_week TEXT DEFAULT 'mon,tue,wed,thu,fri,sat,sun',scheduled_time TEXT,created_at TEXT,is_archived INTEGER DEFAULT 0);
    CREATE TABLE habit_logs(id INTEGER PRIMARY KEY,habit_id INTEGER REFERENCES habits(id),log_date TEXT,is_completed INTEGER,note TEXT,missed_reason TEXT,UNIQUE(habit_id,log_date));`);
  migrateProductivity(db);
  migrateHabitEngine(db);
  runModuleMigrations(db, false);
  return {
    db,
    study: new StudyStore(db),
    reflection: new ReflectionStore(db),
    close() {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
function habit(db: Database, name = 'Read', id = 7) {
  db.prepare(
    "INSERT INTO habits(id,name,frequency,time_of_day,created_at,start_date) VALUES(?,?,'daily','anytime','2026-09-01T12:00:00.000Z','2026-09-01')",
  ).run(id, name);
}
function write(db: Database, state: Productivity) {
  db.prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(state));
}
function state(db: Database): Productivity {
  return JSON.parse(
    (db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as { json: string }).json,
  );
}
test('full backup clean restore preserves all modules, edited built-in presets and preferences without activating focus', async () => {
  const a = fixture(),
    b = fixture();
  try {
    habit(a.db);
    a.db
      .prepare(
        "INSERT INTO habit_logs(habit_id,log_date,is_completed,note,quantity,outcome) VALUES(7,'2026-10-01',1,'Keep this',0,'done')",
      )
      .run();
    const c = a.study.saveCurriculum({ title: 'Physics', description: '' });
    const topic = a.study.saveTopic({ curriculumId: c.id, title: 'Units' });
    a.study.learn({ id: topic.id, learned: true });
    a.study.grade({ id: topic.id, grade: 3 });
    a.reflection.saveJournal({ date: '2026-10-01', text: 'Unforgettable memory' });
    a.reflection.savePlan({
      date: '2026-10-01',
      priorities: [{ id: 'priority1', kind: 'habit', linkId: '7', title: 'Read', done: false }],
      studyTopicIds: [topic.id],
    });
    const s = defaultProductivity();
    s.settings.name = 'Test';
    s.settings.theme = 'dark';
    s.presets[0].focus = 47;
    s.timer = startTimer(newTimer(s.presets[0]), Date.now());
    s.sessions = [
      {
        id: 'session1',
        date: '2026-10-01',
        endedAt: '2026-10-01T12:00:00.000Z',
        duration: 47,
        phase: 'focus',
        presetId: 'classic',
        presetName: 'Classic',
        link: { type: 'study', id: topic.id, name: 'Units', curriculumId: c.id },
      },
    ];
    write(a.db, s);
    const guard = {
      ...defaultFocusSettings(),
      enabled: true,
      blocklists: [{ id: 'list1', name: 'Example', apps: [], websites: ['example.com'] }],
      selected: ['list1'],
    };
    a.db.prepare('UPDATE focus_settings SET json=? WHERE id=1').run(JSON.stringify(guard));
    const backup = exportBackup(a.db);
    assert.equal(backup.version, 3);
    await importBackup(b.db, backup);
    await importBackup(b.db, backup);
    assert.equal(state(b.db).settings.name, 'Test');
    assert.equal(state(b.db).presets[0].focus, 47);
    assert.equal(state(b.db).timer.startedAt, null);
    assert.equal(state(b.db).timer.deadline, null);
    assert.equal(state(b.db).sessions.length, 1);
    assert.deepEqual(b.study.snapshot(), a.study.snapshot());
    const expectedReflection = a.reflection.data();
    expectedReflection.plans[0].priorities[0].linkId = String(
      (b.db.prepare('SELECT id FROM habits').get() as { id: number }).id,
    );
    assert.deepEqual(b.reflection.data(), expectedReflection);
    assert.equal(b.reflection.search({ query: 'Unforgettable' }).length, 1);
    const h = b.db.prepare('SELECT id FROM habits').all() as { id: number }[];
    assert.equal(h.length, 1);
    assert.equal(b.reflection.data().plans[0].priorities[0].linkId, String(h[0].id));
    assert.equal(b.db.prepare('SELECT * FROM habit_logs').all().length, 1);
    const restored = JSON.parse(
      (b.db.prepare('SELECT json FROM focus_settings').get() as { json: string }).json,
    );
    assert.equal(restored.enabled, false);
    assert.deepEqual(restored.blocklists, guard.blocklists);
  } finally {
    a.close();
    b.close();
  }
});
test('colliding habit IDs are remapped across plans and focus history, repeat import remains idempotent', async () => {
  const a = fixture(),
    b = fixture();
  try {
    habit(a.db, 'Imported');
    habit(b.db, 'Local');
    a.reflection.savePlan({
      date: '2026-10-01',
      priorities: [{ id: 'p1', kind: 'habit', linkId: '7', title: 'Imported', done: false }],
      studyTopicIds: [],
    });
    const s = state(a.db);
    s.sessions.push({
      id: 's',
      date: '2026-10-01',
      endedAt: '2026-10-01T12:00:00.000Z',
      duration: 60,
      phase: 'focus',
      presetId: 'classic',
      presetName: 'Classic',
      link: { type: 'habit', id: '7', name: 'Imported' },
    });
    write(a.db, s);
    const backup = exportBackup(a.db);
    await importBackup(b.db, backup);
    await importBackup(b.db, backup);
    const id = (b.db.prepare("SELECT id FROM habits WHERE name='Imported'").get() as { id: number })
      .id;
    assert.notEqual(id, 7);
    assert.equal(b.db.prepare('SELECT * FROM habits').all().length, 2);
    assert.equal(state(b.db).sessions[0].link!.id, String(id));
    assert.equal(b.reflection.data().plans[0].priorities[0].linkId, String(id));
  } finally {
    a.close();
    b.close();
  }
});
test('existing workspace preferences and active timer survive complete import', async () => {
  const a = fixture(),
    b = fixture();
  try {
    habit(a.db);
    const s = state(b.db);
    s.settings.name = 'Local';
    s.presets[0].focus = 33;
    s.timer = startTimer(newTimer(s.presets[0]), Date.now());
    write(b.db, s);
    a.db
      .prepare('UPDATE focus_settings SET json=? WHERE id=1')
      .run(JSON.stringify({ ...defaultFocusSettings(), strict: true }));
    await importBackup(b.db, exportBackup(a.db));
    assert.deepEqual(state(b.db).timer, s.timer);
    assert.equal(
      JSON.parse((b.db.prepare('SELECT json FROM focus_settings').get() as { json: string }).json)
        .strict,
      false,
    );
    assert.deepEqual(state(b.db).settings, s.settings);
    assert.equal(state(b.db).presets[0].focus, 33);
  } finally {
    a.close();
    b.close();
  }
});
test('malformed module or engine data rejects the entire import without partial records', async () => {
  const a = fixture(),
    b = fixture();
  try {
    habit(a.db);
    const backup = exportBackup(a.db);
    const bad = structuredClone(backup) as any;
    bad.modules.study.topics = [{ id: 'broken' }];
    const before = exportBackup(b.db);
    await assert.rejects(importBackup(b.db, bad), /Invalid Study/);
    const after = exportBackup(b.db);
    assert.deepEqual(after.modules, before.modules);
    assert.equal(after.habits.length, 0);
    bad.modules = backup.modules;
    bad.logs = [
      { habit_id: 7, log_date: '2026-10-01', is_completed: 0, quantity: -1, outcome: 'pending' },
    ];
    await assert.rejects(importBackup(b.db, bad), /habit-engine/);
    assert.equal(exportBackup(b.db).habits.length, 0);
  } finally {
    a.close();
    b.close();
  }
});
for (const version of [1, 2])
  test(`legacy format ${version} remains readable and retains notes`, async () => {
    const a = fixture(),
      b = fixture();
    try {
      habit(a.db);
      a.db
        .prepare(
          "INSERT INTO habit_logs(habit_id,log_date,is_completed,note,quantity,outcome) VALUES(7,'2026-10-01',1,'Legacy note',0,'done')",
        )
        .run();
      const backup: any = exportBackup(a.db);
      backup.version = version;
      delete backup.modules;
      if (version === 1) {
        for (const h of backup.habits) {
          delete h.habit_type;
          delete h.schedule_type;
        }
        for (const l of backup.logs) {
          delete l.quantity;
          delete l.outcome;
        }
      }
      await importBackup(b.db, backup);
      const record: any = b.db.prepare('SELECT * FROM habits').get();
      assert.equal(record.habit_type, 'check');
      assert.equal(record.schedule_type, 'daily');
      assert.equal((b.db.prepare('SELECT note FROM habit_logs').get() as any).note, 'Legacy note');
    } finally {
      a.close();
      b.close();
    }
  });
