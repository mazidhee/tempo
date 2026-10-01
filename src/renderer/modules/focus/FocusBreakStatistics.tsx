import { useFocus } from './useFocus';
import { localDate } from '../../../shared/productivity';
import { focusEventsInRange } from '../../../shared/focus';
import { usePrivacy } from '../../hooks/PrivacyContext';
export function FocusBreakStatistics({
  start = localDate(),
  end = start,
}: {
  start?: string;
  end?: string;
}) {
  const { snapshot, error } = useFocus();
  const privacy = usePrivacy();
  if (!snapshot) return <p role="status">{error || 'Loading Focus Guard history…'}</p>;
  let events;
  try {
    events = focusEventsInRange(snapshot.events, start, end);
  } catch (e) {
    return <p role="alert">{(e as Error).message}</p>;
  }
  const today = start === localDate() && end === start;
  const dateLabel = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  const range = today
    ? 'today'
    : start === end
      ? `on ${dateLabel(start)}`
      : `from ${dateLabel(start)} to ${dateLabel(end)}`;
  const attempts = events.filter((e) => e.kind === 'attempt'),
    exits = events.filter((e) => e.kind === 'emergency');
  return (
    <section className="panel">
      <h2>Focus breaks {range}</h2>
      <p>
        {exits.length} emergency exits · {attempts.length} chosen app attempts
      </p>
      {events
        .slice(-8)
        .reverse()
        .map((e) => (
          <div className="session-row" key={e.id}>
            <span>
              {e.kind === 'emergency'
                ? 'Emergency focus break'
                : privacy
                  ? 'Private app attempt'
                  : e.target}
            </span>
            <time className="muted" dateTime={e.at}>
              {new Date(e.at).toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
          </div>
        ))}
      {events.length > 8 && (
        <p className="muted small">Showing the latest 8 of {events.length} events in this range.</p>
      )}
      {!events.length && <p className="muted">No focus breaks recorded {range}.</p>}
    </section>
  );
}
