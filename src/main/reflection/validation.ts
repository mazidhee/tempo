import { validDate } from '../../shared/habits';
import type { DailyPlan, Goal, JournalEntry, ReflectionSettings } from '../../shared/reflection';
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid reflection data.');
  return value as Record<string, unknown>;
}
export function text(value: unknown, label: string, max = 500, empty = false): string {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim()))
    throw new Error(`Enter a valid ${label}.`);
  return value.trim();
}
export function day(value: unknown): string {
  if (!validDate(value) || value < '1900-01-01' || value > '2200-12-31')
    throw new Error('Choose a valid date between 1900 and 2200.');
  return value;
}
export function list(value: unknown, max = 100000): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new Error('Invalid list length.');
  return value;
}
export function number(value: unknown, min: number, max: number, integer = false): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  )
    throw new Error('Invalid numeric value.');
  return value;
}
export function flag(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error('Invalid enabled state.');
  return value;
}
export function timestamp(value: unknown): string {
  const result = text(value, 'timestamp', 40);
  if (!Number.isFinite(Date.parse(result))) throw new Error('Invalid timestamp.');
  return result;
}
export function validatePlan(value: unknown): DailyPlan {
  const v = object(value);
  day(v.date);
  list(v.priorities, 3).forEach((x) => {
    const p = object(x);
    text(p.id, 'priority ID', 100);
    text(p.title, 'priority', 500);
    if (!['task', 'habit', 'study', 'free'].includes(p.kind as string))
      throw new Error('Invalid priority type.');
    if (p.kind === 'free') {
      if (p.linkId !== null) throw new Error('Free priorities cannot link records.');
    } else text(p.linkId, 'linked ID', 100);
    flag(p.done);
  });
  const ids = list(v.priorities, 3).map((x) => object(x).id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate priority IDs.');
  const topics = list(v.studyTopicIds, 500).map((x) => text(x, 'topic ID', 100));
  if (new Set(topics).size !== topics.length) throw new Error('Duplicate study topics.');
  const e = object(v.evening);
  if (e.completedAt !== null) timestamp(e.completedAt);
  if (e.sleep !== null) number(e.sleep, 0, 24);
  if (e.energy !== null) number(e.energy, 1, 5, true);
  timestamp(v.updatedAt);
  return value as DailyPlan;
}
export function validateJournal(value: unknown): JournalEntry {
  const v = object(value);
  day(v.date);
  text(v.text, 'journal', 20000, true);
  timestamp(v.updatedAt);
  return value as JournalEntry;
}
export function validateGoal(value: unknown): Goal {
  const v = object(value);
  text(v.id, 'goal ID', 100);
  text(v.title, 'goal title', 500);
  day(v.start);
  day(v.deadline);
  if ((v.deadline as string) < (v.start as string))
    throw new Error('Goal deadline must follow its start.');
  if (!['habit', 'focus', 'chapter', 'tasks'].includes(v.kind as string))
    throw new Error('Invalid goal type.');
  const allowed: Record<string, string[]> = {
    habit: ['habit'],
    focus: ['all', 'project', 'curriculum', 'tag'],
    chapter: ['chapter', 'curriculum'],
    tasks: ['all', 'project', 'tag'],
  };
  if (!allowed[v.kind as string].includes(v.linkType as string))
    throw new Error('Invalid linked record type.');
  text(v.linkId, 'goal link', 200, v.linkType === 'all');
  number(v.target, 0.01, 100000, v.kind !== 'focus');
  number(v.weeks, 1, 520, true);
  if (v.kind === 'habit' && (v.target as number) > 7)
    throw new Error('Habit frequency cannot exceed seven days.');
  if (
    v.kind === 'habit' &&
    (Date.parse(v.deadline as string) - Date.parse(v.start as string)) / 86400000 + 1 <
      (v.weeks as number) * 7
  )
    throw new Error('Allow seven days for every goal week.');
  flag(v.archived);
  timestamp(v.createdAt);
  return value as Goal;
}
export function validateSettings(value: unknown): ReflectionSettings {
  const v = object(value);
  for (const key of ['morning', 'evening', 'weekly']) {
    const r = object(v[key]);
    flag(r.enabled);
    if (typeof r.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time))
      throw new Error('Choose a reminder time.');
    if (key === 'weekly') number(r.day, 0, 6, true);
  }
  return value as ReflectionSettings;
}
