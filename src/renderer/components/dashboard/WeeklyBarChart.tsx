import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { BarChart3 } from 'lucide-react';
import { dateRange, weekStart, shiftDay, dayOutcome } from '../../../shared/habits';
import { localDate } from '../../../shared/productivity';
import type { Habit, HabitLog } from '../../types';
interface WeeklyBarChartProps {
  habits: Habit[];
  logs: HabitLog[];
}

export default function WeeklyBarChart({ habits, logs }: WeeklyBarChartProps) {
  const today = localDate();
  const chartData = useMemo(
    () =>
      dateRange(weekStart(today), shiftDay(weekStart(today), 6)).map((date) => {
        const statuses = date <= today ? habits.map((h) => dayOutcome(h, logs, date, today)) : [];
        return {
          day: format(new Date(date + 'T12:00:00'), 'EEE'),
          date,
          Completed: statuses.filter((s) => s === 'done').length,
          Missed: statuses.filter((s) => s === 'missed' || s === 'slip').length,
        };
      }),
    [habits, logs, today],
  );

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">This Week</h3>
      </div>

      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={2} barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-100 dark:text-slate-800"
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-gray-400 dark:text-gray-600"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-gray-400 dark:text-gray-600"
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #fff)',
                border: '1px solid var(--tooltip-border, #e5e7eb)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="Completed" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Missed" fill="var(--muted)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
