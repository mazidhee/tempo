import { localDate } from './productivity';
export type HabitType = 'check' | 'quantity' | 'avoid';
export type ScheduleType = 'daily' | 'weekdays' | 'weekly_target' | 'interval';
export type FreezeReason = 'sick' | 'travel' | 'rest' | 'other';
export interface PauseRange {
  id?: number;
  habit_id?: number;
  start_date: string;
  end_date: string;
  reason: string;
}
export interface EngineHabit {
  id: number;
  name?: string;
  created_at: string;
  days_of_week: string;
  is_archived?: number;
  habit_type?: HabitType;
  schedule_type?: ScheduleType;
  quantity_target?: number;
  quantity_unit?: string;
  completion_threshold?: number;
  weekly_target?: number;
  interval_days?: number;
  start_date?: string;
  week_start?: number;
  freeze_cap?: number;
  pause_cap?: number;
  non_negotiable?: number;
  after_habit_id?: number | null;
  time_of_day?: string;
  pauses?: PauseRange[];
}
export interface EngineLog {
  habit_id: number;
  log_date: string;
  is_completed: number;
  quantity?: number;
  outcome?: 'pending' | 'done' | 'clean' | 'slip' | 'freeze';
  note?: string | null;
  missed_reason?: string | null;
  slip_reason?: string | null;
  freeze_reason?: FreezeReason | null;
  freeze_note?: string | null;
  freeze_at?: string | null;
}
export const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const parseDay = (day: string) => new Date(`${day}T12:00:00`);
export const shiftDay = (day: string, count: number) => {
  const date = parseDay(day);
  date.setDate(date.getDate() + count);
  return localDate(date);
};
export function dateRange(start: string, end: string) {
  const result: string[] = [];
  for (let day = start; day <= end; day = shiftDay(day, 1)) result.push(day);
  return result;
}
export const validDate = (day: unknown): day is string =>
  typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && localDate(parseDay(day)) === day;
const civilDay = (day: string) => Date.parse(`${day}T00:00:00Z`) / 86400000;
export const habitStart = (h: EngineHabit) => h.start_date || localDate(new Date(h.created_at));
export const weekStart = (date: string, first = 1) =>
  shiftDay(date, -((parseDay(date).getDay() - first + 7) % 7));
export const isPaused = (h: EngineHabit, date: string) =>
  (h.pauses || []).some((p) => date >= p.start_date && date <= p.end_date);

/** Weekly days are flexible opportunities; dayOutcome only calls the unmet
 * period's last day a miss, never all seven unused opportunities. */
export function isDue(h: EngineHabit, date: string, logs?: EngineLog[]): boolean {
  if (!validDate(date) || date < habitStart(h) || isPaused(h, date)) return false;
  const schedule = h.schedule_type || 'weekdays';
  if (schedule === 'weekdays')
    return (h.days_of_week || dayKeys.join(','))
      .split(',')
      .includes(dayKeys[parseDay(date).getDay()]);
  if (schedule === 'interval')
    return (civilDay(date) - civilDay(habitStart(h))) % (h.interval_days || 1) === 0;
  if (schedule === 'weekly_target' && logs) {
    const start = weekStart(date, h.week_start ?? 1);
    const credited = dateRange(start, shiftDay(date, -1))
      .filter((d) => isDue(h, d))
      .filter((d) => {
        const log = logFor(logs, h, d);
        return isComplete(h, log) || log?.outcome === 'freeze';
      }).length;
    return credited < (h.weekly_target || 1);
  }
  return true;
}
export function isComplete(h: EngineHabit, log?: EngineLog): boolean {
  if (!log || log.outcome === 'freeze' || log.outcome === 'slip') return false;
  if (h.habit_type === 'quantity')
    return (
      (log.quantity || 0) >= ((h.quantity_target || 1) * (h.completion_threshold ?? 100)) / 100
    );
  if (h.habit_type === 'avoid') return log.outcome === 'clean';
  return log.is_completed === 1;
}
export const progress = (h: EngineHabit, log?: EngineLog) =>
  h.habit_type === 'quantity'
    ? Math.max(0, Math.min(1, (log?.quantity || 0) / (h.quantity_target || 1)))
    : isComplete(h, log)
      ? 1
      : 0;
