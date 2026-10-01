import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { BarChart3 } from 'lucide-react';
import { dateRange, weekStart, shiftDay, dayOutcome } from '../../../shared/habits';
import { localDate } from '../../../shared/productivity';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '../ui/chart';
import type { Habit, HabitLog } from '../../types';
const config = {
  Completed: { label: 'Completed', color: 'var(--chart-1)' },
  Missed: { label: 'Missed', color: 'var(--chart-2)' },
};
const chartMetrics = { axisWidth: 32, barRadius: 4 };
export default function WeeklyBarChart({ habits, logs }: { habits: Habit[]; logs: HabitLog[] }) {
  const today = localDate();
  const data = useMemo(
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
    <section className="panel">
      <div className="section-heading">
        <h2>This week</h2>
        <BarChart3 />
      </div>
      <ChartContainer
        config={config}
        className="advanced-chart-frame"
        aria-label="This week's completed and missed due habits"
      >
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="var(--hairline)" />
          <XAxis dataKey="day" stroke="var(--ink-subtle)" axisLine={false} tickLine={false} />
          <YAxis
            width={chartMetrics.axisWidth}
            stroke="var(--ink-subtle)"
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="Completed"
            fill="var(--color-Completed)"
            radius={[chartMetrics.barRadius, chartMetrics.barRadius, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="Missed"
            fill="var(--color-Missed)"
            radius={[chartMetrics.barRadius, chartMetrics.barRadius, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </section>
  );
}
