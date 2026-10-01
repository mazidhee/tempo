import { Link } from 'react-router-dom';
import { Archive, Pencil, Pin } from 'lucide-react';
import type { Habit, HabitLog } from '../types';
import { isDue, freezesRemaining, isPaused, periodSummary } from '../../shared/habits';
import HabitAction from './HabitAction';
export default function HabitCard({
  habit,
  logs,
  today,
  onChange,
  onEdit,
  onArchive,
}: {
  habit: Habit;
  logs: HabitLog[];
  today: string;
  onChange: () => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const due = isDue(habit, today, logs),
    week = periodSummary(habit, logs, today);
  const log = logs.find((l) => l.habit_id === habit.id && l.log_date === today);
  return (
    <article className="habit-card panel" data-habit-id={habit.id}>
      <div className="habit-card-heading">
        <div>
          <Link className="habit-name habit-title" to={`/habits/${habit.id}`}>
            {habit.name}
          </Link>
          {!!habit.non_negotiable && (
            <span className="pinned-label">
              <Pin /> Non-negotiable
            </span>
          )}
          <p className="muted small">
            {habit.description && <span className="habit-name">{habit.description} · </span>}
            {habit.scheduled_time || habit.time_of_day} ·{' '}
            {habit.schedule_type === 'weekly_target'
              ? `${week.done}+${week.frozen} / ${week.target} this week`
              : habit.habit_type || 'check'}
          </p>
        </div>
        <div className="habit-manage">
          <button className="icon-button" aria-label={`Edit habit ${habit.name}`} onClick={onEdit}>
            <Pencil />
          </button>
          <button
            className="icon-button"
            aria-label={`Archive habit ${habit.name}`}
            onClick={onArchive}
          >
            <Archive />
          </button>
        </div>
      </div>
      {due ? (
        <HabitAction habit={habit} logs={logs} date={today} today={today} onChange={onChange} />
      ) : (
        <p className="muted small">
          {isPaused(habit, today)
            ? 'Paused · a neutral day'
            : habit.schedule_type === 'weekly_target'
              ? 'Weekly quota already covered'
              : 'Not due today'}
        </p>
      )}
      <div className="habit-card-footer">
        <span className="muted small">
          {habit.freeze_cap === 0
            ? 'Strict · no freezes'
            : `${freezesRemaining(habit, logs, today)} freezes left this month`}
        </span>
        {log?.note && <span className="habit-name muted small">{log.note}</span>}
      </div>
    </article>
  );
}
