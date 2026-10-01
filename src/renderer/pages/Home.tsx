import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, CircleCheck, ListTodo, Timer, ArrowRight, Sprout } from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { useMinuteClock } from '../hooks/useClock';
import { useHabitData, habitDataChanged } from '../hooks/useHabitData';
import HabitAction from '../components/HabitAction';
import {
  localDate,
  newTimer,
  focusRequest,
  type Link as FocusLink,
} from '../../shared/productivity';
import { isDue, isComplete, logFor, collectiveYear } from '../../shared/habits';
import Heatmap from '../components/Heatmap';
import { PageHeader, durationLabel } from '../components/ui';
export default function Home() {
  const { state, update } = useProductivity();
  const now = useMinuteClock();
  const { active: habits, habits: allHabits, logs } = useHabitData();
  const navigate = useNavigate();
  const today = localDate(new Date(now));
  const details = useMemo(() => collectiveYear(allHabits, logs, today), [allHabits, logs, today]);
  const hour = new Date(now).getHours();
  const slot =
    hour < 5
      ? 'night'
      : hour < 12
        ? 'morning'
        : hour < 17
          ? 'afternoon'
          : hour < 21
            ? 'evening'
            : 'night';
  const variant = useState(() => Math.random() < 0.25)[0];
  const greeting = variant
    ? {
        morning: 'A fresh start',
        afternoon: 'Make room for progress',
        evening: 'A moment to reflect',
        night: 'Slow down, settle in',
      }[slot]
    : `Good ${slot}`;
  const due = state.tasks.filter((t) => !t.completedAt && t.due && t.due <= today);
  const todaysHabits = habits.filter((h) => isDue(h, today, logs));
  const dueHabits = todaysHabits.filter((h) => logFor(logs, h, today)?.outcome !== 'freeze');
  const done = dueHabits.filter((h) => isComplete(h, logFor(logs, h, today))).length;
  const focus = state.sessions
    .filter((s) => s.phase === 'focus' && s.date === today)
    .reduce((n, s) => n + s.duration, 0);
  const startFocus = (link?: FocusLink) => {
    const action = focusRequest(state.timer, link);
    if (action === 'resume') {
      navigate('/focus');
      return;
    }
    if (
      action === 'confirm' &&
      !window.confirm('Replace the current focus session? Unfinished time will not be logged.')
    )
      return;
    update((s) => ({
      ...s,
      timer: newTimer(
        s.presets.find((p) => p.id === s.timer.presetId)!,
        'focus',
        s.timer.completed,
        link || null,
      ),
    }));
    navigate('/focus');
  };
  return (
    <div className="page home-page">
      <PageHeader
        eyebrow="A LITTLE BETTER, EVERY DAY"
        title={`${greeting}${state.settings.name ? `, ${state.settings.name}` : ''}.`}
        description="Small steps. Clear intentions. A space to make them happen."
        action={
          <button className="btn-primary" onClick={() => startFocus()}>
            <Timer />
            Start focusing
          </button>
        }
      />
      <section className="panel activity-panel">
        <div className="section-heading">
          <div>
            <h2>Your year, one day at a time</h2>
            <p className="muted">Every square is a small step forward.</p>
          </div>
          <Link className="text-link" to="/statistics">
            View insights
            <ArrowUpRight />
          </Link>
        </div>
        <Heatmap details={details} end={today} />
      </section>
      <div className="section-heading today-heading">
        <h2>Today at a glance</h2>
        <span className="muted">
          {new Date(now).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>
      <div className="summary-grid">
        <Link to="/habits" className="summary-card">
          <span className="summary-label">
            <CircleCheck />
            Habits
          </span>
          <strong>
            {done}
            <span> / {dueHabits.length}</span>
          </strong>
          <p className="muted">
            {todaysHabits.length ? 'little commitments kept' : 'Create your first small commitment'}
          </p>
          <div className="progress-track">
            <i
              style={{
                width: `${todaysHabits.length ? (done / Math.max(1, dueHabits.length)) * 100 : 0}%`,
              }}
            />
          </div>
        </Link>
        <Link to="/tasks" className="summary-card">
          <span className="summary-label">
            <ListTodo />
            Tasks due
          </span>
          <strong>
            {due.length}
            <span> to do</span>
          </strong>
          <p className="muted">
            {due.filter((t) => t.due < today).length
              ? `${due.filter((t) => t.due < today).length} carried over from earlier`
              : 'A clear view of what matters today'}
          </p>
          <span className="text-link">
            Open tasks
            <ArrowRight />
          </span>
        </Link>
        <Link to="/focus" className="summary-card">
          <span className="summary-label">
            <Timer />
            Focus time
          </span>
          <strong>
            {Math.floor(focus / 60)}
            <span> min</span>
          </strong>
          <p className="muted">
            {state.sessions.filter((s) => s.phase === 'focus' && s.date === today).length} sessions
            of uninterrupted attention
          </p>
          <span className="text-link">
            Find your flow
            <ArrowRight />
          </span>
        </Link>
      </div>
      <div className="home-lower">
        <section className="panel">
          <div className="section-heading">
            <h2>Your daily rhythm</h2>
            <Link className="text-link" to="/habits">
              All habits
              <ArrowUpRight />
            </Link>
          </div>
          {todaysHabits.length ? (
            todaysHabits.slice(0, 5).map((h) => {
              return (
                <div className="compact-row home-habit-row" key={h.id}>
                  <div className="row-title">
                    <Link className="habit-name" to={`/habits/${h.id}`}>
                      <strong>{h.name}</strong>
                    </Link>
                    <span className="muted">{h.scheduled_time || h.time_of_day}</span>
                  </div>
                  <HabitAction
                    compact
                    habit={h}
                    logs={logs}
                    date={today}
                    today={today}
                    onChange={habitDataChanged}
                  />
                  <button
                    className="icon-button"
                    aria-label={`Focus on ${h.name}`}
                    onClick={() => startFocus({ type: 'habit', id: String(h.id), name: h.name })}
                  >
                    <Timer />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="gentle-empty">
              <Sprout />
              <h3>Good things start small.</h3>
              <p className="muted">Add a habit you want to make space for.</p>
              <Link className="text-link" to="/habits">
                Create a habit
                <ArrowRight />
              </Link>
            </div>
          )}
        </section>
        <section className="panel focus-invitation">
          <div className="focus-symbol">
            <Timer />
          </div>
          <span className="eyebrow">A MOMENT OF CLARITY</span>
          <h2>
            One thing.
            <br />
            Your full attention.
          </h2>
          <p className="muted">
            Choose a task, put distractions aside,
            <br className="desktop-only" /> and let the next few minutes be yours.
          </p>
          <button className="btn-secondary" onClick={() => startFocus()}>
            Begin a focus session
            <ArrowRight />
          </button>
          <span className="muted small">
            {state.presets.find((p) => p.id === state.timer.presetId)?.name} ·{' '}
            {durationLabel(state.presets.find((p) => p.id === state.timer.presetId)!.focus)}
          </span>
        </section>
      </div>
    </div>
  );
}
