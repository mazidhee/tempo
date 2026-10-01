import { localDate } from './productivity';
import { validDate, dayKeys, type EngineHabit } from './habits';
export type HabitInput = Partial<EngineHabit> & {
  name: string;
  description?: string | null;
  frequency: string;
  time_of_day: string;
  scheduled_time?: string | null;
};
export const engineFields = [
  'habit_type',
  'schedule_type',
  'quantity_target',
  'quantity_unit',
  'completion_threshold',
  'weekly_target',
  'interval_days',
  'start_date',
  'week_start',
  'freeze_cap',
  'pause_cap',
  'non_negotiable',
  'after_habit_id',
] as const;
export function normalizeHabit(input: HabitInput) {
  const h = {
    ...input,
    name: input.name?.trim(),
    habit_type: input.habit_type || 'check',
    schedule_type: input.schedule_type || 'daily',
    quantity_target: input.quantity_target ?? 1,
    quantity_unit: (input.quantity_unit || '').trim(),
    completion_threshold: input.completion_threshold ?? 100,
    weekly_target: input.weekly_target ?? 3,
    interval_days: input.interval_days ?? 2,
    start_date: input.start_date || localDate(),
    week_start: input.week_start ?? 1,
    freeze_cap: input.freeze_cap ?? 3,
    pause_cap: input.pause_cap ?? 14,
    non_negotiable: input.non_negotiable ? 1 : 0,
    after_habit_id: input.after_habit_id || null,
    days_of_week: input.days_of_week || 'mon,tue,wed,thu,fri,sat,sun',
  };
  const integer = (n: number, min: number, max: number) =>
    Number.isInteger(n) && n >= min && n <= max;
  if (
    !h.name ||
    h.name.length > 200 ||
    !['daily', 'weekly'].includes(h.frequency) ||
    !['morning', 'afternoon', 'evening', 'anytime'].includes(h.time_of_day)
  )
    throw new Error('Enter a name and valid habit period.');
  if (
    !['check', 'quantity', 'avoid'].includes(h.habit_type) ||
    !['daily', 'weekdays', 'weekly_target', 'interval'].includes(h.schedule_type)
  )
    throw new Error('Invalid habit type or schedule.');
  if (
    !Number.isFinite(h.quantity_target) ||
    h.quantity_target <= 0 ||
    !Number.isFinite(h.completion_threshold) ||
    h.completion_threshold <= 0 ||
    h.completion_threshold > 100
  )
    throw new Error('Quantity target must be positive and threshold must be between 0 and 100%.');
  if (h.habit_type === 'quantity' && !h.quantity_unit) throw new Error('Enter a quantity unit.');
  if (
    !integer(h.weekly_target, 1, 7) ||
    !integer(h.interval_days, 1, 3650) ||
    !integer(h.week_start, 0, 6) ||
    !integer(h.freeze_cap, 0, 31) ||
    !integer(h.pause_cap, 0, 366) ||
    !validDate(h.start_date)
  )
    throw new Error('Invalid schedule date or limits.');
  if (!h.days_of_week.split(',').every((d) => dayKeys.includes(d)))
    throw new Error('Choose valid weekdays.');
  if (h.scheduled_time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(h.scheduled_time))
    throw new Error('Invalid scheduled time.');
  return h;
}
