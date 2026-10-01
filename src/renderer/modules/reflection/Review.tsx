import { usePrivacy } from '../../hooks/PrivacyContext';
import { useEffect, useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { localDate } from '../../../shared/productivity';
import { weekStart } from '../../../shared/habits';
import { PageHeader, Empty } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useReflection } from './useReflection';
import { ActionError, Field, LoadState, Panel, ReflectionNav, Select, useAction } from './ui';
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
export default function Review() {
  const privacy = usePrivacy();
  const { snapshot } = useReflection(),
    action = useAction(),
    [date, setDate] = useState(localDate()),
    [selected, setSelected] = useState(''),
    [obstacle, setObstacle] = useState(''),
    [change, setChange] = useState('');
  const review = snapshot?.reviews.find((r) => r.start === selected);
  useEffect(() => {
    if (snapshot?.reviews.length && !selected) setSelected(snapshot.reviews[0].start);
  }, [snapshot, selected]);
  useEffect(() => {
    setObstacle(review?.obstacle || '');
    setChange(review?.change || '');
  }, [review?.start, review?.editedAt, review?.generatedAt]);
  if (!snapshot) return <LoadState />;
  const generate = async () => {
    const result = await window.workspaceAPI.invoke('review:generate', { date });
    setSelected(result.start);
  };
  return (
    <div className="reflection-page">
      <PageHeader
        title="Weekly review"
        description="Notice what moved forward and choose one change for next week."
      />
      <ReflectionNav />
      <ActionError error={action.error} />
      <div className="reflection-actions">
        <Field label="Saved week">
          <Select
            aria-label="Saved review week"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {!snapshot.reviews.length && <option value="">No saved reviews yet</option>}
            {snapshot.reviews.map((r) => (
              <option key={r.start} value={r.start}>
                {r.start} – {r.end}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Choose any day in a week">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Button
          disabled={action.busy}
          onClick={() => void action.run(generate, 'Weekly review ready')}
        >
          Open week of {weekStart(date, 1)}
        </Button>
      </div>
      {!review ? (
        <Empty
          icon={<NotebookPen />}
          title="Make time to look back"
          description="Open a week to create a saved summary from your records. Completed weeks are also saved automatically after Sunday evening."
        />
      ) : (
        <>
          <p className="reflection-caption">
            {review.start} – {review.end} · Snapshot saved{' '}
            {new Date(review.generatedAt).toLocaleString()}. Saved summaries preserve the activity
            as it was when generated.
          </p>
          <div className="reflection-actions">
            <Button
              variant="secondary"
              disabled={action.busy}
              onClick={() =>
                void action.run(async () => {
                  await window.workspaceAPI.invoke('review:save', {
                    start: review.start,
                    obstacle,
                    change,
                  });
                  return window.workspaceAPI.invoke('review:generate', {
                    date: review.start,
                    refresh: true,
                  });
                }, 'Activity snapshot refreshed')
              }
            >
              Refresh activity snapshot
            </Button>
            <span className="reflection-caption">Your written reflections are preserved.</span>
          </div>
          <Panel
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
          </Panel>
          <Panel
            title="Focus"
            description={`${hours(review.summary.focus.seconds)} this week · ${hours(review.summary.focus.previousSeconds)} last week · Best day: ${review.summary.focus.bestDay || 'No recorded focus'}`}
          >
            <div className="reflection-grid">
              <Breakdown title="By project" values={review.summary.focus.byProject} />
              <Breakdown title="By curriculum" values={review.summary.focus.byCurriculum} />
              <Breakdown title="By preset" values={review.summary.focus.byPreset} />
            </div>
          </Panel>
          <div className="reflection-layout">
            <Panel
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
            </Panel>
            <Panel title="Plans and tasks">
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
            </Panel>
          </div>
          <Panel title="The week in your words">
            {review.summary.journal.length ? (
              <ul className="reflection-list">
                {review.summary.journal.map((j) => (
                  <li key={j.date} className="reflection-row">
                    <div>
                      <time className="reflection-caption">{j.date}</time>
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
          </Panel>
          <Panel
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
          </Panel>
          <Panel title="Take one thing forward">
            <div className="reflection-stack">
              <Field label="What got in the way?">
                <textarea
                  className="reflection-textarea"
                  disabled={privacy}
                  value={privacy ? 'Private reflection' : obstacle}
                  maxLength={20000}
                  onChange={(e) => setObstacle(e.target.value)}
                />
              </Field>
              <Field label="One change for next week">
                <textarea
                  className="reflection-textarea"
                  disabled={privacy}
                  value={privacy ? 'Private reflection' : change}
                  maxLength={20000}
                  onChange={(e) => setChange(e.target.value)}
                  placeholder="Keep this small and specific."
                />
              </Field>
              <Button
                disabled={action.busy}
                onClick={() =>
                  void action.run(
                    () =>
                      window.workspaceAPI.invoke('review:save', {
                        start: review.start,
                        obstacle,
                        change,
                      }),
                    'Review reflections saved',
                  )
                }
              >
                Save reflections
              </Button>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
