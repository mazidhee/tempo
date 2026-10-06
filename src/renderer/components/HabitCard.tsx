import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { Archive, Pencil, Pin, Ellipsis, Trash2 } from 'lucide-react';
import type { Habit, HabitLog } from '../types';
import { isDue, freezesRemaining, isPaused, periodSummary } from '../../shared/habits';
import HabitAction from './HabitAction';
import DeleteHabitButton from './DeleteHabitButton';
import HabitStreak from './HabitStreak';
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
    <article className="habit-card habit-daily-row" data-habit-id={habit.id}>
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
            {habit.scheduled_time || habit.time_of_day} ·{' '}
            {habit.schedule_type === 'weekly_target'
              ? `${week.done}+${week.frozen} / ${week.target} this week`
              : habit.habit_type || 'check'}
          </p>
        </div>
        <div className="habit-manage">
          <DeleteHabitButton id={habit.id} name={habit.name} renderTrigger={open=><DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="icon-button" aria-label="Habit options">
                <Ellipsis />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>{habit.freeze_cap===0 ? 'Strict · no freezes' : `${freezesRemaining(habit,logs,today)} freezes left this month`}</DropdownMenuItem>
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil />
                Edit habit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onArchive}>
                <Archive />
                Archive habit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={open}><Trash2 />Delete habit…</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>} />
        </div>
      </div>
      <HabitStreak habit={habit} logs={logs} today={today} />
      {due ? (
        <HabitAction habit={habit} logs={logs} date={today} today={today} onChange={onChange} />
      ) : (
        <p className="muted small habit-neutral">
          {isPaused(habit, today)
            ? 'Paused · a neutral day'
            : habit.schedule_type === 'weekly_target'
              ? 'Weekly quota already covered'
              : 'Not due today'}
        </p>
      )}
      {log?.note && <div className="habit-card-footer"><span className="habit-name muted small">{log.note}</span></div>}
    </article>
  );
}
