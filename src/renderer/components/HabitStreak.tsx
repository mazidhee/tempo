import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { habitStats, dayOutcome, shiftDay } from '../../shared/habits';
import type { Habit, HabitLog } from '../types';

export default function HabitStreak({ habit, logs, today }: { habit: Habit; logs: HabitLog[]; today: string }) {
  const stats = useMemo(() => habitStats(habit, logs, today), [habit, logs, today]);
  const previous = useRef(stats.current);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    const increased = stats.current > previous.current;
    previous.current = stats.current;
    if (!increased) { setCelebrate(false); return; }
    setCelebrate(true);
    const timer = setTimeout(() => setCelebrate(false), 420);
    return () => clearTimeout(timer);
  }, [stats.current]);
  const unit = habit.schedule_type === 'weekly_target' ? 'weeks' : 'due occurrences';
  return <Link to={`/habits/${habit.id}`} className={`habit-streak${celebrate ? ' streak-checkin' : ''}`}
    aria-label={`${habit.name}: current streak ${stats.current} ${unit}, longest ${stats.longest}`}>
    <span className="streak-count"><svg viewBox="0 0 28 36" fill="none" aria-hidden="true">
      <path d="M15 2c2 8-3 9-1 15 2-1 4-4 5-7 5 6 7 11 5 17-2 5-6 7-10 7S4 32 3 27c-2-7 2-11 5-15 0 5 1 7 3 8-2-8 0-13 4-18Z" fill="currentColor" />
      <path d="M14 23c-3 3-4 5-2 7 2 2 5 0 5-2s-1-4-3-5Z" fill="var(--bg)" />
    </svg><strong>{stats.current}</strong></span>
    <small>{unit}</small>
    <span className="habit-recent-dots" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => {
      const date = shiftDay(today, i - 6);
      return <i key={date} className={`habit-dot ${dayOutcome(habit, logs, date, today)}`} />;
    })}</span>
  </Link>;
}
