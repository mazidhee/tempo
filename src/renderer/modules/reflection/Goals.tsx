import { usePrivacy } from '../../hooks/PrivacyContext';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Archive, Pencil } from 'lucide-react';
import { localDate } from '../../../shared/productivity';
import { shiftDay } from '../../../shared/habits';
import type { Goal, GoalKind, SaveGoal } from '../../../shared/reflection';
import { PageHeader, Empty } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useReflection } from './useReflection';
import { ActionError, Field, LoadState, Panel, Select, useAction } from './ui';
const fresh = (): SaveGoal => ({
  title: '',
  kind: 'tasks',
  linkType: 'all',
  linkId: '',
  start: localDate(),
  deadline: shiftDay(localDate(), 27),
  target: 10,
  weeks: 4,
  archived: false,
});
export default function Goals() {
  const privacy = usePrivacy();
  const { snapshot } = useReflection(),
    action = useAction(),
    [draft, setDraft] = useState<SaveGoal>(fresh),
    [showArchived, setShowArchived] = useState(false);
  if (!snapshot) return <LoadState />;
  const source = snapshot.source;
  const types: Record<GoalKind, Goal['linkType'][]> = {
    habit: ['habit'],
    focus: ['all', 'project', 'curriculum', 'tag'],
    chapter: ['chapter', 'curriculum'],
    tasks: ['all', 'project', 'tag'],
  };
  const options =
    draft.linkType === 'habit'
      ? source.habits.map((h) => ({
          id: String(h.id),
          title: privacy ? 'Private habit' : h.name || 'Habit',
        }))
      : draft.linkType === 'curriculum'
        ? source.study.curricula.map((c) => ({ id: c.id, title: c.title }))
        : draft.linkType === 'chapter'
          ? source.study.topics
              .filter((t) => !t.archived)
              .map((t) => ({
                id: t.id,
                title: `${source.study.curricula.find((c) => c.id === t.curriculumId)?.title} · ${t.title}`,
              }))
          : draft.linkType === 'project'
            ? [
                ...new Set(
                  source.productivity.tasks
                    .map((t) => t.project)
                    .filter(Boolean)
                    .concat(
                      source.productivity.sessions
                        .map((s) => s.link?.project || '')
                        .filter(Boolean),
                    ),
                ),
              ].map((id) => ({ id, title: id }))
            : draft.linkType === 'tag'
              ? [...new Set(source.productivity.tasks.flatMap((t) => t.tags))].map((id) => ({
                  id,
                  title: id,
                }))
              : [];
  const changeKind = (kind: GoalKind) =>
    setDraft({
      ...draft,
      kind,
      linkType: types[kind][0],
      linkId: '',
      target: kind === 'habit' ? 3 : kind === 'chapter' ? 1 : 10,
    });
  const save = async () => {
    await window.workspaceAPI.invoke('goals:save', draft);
    setDraft(fresh());
  };
  const destination = (g: Goal) =>
    g.linkType === 'habit'
      ? `/habits/${g.linkId}`
      : g.linkType === 'chapter' || g.linkType === 'curriculum'
        ? '/study'
        : g.kind === 'tasks'
          ? '/tasks'
          : '/focus';
  return (
    <div className="reflection-page">
      <PageHeader
        title="Goals"
        description="Set a direction. Your existing activity supplies the progress."
      />
      <ActionError error={action.error} />
      <div className="reflection-layout">
        <div className="reflection-stack">
          {!snapshot.goalProgress.length && (
            <Empty
              icon={<Target />}
              title="Give your progress a direction"
              description="Link a habit, focused project, chapter or task target. Tempo computes progress from your recorded activity."
            />
          )}
          {snapshot.goalProgress.map((p) => (
            <Panel
              key={p.goal.id}
              title={privacy && p.goal.kind === 'habit' ? 'Private habit goal' : p.goal.title}
              description={`${p.goal.start} – ${p.goal.deadline}`}
            >
              <div className="reflection-stack">
                <div className="reflection-actions">
                  <Badge variant="secondary">
                    {p.status === 'on-track'
                      ? 'On track'
                      : p.status === 'behind'
                        ? 'Behind'
                        : 'Complete'}
                  </Badge>
                  <span className="reflection-stat">
                    {Number(p.current.toFixed(2))} / {p.target}{' '}
                    {p.goal.kind === 'habit'
                      ? 'weeks'
                      : p.goal.kind === 'focus'
                        ? 'hours'
                        : p.goal.kind === 'chapter'
                          ? 'topics'
                          : 'tasks'}
                  </span>
                </div>
                <progress
                  aria-label={`${privacy && p.goal.kind === 'habit' ? 'Private habit goal' : p.goal.title} progress`}
                  className="reflection-progress"
                  max={100}
                  value={p.percent}
                />
                <p className="reflection-caption">{p.detail}</p>
                <div className="reflection-actions">
                  <Link className="reflection-widget-link" to={destination(p.goal)}>
                    Open linked activity
                  </Link>
                  <Button variant="ghost" onClick={() => setDraft(p.goal)}>
                    <Pencil />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={action.busy}
                    onClick={() =>
                      void action.run(
                        () =>
                          window.workspaceAPI.invoke('goals:archive', {
                            id: p.goal.id,
                            archived: true,
                          }),
                        'Goal archived',
                      )
                    }
                  >
                    <Archive />
                    Archive
                  </Button>
                </div>
              </div>
            </Panel>
          ))}
          <Button variant="ghost" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? 'Hide archived goals' : 'Show archived goals'}
          </Button>
          {showArchived &&
            snapshot.goals
              .filter((g) => g.archived)
              .map((g) => (
                <div className="reflection-row" key={g.id}>
                  <span className="reflection-grow">
                    {privacy && g.kind === 'habit' ? 'Private habit goal' : g.title}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={action.busy}
                    onClick={() =>
                      void action.run(
                        () =>
                          window.workspaceAPI.invoke('goals:archive', {
                            id: g.id,
                            archived: false,
                          }),
                        'Goal restored',
                      )
                    }
                  >
                    Restore
                  </Button>
                </div>
              ))}
        </div>
        <Panel
          title={draft.id ? 'Edit goal' : 'Create a goal'}
          description="On track compares recorded progress with the elapsed goal period; habit goals compare completed seven-day periods."
        >
          <form
            className="reflection-stack"
            onSubmit={(e) => {
              e.preventDefault();
              void action.run(save, 'Goal saved');
            }}
          >
            <Field label="Goal title">
              <Input
                required
                maxLength={500}
                disabled={privacy && draft.kind === 'habit'}
                value={privacy && draft.kind === 'habit' ? 'Private habit goal' : draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </Field>
            <Field label="Goal type">
              <Select value={draft.kind} onChange={(e) => changeKind(e.target.value as GoalKind)}>
                <option value="habit">Habit frequency for N weeks</option>
                <option value="focus">Focus hours by a date</option>
                <option value="chapter">Finish a chapter or curriculum</option>
                <option value="tasks">Complete a number of tasks</option>
              </Select>
            </Field>
            <Field label="Link to">
              <Select
                value={draft.linkType}
                onChange={(e) =>
                  setDraft({ ...draft, linkType: e.target.value as Goal['linkType'], linkId: '' })
                }
              >
                {types[draft.kind].map((type) => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All activity' : type}
                  </option>
                ))}
              </Select>
            </Field>
            {draft.linkType !== 'all' && (
              <Field label="Linked record">
                <Select
                  required
                  value={draft.linkId}
                  onChange={(e) => setDraft({ ...draft, linkId: e.target.value })}
                >
                  <option value="">Choose {draft.linkType}</option>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            {draft.kind !== 'chapter' && (
              <Field
                label={
                  draft.kind === 'habit'
                    ? 'Completions per week'
                    : draft.kind === 'focus'
                      ? 'Target hours'
                      : 'Task target'
                }
              >
                <Input
                  required
                  type="number"
                  min={draft.kind === 'focus' ? 0.01 : 1}
                  max={draft.kind === 'habit' ? 7 : 100000}
                  step={draft.kind === 'focus' ? 0.25 : 1}
                  value={draft.target}
                  onChange={(e) => setDraft({ ...draft, target: Number(e.target.value) })}
                />
              </Field>
            )}
            {draft.kind === 'habit' && (
              <Field label="Number of weeks">
                <Input
                  required
                  type="number"
                  min={1}
                  max={520}
                  value={draft.weeks}
                  onChange={(e) => {
                    const weeks = Number(e.target.value);
                    setDraft({ ...draft, weeks, deadline: shiftDay(draft.start, weeks * 7 - 1) });
                  }}
                />
              </Field>
            )}
            <div className="reflection-grid">
              <Field label="Start date">
                <Input
                  required
                  type="date"
                  value={draft.start}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      start: e.target.value,
                      ...(draft.kind === 'habit'
                        ? { deadline: shiftDay(e.target.value, draft.weeks * 7 - 1) }
                        : {}),
                    })
                  }
                />
              </Field>
              <Field label="Deadline">
                <Input
                  required
                  type="date"
                  min={draft.start}
                  value={draft.deadline}
                  onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
                />
              </Field>
            </div>
            <div className="reflection-actions">
              <Button type="submit" disabled={action.busy}>
                Save goal
              </Button>
              {draft.id && (
                <Button type="button" variant="secondary" onClick={() => setDraft(fresh())}>
                  Cancel editing
                </Button>
              )}
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
