export { parseDay, shiftDay, dateRange, habitStats, isDue as scheduled } from './habits';
export type { EngineHabit as ScheduledHabit, EngineLog as Log } from './habits';
import { dateRange, shiftDay } from './habits';
export function heatmapDays(values: Record<string, number>, end: string, count = 365) {
  return dateRange(shiftDay(end, -(count - 1)), end).map((date) => ({
    date,
    value: values[date] ?? 0,
  }));
}
