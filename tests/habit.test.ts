import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isDue,
  isComplete,
  habitStats,
  aggregateDay,
  habitYear,
  canFreeze,
  canPause,
  freezesRemaining,
  freezesUsed,
  pauseDaysUsed,
  retroWindowOpen,
  dayOutcome,
  weekStart,
  orderHabits,
  dateRange,
  type EngineHabit,
  type EngineLog,
} from '../src/shared/habits';
import { localDate } from '../src/shared/productivity';
import { normalizeHabit } from '../src/shared/habitValidation';
import { migrateProductivity, migrateHabitEngine } from '../src/main/database/migrations';
import Database from '../src/main/database/sqlite';
const h = (patch: Partial<EngineHabit> = {}): EngineHabit => ({
  id: 1,
  name: 'Read',
  created_at: '2026-09-01T12:00:00',
  start_date: '2026-09-01',
  days_of_week: 'mon,tue,wed,thu,fri,sat,sun',
  habit_type: 'check',
  schedule_type: 'daily',
  freeze_cap: 3,
  pause_cap: 14,
  ...patch,
});
const done = (date: string, patch: Partial<EngineLog> = {}): EngineLog => ({
  habit_id: 1,
  log_date: date,
  is_completed: 1,
  outcome: 'done',
  ...patch,
});
const freeze = (date: string): EngineLog =>
  done(date, { is_completed: 0, outcome: 'freeze', freeze_reason: 'rest' });
