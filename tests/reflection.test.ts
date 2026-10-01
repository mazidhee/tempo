import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync } from 'node:fs';
import Database from '../src/main/database/sqlite';
import { migrateHabitEngine, migrateProductivity } from '../src/main/database/migrations';
import { runModuleMigrations } from '../src/main/database/migrationRegistry';
import { ReflectionStore } from '../src/main/reflection/store';
import { StudyStore } from '../src/main/study/store';
import { reflectionBackup } from '../src/main/reflection/backup';
import { reminderTick } from '../src/main/reflection/reminders';
import { goalProgress, weeklySummary } from '../src/main/reflection/aggregate';
import { defaultProductivity } from '../src/shared/productivity';
import type { Goal } from '../src/shared/reflection';
const now = () => new Date('2026-10-05T12:00:00');
function fixture(name = ':memory:') {
  const db = new Database(name);
  db.exec(
    `PRAGMA foreign_keys=ON;CREATE TABLE IF NOT EXISTS habits(id INTEGER PRIMARY KEY,name TEXT,created_at TEXT,days_of_week TEXT,is_archived INTEGER DEFAULT 0);CREATE TABLE IF NOT EXISTS habit_logs(id INTEGER PRIMARY KEY,habit_id INTEGER,log_date TEXT,is_completed INTEGER,note TEXT,missed_reason TEXT);`,
  );
  migrateProductivity(db);
  migrateHabitEngine(db);
  runModuleMigrations(db, false);
  const store = new ReflectionStore(db, now);
  return { db, store, study: new StudyStore(db) };
}
function habit(db: Database, id = 1, schedule = 'daily') {
  db.prepare(
    `INSERT INTO habits(id,name,created_at,days_of_week,schedule_type,start_date,weekly_target) VALUES(?,?,'2026-09-01T00:00:00Z','mon,tue,wed,thu,fri,sat,sun',?,'2026-09-01',3)`,
  ).run(id, 'Run', schedule);
}
const goal = (input: Partial<Goal>): Goal => ({
  id: 'goal',
  title: 'A goal',
  kind: 'tasks',
  linkType: 'all',
  linkId: '',
  start: '2026-09-28',
  deadline: '2026-10-11',
  target: 3,
  weeks: 2,
  archived: false,
  createdAt: '2026-09-28T00:00:00Z',
  ...input,
});
test('weekly streak boundaries treat past misses as closed days and ignore later logs', () => {
  const { db, store } = fixture();
  habit(db);
  for (const date of ['2026-09-26', '2026-10-03', '2026-10-05'])
    db.prepare(
      "INSERT INTO habit_logs(habit_id,log_date,is_completed,outcome) VALUES(1,?,1,'done')",
    ).run(date);
  const summary = weeklySummary(store.source(), store.data(), '2026-09-28', '2026-10-05');
  assert.equal(summary.habits[0].streakBefore, 0);
  assert.equal(summary.habits[0].streakAfter, 0);
  db.close();
});
test('automatic Sunday generation refreshes an early snapshot and preserves written reflections', () => {
  const fixtureData = fixture();
  habit(fixtureData.db);
  let clock = new Date('2026-10-01T12:00:00');
  const store = new ReflectionStore(fixtureData.db, () => clock),
    review = store.generate({ date: '2026-10-01' });
  store.saveReview({
    start: review.start,
    obstacle: 'A written reflection',
    change: 'One small change',
  });
  clock = new Date('2026-10-04T20:00:00');
  store.saveJournal({ date: '2026-10-04', text: 'Sunday memory' });
  assert.equal(
    reminderTick(store, clock, () => assert.fail('Disabled native reminder'), false),
    true,
  );
  const updated = store.data().reviews.find((r) => r.start === review.start)!;
  assert.equal(updated.summary.journal[0].text, 'Sunday memory');
  assert.equal(updated.obstacle, 'A written reflection');
  assert.equal(updated.change, 'One small change');
  assert.equal(
    reminderTick(store, new Date('2026-10-04T20:00:30'), () => {}, false),
    false,
  );
  fixtureData.db.close();
});
test('insights label associations as correlations and arbitrary reason labels remain safe counters', () => {
  const { db, store } = fixture();
  habit(db);
  db.prepare(
    "INSERT INTO habit_logs(habit_id,log_date,is_completed,outcome,missed_reason) VALUES(1,'2026-09-28',0,'pending','__proto__')",
  ).run();
  for (const [date, sleep] of [
    ['2026-09-28', 8],
    ['2026-09-29', 7],
    ['2026-09-30', 5],
  ] as const)
    store.evening({ date, doneIds: [], journal: 'Recorded', sleep, energy: 4 });
  const summary = weeklySummary(store.source(), store.data(), '2026-09-28', '2026-10-05');
  assert.equal(summary.reasons.__proto__, 1);
  assert.equal(summary.correlations.length, 1);
  assert.match(summary.correlations[0], /Correlation only/);
  assert.match(summary.correlations[0], /no causal claim/);
  db.close();
});
test('Reflection migration preserves records and FTS schema is idempotent', () => {
  const { db, store } = fixture();
  habit(db);
  store.saveJournal({ date: '2026-10-01', text: 'Persistent memory' });
  runModuleMigrations(db, false);
  assert.equal(store.lookup('2026-10-01')?.text, 'Persistent memory');
  assert.equal(db.prepare('SELECT * FROM habits').all().length, 1);
  assert.ok(db.prepare('SELECT * FROM schema_migrations WHERE version=200').get());
  db.close();
});
test('plans, evening state and journal persist after reopening the actual SQLite file', () => {
  mkdirSync('.tests', { recursive: true });
  const path = `.tests/reflection-${crypto.randomUUID()}.db`;
  let { db, store } = fixture(path);
  habit(db);
  store.savePlan({
    date: '2026-10-01',
    priorities: [{ id: 'p', kind: 'habit', linkId: '1', title: 'Run', done: false }],
    studyTopicIds: [],
  });
  store.evening({
    date: '2026-10-01',
    doneIds: ['p'],
    journal: 'A long day\nwith useful learning.',
    sleep: 7.5,
    energy: 4,
  });
  db.close();
  ({ db, store } = fixture(path));
  assert.equal(store.snapshot().plans[0].priorities[0].done, true);
  assert.equal(store.snapshot().plans[0].evening.sleep, 7.5);
  assert.equal(store.lookup('2026-10-01')?.text, 'A long day\nwith useful learning.');
  db.close();
  rmSync(path);
});
test('FTS supports Unicode prefix terms, date browse, batch lookup and edits without stale results', () => {
  const { db, store } = fixture();
  store.saveJournal({ date: '2026-10-01', text: 'Café studying economics and bonds' });
  store.saveJournal({ date: '2026-10-02', text: 'Running outdoors' });
  assert.equal(store.search({ query: 'cafe econ' }).length, 1);
  assert.equal(store.search({ query: '" OR bad syntax -' }).length, 0);
  assert.equal(
    store.search({ query: '', start: '2026-10-02', end: '2026-10-02' })[0].text,
    'Running outdoors',
  );
  assert.deepEqual(store.lookupDates(['2026-10-01', '2026-09-01']), {
    '2026-10-01': 'Café studying economics and bonds',
  });
  store.saveJournal({ date: '2026-10-01', text: 'A new memory' });
  assert.equal(store.search({ query: 'economics' }).length, 0);
  assert.equal(store.search({ query: 'new' }).length, 1);
  assert.throws(() => store.lookupDates(['2026-02-30']), /valid date/);
  db.close();
});
test('plan input validates linked records, maximum three and evening numeric bounds atomically', () => {
  const { db, store } = fixture();
  const p = { id: 'one', kind: 'free', linkId: null, title: 'One', done: false };
  assert.throws(
    () => store.savePlan({ date: '2026-10-01', priorities: [p, p, p, p], studyTopicIds: [] }),
    /list length/,
  );
  assert.throws(
    () =>
      store.savePlan({
        date: '2026-10-01',
        priorities: [{ ...p, kind: 'habit', linkId: '404' }],
        studyTopicIds: [],
      }),
    /active habit/,
  );
  store.savePlan({ date: '2026-10-01', priorities: [p], studyTopicIds: [] });
  assert.throws(
    () =>
      store.evening({
        date: '2026-10-01',
        doneIds: ['one'],
        journal: 'Should not write',
        sleep: 25,
        energy: 2,
      }),
    /numeric/,
  );
  assert.equal(store.lookup('2026-10-01'), null);
  assert.equal(store.data().plans[0].priorities[0].done, false);
  db.close();
});
test('weekly aggregation uses canonical quantity, freezes, flexible targets and missed reasons', () => {
  const { db, store } = fixture();
  habit(db);
  habit(db, 2, 'weekly_target');
  db.prepare(
    'UPDATE habits SET habit_type=?,quantity_target=?,completion_threshold=? WHERE id=1',
  ).run('quantity', 10, 80);
  for (const [id, date, quantity, outcome, reason] of [
    [1, '2026-09-28', 8, 'done', null],
    [1, '2026-09-29', 0, 'freeze', null],
    [1, '2026-09-30', 4, 'pending', 'Busy'],
    [2, '2026-09-28', 0, 'done', null],
    [2, '2026-09-29', 0, 'freeze', null],
  ] as const)
    db.prepare(
      'INSERT INTO habit_logs(habit_id,log_date,is_completed,quantity,outcome,missed_reason) VALUES(?,?,1,?,?,?)',
    ).run(id, date, quantity, outcome, reason);
  const summary = weeklySummary(store.source(), store.data(), '2026-09-28', '2026-10-05');
  assert.equal(summary.habits[0].hits, 1);
  assert.equal(summary.habits[0].freezes, 1);
  assert.equal(summary.habits[0].misses, 5);
  assert.equal(summary.habits[1].target, 3);
  assert.equal(summary.habits[1].misses, 1);
  assert.equal(summary.reasons.Busy, 1);
  db.close();
});
test('weekly focus comparisons, best day and Study recall use the canonical Study tables', () => {
  const { db, store, study } = fixture();
  const curriculum = study.saveCurriculum({ title: 'Economics', description: '' }),
    topic = study.saveTopic({ curriculumId: curriculum.id, title: 'Bonds' });
  const state = defaultProductivity();
  state.tasks = [
    {
      id: 't',
      title: 'Task',
      due: '',
      priority: 'medium',
      project: 'Markets',
      tags: ['reading'],
      subtasks: [],
      createdAt: '2026-09-28T00:00:00Z',
      completedAt: '2026-09-30T00:00:00Z',
    },
  ];
  state.sessions = [
    {
      id: 's',
      date: '2026-09-30',
      endedAt: '2026-09-30T12:00:00Z',
      duration: 3600,
      phase: 'focus',
      presetId: 'deep',
      presetName: 'Deep',
      link: {
        type: 'study',
        id: topic.id,
        name: 'Bonds',
        curriculumId: curriculum.id,
        project: 'Markets',
      },
    },
    {
      id: 'old',
      date: '2026-09-23',
      endedAt: '2026-09-23T12:00:00Z',
      duration: 1800,
      phase: 'focus',
      presetId: 'deep',
      presetName: 'Deep',
      link: null,
    },
  ];
  db.prepare('UPDATE productivity_state SET json=?').run(JSON.stringify(state));
  db.prepare('INSERT INTO study_reviews(id,topic_id,reviewed_at,json) VALUES(?,?,?,?)').run(
    'r',
    topic.id,
    '2026-09-30T12:00:00Z',
    JSON.stringify({
      id: 'r',
      topicId: topic.id,
      reviewedAt: '2026-09-30T12:00:00Z',
      grade: 2,
      interval: 2,
    }),
  );
  const summary = weeklySummary(store.source(), store.data(), '2026-09-28', '2026-10-05');
  assert.equal(summary.focus.byProject.Markets, 3600);
  assert.equal(summary.focus.byCurriculum.Economics, 3600);
  assert.equal(summary.focus.previousSeconds, 1800);
  assert.equal(summary.focus.bestDay, '2026-09-30');
  assert.equal(summary.study.retentionPercent, 100);
  assert.match(summary.study.retentionLabel, /self-reported/);
  assert.equal(summary.tasks.completed, 1);
  db.close();
});
test('saved weekly reviews are idempotent immutable snapshots with editable prompts', () => {
  const { db, store } = fixture();
  habit(db);
  store.saveJournal({ date: '2026-09-28', text: 'Original' });
  const first = store.generate({ date: '2026-10-01' });
  store.saveJournal({ date: '2026-09-28', text: 'Changed' });
  assert.equal(store.generate({ date: '2026-09-29' }).summary.journal[0].text, 'Original');
  store.saveReview({ start: first.start, obstacle: 'Travel', change: 'Start earlier' });
  assert.equal(store.generate({ date: first.start }).change, 'Start earlier');
  assert.equal(store.data().reviews.length, 1);
  db.close();
});
test('all goal kinds compute recorded completions without counting freezes or break time', () => {
  const { db, store, study } = fixture();
  habit(db);
  for (const date of ['2026-09-28', '2026-09-29', '2026-09-30'])
    db.prepare(
      "INSERT INTO habit_logs(habit_id,log_date,is_completed,outcome) VALUES(1,?,1,'done')",
    ).run(date);
  db.prepare(
    "INSERT INTO habit_logs(habit_id,log_date,is_completed,outcome) VALUES(1,'2026-10-01',0,'freeze')",
  ).run();
  const curriculum = study.saveCurriculum({ title: 'Course', description: '' }),
    chapter = study.saveTopic({ title: 'Chapter 8', curriculumId: curriculum.id }),
    topic = study.saveTopic({ title: 'Topic', curriculumId: curriculum.id, parentId: chapter.id });
  const source = store.source();
  source.study.topics = source.study.topics.map((t) => ({
    ...t,
    learnedAt: t.id === topic.id ? '2026-09-30T00:00:00Z' : null,
  }));
  source.productivity.tasks = [
    {
      id: 't',
      title: 'Task',
      due: '',
      priority: 'medium',
      project: 'Markets',
      tags: ['reading'],
      subtasks: [],
      createdAt: '2026-09-28T00:00:00Z',
      completedAt: '2026-09-30T00:00:00Z',
    },
  ];
  source.productivity.sessions = [
    {
      id: 'f',
      date: '2026-09-30',
      endedAt: '2026-09-30T00:00:00Z',
      duration: 3600,
      phase: 'focus',
      presetId: 'classic',
      presetName: 'Classic',
      link: { type: 'task', id: 't', name: 'Task' },
    },
    {
      id: 'break',
      date: '2026-09-30',
      endedAt: '2026-09-30T00:00:00Z',
      duration: 600,
      phase: 'short',
      presetId: 'classic',
      presetName: 'Classic',
      link: null,
    },
  ];
  assert.equal(
    goalProgress(
      goal({ kind: 'habit', linkType: 'habit', linkId: '1', target: 3 }),
      source,
      '2026-10-04',
    ).current,
    1,
  );
  assert.equal(
    goalProgress(goal({ kind: 'focus', linkType: 'tag', linkId: 'reading' }), source, '2026-10-04')
      .current,
    1,
  );
  assert.equal(
    goalProgress(
      goal({ kind: 'focus', linkType: 'project', linkId: 'Markets' }),
      source,
      '2026-10-04',
    ).current,
    1,
  );
  assert.equal(
    goalProgress(
      goal({ kind: 'chapter', linkType: 'chapter', linkId: chapter.id }),
      source,
      '2026-10-04',
    ).target,
    2,
  );
  assert.equal(
    goalProgress(
      goal({ kind: 'chapter', linkType: 'chapter', linkId: chapter.id }),
      source,
      '2026-10-04',
    ).current,
    1,
  );
  assert.equal(
    goalProgress(goal({ kind: 'tasks', linkType: 'tag', linkId: 'reading' }), source, '2026-10-04')
      .current,
    1,
  );
  assert.equal(goalProgress(goal({}), source, '2026-10-12').status, 'behind');
  db.close();
});
test('reminders are opt-in, minute-only, persist deduplication and are suppressed in fixtures', () => {
  const { db, store } = fixture();
  habit(db);
  const calls: string[] = [];
  reminderTick(store, new Date('2026-10-04T20:00:00'), (t) => calls.push(t));
  assert.equal(calls.length, 0);
  const settings = store.data().settings;
  settings.morning.enabled = true;
  store.saveSettings(settings);
  reminderTick(store, new Date('2026-10-05T08:01:00'), (t) => calls.push(t));
  assert.equal(calls.length, 0);
  reminderTick(store, new Date('2026-10-05T08:00:00'), (t) => calls.push(t));
  reminderTick(new ReflectionStore(db, now), new Date('2026-10-05T08:00:30'), (t) => calls.push(t));
  assert.equal(calls.length, 1);
  reminderTick(store, new Date('2026-10-06T08:00:00'), (t) => calls.push(t), false);
  assert.equal(calls.length, 1);
  assert.ok(store.data().reviews.length);
  db.close();
});
test('backup validates before writes, preserves local collisions, rebuilds FTS and remaps habit links', () => {
  const first = fixture();
  habit(first.db);
  first.store.savePlan({
    date: '2026-10-01',
    priorities: [{ id: 'p', kind: 'habit', linkId: '1', title: 'Run', done: true }],
    studyTopicIds: [],
  });
  first.store.saveJournal({ date: '2026-10-01', text: 'Imported memory' });
  first.store.saveGoal({
    ...goal({ kind: 'habit', linkType: 'habit', linkId: '1' }),
    id: undefined,
  });
  first.store.generate({ date: '2026-10-01' });
  const backup = reflectionBackup.export(first.db);
  reflectionBackup.validate(backup);
  const second = fixture();
  habit(second.db, 20);
  second.db.transaction(() =>
    reflectionBackup.merge(second.db, backup, { habits: new Map([[1, 20]]) }),
  )();
  assert.equal(second.store.data().plans[0].priorities[0].linkId, '20');
  assert.equal(second.store.data().goals[0].linkId, '20');
  assert.equal(second.store.search({ query: 'imported' })[0].text, 'Imported memory');
  second.store.saveJournal({ date: '2026-10-01', text: 'Local wins' });
  second.db.transaction(() =>
    reflectionBackup.merge(second.db, backup, { habits: new Map([[1, 20]]) }),
  )();
  assert.equal(second.store.lookup('2026-10-01')?.text, 'Local wins');
  const invalid = structuredClone(backup);
  invalid.plans[0].evening.energy = Infinity;
  assert.throws(() => reflectionBackup.validate(invalid), /numeric/);
  assert.equal(second.store.data().plans.length, 1);
  first.db.close();
  second.db.close();
});
test('backup restores opted-in reminder settings into missing or default rows and preserves configured devices', () => {
  const original = fixture(),
    settings = original.store.data().settings;
  settings.morning = { enabled: true, time: '07:15' };
  settings.weekly = { enabled: true, time: '19:30', day: 6 };
  original.store.saveSettings(settings);
  const backup = reflectionBackup.export(original.db);
  for (const initialized of [false, true]) {
    const restored = fixture();
    if (initialized) {
      const defaults = restored.store.data().settings;
      // Persist defaults in a different property order, as an initialized UI may do.
      restored.db
        .prepare('INSERT INTO reflection_settings(id,json) VALUES(1,?)')
        .run(
          JSON.stringify({
            weekly: {
              day: defaults.weekly.day,
              time: defaults.weekly.time,
              enabled: defaults.weekly.enabled,
            },
            evening: defaults.evening,
            morning: defaults.morning,
          }),
        );
    }
    restored.db.transaction(() =>
      reflectionBackup.merge(restored.db, backup, { habits: new Map() }),
    )();
    assert.deepEqual(restored.store.data().settings, settings);
    // A custom, disabled time also means the device has been configured.
    const local = restored.store.data().settings;
    local.morning = { enabled: false, time: '06:45' };
    local.weekly = { enabled: false, time: '18:00', day: 0 };
    restored.store.saveSettings(local);
    restored.db.transaction(() =>
      reflectionBackup.merge(restored.db, backup, { habits: new Map() }),
    )();
    assert.deepEqual(restored.store.data().settings, local);
    restored.db.close();
  }
  original.db.close();
});
