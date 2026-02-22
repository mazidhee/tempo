import React, { useMemo } from 'react';
import { format, subDays, startOfDay, getDay } from 'date-fns';
import { Grid3x3 } from 'lucide-react';
import type { HeatmapData } from '../../types';

interface HeatmapCalendarProps {
  data: HeatmapData;
}

export default function HeatmapCalendar({ data }: HeatmapCalendarProps) {
  const cells = useMemo(() => {
    const today = startOfDay(new Date());
    const totalDays = 365;
    const dayMap = new Map(data.days.map((d) => [d.log_date, d.completed_count]));

    const grid: { date: string; count: number; level: number }[] = [];

    for (let i = totalDays - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = dayMap.get(dateStr) || 0;
      let level = 0;
      if (data.totalHabits > 0 && count > 0) {
        const ratio = count / data.totalHabits;
        if (ratio >= 1) level = 4;
        else if (ratio >= 0.75) level = 3;
        else if (ratio >= 0.5) level = 2;
        else level = 1;
      }
      grid.push({ date: dateStr, count, level });
    }

    return grid;
  }, [data]);

  const weeks = useMemo(() => {
    const result: typeof cells[] = [];
    let currentWeek: typeof cells = [];

    if (cells.length > 0) {
      const firstDate = new Date(cells[0].date);
      const dayOfWeek = getDay(firstDate);
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({ date: '', count: 0, level: -1 });
      }
    }

    cells.forEach((cell) => {
      currentWeek.push(cell);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [cells]);

  const levelColors = [
    'bg-gray-100 dark:bg-slate-800',
    'bg-brand-200 dark:bg-brand-800',
    'bg-brand-300 dark:bg-brand-700',
    'bg-brand-400 dark:bg-brand-600',
    'bg-brand-600 dark:bg-brand-500',
  ];

  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, weekIdx) => {
      const validCell = week.find((c) => c.date);
      if (validCell) {
        const month = new Date(validCell.date).getMonth();
        if (month !== lastMonth) {
          labels.push({ label: format(new Date(validCell.date), 'MMM'), weekIndex: weekIdx });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Grid3x3 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Activity Heatmap</h3>
        <span className="text-xs text-gray-400 dark:text-gray-600 ml-auto">Last 365 days</span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex mb-1 ml-8">
          {monthLabels.map((m, idx) => (
            <div
              key={idx}
              className="text-[10px] text-gray-400 dark:text-gray-600"
              style={{
                position: 'relative',
                left: `${m.weekIndex * 13}px`,
                marginRight: idx < monthLabels.length - 1
                  ? `${((monthLabels[idx + 1]?.weekIndex || 0) - m.weekIndex) * 13 - 24}px`
                  : 0,
              }}
            >
              {m.label}
            </div>
          ))}
        </div>

        <div className="flex gap-[1px]">
          <div className="flex flex-col gap-[1px] mr-1 justify-center">
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
              <div key={i} className="h-[11px] flex items-center">
                <span className="text-[9px] text-gray-400 dark:text-gray-600 w-6 text-right">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[1px]">
              {week.map((cell, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`w-[11px] h-[11px] rounded-[2px] ${
                    cell.level < 0 ? 'bg-transparent' : levelColors[cell.level]
                  }`}
                  title={cell.date ? `${cell.date}: ${cell.count} habits completed` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3 justify-end">
        <span className="text-[10px] text-gray-400 mr-1">Less</span>
        {levelColors.map((color, i) => (
          <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${color}`} />
        ))}
        <span className="text-[10px] text-gray-400 ml-1">More</span>
      </div>
    </div>
  );
}
