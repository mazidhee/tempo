import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Minus, Snowflake } from 'lucide-react';
import { useHabitData, habitDataChanged } from '../hooks/useHabitData';
import { weekStart, shiftDay, dateRange, dayOutcome, habitStats } from '../../shared/habits';
import { PageHeader } from '../components/ui';
import HabitAction from '../components/HabitAction';
import HabitForm from '../components/HabitForm';
import type { Habit } from '../types';
export default function Weekly() {
  const { habits, active, logs, today, mutate, error } = useHabitData();
  const [start, setStart] = useState(() => weekStart(today)),
    [form, setForm] = useState(false),
    [selected, setSelected] = useState<{ habit: Habit; date: string } | null>(null);
  const days = dateRange(start, shiftDay(start, 6));
  const labels = {
    done: 'Done',
    freeze: 'Freeze',
    not_due: 'Not due',
    paused: 'Paused',
    missed: 'Missed',
    slip: 'Slip',
    partial: 'In progress',
    pending: 'Pending',
  };
  return (
    <div className="page weekly-habits">
      <PageHeader
        eyebrow="A WEEK AT A GLANCE"
        title="Your weekly rhythm."
        description="Neutral days never count as misses. Flexible weekly quotas count completed weeks."
        action={
          <button className="btn-primary" onClick={() => setForm(true)}>
            <Plus />
            New Habit
          </button>
        }
      />
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <div className="week-toolbar">
        <button
          className="icon-button"
          aria-label="Previous week"
          onClick={() => {
            setStart(shiftDay(start, -7));
            setSelected(null);
          }}
        >
          <ChevronLeft />
        </button>
        <strong>
          {start} — {shiftDay(start, 6)}
        </strong>
        <button
          className="icon-button"
          aria-label="Next week"
          onClick={() => {
            setStart(shiftDay(start, 7));
            setSelected(null);
          }}
        >
          <ChevronRight />
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            setStart(weekStart(today));
            setSelected(null);
          }}
        >
          This week
        </button>
      </div>
      <div className="panel weekly-grid-scroll">
        <table className="habit-week-grid">
          <thead>
            <tr>
              <th scope="col">Habit</th>
              {days.map((date) => (
                <th key={date} scope="col" className={date === today ? 'today-column' : ''}>
                  {new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })}
                  <small>{date.slice(5)}</small>
                </th>
              ))}
              <th scope="col">Rate</th>
            </tr>
          </thead>
          <tbody>
            {active.map((h) => {
              const stats = habitStats(h, logs, days[6] > today ? today : days[6], start);
              return (
                <tr key={h.id}>
                  <th scope="row">
                    <Link className="habit-name" to={`/habits/${h.id}`}>
                      {h.name}
                    </Link>
                    <small>
                      {h.schedule_type === 'weekly_target'
                        ? `${h.weekly_target} / week`
                        : h.habit_type || 'check'}
                    </small>
                  </th>
                  {days.map((date) => {
                    const status = dayOutcome(h, logs, date, today);
                    return (
                      <td key={date} className={date === today ? 'today-column' : ''}>
                        <button
                          className="week-cell"
                          data-status={status}
                          aria-label={`${h.name}, ${date}: ${labels[status]}`}
                          onClick={() => setSelected({ habit: h, date })}
                        >
                          {status === 'not_due' || status === 'paused' ? (
                            <Minus />
                          ) : (
                            <i className={`status-dot ${status}`} />
                          )}
                        </button>
                      </td>
                    );
                  })}
                  <td>
                    <strong>{stats.rate}%</strong>
                    <small>
                      {stats.done}/{stats.possible}
                    </small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!active.length && (
          <p className="muted section-empty">Create your first habit to see it here.</p>
        )}
      </div>
      <div className="week-legend">
        <span>
          <i className="status-dot done" />
          Done
        </span>
        <span>
          <i className="status-dot missed" />
          Missed
        </span>
        <span>
          <i className="status-dot freeze" />
          Freeze
        </span>
        <span>
          <Minus />
          Not due / paused
        </span>
        <span>
          <i className="status-dot pending" />
          Pending
        </span>
      </div>
      {selected && (
        <section className="panel week-selection">
          <div className="section-heading">
            <h2>
              <span className="habit-name">{selected.habit.name}</span> · {selected.date}
            </h2>
            <Link className="text-link" to={`/habits/${selected.habit.id}`}>
              Habit details
            </Link>
          </div>
          {['not_due', 'paused'].includes(
            dayOutcome(selected.habit, logs, selected.date, today),
          ) ? (
            <p className="muted">This is a neutral day. No check-in is required.</p>
          ) : (
            <HabitAction
              habit={habits.find((h) => h.id === selected.habit.id) || selected.habit}
              logs={logs}
              date={selected.date}
              today={today}
              onChange={habitDataChanged}
            />
          )}
        </section>
      )}
      <p className="muted small">
        <Snowflake /> Freeze-covered occurrences protect streaks and are excluded from rates.
        Weekly-target unused opportunities are neutral; only an unmet week ending is a miss.
      </p>
      {form && (
        <HabitForm
          habits={habits}
          onClose={() => setForm(false)}
          onSave={async (data) => {
            await mutate(() => window.habitAPI.addHabit(data));
            setForm(false);
          }}
        />
      )}
    </div>
  );
}
