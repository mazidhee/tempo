import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from '../src/main/database/sqlite';
import { migrateProductivity } from '../src/main/database/migrations';
import { runModuleMigrations } from '../src/main/database/migrationRegistry';
import { defaultProductivity, validProductivity, type Task } from '../src/shared/productivity';
import { defaultThoughtLibrary, selectDailyThought, mergeThoughtLibraries, validThoughtLibrary } from '../src/shared/thoughts';
import { activeTask, cleanUpTasks, restoreTask } from '../src/shared/taskLifecycle';
import { mergeWorkProjects, validWorkProjects } from '../src/shared/work';
const task = (completedAt: string | null): Task => ({ id:'task-1', title:'Preserve my work', due:'2026-10-06', priority:'medium', project:'Pipeline', tags:['work'],
  subtasks:[{id:'sub-1',title:'Check source',done:true}],createdAt:'2026-08-01T12:00:00Z',completedAt });
test('dated thoughts stay immutable through edits, reorder, pause and restart', () => {
  const first = selectDailyThought(defaultThoughtLibrary(), '2026-10-06');
  const day = first.days[0];
  const edited = { entries: [...first.entries].reverse().map(v => ({ ...v, text:'Changed for tomorrow',active:false })),days:first.days };
  assert.equal(selectDailyThought(edited, day.date), edited);
  assert.deepEqual(selectDailyThought(JSON.parse(JSON.stringify(edited)), day.date).days[0], day);
  assert.equal(selectDailyThought(edited, '2026-10-07').days.length, 1);
});
test('thought rotation follows calendar days across DST, midnight and year boundaries', () => {
  const library = defaultThoughtLibrary();
  for (const [before,after] of [['2026-03-08','2026-03-09'],['2026-11-01','2026-11-02'],['2026-12-31','2027-01-01']]) {
    const next = selectDailyThought(selectDailyThought(library, before), after);
    assert.equal(next.days.length, 2);
    assert.notEqual(next.days[0].id, next.days[1].id);
  }
  assert.equal(selectDailyThought(library, '2026-02-30'), library);
  assert.equal(selectDailyThought(library, 'invalid'), library);
});
test('personal thoughts validate and backup merge preserves current day and adds missing custom entries', () => {
  const current = selectDailyThought(defaultThoughtLibrary(), '2026-10-06');
  const incoming = { entries:[{id:'mine',text:'Choose deliberately.',author:'My own words',prompt:'What did I choose?',active:true}],days:[] };
  assert.ok(validThoughtLibrary(incoming));
  const merged = mergeThoughtLibraries(current, incoming)!;
  assert.equal(merged.entries.at(-1)?.id, 'mine');
  assert.deepEqual(merged.days, current.days);
  assert.ok(!validThoughtLibrary({ ...incoming,entries:[...incoming.entries,...incoming.entries] }));
  assert.ok(!validThoughtLibrary({ ...incoming,entries:[{...incoming.entries[0],text:' '}] }));
});
test('task retention moves eligible records at the boundary without deleting history', () => {
  const state = defaultProductivity();
  state.tasks = [task('2026-09-06T12:00:00Z')];
  state.sessions = [{ id:'session',date:'2026-09-06',endedAt:'2026-09-06T12:00:00Z',duration:600,phase:'focus',presetId:'classic',presetName:'Classic',link:{type:'task',id:'task-1',name:'Preserve my work'} }];
  assert.equal(cleanUpTasks(state, Date.parse('2026-10-06T11:59:59Z')), state);
  const next = cleanUpTasks(state, Date.parse('2026-10-06T12:00:00Z'));
  assert.equal(next.tasks.length, 1);
  assert.equal(next.tasks[0].completedAt, state.tasks[0].completedAt);
  assert.deepEqual(next.tasks[0].subtasks,state.tasks[0].subtasks);
  assert.deepEqual(next.sessions,state.sessions);
  assert.deepEqual(next.timer,state.timer);
  assert.equal(cleanUpTasks(next, Date.parse('2027-10-06T12:00:00Z')),next);
  assert.ok(validProductivity(next));
});
test('Keep, disabled cleanup and later archive dates protect tasks; restore does not retrash', () => {
  const state = defaultProductivity(), now = Date.parse('2026-10-06T12:00:00Z');
  state.tasks = [{ ...task('2026-08-01T12:00:00Z'),archivedAt:'2026-10-05T12:00:00Z' }];
  assert.equal(cleanUpTasks(state,now),state);
  state.tasks = [{ ...task(null), archivedAt:'2026-08-01T12:00:00Z',keep:true }];
  assert.equal(cleanUpTasks(state,now),state);
  state.tasks[0].keep = false;
  state.settings.taskCleanup = false;
  assert.equal(cleanUpTasks(state,now),state);
  state.settings.taskCleanup = true;
  const moved = cleanUpTasks(state,now);
  assert.ok(moved.tasks[0].trashedAt);
  moved.tasks[0] = restoreTask(moved.tasks[0]);
  assert.equal(cleanUpTasks(moved,now),moved);
  assert.ok(moved.tasks[0].keep);
  assert.ok(!activeTask(moved.tasks[0])); // restored archived task belongs in Archived
  moved.tasks[0].archivedAt = null;
  assert.ok(activeTask(moved.tasks[0]));
});
test('workspace migrations preserve legacy records and preferences and run once', () => {
  const db = new Database(':memory:');
  migrateProductivity(db);
  const original = defaultProductivity(); original.tasks = [task('2026-09-01T12:00:00Z')]; original.settings.name = 'Fixture'; original.settings.greetingStyle='simple';
  db.prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(original));
  runModuleMigrations(db);
  const result = JSON.parse((db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as {json:string}).json);
  assert.equal(result.tasks[0].id,original.tasks[0].id);
  assert.equal(result.tasks[0].completedAt,original.tasks[0].completedAt);
  assert.equal(result.tasks[0].trashedAt,null);
  assert.equal(result.settings.greetingStyle,'simple');
  assert.equal(result.settings.name,'Fixture');
  assert.deepEqual(result.timer,original.timer);
  assert.deepEqual(result.sessions,original.sessions);
  assert.equal(result.settings.thoughtLibrary.entries.length,8);
  assert.equal(result.settings.taskRetentionDays,30);
  assert.deepEqual(result.settings.workProjects,[]);
  const before = JSON.stringify(result); runModuleMigrations(db);
  assert.equal((db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as {json:string}).json,before);
  db.close();
});
test('work project backup merges missing milestones, rejects duplicate identities, preserves completion', () => {
  const project = {id:'p1',title:'Data quality',description:'Reliable reports',archived:false,milestones:[{id:'m1',title:'Ship checks',due:'2026-10-10',completedAt:null}]};
  assert.ok(validWorkProjects([project]));
  assert.ok(!validWorkProjects([project,project]));
  const merged = mergeWorkProjects([project],[{...project,milestones:[{...project.milestones[0],completedAt:'2026-10-06T12:00:00Z'},{id:'m2',title:'Monitor',due:'',completedAt:null}]}]);
  assert.equal(merged[0].milestones.length,2);
  assert.equal(merged[0].milestones[0].completedAt,null);
});
