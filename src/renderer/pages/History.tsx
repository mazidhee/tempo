import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHabitData } from '../hooks/useHabitData';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dayOutcome, shiftDay, isComplete } from '../../shared/habits';
import MissedReasonModal from '../components/MissedReasonModal';
import { PageHeader } from '../components/ui';
import { usePrivacy } from '../hooks/PrivacyContext';
import '../styles/approved-workspace.css';
export default function History() {
  const { habits, logs, events, today, mutate, error } = useHabitData();
  const [reason, setReason] = useState<{
      habitId: number;
      habitName: string;
      logDate: string;
    } | null>(null),
    [actionError, setActionError] = useState('');
  const privacy = usePrivacy();
  const [habitId, setHabitId] = useState('all'),
    [metric, setMetric] = useState('completions'),
    [end, setEnd] = useState(today),
    [limit, setLimit] = useState(14);
  const filteredLogs = logs.filter((l) => habitId === 'all' || String(l.habit_id) === habitId);
  const filteredEvents = events.filter((e) => habitId === 'all' || String(e.habit_id) === habitId);
  const count = (date: string) =>
    metric === 'events'
      ? filteredEvents.filter((e) => e.occurred_at.slice(0, 10) === date).length
      : filteredLogs.filter(
          (l) => l.log_date === date && habits.some((h) => h.id === l.habit_id && isComplete(h, l)),
        ).length;
  const series = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    date: shiftDay(end, i - 29),
    previousDate: shiftDay(end, i - 59),
    current: count(shiftDay(end, i - 29)),
    previous: count(shiftDay(end, i - 59)),
  }));
  const currentTotal = series.reduce((sum, r) => sum + r.current, 0),
    previousTotal = series.reduce((sum, r) => sum + r.previous, 0);
  const dates = [...new Set(filteredLogs.filter((l) => l.log_date <= end).map((l) => l.log_date))]
    .sort()
    .reverse();
  return (
    <div className="page habit-history">
      <PageHeader title="History" />
      {(error || actionError) && (
        <p className="inline-error" role="alert">
          {error || actionError}
        </p>
      )}
      <div className="workspace-toolbar">
        <select
          aria-label="History habit"
          value={habitId}
          onChange={(e) => {
            setHabitId(e.target.value);
            setLimit(14);
          }}
        >
          <option value="all">All habits</option>
          {habits.map((h) => (
            <option key={h.id} value={h.id}>
              {privacy ? 'Private habit' : h.name}
            </option>
          ))}
        </select>
        <select
          aria-label="History metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
        >
          <option value="completions">Completions</option>
          <option value="events">Timestamped events</option>
        </select>
        <input
          type="date"
          aria-label="History period end"
          value={end}
          onChange={(e) => {
            if (e.target.value) setEnd(e.target.value);
          }}
        />
      </div>
      <section className="history-comparison" aria-label="Recorded activity comparison">
        <header>
          <div>
            <h2>{metric === 'events' ? 'Recorded events' : 'Recorded completions'}</h2>
            <span className="muted">
              {shiftDay(end, -29)} – {end}
            </span>
          </div>
          <div className="history-period-totals">
            <span>
              <i />
              {currentTotal} this period
            </span>
            <span>
              <i />
              {previousTotal} previous
            </span>
          </div>
        </header>
        <div
          className="history-comparison-chart"
          role="img"
          aria-label={series
            .map((r) => `${r.date}: ${r.current}; ${r.previousDate}: ${r.previous}`)
            .join('; ')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 20, right: 12, bottom: 5, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--hairline)" />
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--ink-subtle)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                width={32}
                tick={{ fill: 'var(--ink-subtle)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload;
                  return active && row ? (
                    <div className="review-trend-tooltip">
                      <span>
                        {row.date}: {row.current}
                      </span>
                      <span>
                        {row.previousDate}: {row.previous}
                      </span>
                    </div>
                  ) : null;
                }}
              />
              <Line
                name="This period"
                dataKey="current"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                name="Previous period"
                dataKey="previous"
                stroke="var(--ink-subtle)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="muted small">
          Recorded entries only. Gaps do not establish clean or missed days.
        </p>
      </section>
      {metric === 'events' && (
        <section className="history-event-ledger" aria-label="Timestamped history">
          <h2>Events</h2>
          {filteredEvents
            .filter((e) => e.occurred_at.slice(0, 10) <= end)
            .slice(0, limit)
            .map((e) => (
              <div className="history-event-row" key={e.id}>
                <time>{e.occurred_at}</time>
                <span className="habit-name">{habits.find((h) => h.id === e.habit_id)?.name}</span>
                {e.note && (
                  <details>
                    <summary>Note</summary>
                    <p className="habit-name">{e.note}</p>
                  </details>
                )}
              </div>
            ))}
          {filteredEvents.length > limit && (
            <button className="btn-ghost" onClick={() => setLimit((l) => l + 25)}>
              Show more events
            </button>
          )}
        </section>
      )}
      <h2 className="history-record-heading">Check-ins</h2>
      {!dates.length && <p className="muted gentle-empty">No check-ins recorded yet.</p>}
      {dates.slice(0, limit).map((date) => (
        <details className="panel history-day" key={date} open={date === today}>
          <summary>
            {date}
            <span className="muted small">{date < today ? 'Locked day' : 'Today'}</span>
          </summary>
          {filteredLogs
            .filter((l) => l.log_date === date)
            .map((l) => {
              const h = habits.find((h) => h.id === l.habit_id);
              if (!h) return null;
              const status = dayOutcome(h, logs, date, today);
              return (
                <article className="history-row" key={l.id}>
                  <div>
                    <Link className="habit-name habit-title" to={`/habits/${h.id}`}>
                      {h.name}
                    </Link>
                    <span className="history-status">
                      {status.replace('_', ' ')}
                      {h.is_archived ? ' · archived' : ''}
                    </span>
                    {h.habit_type === 'quantity' && (
                      <p className="muted small">
                        {l.quantity} {h.quantity_unit}
                      </p>
                    )}
                    {l.note && <p className="habit-name muted">{l.note}</p>}
                    {(l.missed_reason || l.slip_reason || l.freeze_reason) && (
                      <p className="habit-name muted small">
                        {l.outcome === 'freeze'
                          ? `${l.freeze_reason} · ${l.freeze_note || ''}`
                          : l.slip_reason || l.missed_reason}
                      </p>
                    )}
                  </div>
                  {date < today && ['missed', 'slip'].includes(status) && (
                    <button
                      className="btn-secondary"
                      onClick={() => setReason({ habitId: h.id, habitName: h.name, logDate: date })}
                    >
                      {l.missed_reason ? 'Edit reason' : 'Add missed reason'}
                    </button>
                  )}
                </article>
              );
            })}
        </details>
      ))}
      {dates.length > limit && (
        <button className="btn-ghost" onClick={() => setLimit((l) => l + 25)}>
          Show earlier check-ins
        </button>
      )}
      {reason && (
        <MissedReasonModal
          habitName={reason.habitName}
          logDate={reason.logDate}
          onClose={() => setReason(null)}
          onSave={async (value) => {
            try {
              await mutate(() => window.habitAPI.addMissedReason({ ...reason, reason: value }));
              setReason(null);
            } catch (e) {
              setActionError((e as Error).message);
            }
          }}
        />
      )}
    </div>
  );
}
