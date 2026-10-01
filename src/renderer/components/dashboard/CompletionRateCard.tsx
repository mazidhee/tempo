import { useState } from 'react';
import { Target } from 'lucide-react';
import type { CompletionRateData } from '../../types';

interface CompletionRateCardProps {
  data: CompletionRateData;
}

const periods = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
];

export default function CompletionRateCard({ data }: CompletionRateCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Completion Rate</h3>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setSelectedPeriod(p.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedPeriod === p.key
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4 mb-4">
        <p className="text-xs text-brand-600 dark:text-brand-400 font-medium uppercase tracking-wider">
          Overall ({periods.find((p) => p.key === selectedPeriod)?.label})
        </p>
        <p className="text-3xl font-bold text-brand-700 dark:text-brand-300 mt-1">
          {data.overall[selectedPeriod] || 0}%
        </p>
      </div>

      <div className="space-y-3">
        {data.habits.map((h) => {
          const rate = h.rates[selectedPeriod] || 0;
          return (
            <div key={h.habitId}>
              <div className="flex items-center justify-between mb-1">
                <span className="habit-name text-xs text-gray-600 dark:text-gray-400 truncate mr-2">
                  {h.habitName}
                </span>
                <span
                  className={`text-xs font-bold ${
                    rate >= 80
                      ? 'text-brand-600 dark:text-brand-400'
                      : rate >= 50
                        ? 'text-amber-600'
                        : 'text-red-500'
                  }`}
                >
                  {rate}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    rate >= 80
                      ? 'bg-brand-500'
                      : rate >= 50
                        ? 'bg-amber-400'
                        : rate > 0
                          ? 'bg-red-400'
                          : 'bg-gray-200 dark:bg-slate-700'
                  }`}
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
