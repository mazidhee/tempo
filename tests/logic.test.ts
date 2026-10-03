import { test } from 'node:test';
import './habit.test';
import './study.test';
import './moduleBackup.test';
import './personal.test';
import './redesign.test';
import assert from 'node:assert/strict';
import {
  defaultProductivity,
  startTimer,
  pauseTimer,
  secondsLeft,
  finishTimer,
  validProductivity,
  focusRequest,
} from '../src/shared/productivity';
import { habitStats, heatmapDays, dateRange } from '../src/shared/analytics';
import Database from '../src/main/database/sqlite';
import { migrateProductivity } from '../src/main/database/migrations';

test('Home navigation preserves a paused phase; a different link requires confirmation', () => {
  const timer = pauseTimer(startTimer(defaultProductivity().timer, 1000), 1500);
  timer.link = { type: 'habit', id: '7', name: 'Read' };
  assert.equal(focusRequest(timer), 'resume');
  assert.equal(focusRequest(timer, { type: 'habit', id: '7', name: 'Read' }), 'resume');
  assert.equal(focusRequest(timer, { type: 'task', id: 'x', name: 'Write' }), 'confirm');
  assert.equal(focusRequest(defaultProductivity().timer), 'replace');
});

test('additive SQLite migration preserves habit and log records and is repeatable', () => {
  const db = new Database(':memory:');
  db.exec(`CREATE TABLE habits(id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE habit_logs(id INTEGER PRIMARY KEY, habit_id INTEGER, note TEXT);
    INSERT INTO habits VALUES(7, 'Original habit'); INSERT INTO habit_logs VALUES(3,7,'Original note');`);
  const habits = db.prepare('SELECT * FROM habits').all();
  const logs = db.prepare('SELECT * FROM habit_logs').all();
  migrateProductivity(db);
  migrateProductivity(db);
  assert.deepEqual(db.prepare('SELECT * FROM habits').all(), habits);
  assert.deepEqual(db.prepare('SELECT * FROM habit_logs').all(), logs);
  assert.equal((db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get() as any).n, 1);
  assert.equal(
    validProductivity(
      JSON.parse((db.prepare('SELECT json FROM productivity_state').get() as any).json),
    ),
    true,
  );
  db.close();
});
test('SQLite transaction rollback keeps existing records intact', () => {
  const db = new Database(':memory:');
  db.exec("CREATE TABLE fixture(value TEXT); INSERT INTO fixture VALUES('original');");
  assert.throws(
    db.transaction(() => {
      db.exec("INSERT INTO fixture VALUES('new')");
      throw new Error('rollback');
    }),
  );
  assert.equal(db.prepare('SELECT * FROM fixture').all().length, 1);
  db.close();
});
test('deadline remains correct after background throttling and refresh', () => {
  const s = defaultProductivity();
  const t = startTimer(s.timer, 1000);
  const restored = JSON.parse(JSON.stringify(t));
  assert.equal(secondsLeft(restored, 601000), 900);
  assert.equal(secondsLeft(restored, 2000000), 0);
});
test('pause and resume exclude paused wall time without rounding drift', () => {
  const s = defaultProductivity();
  const paused = pauseTimer(startTimer(s.timer, 1000), 1123);
  assert.equal(paused.remaining, 1499.877);
  assert.equal(secondsLeft(paused, 999999), 1499.877);
  const resumed = startTimer(paused, 1000000);
  assert.equal(resumed.deadline, 2499877);
});
test('finish records the actual deadline date and immutable link, then waits for break', () => {
  let s = defaultProductivity();
  s.timer.link = { type: 'task', id: 'x', name: 'Write', project: 'Study' };
  s.timer = startTimer(s.timer, new Date('2026-09-28T10:00:00').getTime());
  const result = finishTimer(s, new Date('2026-09-30T15:00:00').getTime());
  assert.equal(result.sessions[0].date, '2026-09-28');
  assert.equal(result.sessions[0].link?.name, 'Write');
  assert.equal(result.timer.phase, 'short');
  assert.equal(result.timer.deadline, null);
  assert.equal(result.timer.completed, 1);
});
test('phase logging is idempotent across crash/reload replay', () => {
  const s = defaultProductivity();
  const first = finishTimer(s, 1000);
  const replay = finishTimer({ ...s, sessions: first.sessions }, 1000);
  assert.equal(replay.sessions.length, 1);
});
test('long break cadence and skip never fabricate focus', () => {
  let s = defaultProductivity();
  s.timer.completed = 3;
  const result = finishTimer(s, 1000);
  assert.equal(result.timer.phase, 'long');
  assert.equal(result.timer.completed, 4);
  const skipped = finishTimer(s, 1000, true);
  assert.equal(skipped.sessions.length, 0);
  assert.equal(skipped.timer.completed, 3);
});
test('break completions log but are distinguishable from focus', () => {
  const s = finishTimer(defaultProductivity(), 1000);
  const after = finishTimer(s, 2000);
  assert.equal(after.sessions[1].phase, 'short');
  assert.equal(after.timer.phase, 'focus');
  assert.equal(after.timer.completed, 1);
});
test('scheduled streak skips weekends and unfinished today', () => {
  const h = { id: 1, days_of_week: 'mon,tue,wed,thu,fri', created_at: '2026-09-24T12:00:00' };
  const logs = ['2026-09-24', '2026-09-25', '2026-09-28'].map((log_date) => ({
    habit_id: 1,
    log_date,
    is_completed: 1,
  }));
  const stats = habitStats(h, logs, '2026-09-29');
  assert.equal(stats.current, 3);
  assert.equal(stats.longest, 3);
  assert.equal(stats.possible, 4);
  assert.equal(stats.rate, 75);
});
test('missing scheduled day breaks streak, duplicates cannot inflate it', () => {
  const h = {
    id: 1,
    days_of_week: 'mon,tue,wed,thu,fri,sat,sun',
    created_at: '2026-09-25T12:00:00',
  };
  const logs = ['2026-09-25', '2026-09-25', '2026-09-27'].map((log_date) => ({
    habit_id: 1,
    log_date,
    is_completed: 1,
  }));
  assert.deepEqual(habitStats(h, logs, '2026-09-28'), {
    current: 1,
    longest: 1,
    possible: 4,
    done: 2,
    rate: 50,
  });
});
test('date filtering denominators respect creation date and schedule', () => {
  const h = { id: 1, days_of_week: 'mon', created_at: '2026-09-15T12:00:00' };
  const s = habitStats(
    h,
    [{ habit_id: 1, log_date: '2026-09-21', is_completed: 1 }],
    '2026-09-28',
    '2026-09-01',
  );
  assert.equal(s.possible, 2);
  assert.equal(s.rate, 50);
});
test('heatmap is exactly 365 local days including today, zeros and leap day', () => {
  const days = heatmapDays({ '2024-02-29': 3, '2024-03-01': 2 }, '2024-03-01');
  assert.equal(days.length, 365);
  assert.equal(days.at(-1)?.date, '2024-03-01');
  assert.equal(days.at(-2)?.value, 3);
  assert.equal(days[0].value, 0);
  assert.equal(new Set(days.map((d) => d.date)).size, 365);
});
test('date range traverses DST without skipping local days', () => {
  assert.deepEqual(dateRange('2026-03-07', '2026-03-10'), [
    '2026-03-07',
    '2026-03-08',
    '2026-03-09',
    '2026-03-10',
  ]);
});
test('invalid durations and incomplete imported state are rejected', () => {
  const s = defaultProductivity();
  assert.equal(validProductivity(s), true);
  s.presets[0].focus = NaN;
  assert.equal(validProductivity(s), false);
  assert.equal(validProductivity({ version: 1 }), false);
});

import './focus.test';
import './reflection.test';
import './backup.test';
import './ux.test';
