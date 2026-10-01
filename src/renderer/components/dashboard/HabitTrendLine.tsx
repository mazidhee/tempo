import { usePrivacy } from '../../hooks/PrivacyContext';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { TrendingUp } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '../ui/chart';
import type { TrendPoint, Habit } from '../../types';
const config = {
  completed: { label: 'Daily', color: 'var(--chart-2)' },
  average: { label: '7-day average', color: 'var(--chart-1)' },
};
const chartMetrics = { axisWidth: 32 };
export default function HabitTrendLine({ habits }: { habits: Habit[] }) {
  const privacy = usePrivacy();
  const [selected, setSelected] = useState<number | null>(habits[0]?.id || null),
    [data, setData] = useState<TrendPoint[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    if (!habits.some((h) => h.id === selected)) setSelected(habits[0]?.id || null);
  }, [habits, selected]);
  useEffect(() => {
    let alive = true;
    if (selected) {
      setLoading(true);
      setError('');
      void window.habitAPI
        .getHabitTrend(selected)
        .then((next) => {
          if (alive) setData(next);
        })
        .catch((reason) => {
          if (alive) setError(String(reason));
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }
    return () => {
      alive = false;
    };
  }, [selected]);
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Habit trend</h2>
          <p className="muted">Last 30 days · Daily completion and 7-day average</p>
        </div>
        <TrendingUp />
        <select
          className="input compact-select habit-name"
          aria-label="Habit for trend"
          value={selected || ''}
          onChange={(e) => setSelected(Number(e.target.value))}
        >
          {habits.map((h) => (
            <option key={h.id} value={h.id}>
              {privacy ? `Private habit ${h.id}` : h.name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      {loading ? (
        <p className="muted">Loading trend…</p>
      ) : (
        <ChartContainer
          config={config}
          className="advanced-chart-frame"
          aria-label="Daily completion and seven-day rolling average"
        >
          <LineChart data={data.map((d) => ({ ...d, label: format(parseISO(d.date), 'MMM d') }))}>
            <CartesianGrid vertical={false} stroke="var(--hairline)" />
            <XAxis
              dataKey="label"
              stroke="var(--ink-subtle)"
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              width={chartMetrics.axisWidth}
              domain={[0, 1]}
              ticks={[0, 0.5, 1]}
              stroke="var(--ink-subtle)"
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="stepAfter"
              dataKey="completed"
              stroke="var(--color-completed)"
              dot={false}
              strokeWidth={1}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="average"
              stroke="var(--color-average)"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      )}
    </section>
  );
}
