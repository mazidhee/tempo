import React, { useState, useEffect, useCallback } from 'react';
import { format, isBefore, startOfDay, getDay } from 'date-fns';
import { Plus, Archive, RotateCcw, Pencil, Trash2 } from 'lucide-react';
import HabitCard from '../components/HabitCard';
import HabitForm from '../components/HabitForm';
import NoteModal from '../components/NoteModal';
import { useHabits } from '../hooks/useHabits';
import type { Habit, HabitLog } from '../types';

const DAY_INDEX_TO_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function isHabitScheduledForDate(habit: Habit, date: Date): boolean {
  const dayKey = DAY_INDEX_TO_KEY[getDay(date)];
  const days = (habit.days_of_week || 'mon,tue,wed,thu,fri,sat,sun').split(',');
  return days.includes(dayKey);
}

export default function Today() {
  const { habits, archivedHabits, addHabit, editHabit, archiveHabit, restoreHabit, deleteHabit, fetchHabits } = useHabits();
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [noteModal, setNoteModal] = useState<{ habitId: number; habitName: string; completing: boolean } | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const isLocked = isBefore(startOfDay(new Date(today)), startOfDay(new Date()));

  const fetchLogs = useCallback(async () => {
    try {
      const data = await window.habitAPI.getLogsByDate(today);
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch today logs:', err);
    }
  }, [today]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const dailyHabits = habits.filter(
    (h) => h.frequency === 'daily' && isHabitScheduledForDate(h, new Date())
  );
  const completedCount = dailyHabits.filter((h) =>
    logs.find((l) => l.habit_id === h.id && l.is_completed === 1)
  ).length;
  const totalCount = dailyHabits.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggle = async (habitId: number, isCompleted: boolean) => {
    if (isCompleted) {
      const habit = habits.find((h) => h.id === habitId);
      setNoteModal({ habitId, habitName: habit?.name || '', completing: true });
    } else {
      await window.habitAPI.toggleLog({ habitId, logDate: today, isCompleted: false });
      await fetchLogs();
    }
  };

  const handleNoteSave = async (note: string) => {
    if (noteModal) {
      if (noteModal.completing) {
        await window.habitAPI.toggleLog({
          habitId: noteModal.habitId,
          logDate: today,
          isCompleted: true,
          note: note || undefined,
        });
      } else {
        await window.habitAPI.addNote({
          habitId: noteModal.habitId,
          logDate: today,
          note,
        });
      }
      await fetchLogs();
    }
    setNoteModal(null);
  };

  const handleNoteSkip = async () => {
    if (noteModal?.completing) {
      await window.habitAPI.toggleLog({
        habitId: noteModal.habitId,
        logDate: today,
        isCompleted: true,
      });
      await fetchLogs();
    }
    setNoteModal(null);
  };

  const handleOpenNote = (habitId: number) => {
    const habit = habits.find((h) => h.id === habitId);
    setNoteModal({ habitId, habitName: habit?.name || '', completing: false });
  };

  const handleSaveForm = async (data: any) => {
    if (data.id) {
      await editHabit(data);
    } else {
      await addHabit(data);
    }
    setShowForm(false);
    setEditingHabit(null);
    await fetchLogs();
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Today</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Habit
            </button>
          </div>

          {totalCount > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-medium mb-2">
                <span className="text-gray-500 dark:text-gray-400">
                  {completedCount} of {totalCount} completed
                </span>
                <span className={`${pct === 100 ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {pct}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    pct === 100
                      ? 'bg-brand-500'
                      : pct >= 50
                      ? 'bg-brand-400'
                      : 'bg-brand-300'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {dailyHabits.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <Plus className="w-7 h-7 text-gray-400 dark:text-slate-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">No habits yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Create your first habit
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {dailyHabits.map((habit) => {
              const log = logs.find((l) => l.habit_id === habit.id);
              return (
                <div key={habit.id} className="group relative">
                  <HabitCard
                    habit={habit}
                    log={log}
                    isLocked={isLocked}
                    onToggle={handleToggle}
                    onNote={handleOpenNote}
                  />
                  <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingHabit(habit);
                        setShowForm(true);
                      }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => archiveHabit(habit.id)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                      title="Archive"
                    >
                      <Archive className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {archivedHabits.length > 0 && (
          <div className="mt-8 border-t border-gray-200 dark:border-slate-800 pt-6">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="btn-ghost text-gray-500 dark:text-gray-400 flex items-center gap-2"
            >
              <Archive className="w-4 h-4" />
              {showArchived ? 'Hide' : 'Show'} Archived ({archivedHabits.length})
            </button>
            {showArchived && (
              <div className="mt-3 space-y-2">
                {archivedHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="card flex items-center justify-between px-4 py-3 opacity-60"
                  >
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{habit.name}</span>
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-600">({habit.frequency})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => restoreHabit(habit.id)}
                        className="btn-ghost flex items-center gap-1 text-brand-600 dark:text-brand-400"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Permanently delete "${habit.name}" and all its history? This cannot be undone.`)) {
                            deleteHabit(habit.id);
                          }
                        }}
                        className="btn-ghost flex items-center gap-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <HabitForm
          habit={editingHabit}
          onSave={handleSaveForm}
          onClose={() => {
            setShowForm(false);
            setEditingHabit(null);
          }}
        />
      )}

      {noteModal && (
        <NoteModal
          habitName={noteModal.habitName}
          onSave={handleNoteSave}
          onSkip={handleNoteSkip}
          onClose={() => setNoteModal(null)}
        />
      )}
    </div>
  );
}
