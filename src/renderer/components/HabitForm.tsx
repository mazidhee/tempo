import React, { useState, useEffect } from 'react';
import { X, Clock, CalendarDays } from 'lucide-react';
import type { Habit } from '../types';

const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

interface HabitFormProps {
  habit?: Habit | null;
  onSave: (data: {
    id?: number;
    name: string;
    description?: string;
    frequency: string;
    time_of_day: string;
    days_of_week: string;
    scheduled_time?: string;
  }) => void;
  onClose: () => void;
}

export default function HabitForm({ habit, onSave, onClose }: HabitFormProps) {
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [frequency, setFrequency] = useState(habit?.frequency || 'daily');
  const [timeOfDay, setTimeOfDay] = useState(habit?.time_of_day || 'anytime');
  const [selectedDays, setSelectedDays] = useState<string[]>(
    habit?.days_of_week ? habit.days_of_week.split(',') : [...ALL_DAYS]
  );
  const [scheduledTime, setScheduledTime] = useState(habit?.scheduled_time || '');

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description || '');
      setFrequency(habit.frequency);
      setTimeOfDay(habit.time_of_day);
      setSelectedDays(habit.days_of_week ? habit.days_of_week.split(',') : [...ALL_DAYS]);
      setScheduledTime(habit.scheduled_time || '');
    }
  }, [habit]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day];
    });
  };

  const selectAllDays = () => setSelectedDays([...ALL_DAYS]);
  const selectWeekdays = () => setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri']);
  const selectWeekends = () => setSelectedDays(['sat', 'sun']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (selectedDays.length === 0) return;

    const sortedDays = ALL_DAYS.filter((d) => selectedDays.includes(d));

    onSave({
      ...(habit ? { id: habit.id } : {}),
      name: name.trim(),
      description: description.trim() || undefined,
      frequency,
      time_of_day: timeOfDay,
      days_of_week: sortedDays.join(','),
      scheduled_time: scheduledTime || undefined,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {habit ? 'Edit Habit' : 'New Habit'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Meditation"
              className="input"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — a brief reminder of what this habit involves"
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="select"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Time of Day
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="select"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="anytime">Anytime</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                <CalendarDays className="w-3.5 h-3.5" />
                Active Days
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectAllDays}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={selectWeekdays}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Weekdays
                </button>
                <button
                  type="button"
                  onClick={selectWeekends}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Weekends
                </button>
              </div>
            </div>
            <div className="flex gap-1.5">
              {ALL_DAYS.map((day) => {
                const isActive = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`
                      flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border
                      ${isActive
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-200 dark:shadow-brand-900/50'
                        : 'bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600'
                      }
                    `}
                  >
                    {DAY_LABELS[day]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              <Clock className="w-3.5 h-3.5" />
              Scheduled Time
              <span className="text-gray-400 dark:text-gray-600 font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="input flex-1"
              />
              {scheduledTime && (
                <button
                  type="button"
                  onClick={() => setScheduledTime('')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-400"
                  title="Clear time"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {habit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
