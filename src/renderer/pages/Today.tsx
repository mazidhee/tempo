import { usePrivacy } from '../hooks/PrivacyContext';
import { useEffect, useState } from 'react';
import { Plus, ChevronDown, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { useHabitData, habitDataChanged } from '../hooks/useHabitData';
import {
  isDue,
  isComplete,
  logFor,
  orderHabits,
  canFreeze,
  dayOutcome,
  shiftDay,
} from '../../shared/habits';
import HabitCard from '../components/HabitCard';
import HabitForm from '../components/HabitForm';
import HabitAction from '../components/HabitAction';
import { PageHeader } from '../components/ui';
import type { Habit } from '../types';
export default function Today() {
  const privacy = usePrivacy();
  const { active, archived, habits, logs, today, now, mutate, error } = useHabitData();
  const hour = new Date(now).getHours(),
    period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'anytime';
  const [expanded, setExpanded] = useState<string[]>([period, 'anytime']);
  useEffect(() => setExpanded((x) => [...new Set([...x, period])]), [period]);
  const [showAll, setAll] = useState(false),
    [showArchived, setArchived] = useState(false),
    [showForm, setForm] = useState(false),
    [editing, setEditing] = useState<Habit | null>(null),
    [actionError, setActionError] = useState('');
  const due = active.filter((h) => isDue(h, today, logs)),
    pinned = due.filter((h) => h.non_negotiable && logFor(logs, h, today)?.outcome !== 'freeze');
  const done = pinned.filter((h) => isComplete(h, logFor(logs, h, today))).length;
  const displayed = showAll ? active : due;
  const recovery = active.flatMap((h) =>
    [1, 2, 3]
      .map((n) => shiftDay(today, -n))
      .filter(
        (date) =>
          dayOutcome(h, logs, date, today) === 'missed' && canFreeze(h, logs, date, new Date(now)),
      )
      .map((date) => ({ habit: h, date })),
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
    <div className="page habit-checkin">
      <PageHeader
        title="Small commitments, kept."
        description={new Date(now).toLocaleDateString(undefined, { dateStyle: 'full' })}
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setForm(true);
            }}
          >
            <Plus />
            New Habit
          </button>
        }
      />
      {(error || actionError) && (
        <p className="inline-error" role="alert">
          {error || actionError}
        </p>
      )}
      <section className="panel non-negotiable-summary">
        <div className="section-heading">
          <h2>
            Non-negotiables {done}/{pinned.length}
          </h2>
          <span className="muted small">
            {due.filter((h) => isComplete(h, logFor(logs, h, today))).length}/
            {due.filter((h) => logFor(logs, h, today)?.outcome !== 'freeze').length} due habits done
          </span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Non-negotiables"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={Math.max(1, pinned.length)}
        >
          <i style={{ width: `${pinned.length ? (done / pinned.length) * 100 : 0}%` }} />
        </div>
      </section>
      {!!recovery.length && (
        <section className="panel recovery-panel">
          <h2>A little room for recovery</h2>
          <p className="muted">
            These missed occurrences are within 48 hours of their day ending. A freeze protects the
            streak, without counting as done.
          </p>
          {recovery.map(({ habit, date }) => (
            <div className="recovery-row" key={habit.id + date}>
              <span>
                <strong className="habit-name">{habit.name}</strong>
                <small className="muted">
                  {date} · budget charged to {date.slice(0, 7)}
                </small>
              </span>
              <HabitAction
                compact
                habit={habit}
                date={date}
                today={today}
                logs={logs}
                onChange={habitDataChanged}
              />
            </div>
          ))}
        </section>
      )}
      <div className="tabs">
        <button className={!showAll ? 'selected' : ''} onClick={() => setAll(false)}>
          Scheduled today
        </button>
        <button className={showAll ? 'selected' : ''} onClick={() => setAll(true)}>
          All habits
        </button>
      </div>
      {!active.length && (
        <div className="gentle-empty">
          <h2>A rhythm starts with one habit.</h2>
          <p className="muted">Create a check, quantity, or avoid habit.</p>
          <button className="btn-primary" onClick={() => setForm(true)}>
            Create your first habit
          </button>
        </div>
      )}
      {['morning', 'afternoon', 'evening', 'anytime'].map((section) => {
        const items = orderHabits(displayed.filter((h) => h.time_of_day === section));
        const open = expanded.includes(section);
        return (
          <section className="habit-section" key={section}>
            <button
              className="habit-section-toggle"
              aria-expanded={open}
              aria-controls={`section-${section}`}
              onClick={() =>
                setExpanded((x) => (open ? x.filter((s) => s !== section) : [...x, section]))
              }
            >
              <span>
                {section[0].toUpperCase() + section.slice(1)}
                <small>{items.length} habits</small>
              </span>
              <ChevronDown className={open ? 'rotated' : ''} />
            </button>
            <div id={`section-${section}`} hidden={!open}>
              {items.length ? (
                items.map((h) => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    logs={logs}
                    today={today}
                    onChange={habitDataChanged}
                    onEdit={() => {
                      setEditing(h);
                      setForm(true);
                    }}
                    onArchive={() => act(() => window.habitAPI.archiveHabit(h.id))}
                  />
                ))
              ) : (
                <p className="muted section-empty">
                  Nothing scheduled here. A little breathing room.
                </p>
              )}
            </div>
          </section>
        );
      })}
      {!!archived.length && (
        <section className="archived-section">
          <button className="btn-ghost" onClick={() => setArchived((x) => !x)}>
            <Archive />
            {showArchived ? 'Hide' : 'Show'} Archived ({archived.length})
          </button>
          {showArchived &&
            archived.map((h) => (
              <div className="compact-row" key={h.id}>
                <strong className="habit-name row-title">{h.name}</strong>
                <button
                  className="btn-secondary"
                  onClick={() => act(() => window.habitAPI.restoreHabit(h.id))}
                >
                  <RotateCcw />
                  Restore
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Permanently delete "${privacy ? 'Private habit' : h.name}" and all its history? This cannot be undone.`,
                      )
                    )
                      void act(() => window.habitAPI.deleteHabit(h.id));
                  }}
                >
                  <Trash2 />
                  Delete
                </button>
              </div>
            ))}
        </section>
      )}
      {showForm && (
        <HabitForm
          habit={editing}
          habits={habits}
          onClose={() => setForm(false)}
          onSave={async (data) => {
            await mutate(() =>
              data.id
                ? window.habitAPI.editHabit({ ...data, id: data.id })
                : window.habitAPI.addHabit(data),
            );
            setForm(false);
          }}
        />
      )}
    </div>
  );
}
