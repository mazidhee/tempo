import React, { useMemo } from 'react';
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
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isBefore,
  startOfDay,
  isAfter,
} from 'date-fns';
import { BarChart3 } from 'lucide-react';

interface WeeklyBarChartProps {
  habits: { id: number; name: string }[];
  logs: any[];
}

export default function WeeklyBarChart({ habits, logs }: WeeklyBarChartProps) {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const logMap = useMemo(() => {
    const map = new Map<string, any>();
    logs.forEach((l: any) => {
      map.set(`${l.habit_id}_${l.log_date}`, l);
    });
    return map;
  }, [logs]);

  const chartData = useMemo(() => {
    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const isFuture = isAfter(startOfDay(day), today);
      let completed = 0;
      let missed = 0;

      if (!isFuture) {
        habits.forEach((h) => {
          const key = `${h.id}_${dateStr}`;
          const log = logMap.get(key);
          if (log?.is_completed === 1) {
            completed++;
          } else if (isBefore(startOfDay(day), today)) {
            missed++;
          }
        });
      }

      return {
        day: format(day, 'EEE'),
        date: format(day, 'MMM d'),
        Completed: completed,
        Missed: missed,
      };
    });
  }, [days, habits, logMap]);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">This Week</h3>
      </div>

      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-slate-800" />
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
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px' }}
            />
            <Bar dataKey="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Missed" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
