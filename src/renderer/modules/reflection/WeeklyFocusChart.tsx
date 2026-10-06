import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import type { WeeklySummary } from '../../../shared/reflection';
import { Button } from '../../components/ui/button';
const weekday = (date: string, long = false) =>
  new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: long ? 'long' : 'short' });
const duration = (seconds: number) =>
  seconds < 3600 ? `${Math.round(seconds / 60)} min` : `${Number((seconds / 3600).toFixed(2))} h`;
/** A saved seven-day series: observed zeroes are real, future/legacy values stay absent. */
export function WeeklyFocusChart({
  focus,
  onRefresh,
  busy,
}: {
  focus: WeeklySummary['focus'];
  onRefresh: () => void;
  busy: boolean;
}) {
  const rows = focus.daily?.map((point) => ({
    ...point,
    label: weekday(point.date),
    hours: point.seconds === null ? null : point.seconds / 3600,
  }));
  const active = rows?.filter((point) => point.seconds !== null && point.seconds > 0) || [];
  const best = [...active].sort((a, b) => b.seconds! - a.seconds!)[0];
  return (
    <section className="review-focus-chart" aria-label="Saved weekly focus trend">
      <div className="review-chart-heading">
        <div>
          <h2>Focus</h2>
        </div>
        <span className="review-chart-unit">Hours</span>
      </div>
      {rows ? (
        <>
          <div
            className="review-chart-canvas"
            role="img"
            aria-label={`Daily focus hours. ${rows.map((point) => `${weekday(point.date, true)} ${point.date}: ${point.hours === null ? 'not observed' : point.hours.toFixed(2) + ' hours'}`).join('; ')}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 18, right: 14, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--hairline)" strokeDasharray="3 6" />
                <XAxis
                  dataKey="label"
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={14}
                  tick={{ fill: 'var(--ink-subtle)', fontSize: 12 }}
                />
                <YAxis
                  domain={[0, (max: number) => Math.max(1, Math.ceil(max))]}
                  width={36}
                  tickCount={4}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--ink-subtle)', fontSize: 12 }}
                  tickFormatter={(value) => Number(value.toFixed(1)).toString()}
                />
                <Tooltip
                  cursor={{ stroke: 'var(--hairline)' }}
                  content={({ active: hovered, payload }) => {
                    const point = payload?.[0]?.payload as
                      NonNullable<typeof rows>[number] | undefined;
                    return hovered && point && point.seconds !== null ? (
                      <div className="review-trend-tooltip">
                        <strong>
                          {new Date(point.date + 'T12:00:00').toLocaleDateString(undefined, {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </strong>
                        <span>{duration(point.seconds)} focused</span>
                      </div>
                    ) : null;
                  }}
                />
                <Line
                  type="linear"
                  dataKey="hours"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 2, fill: 'var(--surface-1)' }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="review-chart-footnote">
            <span>
              {active.length
                ? `${active.length} focused ${active.length === 1 ? 'day' : 'days'}${best ? ' · Best: ' + weekday(best.date) : ''}`
                : 'No focus sessions recorded'}
            </span>
            <details>
              <summary>Daily values</summary>
              <dl>
                {rows.map((point) => (
                  <div key={point.date}>
                    <dt>
                      {weekday(point.date)} · {point.date}
                    </dt>
                    <dd>{point.seconds === null ? 'Not observed' : duration(point.seconds)}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </div>
          <p className="review-chart-provenance">Unobserved days stay open.</p>
        </>
      ) : (
        <div className="review-chart-empty">
          <p>This saved review has totals only. Update activity to see its daily trend.</p>
          <Button variant="ghost" size="sm" disabled={busy} onClick={onRefresh}>
            Update activity
          </Button>
          <small>Your written reflections stay intact.</small>
        </div>
      )}
    </section>
  );
}
