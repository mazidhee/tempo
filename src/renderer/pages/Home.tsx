import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  CircleCheck,
  ListTodo,
  Timer,
  ArrowRight,
  Sprout,
  BookOpen,
} from 'lucide-react';
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
import { HomeWidgets, homeWidgets, type HomeSlot } from '../registry/home';
import { PageHeader, durationLabel } from '../components/ui';
import { useReflection } from '../modules/reflection/useReflection';
import { greetingFor } from '../../shared/greetings';
import ContinueStudy from '../components/ContinueStudy';
export default function Home({ journal: suppliedJournal }: { journal?: Record<string, string> }) {
  const { state, update } = useProductivity();
  const { snapshot } = useReflection();
  const journal = useMemo(
    () =>
      suppliedJournal ?? Object.fromEntries((snapshot?.journal ?? []).map((j) => [j.date, j.text])),
    [snapshot?.journal, suppliedJournal],
  );
  const now = useMinuteClock();
  const { active: habits, habits: allHabits, logs } = useHabitData();
  const navigate = useNavigate();
  const today = localDate(new Date(now));
  const details = useMemo(() => collectiveYear(allHabits, logs, today), [allHabits, logs, today]);
  const hour = new Date(now).getHours();
  const greetingSeed = useState(() => Math.random())[0];
  const greeting = greetingFor(
    hour,
    state.settings.name,
    greetingSeed,
    state.settings.greetingStyle === 'simple',
  );
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
      !window.confirm(
        state.timer.stopwatch
          ? 'Save the current tracked time and switch focus?'
          : 'Replace the current focus session? Unfinished time will not be logged.',
      )
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
        title={greeting.title}
        description={greeting.detail}
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
            <h2>Your year</h2>
            <p className="muted">Due habits, completions and protected days.</p>
          </div>
          <Link className="text-link" to="/statistics">
            View insights
            <ArrowUpRight />
          </Link>
        </div>
        <Heatmap details={details} end={today} journal={journal} />
      </section>
      <ContinueStudy />
      <Link className="home-guide-link" to="/settings?section=guide">
        <BookOpen />
        New here? Open the getting-started guide
      </Link>
      <div className="home-widget-grid">
        {(['today-plan', 'goals', 'reviews-due'] as HomeSlot[]).map((slot) => (
          <div key={slot} data-home-slot={slot}>
            {homeWidgets.some((widget) => widget.slot === slot) ? (
              <HomeWidgets slot={slot} />
            ) : (
              <section className="panel widget-placeholder">
                <h2>
                  {
                    { 'today-plan': 'Today’s plan', goals: 'Goals', 'reviews-due': 'Reviews due' }[
                      slot
                    ]
                  }
                </h2>
                <p className="muted">
                  {
                    {
                      'today-plan': 'Choose up to three priorities for today.',
                      goals: 'Track a goal alongside your daily work.',
                      'reviews-due': 'Your study reviews and weekly reflection appear here.',
                    }[slot]
                  }
                </p>
              </section>
            )}
          </div>
        ))}
      </div>
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
        <section className="panel">
          <div className="section-heading">
            <h2>Focus</h2>
            <Timer />
          </div>
          <p className="muted">
            {state.presets.find((p) => p.id === state.timer.presetId)?.name} ·{' '}
            {durationLabel(state.presets.find((p) => p.id === state.timer.presetId)!.focus)}
          </p>
          <button className="btn-secondary" onClick={() => startFocus()}>
            Begin a focus session
            <ArrowRight />
          </button>
        </section>
      </div>
    </div>
  );
}
