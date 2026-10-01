import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Snowflake, CalendarDays } from 'lucide-react';
import { useHabitData, habitDataChanged } from '../hooks/useHabitData';
import {
  habitStats,
  habitYear,
  freezesUsed,
  freezesRemaining,
  pauseDaysUsed,
  isDue,
  dayOutcome,
  shiftDay,
  canFreeze,
} from '../../shared/habits';
import Heatmap from '../components/Heatmap';
import HabitAction from '../components/HabitAction';
import HabitForm from '../components/HabitForm';
import { PageHeader } from '../components/ui';
export default function HabitDetail() {
  const { id } = useParams(),
    { habits, logs, today, mutate, loading, error } = useHabitData();
  const habit = habits.find((h) => h.id === Number(id));
  const [editing, setEditing] = useState(false),
    [pauseStart, setPauseStart] = useState(today),
    [pauseEnd, setPauseEnd] = useState(today),
    [reason, setReason] = useState('Vacation'),
    [actionError, setActionError] = useState('');
  const analysis = useMemo(
    () =>
      habit
        ? {
            stats: habitStats(habit, logs, today),
            year: habitYear(habit, logs, today),
            history: logs
              .filter((l) => l.habit_id === habit.id)
              .sort((a, b) => b.log_date.localeCompare(a.log_date)),
          }
        : null,
    [habit, logs, today],
  );
  if (loading) return <div className="empty">Opening habit…</div>;
  if (!habit)
    return (
      <div className="empty">
        <h2>Habit not found</h2>
        <Link to="/habits">Back to habits</Link>
      </div>
    );
  const { stats, history, year } = analysis!;
  const missed = history.filter((l) => l.missed_reason || l.slip_reason || l.freeze_reason);
  const recover = [1, 2, 3]
    .map((n) => shiftDay(today, -n))
    .filter(
      (date) => dayOutcome(habit, logs, date, today) === 'missed' && canFreeze(habit, logs, date),
    );
  const act = async (work: () => Promise<unknown>) => {
    setActionError('');
    try {
      await mutate(work);
    } catch (e) {
      setActionError((e as Error).message);
    }
  };
  return (
    <div className="page habit-detail">
      <Link className="text-link" to="/habits">
        <ArrowLeft />
        All habits
      </Link>
      <PageHeader
        eyebrow="ONE HABIT, OVER TIME"
        title={habit.name}
        description={habit.description || 'A little progress, one due occurrence at a time.'}
        action={
          <button className="btn-secondary" onClick={() => setEditing(true)}>
            <Pencil />
            Edit habit & schedule
          </button>
        }
      />
      {(error || actionError) && (
        <p className="inline-error" role="alert">
          {error || actionError}
        </p>
      )}
      <div className="habit-detail-stats">
        {[
          ['Current streak', stats.current],
          ['Longest streak', stats.longest],
          ['Completion rate', stats.rate + '%'],
          ['Freezes this month', `${freezesUsed(habit, logs, today)} / ${habit.freeze_cap ?? 3}`],
        ].map(([label, value]) => (
          <div className="summary-card" key={label}>
            <span className="summary-label">{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className="muted small">
        Streak unit:{' '}
        {habit.schedule_type === 'weekly_target' ? 'qualifying weeks' : 'due occurrences'} ·{' '}
        {stats.done}/{stats.possible} completions · {freezesRemaining(habit, logs, today)} freezes
        remaining
      </p>
      <section className="panel">
        <h2>Today</h2>
        {isDue(habit, today, logs) ? (
          <HabitAction
            habit={habit}
            logs={logs}
            date={today}
            today={today}
            onChange={habitDataChanged}
          />
        ) : (
          <p className="muted">Not due today · a neutral day.</p>
        )}
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Your year</h2>
          <span className="muted small">
            {habit.habit_type === 'quantity'
              ? 'Shade follows % of quantity target'
              : 'Due occurrences only'}
          </span>
        </div>
        <Heatmap details={year} end={today} label="Habit detail activity" />
      </section>
      {!!recover.length && (
        <section className="panel">
          <h2>Recover a recent miss</h2>
          {recover.map((date) => (
            <div className="recovery-row" key={date}>
              <span>{date}</span>
              <HabitAction
                compact
                habit={habit}
                logs={logs}
                date={date}
                today={today}
                onChange={habitDataChanged}
              />
            </div>
          ))}
        </section>
      )}
      <section className="panel pause-manager">
        <div className="section-heading">
          <h2>
            <CalendarDays />
            Pause ranges
          </h2>
          <span className="muted small">
            {pauseDaysUsed(habit, today.slice(0, 4))} / {habit.pause_cap ?? 14} days used in{' '}
            {today.slice(0, 4)}
          </span>
        </div>
        <p className="muted">
          Prospective vacation days are neutral. Inclusive dates use a separate yearly budget. Past
          ranges stay locked.
        </p>
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            void act(() =>
              window.habitAPI.addPause({
                habitId: habit.id,
                start_date: pauseStart,
                end_date: pauseEnd,
                reason,
              }),
            );
          }}
        >
          <div className="form-grid">
            <label>
              Pause from
              <input
                className="input"
                aria-label="Pause from"
                type="date"
                min={today}
                required
                value={pauseStart}
                onChange={(e) => setPauseStart(e.target.value)}
              />
            </label>
            <label>
              Pause to
              <input
                className="input"
                aria-label="Pause to"
                type="date"
                min={pauseStart}
                required
                value={pauseEnd}
                onChange={(e) => setPauseEnd(e.target.value)}
              />
            </label>
          </div>
          <label>
            Pause reason
            <input
              className="input habit-name"
              aria-label="Pause reason"
              required
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button className="btn-secondary">Add pause range</button>
        </form>
        {habit.pauses?.map((p) => (
          <div className="compact-row" key={p.id}>
            <span>
              {p.start_date} — {p.end_date}
              <small className="habit-name muted">{p.reason}</small>
            </span>
            {p.start_date >= today && (
              <button
                className="btn-ghost"
                onClick={() => act(() => window.habitAPI.removePause(p.id!))}
              >
                Remove pause
              </button>
            )}
          </div>
        ))}
      </section>
      <section className="panel">
        <h2>Missed reasons & protection</h2>
        {missed.length ? (
          missed.map((l) => (
            <div className="compact-row" key={l.id}>
              <strong>{l.log_date}</strong>
              <span className="habit-name muted">
                {l.outcome === 'freeze'
                  ? `${l.freeze_reason}: ${l.freeze_note || 'Freeze'}`
                  : l.slip_reason || l.missed_reason}
              </span>
              {l.outcome === 'freeze' && <Snowflake />}
            </div>
          ))
        ) : (
          <p className="muted">
            No reasons recorded yet. Missed reasons can still be added in History.
          </p>
        )}
      </section>
      {editing && (
        <HabitForm
          habit={habit}
          habits={habits}
          onClose={() => setEditing(false)}
          onSave={async (data) => {
            await mutate(() => window.habitAPI.editHabit({ ...data, id: habit.id }));
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
