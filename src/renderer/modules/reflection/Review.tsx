import { usePrivacy } from '../../hooks/PrivacyContext';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/document-pages.css';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { shiftDay } from '../../../shared/habits';
import { WeeklyFocusChart } from './WeeklyFocusChart';
import '../../styles/reflection-documents.css';
import { localDate } from '../../../shared/productivity';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui';
import { Input } from '../../components/ui/input';
import { useReflection } from './useReflection';
import { ActionError, Field, LoadState, Select, useAction } from './ui';
const hours = (seconds: number) => `${(seconds / 3600).toFixed(1)} h`;
function Breakdown({ title, values }: { title: string; values: Record<string, number> }) {
  return (
    <div>
      <h3>{title}</h3>
      {Object.entries(values).length ? (
        <dl>
          {Object.entries(values)
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => (
              <div className="reflection-row" key={label}>
                <dt className="reflection-grow">{label}</dt>
                <dd className="reflection-stat">{hours(value)}</dd>
              </div>
            ))}
        </dl>
      ) : (
        <p className="muted">No focus sessions recorded.</p>
      )}
    </div>
  );
}
function ReviewSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <details className="review-section">
      <summary>{title}</summary>
      <div>
        {description && <p className="muted">{description}</p>}
        {children}
      </div>
    </details>
  );
}
export default function Review() {
  const privacy = usePrivacy();
  const { snapshot } = useReflection(),
    action = useAction(),
    [date, setDate] = useState(localDate()),
    [selected, setSelected] = useState(''),
    [obstacle, setObstacle] = useState(''),
    [change, setChange] = useState(''),
    [weekPicker, setWeekPicker] = useState(false);
  const review = snapshot?.reviews.find((r) => r.start === selected);
  useEffect(() => {
    if (snapshot?.reviews.length && !selected) setSelected(snapshot.reviews[0].start);
  }, [snapshot, selected]);
  useEffect(() => {
    if (!review) return;
    let draft: { obstacle?: string; change?: string } = {};
    try {
      draft = JSON.parse(localStorage.getItem('tempo-review-draft:' + review.start) || '{}');
    } catch {
      /* Saved reflection remains available. */
    }
    setObstacle(typeof draft.obstacle === 'string' ? draft.obstacle : review.obstacle || '');
    setChange(typeof draft.change === 'string' ? draft.change : review.change || '');
  }, [review?.start, review?.editedAt, review?.generatedAt]);
  if (!snapshot) return <LoadState />;
  const writeDraft = (key: 'obstacle' | 'change', value: string) => {
    if (key === 'obstacle') setObstacle(value);
    else setChange(value);
    if (review) {
      try {
        localStorage.setItem(
          'tempo-review-draft:' + review.start,
          JSON.stringify({ obstacle, change, [key]: value }),
        );
      } catch {
        /* In-memory writing stays available for manual save. */
      }
    }
  };
  const saveReflections = async () => {
    if (!review) return;
    const captured = JSON.stringify({ obstacle, change });
    const result = await window.workspaceAPI.invoke('review:save', {
      start: review.start,
      obstacle,
      change,
    });
    if (localStorage.getItem('tempo-review-draft:' + review.start) === captured)
      localStorage.removeItem('tempo-review-draft:' + review.start);
    return result;
  };
  const generate = async () => {
    const result = await window.workspaceAPI.invoke('review:generate', { date });
    setSelected(result.start);
    setWeekPicker(false);
  };
  const refreshActivity = () =>
    void action.run(async () => {
      await saveReflections();
      return window.workspaceAPI.invoke('review:generate', { date: review!.start, refresh: true });
    }, 'Activity snapshot refreshed');
  return (
    <div className="review-page">
      <header className="reflection-document-header">
        <div>
          <h1>Weekly review.</h1>
          <p>Make sense of the week, then choose your next step.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setWeekPicker(true)}>
          <CalendarDays />
          Browse weeks
        </Button>
      </header>
      <ActionError error={action.error} />
      {weekPicker && (
        <Modal title="Choose a review week" onClose={() => setWeekPicker(false)}>
          <div className="review-week-controls">
            <div className="review-saved-week">
              <Select
                aria-label="Saved review week"
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setWeekPicker(false);
                }}
              >
                {!snapshot.reviews.length && <option value="">No saved reviews yet</option>}
                {snapshot.reviews.map((r) => (
                  <option key={r.start} value={r.start}>
                    {r.start} – {r.end}
                  </option>
                ))}
              </Select>
            </div>
            <div className="review-week-date">
              <Input
                aria-label="Week containing"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={action.busy}
              onClick={() => void action.run(generate, 'Weekly review ready')}
            >
              Open week
            </Button>
          </div>
        </Modal>
      )}
      {!review ? (
        <section className="review-empty">
          <h2>Make a little time to look back.</h2>
          <p>
            Browse weeks to choose a week. Tempo gathers your recorded activity into a saved review.
          </p>
        </section>
      ) : (
        <>
          <div className="review-period">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous review week"
              disabled={action.busy}
              onClick={() =>
                void action.run(async () => {
                  const r = await window.workspaceAPI.invoke('review:generate', {
                    date: shiftDay(review.start, -7),
                  });
                  setSelected(r.start);
                  setDate(r.start);
                }, 'Previous week opened')
              }
            >
              <ChevronLeft />
            </Button>
            <h2>
              {new Date(review.start + 'T12:00:00').toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
              })}{' '}
              –{' '}
              {new Date(review.end + 'T12:00:00').toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next review week"
              disabled={action.busy}
              onClick={() =>
                void action.run(async () => {
                  const r = await window.workspaceAPI.invoke('review:generate', {
                    date: shiftDay(review.start, 7),
                  });
                  setSelected(r.start);
                  setDate(r.start);
                }, 'Next week opened')
              }
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="review-overview" aria-label="Weekly overview">
            <div>
              <strong>{hours(review.summary.focus.seconds)}</strong>
              <span>Focused · {hours(review.summary.focus.previousSeconds)} last week</span>
            </div>
            <div>
              <strong>{review.summary.tasks.completed}</strong>
              <span>Tasks completed</span>
            </div>
            <div>
              <strong>{review.summary.study.topicsLearned}</strong>
              <span>Topics learned</span>
            </div>
            <div>
              <strong>{review.summary.habits.reduce((n, h) => n + h.hits, 0)}</strong>
              <span>Habit completions</span>
            </div>
          </div>
          <WeeklyFocusChart
            focus={review.summary.focus}
            busy={action.busy}
            onRefresh={refreshActivity}
          />
          <section className="review-reflections">
            <h2>Take one thing forward</h2>
            <div className="review-writing-grid">
              <Field label="What got in the way?">
                <textarea
                  className="reflection-textarea"
                  disabled={privacy}
                  value={privacy ? 'Private reflection' : obstacle}
                  maxLength={20000}
                  onChange={(e) => writeDraft('obstacle', e.target.value)}
                />
              </Field>
              <Field label="One change for next week">
                <textarea
                  className="reflection-textarea"
                  disabled={privacy}
                  value={privacy ? 'Private reflection' : change}
                  maxLength={20000}
                  onChange={(e) => writeDraft('change', e.target.value)}
                  placeholder="Keep this small and specific."
                />
              </Field>
              <Button
                disabled={action.busy}
                onClick={() => void action.run(saveReflections, 'Review reflections saved')}
              >
                Save reflections
              </Button>
            </div>
          </section>{' '}
          <div className="plan-context">
            <Link to="/plan">Plan your next day</Link>
            <Link to="/study">Continue studying</Link>
            <Link to="/goals">Check your direction</Link>
          </div>
          <p className="reflection-caption">
            {review.start} – {review.end} · Snapshot saved{' '}
            {new Date(review.generatedAt).toLocaleString()}. Saved summaries preserve the activity
            as it was when generated.
          </p>
          <div className="reflection-actions">
            <Button variant="ghost" disabled={action.busy} onClick={refreshActivity}>
              Refresh activity snapshot
            </Button>
            <span className="reflection-caption">Your written reflections are preserved.</span>
          </div>
          <ReviewSection
            title="Habits"
            description="Hits count completions; freezes preserve continuity without counting as completed work. Weekly targets respect each habit’s own week boundary."
          >
            <div className="reflection-table-wrap">
              <table className="reflection-table">
                <thead>
                  <tr>
                    <th>Habit</th>
                    <th>Hits / target</th>
                    <th>Misses</th>
                    <th>Freezes</th>
                    <th>Streak before → after</th>
                  </tr>
                </thead>
                <tbody>
                  {review.summary.habits.map((h) => (
                    <tr key={h.id}>
                      <td>{privacy ? 'Private habit' : h.name}</td>
                      <td>
                        {h.hits} / {h.target}
                      </td>
                      <td>{h.misses}</td>
                      <td>{h.freezes}</td>
                      <td>
                        {h.streakBefore} → {h.streakAfter}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!review.summary.habits.length && <p className="muted">No habits in this week.</p>}
            <h3>Logged missed reasons</h3>
            {Object.entries(review.summary.reasons).length ? (
              <ul>
                {Object.entries(review.summary.reasons).map(([reason, count]) => (
                  <li key={reason}>
                    {privacy ? 'Private reason' : reason} · {count}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No missed reasons logged.</p>
            )}
          </ReviewSection>
          <ReviewSection
            title="Focus"
            description={`${hours(review.summary.focus.seconds)} this week · ${hours(review.summary.focus.previousSeconds)} last week · Best day: ${review.summary.focus.bestDay || 'No recorded focus'}`}
          >
            <div className="reflection-grid">
              <Breakdown title="By project" values={review.summary.focus.byProject} />
              <Breakdown title="By curriculum" values={review.summary.focus.byCurriculum} />
              <Breakdown title="By preset" values={review.summary.focus.byPreset} />
            </div>
          </ReviewSection>
          <div className="reflection-layout">
            <ReviewSection
              title="Learning"
              description={`${review.summary.study.topicsLearned} topics learned · ${review.summary.study.reviews} reviews completed`}
            >
              <p>
                Recall grades:{' '}
                {review.summary.study.retentionPercent === null
                  ? 'No reviews this week'
                  : `${review.summary.study.retentionPercent}% (${review.summary.study.retained}/${review.summary.study.reviews})`}
              </p>
              <p className="reflection-caption">{review.summary.study.retentionLabel}</p>
              <ul className="reflection-list">
                {review.summary.study.progress.map((c) => (
                  <li className="reflection-row" key={c.id}>
                    <span className="reflection-grow">{c.title}</span>
                    <span className="reflection-stat">
                      {c.learned}/{c.total} learned
                    </span>
                  </li>
                ))}
              </ul>
            </ReviewSection>
            <ReviewSection title="Plans and tasks">
              <div className="reflection-stack">
                <p>
                  {review.summary.plans.done} / {review.summary.plans.total} priorities completed
                </p>
                <p>{review.summary.plans.evenings} evening reflections saved</p>
                <p>
                  {review.summary.tasks.completed} tasks completed · {review.summary.tasks.created}{' '}
                  created
                </p>
              </div>
            </ReviewSection>
          </div>
          <ReviewSection title="The week in your words">
            {review.summary.journal.length ? (
              <ul className="reflection-list">
                {review.summary.journal.map((j) => (
                  <li key={j.date} className="reflection-row">
                    <div>
                      <Link to={`/journal?date=${j.date}`} className="text-link">
                        {j.date} · Open journal
                      </Link>
                      <p className="reflection-journal-line">
                        {privacy ? 'Private journal line' : j.text || 'Empty journal line'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No journal lines saved this week.</p>
            )}
          </ReviewSection>
          <ReviewSection
            title="Patterns to consider"
            description="Simple correlations from recorded days. These do not establish cause and effect."
          >
            {review.summary.correlations.length ? (
              review.summary.correlations.map((line) => <p key={line}>{line}</p>)
            ) : (
              <p className="muted">
                Record sleep or energy on at least three days to compare recorded days with focus
                time.
              </p>
            )}
          </ReviewSection>
        </>
      )}
    </div>
  );
}
