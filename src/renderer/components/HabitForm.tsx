import { usePrivacy } from '../hooks/PrivacyContext';
import { useState, type FormEvent } from 'react';
import { Modal } from './ui';
import { localDate } from '../../shared/productivity';
import { normalizeHabit, type HabitInput } from '../../shared/habitValidation';
import type { Habit } from '../types';
const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export default function HabitForm({
  habit,
  onSave,
  onClose,
  habits = [],
}: {
  habit?: Habit | null;
  onSave: (data: HabitInput & { id?: number }) => Promise<void> | void;
  onClose: () => void;
  habits?: Habit[];
}) {
  const privacy = usePrivacy();
  const [data, setData] = useState<HabitInput>({
    name: habit?.name || '',
    description: habit?.description || '',
    frequency: habit?.frequency || 'daily',
    time_of_day: habit?.time_of_day || 'anytime',
    days_of_week: habit?.days_of_week || days.join(','),
    scheduled_time: habit?.scheduled_time || '',
    habit_type: habit?.habit_type || 'check',
    schedule_type: habit?.schedule_type || 'daily',
    quantity_target: habit?.quantity_target ?? 2000,
    quantity_unit: habit?.quantity_unit || 'ml',
    completion_threshold: habit?.completion_threshold ?? 100,
    weekly_target: habit?.weekly_target ?? 3,
    interval_days: habit?.interval_days ?? 2,
    start_date: habit?.start_date || localDate(),
    week_start: habit?.week_start ?? 1,
    freeze_cap: habit?.freeze_cap ?? 3,
    pause_cap: habit?.pause_cap ?? 14,
    non_negotiable: habit?.non_negotiable || 0,
    after_habit_id: habit?.after_habit_id || null,
  });
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const set = (patch: Partial<HabitInput>) => setData((d) => ({ ...d, ...patch }));
  const number = (key: keyof HabitInput, label: string, min: number, max?: number, step = '1') => (
    <label>
      {label}
      <input
        className="input"
        aria-label={label}
        type="number"
        min={min}
        max={max}
        step={step}
        required
        value={String(data[key] ?? '')}
        onChange={(e) => set({ [key]: Number(e.target.value) })}
      />
    </label>
  );
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const normalized = normalizeHabit(data);
      await onSave({ ...normalized, ...(habit ? { id: habit.id } : {}) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={habit ? 'Edit Habit' : 'New Habit'} onClose={onClose}>
      <form className="form-stack habit-form" onSubmit={submit}>
        <label>
          Name
          <input
            className="input"
            aria-label="Name"
            required
            maxLength={200}
            value={data.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </label>
        <label>
          Description
          <input
            className="input"
            aria-label="Description"
            maxLength={500}
            value={data.description || ''}
            onChange={(e) => set({ description: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Habit type
            <select
              className="select"
              aria-label="Habit type"
              value={data.habit_type}
              onChange={(e) => set({ habit_type: e.target.value as Habit['habit_type'] })}
            >
              <option value="check">Check — done / not done</option>
              <option value="quantity">Quantity — build toward a target</option>
              <option value="avoid">Avoid — stay clean</option>
            </select>
          </label>
          <label>
            Time of day
            <select
              className="select"
              aria-label="Time of day"
              value={data.time_of_day}
              onChange={(e) => set({ time_of_day: e.target.value, after_habit_id: null })}
            >
              {['morning', 'afternoon', 'evening', 'anytime'].map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {data.habit_type === 'quantity' && (
          <div className="form-grid quantity-fields">
            {number('quantity_target', 'Target', 0.000001, undefined, 'any')}
            <label>
              Unit
              <input
                className="input"
                aria-label="Unit"
                required
                maxLength={30}
                value={data.quantity_unit}
                onChange={(e) => set({ quantity_unit: e.target.value })}
              />
            </label>
            {number('completion_threshold', 'Completion threshold (%)', 0.000001, 100, 'any')}
          </div>
        )}
        {data.habit_type === 'avoid' && (
          <p className="muted">
            Confirm Stayed clean when your day is finished. A slip records a reason and breaks the
            clean streak.
          </p>
        )}
        <div className="form-grid">
          <label>
            Schedule
            <select
              className="select"
              aria-label="Schedule"
              value={data.schedule_type}
              onChange={(e) => set({ schedule_type: e.target.value as Habit['schedule_type'] })}
            >
              <option value="daily">Daily</option>
              <option value="weekdays">Selected weekdays</option>
              <option value="weekly_target">N times per week · any days</option>
              <option value="interval">Every K days</option>
            </select>
          </label>
          <label>
            {data.schedule_type === 'interval' ? 'Anchor / start date' : 'Start date'}
            <input
              className="input"
              aria-label="Start date"
              type="date"
              required
              value={data.start_date}
              onChange={(e) => set({ start_date: e.target.value })}
            />
          </label>
        </div>
        {data.schedule_type === 'weekdays' && (
          <fieldset>
            <legend>Due weekdays</legend>
            <div className="weekday-picker">
              {days.map((d) => (
                <button
                  type="button"
                  key={d}
                  aria-pressed={data.days_of_week?.split(',').includes(d)}
                  className={data.days_of_week?.split(',').includes(d) ? 'selected' : ''}
                  onClick={() => {
                    const selected = data.days_of_week!.split(',');
                    const next = selected.includes(d)
                      ? selected.filter((x) => x !== d)
                      : [...selected, d];
                    if (next.length)
                      set({ days_of_week: days.filter((x) => next.includes(x)).join(',') });
                  }}
                >
                  {d[0].toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {data.schedule_type === 'weekly_target' && (
          <div className="form-grid">
            {number('weekly_target', 'Times per week', 1, 7)}
            <label>
              Week starts
              <select
                className="select"
                aria-label="Week starts"
                value={data.week_start}
                onChange={(e) => set({ week_start: Number(e.target.value) })}
              >
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                  (d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
        )}
        {data.schedule_type === 'interval' && number('interval_days', 'Every K days', 1, 3650)}
        <div className="form-grid">
          <label>
            Scheduled time (optional)
            <input
              className="input"
              aria-label="Scheduled time"
              type="time"
              value={data.scheduled_time || ''}
              onChange={(e) => set({ scheduled_time: e.target.value })}
            />
          </label>
          <label>
            After habit (optional)
            <select
              className="select"
              aria-label="After habit"
              value={data.after_habit_id || ''}
              onChange={(e) =>
                set({ after_habit_id: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="">No anchor</option>
              {habits
                .filter(
                  (h) => h.id !== habit?.id && h.time_of_day === data.time_of_day && !h.is_archived,
                )
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {privacy ? `Private habit ${h.id}` : h.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <label className="switch-line">
          <input
            type="checkbox"
            checked={!!data.non_negotiable}
            onChange={(e) => set({ non_negotiable: e.target.checked ? 1 : 0 })}
          />
          Non-negotiable · pin first in its section
        </label>
        <details className="habit-limits" open>
          <summary>Streak protection</summary>
          <div className="form-grid">
            {number('freeze_cap', 'Freezes per calendar month', 0, 31)}
            {number('pause_cap', 'Pause days per calendar year', 0, 366)}
          </div>
          <p className="muted small">
            0 means strict. Freezes keep a streak alive without increasing its length. Pause ranges
            are managed in habit details.
          </p>
        </details>
        {error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? 'Saving…' : habit ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