// Snapshots are immutable. Reuse one index across streaks, grids and statistics.
// Length checking also supports callers that append logs to an existing array.
const logIndexes = new WeakMap<EngineLog[], { length: number; entries: Map<string, EngineLog> }>();
export function logFor(logs: EngineLog[], h: EngineHabit, date: string) {
  let index = logIndexes.get(logs);
  if (!index || index.length !== logs.length) {
    const entries = new Map<string, EngineLog>();
    for (const log of logs) {
      const key = `${log.habit_id}:${log.log_date}`;
      if (!entries.has(key)) entries.set(key, log);
    }
    index = { length: logs.length, entries };
    logIndexes.set(logs, index);
  }
  return index.entries.get(`${h.id}:${date}`);
}
export function freezesUsed(h: EngineHabit, logs: EngineLog[], date: string) {
  return new Set(
    logs
      .filter(
        (l) =>
          l.habit_id === h.id &&
          l.outcome === 'freeze' &&
          l.log_date.slice(0, 7) === date.slice(0, 7),
      )
      .map((l) => l.log_date),
  ).size;
}
export const freezesRemaining = (h: EngineHabit, logs: EngineLog[], date: string) =>
  Math.max(0, (h.freeze_cap ?? 3) - freezesUsed(h, logs, date));
export function pauseDaysUsed(h: EngineHabit, year: string) {
  const days = new Set<string>();
  for (const p of h.pauses || [])
    for (const d of dateRange(p.start_date, p.end_date)) if (d.startsWith(year)) days.add(d);
  return days.size;
}
export function canPause(h: EngineHabit, start: string, end: string) {
  if (
    !validDate(start) ||
    !validDate(end) ||
    end < start ||
    start < habitStart(h) ||
    civilDay(end) - civilDay(start) > 366
  )
    return false;
  const years = new Set(dateRange(start, end).map((d) => d.slice(0, 4)));
  const candidate = {
    ...h,
    pauses: [...(h.pauses || []), { start_date: start, end_date: end, reason: '' }],
  };
  return [...years].every((y) => pauseDaysUsed(candidate, y) <= (h.pause_cap ?? 14));
}
export function retroWindowOpen(date: string, now = new Date()) {
  if (!validDate(date) || date >= localDate(now)) return false;
  const end = new Date(`${shiftDay(date, 1)}T00:00:00`).getTime();
  return now.getTime() >= end && now.getTime() <= end + 48 * 3600000;
}
export function canFreeze(h: EngineHabit, logs: EngineLog[], date: string, now = new Date()) {
  const log = logFor(logs, h, date);
  return (
    isDue(h, date, logs) &&
    date <= localDate(now) &&
    (date === localDate(now) || retroWindowOpen(date, now)) &&
    !isComplete(h, log) &&
    log?.outcome !== 'freeze' &&
    log?.outcome !== 'slip' &&
    freezesRemaining(h, logs, date) > 0
  );
}
export function periodSummary(h: EngineHabit, logs: EngineLog[], date: string, asOf?: string) {
  const start = weekStart(date, h.week_start ?? 1),
    end = shiftDay(start, 6);
  const days = dateRange(start, end).filter((d) => isDue(h, d));
  const observed = asOf ? days.filter((d) => d <= asOf) : days;
  const done = observed.filter((d) => isComplete(h, logFor(logs, h, d))).length;
  const frozen = observed.filter((d) => logFor(logs, h, d)?.outcome === 'freeze').length;
  const target = days.length ? h.weekly_target || 1 : 0;
  return { start, end, done, frozen, target, met: target > 0 && done + frozen >= target };
}
export type DayOutcome =
  'done' | 'partial' | 'pending' | 'missed' | 'slip' | 'freeze' | 'not_due' | 'paused';
