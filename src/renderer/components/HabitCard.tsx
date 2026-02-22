import React from 'react';
import { Check, MessageSquare, Lock, Clock } from 'lucide-react';
import type { Habit, HabitLog } from '../types';

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  isLocked: boolean;
  onToggle: (habitId: number, isCompleted: boolean) => void;
  onNote: (habitId: number) => void;
}

const timeLabels: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  anytime: 'Anytime',
};

const timeBadgeClass: Record<string, string> = {
  morning: 'badge-morning',
  afternoon: 'badge-afternoon',
  evening: 'badge-evening',
  anytime: 'badge-anytime',
};

export default function HabitCard({ habit, log, isLocked, onToggle, onNote }: HabitCardProps) {
  const isCompleted = log?.is_completed === 1;

  return (
    <div
      className={`
        card-hover flex items-center gap-4 px-4 py-3.5
        ${isCompleted ? 'border-brand-200 dark:border-brand-800/40 bg-brand-50/30 dark:bg-brand-900/10' : ''}
        ${isLocked ? 'opacity-70' : ''}
      `}
    >
      <button
        onClick={() => !isLocked && onToggle(habit.id, !isCompleted)}
        disabled={isLocked}
        className={`
          flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors
          ${isCompleted
            ? 'bg-brand-600 border-brand-600 text-white'
            : 'border-gray-300 dark:border-slate-600 hover:border-brand-500 dark:hover:border-brand-500'
          }
          ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium truncate ${
              isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
            }`}
          >
            {habit.name}
          </span>
          <span className={timeBadgeClass[habit.time_of_day]}>
            {timeLabels[habit.time_of_day]}
          </span>
          {habit.scheduled_time && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-1.5 py-0.5 rounded-full">
              <Clock className="w-2.5 h-2.5" />
              {habit.scheduled_time}
            </span>
          )}
        </div>
        {habit.description && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 truncate">
            {habit.description}
          </p>
        )}
        {log?.note && (
          <p className="text-xs text-brand-600 dark:text-brand-400 mt-1 italic truncate">
            "{log.note}"
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isLocked ? (
          <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-600" />
        ) : (
          <button
            onClick={() => onNote(habit.id)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Add note"
          >
            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}
