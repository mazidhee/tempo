import { localDate } from '../../shared/productivity';
import { parseDay, shiftDay, weekStart } from '../../shared/habits';
import type { ReflectionStore } from './store';
import {
  defaultReflectionSettings,
  type ReflectionSettings,
  type WeeklyReview,
} from '../../shared/reflection';
/** Only the configured minute is eligible; missed reminders never flood a reopened app. */
export function reminderTick(
  store: ReflectionStore,
  now: Date,
  notify: (title: string, body: string) => void,
  allowNotifications = true,
) {
  const date = localDate(now),
    time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    row = store.db.prepare('SELECT json FROM reflection_settings WHERE id=1').get() as
      { json: string } | undefined,
    settings = row ? (JSON.parse(row.json) as ReflectionSettings) : defaultReflectionSettings();
  let generated = false;
  const week = weekStart(date, 1),
    end = shiftDay(week, 6),
    latest =
      date > end || (date === end && time >= settings.weekly.time) ? week : shiftDay(week, -7);
  const savedRow = store.db
    .prepare('SELECT json FROM reflection_reviews WHERE start=?')
    .get(latest) as { json: string } | undefined;
  const saved = savedRow ? (JSON.parse(savedRow.json) as WeeklyReview) : null;
  const closingTime = new Date(`${shiftDay(latest, 6)}T${settings.weekly.time}:00`).getTime();
  if (!saved || Date.parse(saved.generatedAt) < closingTime) {
    const source = store.source(),
      data = store.data();
    if (
      source.habits.length ||
      source.productivity.tasks.length ||
      source.study.topics.length ||
      data.plans.length ||
      data.journal.length
    ) {
      store.generate({ date: latest, refresh: true });
      generated = true;
    }
  }
  if (!allowNotifications) return generated;
  for (const kind of ['morning', 'evening', 'weekly'] as const) {
    const reminder = settings[kind];
    if (
      !reminder.enabled ||
      reminder.time !== time ||
      (kind === 'weekly' && parseDay(date).getDay() !== settings.weekly.day)
    )
      continue;
    const key = `${kind}:${date}:${reminder.time}`;
    if (store.db.prepare('SELECT key FROM reflection_reminder_deliveries WHERE key=?').get(key))
      continue;
    store.db
      .prepare('INSERT INTO reflection_reminder_deliveries(key,delivered_at) VALUES(?,?)')
      .run(key, now.toISOString());
    if (kind === 'weekly') store.generate({ date });
    notify(
      kind === 'morning'
        ? 'Plan your day'
        : kind === 'evening'
          ? 'Close your day'
          : 'Your weekly review',
      kind === 'morning'
        ? 'Make room for what matters in your daily plan.'
        : kind === 'evening'
          ? 'Review your priorities and leave a journal line.'
          : 'See the week’s activity and choose one change.',
    );
  }
  return generated;
}
