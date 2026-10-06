import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultProductivity, validProductivity, type Task } from '../src/shared/productivity';
import { boardLane, moveTask, tasksForDay } from '../src/shared/taskBoard';
const task = (id: string, extra: Partial<Task> = {}): Task => ({
  id,
  title: id,
  due: '',
  priority: 'medium',
  project: '',
  tags: [],
  subtasks: [],
  createdAt: '2026-10-01T12:00:00Z',
  completedAt: null,
  ...extra,
});
test('legacy tasks derive a board lane without rewriting dates or records', () => {
  const older = task('legacy', {
    due: '2026-10-06',
    keep: true,
    subtasks: [{ id: 's', title: 'step', done: true }],
  });
  assert.equal(boardLane(older), 'next');
  const moved = moveTask(older, 'doing');
  assert.equal(moved.due, older.due);
  assert.deepEqual(moved.subtasks, older.subtasks);
  assert.equal(moved.keep, true);
  assert.equal(moveTask(moved, 'done', '2026-10-06T12:00:00Z').completedAt, '2026-10-06T12:00:00Z');
  assert.equal(boardLane(moveTask(moveTask(moved, 'done'), 'doing')), 'doing');
  assert.equal(older.boardStatus, undefined);
});
test('daily queue draws canonical dated tasks, excludes trash, and keeps overdue work in today only', () => {
  const rows = [
    task('later', { due: '2026-10-07' }),
    task('late', { due: '2026-10-05' }),
    task('todayB', { due: '2026-10-06', scheduledTime: '14:00' }),
    task('todayA', { due: '2026-10-06', scheduledTime: '09:00' }),
    task('done', { due: '2026-10-06', completedAt: '2026-10-06T08:00:00Z' }),
    task('trash', { due: '2026-10-06', trashedAt: '2026-10-06T08:00:00Z' }),
    task('undated'),
  ];
  assert.deepEqual(
    tasksForDay(rows, '2026-10-06', '2026-10-06').map((t) => t.id),
    ['late', 'todayA', 'todayB', 'done'],
  );
  assert.deepEqual(
    tasksForDay(rows, '2026-10-07', '2026-10-06').map((t) => t.id),
    ['later'],
  );
  assert.equal(tasksForDay(rows, '2026-10-06', '2026-10-06')[1], rows[3]);
});
test('backup validation accepts optional board and schedule fields and rejects impossible times', () => {
  const state = defaultProductivity();
  state.tasks = [task('saved', { boardStatus: 'doing', scheduledTime: '23:59' })];
  assert.equal(validProductivity(JSON.parse(JSON.stringify(state))), true);
  state.tasks[0].scheduledTime = '24:00';
  assert.equal(validProductivity(state), false);
  state.tasks[0].scheduledTime = '';
  assert.equal(validProductivity(state), true);
  delete state.tasks[0].boardStatus;
  delete state.tasks[0].scheduledTime;
  assert.equal(validProductivity(state), true);
});