export function dayOutcome(
  h: EngineHabit,
  logs: EngineLog[],
  date: string,
  today: string,
): DayOutcome {
  if (isPaused(h, date)) return 'paused';
  if (!isDue(h, date, logs)) return 'not_due';
  const log = logFor(logs, h, date);
  if (log?.outcome === 'freeze') return 'freeze';
  if (log?.outcome === 'slip') return 'slip';
  if (isComplete(h, log)) return 'done';
  if (h.schedule_type === 'weekly_target') {
    // Only use records on/before this day: later entries never rewrite its shade.
    const week = periodSummary(h, logs, date, date);
    if (week.met) return 'not_due';
    // An eligible current opportunity and recorded partial work stay visible.
    // Unused flexible past days are neutral until the unmet week closes.
    if (date === today) return progress(h, log) > 0 ? 'partial' : 'pending';
    if (date < today && date === week.end) return 'missed';
    if (progress(h, log) > 0) return 'partial';
    return 'not_due';
  }
  if (date < today) return 'missed';
  return progress(h, log) > 0 ? 'partial' : 'pending';
}
export function habitStats(h: EngineHabit, logs: EngineLog[], today: string, from = habitStart(h)) {
  let run = 0,
    longest = 0,
    possible = 0,
    done = 0;
  if (h.schedule_type === 'weekly_target') {
    for (
      let start = weekStart(habitStart(h), h.week_start ?? 1);
      start <= today;
      start = shiftDay(start, 7)
    ) {
      const week = periodSummary(h, logs, start, today);
      if (!week.target) continue;
      const completed = Math.min(week.target, week.done);
      const denominator = Math.max(completed, week.target - week.frozen);
      if (week.end >= from) {
        possible += denominator;
        done += completed;
      }
      if (week.done >= week.target) {
        run++;
        longest = Math.max(longest, run);
      } else if (!week.met && week.end < today) run = 0;
    }
  } else {
    for (const date of dateRange(habitStart(h), today)) {
      if (!isDue(h, date)) continue;
      const log = logFor(logs, h, date);
      if (log?.outcome === 'freeze') continue;
      const complete = isComplete(h, log);
      if (date >= from) {
        possible++;
        if (complete) done++;
      }
      if (complete) {
        run++;
        longest = Math.max(longest, run);
      } else if (date !== today || log?.outcome === 'slip') run = 0;
    }
  }
  return {
    current: run,
    longest,
    possible,
    done,
    rate: possible ? Math.round((done / possible) * 100) : 0,
  };
}
export interface HabitDay {
  date: string;
  due: number;
  done: number;
  percent: number;
  shade: number;
  missed: string[];
  freezes: string[];
  neutral: boolean;
}
export function aggregateDay(
  habits: EngineHabit[],
  logs: EngineLog[],
  date: string,
  today: string,
): HabitDay {
  let due = 0,
    done = 0;
  const missed: string[] = [],
    freezes: string[] = [];
  for (const h of habits) {
    if (h.is_archived && !logFor(logs, h, date)) continue;
    const outcome = dayOutcome(h, logs, date, today);
    if (outcome === 'freeze') {
      freezes.push(h.name || 'Habit');
      continue;
    }
    if (outcome === 'not_due' || outcome === 'paused' || date > today) continue;
    due++;
    if (outcome === 'done') done++;
    else if (outcome === 'missed' || outcome === 'slip') missed.push(h.name || 'Habit');
  }
  const ratio = due ? done / due : 0;
  const percent = Math.round(ratio * 1000) / 10;
  return {
    date,
    due,
    done,
    percent,
    shade: due > 0 && done === due ? 3 : ratio >= 0.5 ? 2 : ratio > 0 ? 1 : 0,
    missed,
    freezes,
    neutral: due === 0 && freezes.length === 0,
  };
}
export function collectiveYear(habits: EngineHabit[], logs: EngineLog[], end: string, today = end) {
  return Object.fromEntries(
    dateRange(shiftDay(end, -364), end).map((date) => [
      date,
      aggregateDay(habits, logs, date, today),
    ]),
  );
}
export function habitYear(h: EngineHabit, logs: EngineLog[], end: string, today = end) {
  return Object.fromEntries(
    dateRange(shiftDay(end, -364), end).map((date) => {
      const day = aggregateDay([h], logs, date, today);
      const p = progress(h, logFor(logs, h, date));
      return [
        date,
        {
          ...day,
          shade:
            h.habit_type === 'quantity' && !day.neutral && !day.freezes.length
              ? p >= 1
                ? 3
                : p >= 0.5
                  ? 2
                  : p > 0
                    ? 1
                    : 0
              : day.shade,
        },
      ];
    }),
  );
}
export function orderHabits<T extends EngineHabit>(habits: T[]): T[] {
  const result: T[] = [],
    visiting = new Set<number>(),
    visited = new Set<number>();
  const visit = (h: T) => {
    if (visited.has(h.id) || visiting.has(h.id)) return;
    visiting.add(h.id);
    const anchor = habits.find(
      (a) => a.id === h.after_habit_id && a.time_of_day === h.time_of_day && !h.non_negotiable,
    );
    if (anchor) visit(anchor);
    visiting.delete(h.id);
    visited.add(h.id);
    result.push(h);
  };
  [...habits]
    .sort((a, b) => (b.non_negotiable || 0) - (a.non_negotiable || 0) || a.id - b.id)
    .forEach(visit);
  return result;
}
