import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronRight, Check, X, MessageSquare, AlertCircle } from 'lucide-react';
import MissedReasonModal from '../components/MissedReasonModal';
import LockBadge from '../components/LockBadge';
import type { HabitLog } from '../types';

export default function History() {
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [reasonModal, setReasonModal] = useState<{
    habitId: number;
    habitName: string;
    logDate: string;
  } | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await window.habitAPI.getHistory();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const today = format(new Date(), 'yyyy-MM-dd');

  // grouping by date
  const groupedLogs = useMemo(() => {
    const groups = new Map<string, HabitLog[]>();
    logs.forEach((log) => {
      const existing = groups.get(log.log_date) || [];
      existing.push(log);
      groups.set(log.log_date, existing);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [logs]);

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const handleSaveReason = async (reason: string) => {
    if (reasonModal) {
      await window.habitAPI.addMissedReason({
        habitId: reasonModal.habitId,
        logDate: reasonModal.logDate,
        reason,
      });
      await fetchHistory();
    }
    setReasonModal(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-gray-400">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review past days & log reasons for missed habits
          </p>
        </div>

        {groupedLogs.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-700" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No history yet. Start logging habits on the Today page!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {groupedLogs.map(([date, dayLogs]) => {
              const isExpanded = expandedDays.has(date);
              const isLocked = date < today;
              const completed = dayLogs.filter((l) => l.is_completed === 1).length;
              const total = dayLogs.length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div key={date} className="card overflow-hidden">
                  <button
                    onClick={() => toggleDay(date)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}

                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {format(parseISO(date), 'EEEE, MMM d, yyyy')}
                      </span>
                      {isLocked && <LockBadge size={12} />}
                      {date === today && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${
                        pct === 100 ? 'text-brand-600 dark:text-brand-400' :
                        pct >= 50 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {completed}/{total} ({pct}%)
                      </span>
                      <div className="w-16 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct === 100 ? 'bg-brand-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-slate-800">
                      {dayLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-slate-800/50 last:border-b-0"
                        >
                          {log.is_completed === 1 ? (
                            <div className="w-5 h-5 rounded bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 text-brand-600 dark:text-brand-400" strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <X className="w-3 h-3 text-red-400" strokeWidth={2.5} />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <span className={`text-sm ${
                              log.is_completed === 1
                                ? 'text-gray-700 dark:text-gray-300'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {log.habit_name}
                            </span>

                            {log.note && (
                              <div className="flex items-center gap-1 mt-1">
                                <MessageSquare className="w-3 h-3 text-brand-400" />
                                <span className="text-xs text-brand-600 dark:text-brand-400 italic">
                                  "{log.note}"
                                </span>
                              </div>
                            )}

                            {log.is_completed !== 1 && isLocked && (
                              <div className="mt-1.5">
                                {log.missed_reason ? (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 rounded px-2 py-1">
                                    <span className="font-medium text-gray-600 dark:text-gray-300">Reason:</span>{' '}
                                    {log.missed_reason}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setReasonModal({
                                        habitId: log.habit_id,
                                        habitName: log.habit_name || '',
                                        logDate: log.log_date,
                                      })
                                    }
                                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium flex items-center gap-1"
                                  >
                                    <AlertCircle className="w-3 h-3" />
                                    Log Reason
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {log.time_of_day && (
                            <span className={`badge-${log.time_of_day} text-[10px] flex-shrink-0`}>
                              {log.time_of_day}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reasonModal && (
        <MissedReasonModal
          habitName={reasonModal.habitName}
          logDate={reasonModal.logDate}
          onSave={handleSaveReason}
          onClose={() => setReasonModal(null)}
        />
      )}
    </div>
  );
}
