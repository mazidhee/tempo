import { usePrivacy } from '../../hooks/PrivacyContext';
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { TrendingUp } from 'lucide-react';
import type { TrendPoint, Habit } from '../../types';

interface HabitTrendLineProps {
  habits: Habit[];
}

export default function HabitTrendLine({ habits }: HabitTrendLineProps) {
  const privacy = usePrivacy();
  const [selectedHabit, setSelectedHabit] = useState<number | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (habits.length > 0 && selectedHabit === null) {
      setSelectedHabit(habits[0].id);
    }
  }, [habits]);

  useEffect(() => {
    if (selectedHabit) {
      setLoading(true);
      window.habitAPI
        .getHabitTrend(selectedHabit)
        .then((data) => setTrendData(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedHabit]);

  const chartData = trendData.map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  }));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Habit Trend</h3>
        </div>
        <select
          value={selectedHabit || ''}
          onChange={(e) => setSelectedHabit(Number(e.target.value))}
          className="select habit-name max-w-[180px] text-xs"
        >
          {habits.map((h) => (
            <option key={h.id} value={h.id}>
              {privacy ? `Private habit ${h.id}` : h.name}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-600 mb-3">
        Last 30 days · Daily completion with 7-day rolling average
      </p>

      <div className="h-[220px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-gray-400">Loading...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-100 dark:text-slate-800"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: 'currentColor' }}
                className="text-gray-400 dark:text-gray-600"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 1]}
                ticks={[0, 0.5, 1]}
                tick={{ fontSize: 10, fill: 'currentColor' }}
                className="text-gray-400 dark:text-gray-600"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Legend iconType="line" iconSize={12} wrapperStyle={{ fontSize: '11px' }} />
              <Line
                type="stepAfter"
                dataKey="completed"
                stroke="#22c55e"
                strokeWidth={1}
                dot={false}
                name="Daily"
                opacity={0.4}
              />
              <Line
                type="monotone"
                dataKey="average"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                name="7-Day Avg"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