test('daily due excludes pre-start days and pause ranges', () => {
  const habit = h({
    pauses: [{ start_date: '2026-09-05', end_date: '2026-09-07', reason: 'Vacation' }],
  });
  assert.equal(isDue(habit, '2026-08-31'), false);
  assert.equal(isDue(habit, '2026-09-01'), true);
  assert.equal(isDue(habit, '2026-09-07'), false);
  assert.equal(isDue(habit, '2026-09-08'), true);
  assert.equal(isDue(habit, '2026-02-30'), false);
});
test('selected weekday schedule recognizes every weekday independently', () => {
  const habit = h({ schedule_type: 'weekdays', days_of_week: 'mon,wed,fri' });
  assert.deepEqual(
    dateRange('2026-09-28', '2026-10-04').map((d) => isDue(habit, d)),
    [true, false, true, false, true, false, false],
  );
});
test('interval schedule uses civil dates across months and leap days', () => {
  const habit = h({ schedule_type: 'interval', interval_days: 3, start_date: '2024-02-28' });
  assert.equal(isDue(habit, '2024-02-29'), false);
  assert.equal(isDue(habit, '2024-03-02'), true);
  assert.equal(isDue(habit, '2024-03-05'), true);
});
test('weekly quota uses earlier completions only, never later records', () => {
  const habit = h({ schedule_type: 'weekly_target', weekly_target: 2 });
  const logs = [done('2026-09-28'), done('2026-09-30')];
  assert.equal(isDue(habit, '2026-09-29', logs), true);
  assert.equal(isDue(habit, '2026-10-01', logs), false);
  assert.equal(isDue(habit, '2026-10-05', logs), true);
  assert.equal(dayOutcome(habit, logs, '2026-09-29', '2026-10-05'), 'not_due');
});
test('weekly current opportunity and partial history remain visible without future credit', () => {
  const habit = h({
    habit_type: 'quantity',
    quantity_target: 1000,
    schedule_type: 'weekly_target',
    weekly_target: 2,
  });
  const logs = [
    done('2026-09-29', { quantity: 250, is_completed: 0, outcome: 'pending' }),
    done('2026-10-02', { quantity: 1000 }),
    done('2026-10-03', { quantity: 1000 }),
  ];
  assert.equal(dayOutcome(habit, logs, '2026-10-01', '2026-10-01'), 'pending');
  assert.equal(dayOutcome(habit, logs, '2026-09-29', '2026-10-01'), 'partial');
  assert.equal(dayOutcome(habit, logs, '2026-09-30', '2026-10-01'), 'not_due');
  assert.equal(habitYear(habit, logs, '2026-10-01')['2026-09-29'].shade, 1);
  assert.equal(aggregateDay([habit], logs, '2026-10-01', '2026-10-01').due, 1);
  assert.equal(habitStats(habit, logs, '2026-10-01').current, 0);
  assert.equal(dayOutcome(habit, [], '2026-10-04', '2026-10-05'), 'missed');
});
test('full collective shade requires every due completion, independent of rounding', () => {
  const habits = Array.from({ length: 200 }, (_, i) => h({ id: i + 1 }));
  const logs = habits.slice(0, 199).map((habit) => done('2026-10-01', { habit_id: habit.id }));
  const day = aggregateDay(habits, logs, '2026-10-01', '2026-10-01');
  assert.equal(day.percent, 99.5);
  assert.equal(day.shade, 2);
  logs.push(done('2026-10-01', { habit_id: 200 }));
  assert.equal(aggregateDay(habits, logs, '2026-10-01', '2026-10-01').shade, 3);
});
test('week boundary respects Monday default and configurable Sunday', () => {
  assert.equal(weekStart('2026-10-04'), '2026-09-28');
  assert.equal(weekStart('2026-10-04', 0), '2026-10-04');
  const habit = h({
    schedule_type: 'weekly_target',
    weekly_target: 1,
    week_start: 0,
    start_date: '2026-09-27',
  });
  assert.equal(
    habitStats(habit, [done('2026-09-27'), done('2026-10-04')], '2026-10-05').current,
    2,
  );
});
test('weekly streak counts qualified weeks, not daily completions', () => {
  const habit = h({ schedule_type: 'weekly_target', weekly_target: 2, start_date: '2026-09-14' });
  const logs = [
    '2026-09-14',
    '2026-09-16',
    '2026-09-21',
    '2026-09-23',
    '2026-09-28',
    '2026-09-29',
  ].map((d) => done(d));
  const stats = habitStats(habit, logs, '2026-10-01');
  assert.equal(stats.current, 3);
  assert.equal(stats.longest, 3);
  assert.equal(stats.rate, 100);
});
test('freeze-covered week preserves length; unmet closed week breaks it', () => {
  const habit = h({ schedule_type: 'weekly_target', weekly_target: 2, start_date: '2026-09-14' });
  const logs = [done('2026-09-14'), done('2026-09-16'), done('2026-09-21'), freeze('2026-09-27')];
  const stats = habitStats(habit, logs, '2026-09-28');
  assert.equal(stats.current, 1);
  assert.equal(stats.longest, 1);
  assert.equal(habitStats(habit, logs, '2026-10-05').current, 0);
});
test('day streak passes through freezes and pauses without increasing', () => {
  const habit = h({
    start_date: '2026-09-24',
    pauses: [{ start_date: '2026-09-27', end_date: '2026-09-28', reason: 'Travel' }],
  });
  const stats = habitStats(
    habit,
    [done('2026-09-24'), freeze('2026-09-25'), done('2026-09-26'), done('2026-09-29')],
    '2026-09-30',
  );
  assert.deepEqual(stats, { current: 3, longest: 3, possible: 4, done: 3, rate: 75 });
});
test('freeze cap is per occurrence month, strict zero disallows protection', () => {
  const logs = [freeze('2026-09-01'), freeze('2026-09-15'), freeze('2026-09-29')],
    habit = h();
  assert.equal(freezesUsed(habit, logs, '2026-09-30'), 3);
  assert.equal(freezesRemaining(habit, logs, '2026-10-01'), 3);
  assert.equal(canFreeze(habit, logs, '2026-09-30', new Date('2026-10-01T12:00:00')), false);
  assert.equal(
    canFreeze(h({ freeze_cap: 0 }), [], '2026-10-01', new Date('2026-10-01T12:00:00')),
    false,
  );
  assert.equal(
    habitStats(h({ start_date: '2026-09-29' }), [done('2026-09-29')], '2026-10-01').current,
    0,
  );
});
test('complete, slipped, non-due or expired days cannot be frozen', () => {
  const now = new Date('2026-10-01T12:00:00');
  assert.equal(canFreeze(h(), [done('2026-09-30')], '2026-09-30', now), false);
  assert.equal(
    canFreeze(h(), [done('2026-09-30', { outcome: 'slip', is_completed: 0 })], '2026-09-30', now),
    false,
  );
  assert.equal(
    canFreeze(h({ schedule_type: 'weekdays', days_of_week: 'mon' }), [], '2026-09-30', now),
    false,
  );
  assert.equal(canFreeze(h(), [], '2026-09-28', now), false);
});
test('pause caps count inclusive union days independently across years', () => {
  const habit = h({
    pause_cap: 2,
    pauses: [{ start_date: '2026-12-31', end_date: '2027-01-01', reason: 'Travel' }],
  });
  assert.equal(pauseDaysUsed(habit, '2026'), 1);
  assert.equal(pauseDaysUsed(habit, '2027'), 1);
  assert.equal(canPause(habit, '2026-12-30', '2027-01-02'), true);
  assert.equal(canPause(habit, '2026-12-29', '2027-01-02'), false);
  assert.equal(canPause(h({ pause_cap: 0 }), '2026-10-01', '2026-10-01'), false);
});
test('retroactive window closes after exactly 48 elapsed hours from day end', () => {
  const deadline = new Date('2026-10-03T00:00:00');
  assert.equal(retroWindowOpen('2026-09-30', new Date(deadline.getTime() - 1)), true);
  assert.equal(retroWindowOpen('2026-09-30', deadline), true);
  assert.equal(retroWindowOpen('2026-09-30', new Date(deadline.getTime() + 1)), false);
});
test('quantity threshold is inclusive, custom, and independent from target shade', () => {
  const habit = h({ habit_type: 'quantity', quantity_target: 2000, completion_threshold: 80 });
  assert.equal(isComplete(habit, done('2026-09-30', { quantity: 1599 })), false);
  assert.equal(isComplete(habit, done('2026-09-30', { quantity: 1600 })), true);
  assert.equal(isComplete(habit, done('2026-09-30', { quantity: 2001 })), true);
  assert.equal(
    habitYear(habit, [done('2026-09-30', { quantity: 1600 })], '2026-09-30')['2026-09-30'].shade,
    2,
  );
  assert.equal(
    aggregateDay([habit], [done('2026-09-30', { quantity: 1600 })], '2026-09-30', '2026-09-30')
      .percent,
    100,
  );
});
test('Avoid requires explicit clean confirmation; Slip breaks even today', () => {
  const habit = h({ habit_type: 'avoid', start_date: '2026-09-29' }),
    clean = done('2026-09-29', { outcome: 'clean' });
  assert.equal(isComplete(habit, done('2026-09-30')), false);
  assert.equal(habitStats(habit, [clean], '2026-09-30').current, 1);
  assert.equal(
    habitStats(
      habit,
      [clean, done('2026-09-30', { outcome: 'slip', is_completed: 0 })],
      '2026-09-30',
    ).current,
    0,
  );
});
test('heatmap buckets use due denominator and show freeze names without a completion', () => {
  const habits = [
    h(),
    h({ id: 2, name: 'Water' }),
    h({ id: 3, name: 'Weekend', schedule_type: 'weekdays', days_of_week: 'sat' }),
  ];
  const result = aggregateDay(
    habits,
    [done('2026-09-30'), freeze('2026-09-30')].slice(0, 1),
    '2026-09-30',
    '2026-10-01',
  );
  assert.equal(result.due, 2);
  assert.equal(result.done, 1);
  assert.equal(result.shade, 2);
  assert.deepEqual(result.missed, ['Water']);
  const frozen = aggregateDay([h()], [freeze('2026-09-30')], '2026-09-30', '2026-10-01');
  assert.equal(frozen.due, 0);
  assert.equal(frozen.done, 0);
  assert.deepEqual(frozen.freezes, ['Read']);
  assert.equal(frozen.neutral, false);
  assert.equal(
    aggregateDay(
      [h({ schedule_type: 'weekdays', days_of_week: 'sat' })],
      [],
      '2026-09-30',
      '2026-10-01',
    ).neutral,
    true,
  );
});
test('stacking stays within section and non-negotiables are pinned first', () => {
  const habits = [
    h({ id: 2, after_habit_id: 1, time_of_day: 'morning' }),
    h({ id: 1, time_of_day: 'morning' }),
    h({ id: 3, non_negotiable: 1, time_of_day: 'morning' }),
  ];
  assert.deepEqual(
    orderHabits(habits).map((h) => h.id),
    [3, 1, 2],
  );
});
test('habit input rejects invalid schedules, dates, limits and quantity targets', () => {
  const base = { name: 'Read', frequency: 'daily', time_of_day: 'anytime' };
  assert.throws(() => normalizeHabit({ ...base, quantity_target: 0 }));
  assert.throws(() => normalizeHabit({ ...base, freeze_cap: -1 }));
  assert.throws(() => normalizeHabit({ ...base, weekly_target: 8 }));
  assert.throws(() => normalizeHabit({ ...base, start_date: '2026-02-30' }));
  assert.equal(normalizeHabit(base).schedule_type, 'daily');
});
test('migration3 preserves original fields and every log, converts daily, and is idempotent', () => {
  const db = new Database(':memory:');
  db.exec(`CREATE TABLE habits(id INTEGER PRIMARY KEY,name TEXT,frequency TEXT,days_of_week TEXT,created_at TEXT,is_archived INTEGER); CREATE TABLE habit_logs(id INTEGER PRIMARY KEY,habit_id INTEGER,log_date TEXT,is_completed INTEGER,note TEXT,missed_reason TEXT);
    INSERT INTO habits VALUES(7,'Original','weekly','mon,wed,fri','2026-09-01T12:00:00',1); INSERT INTO habit_logs VALUES(4,7,'2026-09-28',1,'Original note','Original reason');`);
  migrateProductivity(db);
  const before = db.prepare('SELECT * FROM habits').all(),
    beforeLogs = db.prepare('SELECT * FROM habit_logs').all();
  const productivity = (db.prepare('SELECT json FROM productivity_state').get() as any).json;
  migrateHabitEngine(db);
  migrateHabitEngine(db);
  assert.deepEqual(
    db.prepare('SELECT id,name,frequency,days_of_week,created_at,is_archived FROM habits').all(),
    before,
  );
  assert.deepEqual(
    db.prepare('SELECT id,habit_id,log_date,is_completed,note,missed_reason FROM habit_logs').all(),
    beforeLogs,
  );
  const migrated = db.prepare('SELECT * FROM habits').get() as any;
  assert.equal(migrated.habit_type, 'check');
  assert.equal(migrated.schedule_type, 'daily');
  assert.equal((db.prepare('SELECT json FROM productivity_state').get() as any).json, productivity);
  assert.equal(
    (db.prepare('SELECT COUNT(*) as n FROM schema_migrations WHERE version=3').get() as any).n,
    1,
  );
  db.close();
});
test('DST calendar traversal, interval anchoring and midnight use local civil days', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    assert.deepEqual(dateRange('2026-03-07', '2026-03-10'), [
      '2026-03-07',
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
    ]);
    assert.equal(
      isDue(
        h({ schedule_type: 'interval', interval_days: 2, start_date: '2026-03-07' }),
        '2026-03-09',
      ),
      true,
    );
    const end = new Date('2026-03-08T00:00:00').getTime(),
      cutoff = new Date(end + 48 * 3600000);
    assert.equal(retroWindowOpen('2026-03-07', cutoff), true);
    assert.equal(retroWindowOpen('2026-03-07', new Date(cutoff.getTime() + 1)), false);
    assert.equal(localDate(new Date('2026-11-01T23:59:59')), '2026-11-01');
    assert.equal(localDate(new Date('2026-11-02T00:00:00')), '2026-11-02');
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
