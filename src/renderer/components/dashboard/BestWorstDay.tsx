import { ThumbsUp, ThumbsDown, CalendarDays } from 'lucide-react';
import type { BestWorstDayData } from '../../types';

interface BestWorstDayProps {
  data: BestWorstDayData;
}

export default function BestWorstDay({ data }: BestWorstDayProps) {
  if (!data.best && !data.worst) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Best & Worst Day</h3>
        </div>
        <p className="text-sm text-gray-400 text-center py-4">Not enough data yet</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Best & Worst Day</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data.best && (
          <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ThumbsUp className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span className="text-xs font-medium text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                Best
              </span>
            </div>
            <p className="text-lg font-bold text-brand-700 dark:text-brand-300">
              {data.best.day_name}
            </p>
            <p className="text-xs text-brand-500/70 dark:text-brand-400/60 mt-0.5">
              {Math.round(data.best.avg_rate * 100)}% avg completion
            </p>
          </div>
        )}

        {data.worst && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ThumbsDown className="w-4 h-4 text-red-500 dark:text-red-400" />
              <span className="text-xs font-medium text-red-500 dark:text-red-400 uppercase tracking-wider">
                Worst
              </span>
            </div>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">
              {data.worst.day_name}
            </p>
            <p className="text-xs text-red-500/70 dark:text-red-400/60 mt-0.5">
              {Math.round(data.worst.avg_rate * 100)}% avg completion
            </p>
          </div>
        )}
      </div>

      {data.all.length > 0 && (
        <div className="mt-4 space-y-2">
          {data.all.map((d) => (
            <div key={d.day_num} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-20">{d.day_name}</span>
              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    Math.round(d.avg_rate * 100) >= 80
                      ? 'bg-brand-500'
                      : Math.round(d.avg_rate * 100) >= 50
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.round(d.avg_rate * 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-10 text-right">
                {Math.round(d.avg_rate * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
