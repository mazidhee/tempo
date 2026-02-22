import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  isBefore,
  isAfter,
  startOfDay,
  eachDayOfInterval,
  isToday,
  isSameDay,
  getDay,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Minus,
  Lock,
  Plus,
  MessageSquare,
  Calendar,
  Flame,
  Target,
} from 'lucide-react';
import NoteModal from '../components/NoteModal';
import HabitForm from '../components/HabitForm';
import { useHabits } from '../hooks/useHabits';
import type { Habit, HabitLog } from '../types';

const DAY_INDEX_TO_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function isHabitScheduledForDay(habit: Habit, date: Date): boolean {
  const dayKey = DAY_INDEX_TO_KEY[getDay(date)];
  const days = (habit.days_of_week || 'mon,tue,wed,thu,fri,sat,sun').split(',');
  return days.includes(dayKey);
}

export default function Weekly() {
  const { habits, addHabit, fetchHabits } = useHabits();
  const [weekOffset, setWeekOffset] = useState(0);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState<{
    habitId: number;
    habitName: string;
    date: string;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });

  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart.toISOString(), weekEnd.toISOString()]
  );

  const startStr = format(weekStart, 'yyyy-MM-dd');
  const endStr = format(weekEnd, 'yyyy-MM-dd');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.habitAPI.getWeeklyData({ startDate: startStr, endDate: endStr });
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch weekly logs:', err);
    } finally {
      setLoading(false);
    }
  }, [startStr, endStr]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const dailyHabits = habits.filter((h) => h.frequency === 'daily');

  const logMap = useMemo(() => {
    const map = new Map<string, HabitLog>();
    logs.forEach((l) => {
      map.set(`${l.habit_id}_${l.log_date}`, l);
    });
    return map;
  }, [logs]);

  const isDayLocked = (date: Date) => isBefore(startOfDay(date), today);
  const isDayFuture = (date: Date) => isAfter(startOfDay(date), today);
  const isDayToday = (date: Date) => isSameDay(date, today);

  const handleCellClick = async (habit: Habit, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (isDayLocked(date) || isDayFuture(date)) return;
    if (!isHabitScheduledForDay(habit, date)) return;

    const key = `${habit.id}_${dateStr}`;
    const existing = logMap.get(key);
    const isCurrentlyCompleted = existing?.is_completed === 1;

    if (!isCurrentlyCompleted) {
      setNoteModal({ habitId: habit.id, habitName: habit.name, date: dateStr });
    } else {
      await window.habitAPI.toggleLog({
        habitId: habit.id,
        logDate: dateStr,
        isCompleted: false,
      });
      await fetchLogs();
    }
  };

  const handleNoteSave = async (note: string) => {
    if (noteModal) {
      await window.habitAPI.toggleLog({
        habitId: noteModal.habitId,
        logDate: noteModal.date,
        isCompleted: true,
        note: note || undefined,
      });
      await fetchLogs();
    }
    setNoteModal(null);
  };

  const handleNoteSkip = async () => {
    if (noteModal) {
      await window.habitAPI.toggleLog({
        habitId: noteModal.habitId,
        logDate: noteModal.date,
        isCompleted: true,
      });
      await fetchLogs();
    }
    setNoteModal(null);
  };

  const weekStats = useMemo(() => {
    let totalCells = 0;
    let completed = 0;
    let missed = 0;
    dailyHabits.forEach((h) => {
      days.forEach((d) => {
        if (isDayFuture(d)) return;
        if (!isHabitScheduledForDay(h, d)) return;
        totalCells++;
        const key = `${h.id}_${format(d, 'yyyy-MM-dd')}`;
        const log = logMap.get(key);
        if (log?.is_completed === 1) completed++;
        else if (isDayLocked(d)) missed++;
      });
    });
    const rate = totalCells > 0 ? Math.round((completed / totalCells) * 100) : 0;
    return { completed, missed, rate, total: totalCells };
  }, [dailyHabits, days, logMap]);

  const habitWeekStats = useCallback(
    (habit: Habit) => {
      let streak = 0;
      let completed = 0;
      let scheduledDays = 0;
      for (const d of days) {
        if (isDayFuture(d)) continue;
        if (!isHabitScheduledForDay(habit, d)) continue;
        scheduledDays++;
        const key = `${habit.id}_${format(d, 'yyyy-MM-dd')}`;
        const log = logMap.get(key);
        if (log?.is_completed === 1) {
          completed++;
          streak++;
        }
      }
      return { completed, streak, scheduledDays };
    },
    [days, logMap]
  );

  const handleSaveForm = async (data: any) => {
    await addHabit(data);
    setShowForm(false);
    await fetchLogs();
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly View</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Spreadsheet-style habit tracking
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Habit
          </button>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setWeekOffset((o) => o - 1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center min-w-[220px]">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {format(weekStart, 'MMM d')} — {format(weekEnd, 'MMM d, yyyy')}
                </span>
                {weekOffset === 0 && (
                  <span className="ml-2 text-xs text-brand-600 dark:text-brand-400 font-medium">
                    This Week
                  </span>
                )}
              </div>
              <button
                onClick={() => setWeekOffset((o) => o + 1)}
                disabled={weekOffset >= 0}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {weekOffset !== 0 && (
                <button onClick={() => setWeekOffset(0)} className="btn-ghost text-brand-600 dark:text-brand-400 text-xs">
                  Today
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-brand-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {weekStats.completed} done
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {weekStats.missed} missed
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Target className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span className={`${weekStats.rate >= 80 ? 'text-brand-600 dark:text-brand-400' : weekStats.rate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'}`}>
                  {weekStats.rate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {dailyHabits.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-700" />
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
              No habits to display. Create one to get started!
            </p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Create Habit
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr>
                    <th className="spreadsheet-cell-header text-left sticky left-0 z-10 bg-gray-50 dark:bg-slate-900/80 min-w-[200px] border-r-2 border-gray-300 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider">Habit</span>
                      </div>
                    </th>

                    {days.map((day) => {
                      const locked = isDayLocked(day);
                      const todayCol = isDayToday(day);
                      const future = isDayFuture(day);

                      return (
                        <th
                          key={day.toISOString()}
                          className={`
                            spreadsheet-cell-header min-w-[110px] relative
                            ${todayCol ? 'bg-brand-50 dark:bg-brand-900/20 border-b-2 border-brand-500' : ''}
                            ${locked ? 'bg-gray-100/80 dark:bg-slate-900/60' : ''}
                            ${future ? 'bg-gray-50/50 dark:bg-slate-900/40' : ''}
                          `}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`text-[10px] uppercase tracking-widest ${todayCol ? 'text-brand-600 dark:text-brand-400 font-bold' : ''}`}>
                              {format(day, 'EEE')}
                            </span>
                            <span className={`text-sm font-bold ${todayCol ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'}`}>
                              {format(day, 'd MMM')}
                            </span>
                            {locked && (
                              <Lock className="w-3 h-3 text-gray-400 dark:text-slate-600 mt-0.5" />
                            )}
                            {todayCol && (
                              <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-0.5" />
                            )}
                          </div>
                        </th>
                      );
                    })}

                    <th className="spreadsheet-cell-header min-w-[80px] border-l-2 border-gray-300 dark:border-slate-700">
                      <div className="flex flex-col items-center gap-0.5">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-[10px] uppercase tracking-wider">Stats</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailyHabits.map((habit, idx) => {
                    const stats = habitWeekStats(habit);
                    const completionRate = stats.scheduledDays > 0
                      ? Math.round((stats.completed / stats.scheduledDays) * 100)
                      : 0;

                    return (
                      <tr
                        key={habit.id}
                        className={`
                          ${idx % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-gray-50/50 dark:bg-slate-900/30'}
                          hover:bg-gray-50 dark:hover:bg-slate-900/50
                        `}
                      >
                        <td className="spreadsheet-cell text-left sticky left-0 z-10 border-r-2 border-gray-300 dark:border-slate-700 bg-inherit">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                completionRate >= 80
                                  ? 'bg-brand-500'
                                  : completionRate >= 50
                                  ? 'bg-amber-400'
                                  : completionRate > 0
                                  ? 'bg-red-400'
                                  : 'bg-gray-300 dark:bg-slate-700'
                              }`}
                            />
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate block">
                                {habit.name}
                              </span>
                              {habit.description && (
                                <span className="text-[11px] text-gray-400 dark:text-gray-600 truncate block">
                                  {habit.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {days.map((day) => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const key = `${habit.id}_${dateStr}`;
                          const log = logMap.get(key);
                          const locked = isDayLocked(day);
                          const todayCol = isDayToday(day);
                          const future = isDayFuture(day);
                          const scheduled = isHabitScheduledForDay(habit, day);
                          const isCompleted = log?.is_completed === 1;
                          const isMissed = locked && !isCompleted && scheduled;
                          const cellId = `${habit.id}_${dateStr}`;
                          const isHovered = hoveredCell === cellId;

                          return (
                            <td
                              key={dateStr}
                              className={`
                                spreadsheet-cell relative select-none
                                ${!scheduled ? 'bg-gray-100/60 dark:bg-slate-900/60 cursor-default' : 'cursor-pointer'}
                                ${scheduled && todayCol ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''}
                                ${scheduled && locked ? 'bg-gray-50/70 dark:bg-slate-900/40' : ''}
                                ${scheduled && future ? 'bg-gray-50/30 dark:bg-slate-900/20' : ''}
                                ${isHovered && scheduled && !locked && !future ? 'ring-2 ring-inset ring-brand-400 dark:ring-brand-500' : ''}
                              `}
                              onClick={() => handleCellClick(habit, day)}
                              onMouseEnter={() => scheduled && setHoveredCell(cellId)}
                              onMouseLeave={() => setHoveredCell(null)}
                            >
                              <div className="flex flex-col items-center gap-1">
                                {!scheduled ? (
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center">
                                    <Minus className="w-4 h-4 text-gray-200 dark:text-slate-700" />
                                  </div>
                                ) : isCompleted ? (
                                  <div className={`
                                    w-7 h-7 rounded-lg flex items-center justify-center
                                    ${locked
                                      ? 'bg-brand-100 dark:bg-brand-900/30'
                                      : 'bg-brand-500 shadow-sm shadow-brand-200 dark:shadow-brand-900/50'
                                    }
                                  `}>
                                    <Check
                                      className={`w-4 h-4 ${locked ? 'text-brand-500 dark:text-brand-400' : 'text-white'}`}
                                      strokeWidth={3}
                                    />
                                  </div>
                                ) : isMissed ? (
                                  <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                    <X className="w-4 h-4 text-red-400 dark:text-red-500" strokeWidth={2.5} />
                                  </div>
                                ) : future ? (
                                  <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                                    <Minus className="w-4 h-4 text-gray-300 dark:text-slate-600" />
                                  </div>
                                ) : (
                                  <div className={`
                                    w-7 h-7 rounded-lg border-2 border-dashed flex items-center justify-center
                                    ${isHovered
                                      ? 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                                      : 'border-gray-200 dark:border-slate-700'
                                    }
                                  `}>
                                    {isHovered && <Check className="w-3.5 h-3.5 text-brand-400" />}
                                  </div>
                                )}

                                {log?.note && (
                                  <MessageSquare className="w-3 h-3 text-brand-400 dark:text-brand-500" />
                                )}
                              </div>
                            </td>
                          );
                        })}

                        <td className="spreadsheet-cell border-l-2 border-gray-300 dark:border-slate-700">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-bold ${
                              completionRate >= 80 ? 'text-brand-600 dark:text-brand-400' :
                              completionRate >= 50 ? 'text-amber-600 dark:text-amber-400' :
                              'text-gray-400 dark:text-gray-600'
                            }`}>
                              {completionRate}%
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-600">
                              {stats.completed}/{stats.scheduledDays}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  <tr className="bg-gray-50 dark:bg-slate-900/60 border-t-2 border-gray-300 dark:border-slate-700">
                    <td className="spreadsheet-cell text-left sticky left-0 z-10 bg-gray-50 dark:bg-slate-900/60 border-r-2 border-gray-300 dark:border-slate-700">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Daily Total
                      </span>
                    </td>
                    {days.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const future = isDayFuture(day);
                      const todayCol = isDayToday(day);
                      let dayCompleted = 0;
                      let dayScheduled = 0;
                      dailyHabits.forEach((h) => {
                        if (!isHabitScheduledForDay(h, day)) return;
                        dayScheduled++;
                        const key = `${h.id}_${dateStr}`;
                        if (logMap.get(key)?.is_completed === 1) dayCompleted++;
                      });
                      const dayRate = dayScheduled > 0
                        ? Math.round((dayCompleted / dayScheduled) * 100)
                        : 0;

                      return (
                        <td
                          key={dateStr}
                          className={`spreadsheet-cell ${todayCol ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''}`}
                        >
                          {!future && (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`text-sm font-bold ${
                                dayRate === 100 ? 'text-brand-600 dark:text-brand-400' :
                                dayRate >= 50 ? 'text-amber-600 dark:text-amber-400' :
                                'text-gray-400'
                              }`}>
                                {dayCompleted}/{dayScheduled}
                              </span>
                              <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    dayRate === 100 ? 'bg-brand-500' :
                                    dayRate >= 50 ? 'bg-amber-400' :
                                    dayRate > 0 ? 'bg-red-400' : ''
                                  }`}
                                  style={{ width: `${dayRate}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="spreadsheet-cell border-l-2 border-gray-300 dark:border-slate-700">
                      <span className={`text-sm font-bold ${
                        weekStats.rate >= 80 ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500'
                      }`}>
                        {weekStats.rate}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-6 justify-center">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-5 h-5 rounded bg-brand-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            Completed
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-5 h-5 rounded bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <X className="w-3 h-3 text-red-400" strokeWidth={2.5} />
            </div>
            Missed
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-5 h-5 rounded border-2 border-dashed border-gray-200 dark:border-slate-700" />
            Pending
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Lock className="w-3.5 h-3.5" />
            Locked
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-5 h-5 rounded bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
              <Minus className="w-3 h-3 text-gray-200 dark:text-slate-700" />
            </div>
            Not scheduled
          </div>
        </div>
      </div>

      {noteModal && (
        <NoteModal
          habitName={noteModal.habitName}
          onSave={handleNoteSave}
          onSkip={handleNoteSkip}
          onClose={() => setNoteModal(null)}
        />
      )}

      {showForm && (
        <HabitForm
          onSave={handleSaveForm}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
