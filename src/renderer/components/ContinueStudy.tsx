import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { useStudy } from '../hooks/useStudy';
import { useStudyFocus } from '../hooks/useStudyFocus';
import { useProductivity } from '../hooks/ProductivityProvider';
import { isStudyFocus, studyContinuation } from '../../shared/studyContinuity';
import { formatStudyTime } from '../../shared/time';
import { studyTimeTotals } from '../../shared/study';
import '../styles/study-workspace.css';
export default function ContinueStudy() {
  const { snapshot, ready, error } = useStudy();
  const { state } = useProductivity();
  const focus = useStudyFocus();
  const current = snapshot.curricula.filter((c) => isStudyFocus(c)),
    time = studyTimeTotals(snapshot, state.sessions);
  return (
    <section className="continue-study" aria-label="Continue studying">
      <div className="section-heading">
        <h2>Continue studying</h2>
        <Link className="text-link" to="/study">
          Study library <ArrowRight />
        </Link>
      </div>
      {(error || focus.error) && (
        <p role="alert" className="inline-error">
          {error || focus.error}
        </p>
      )}
      {!ready && !error && <p className="muted">Opening your study paths…</p>}
      {ready && !current.length && (
        <p className="muted">Choose your current focus in Study to keep your next topic here.</p>
      )}
      <div className="continue-study-list">
        {current.map((c) => {
          const continuation = studyContinuation(snapshot, c, state.sessions, state.timer),
            topic = continuation.topic;
          return (
            <article key={c.id} className="continue-study-item">
              <div>
                <Link className="continue-curriculum" to={`/study/${c.id}`}>
                  {c.title}
                </Link>
                <Link
                  className="continue-topic"
                  to={`/study/${c.id}${topic ? `?topic=${topic.id}` : ''}`}
                >
                  {topic
                    ? continuation.path
                        .slice(-2)
                        .map((t) => t.title)
                        .join(' › ')
                    : continuation.complete
                      ? 'Your learning path is complete'
                      : 'Add a topic to begin'}
                </Link>
                <p className="muted small">
                  {continuation.lastSession
                    ? `Last studied ${new Date(continuation.lastSession.endedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${formatStudyTime(time.topicSeconds[topic!.id] || 0)} on this topic`
                    : 'Ready when you are'}
                  {c.focusUntil ? ` · Focus until ${c.focusUntil}` : ''}
                </p>
                {continuation.next && (
                  <p className="muted small continue-next">Next: {continuation.next.title}</p>
                )}
              </div>
              {topic && (
                <button
                  className="btn-secondary"
                  disabled={focus.busy}
                  onClick={() => void focus.start(c, topic)}
                  aria-label={`Start focus in ${c.title}`}
                >
                  <Play />
                  Start focus
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
