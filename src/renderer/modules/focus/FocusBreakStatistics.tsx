import { useFocus } from './useFocus';
import { localDate } from '../../../shared/productivity';
export function FocusBreakStatistics() {
  const { snapshot, error } = useFocus();
  if (!snapshot) return <p role="status">{error || 'Loading Focus Guard history…'}</p>;
  const events = snapshot.events.filter((e) => localDate(new Date(e.at)) === localDate());
  const attempts = events.filter((e) => e.kind === 'attempt'),
    exits = events.filter((e) => e.kind === 'emergency');
  return (
    <section className="panel">
      <h2>Focus breaks today</h2>
      <p>
        {exits.length} emergency exits · {attempts.length} chosen app attempts
      </p>
      {events
        .slice(-8)
        .reverse()
        .map((e) => (
          <div className="session-row" key={e.id}>
            <span>{e.kind === 'emergency' ? 'Emergency focus break' : e.target}</span>
            <span className="muted">
              {new Date(e.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      {!events.length && <p className="muted">No focus breaks recorded today.</p>}
    </section>
  );
}
