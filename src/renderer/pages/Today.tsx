import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Archive, RotateCcw, Search } from 'lucide-react';
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
import DeleteHabitButton from '../components/DeleteHabitButton';
import '../styles/habit-daily.css';
import '../styles/approved-workspace.css';
import HabitCard from '../components/HabitCard';
import HabitForm from '../components/HabitForm';
import HabitAction from '../components/HabitAction';
import { PageHeader } from '../components/ui';
import type { Habit } from '../types';
export default function Today() {
  const [params] = useSearchParams();
  const { active, archived, habits, logs, today, now, mutate, error } = useHabitData();
  const [showAll, setAll] = useState(true),
    [showArchived, setArchived] = useState(false),
    [showForm, setForm] = useState(false),
    [editing, setEditing] = useState<Habit | null>(null),
    [actionError, setActionError] = useState(''),
    [query, setQuery] = useState('');
  const due = active.filter((h) => isDue(h, today, logs)),
    pinned = due.filter((h) => h.non_negotiable && logFor(logs, h, today)?.outcome !== 'freeze');
  const done = pinned.filter((h) => isComplete(h, logFor(logs, h, today))).length;
  const displayed = (showAll ? active : due).filter((h) =>
    h.name.toLowerCase().includes(query.toLowerCase()),
  );
  const recovering = params.get('recovery') === '1';
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
        title={recovering ? 'Recovery' : 'Habits'}
        description={new Date(now).toLocaleDateString(undefined, { dateStyle: 'full' })}
        action={
          <button
            className="btn-ghost"
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
      {recovering ? (
        <section className="habit-recovery-canvas" aria-label="Recover missed habits">
          <Link className="btn-ghost" to="/habits">
            Back to habits
          </Link>
          {!recovery.length && <p className="workspace-empty">No eligible days to recover</p>}
          {recovery
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(({ habit, date }) => (
              <div className="recovery-row" key={habit.id + date}>
                <time dateTime={date}>
                  {new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
                <Link className="habit-name" to={'/habits/' + habit.id}>
                  {habit.name}
                </Link>
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
      ) : (
        <>
          <div className="workspace-toolbar">
            <label className="workspace-search">
              <Search aria-hidden="true" />
              <input
                type="search"
                aria-label="Search habits"
                placeholder="Search habits"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="Habit visibility"
              value={showAll ? 'all' : 'due'}
              onChange={(e) => setAll(e.target.value === 'all')}
            >
              <option value="all">All habits</option>
              <option value="due">Due today</option>
            </select>
            <Link className="btn-ghost" to="/habits?recovery=1">
              Recovery{recovery.length ? ` · ${recovery.length}` : ''}
            </Link>
            <span className="muted small">
              {due.filter((h) => isComplete(h, logFor(logs, h, today))).length}/{due.length} done
              {pinned.length ? ` · ${done}/${pinned.length} essential` : ''}
            </span>
          </div>
          <section className="habit-direct-list" aria-label="Habits">
            {orderHabits(displayed).map((h) => (
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
            ))}
            {!displayed.length && (
              <p className="workspace-empty">
                {active.length ? 'No matching habits' : 'No habits yet'}
              </p>
            )}
          </section>
        </>
      )}
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
                <DeleteHabitButton id={h.id} name={h.name} />
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
