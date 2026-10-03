import { usePrivacy } from '../../hooks/PrivacyContext';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, X, ArrowUp, CalendarCheck, Timer } from 'lucide-react';
import { localDate } from '../../../shared/productivity';
import type { PlanPriority, PriorityKind } from '../../../shared/reflection';
import '../../styles/document-pages.css';
import { PageHeader, Empty } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { useReflection } from './useReflection';
import { SearchPicker } from '../../components/SearchPicker';
import { studyOptions } from '../../../shared/picker';
import { ActionError, Field, LoadState, Panel, Select, useAction } from './ui';
export default function Plan() {
  const privacy = usePrivacy();
  const navigate = useNavigate();
  const { snapshot } = useReflection(),
    action = useAction(),
    [date, setDate] = useState(localDate()),
    [priorities, setPriorities] = useState<PlanPriority[]>([]),
    [topics, setTopics] = useState<string[]>([]),
    [sleep, setSleep] = useState(''),
    [energy, setEnergy] = useState(''),
    [choice, setChoice] = useState('free'),
    [title, setTitle] = useState('');
  const saved = snapshot?.plans.find((p) => p.date === date);
  useEffect(() => {
    setPriorities(saved?.priorities || []);
    setTopics(saved?.studyTopicIds || []);
    setSleep(
      saved?.evening.sleep === undefined || saved.evening.sleep === null
        ? ''
        : String(saved.evening.sleep),
    );
    setEnergy(
      saved?.evening.energy === undefined || saved.evening.energy === null
        ? ''
        : String(saved.evening.energy),
    );
    // Hydrate when opening a day. Background saves must not erase an unfinished
    // journal line, sleep input, or priority draft in this same workspace.
  }, [date, !!snapshot]);
  if (!snapshot) return <LoadState />;
  const source = snapshot.source,
    options = [
      ...source.productivity.tasks
        .filter((t) => !t.completedAt)
        .map((t) => ({
          value: `task:${t.id}`,
          label: t.title,
          group: 'task',
          groupLabel: 'Tasks',
        })),
      ...source.habits
        .filter((h) => !h.is_archived)
        .map((h) => ({
          value: `habit:${h.id}`,
          label: privacy ? 'Private habit' : h.name || 'Habit',
          group: 'habit',
          groupLabel: 'Habits',
        })),
      ...studyOptions(source.study),
    ];
  const add = () => {
    if (priorities.length >= 3) return;
    const [kind, ...rest] = choice.split(':'),
      linkId = rest.join(':') || null;
    const linked = options.find((o) => o.value === choice)?.label;
    if (!(choice === 'free' ? title.trim() : linked)) return;
    setPriorities([
      ...priorities,
      {
        id: crypto.randomUUID(),
        kind: kind as PriorityKind,
        linkId,
        title:
          choice === 'free'
            ? title.trim()
            : kind === 'habit'
              ? source.habits.find((h) => String(h.id) === linkId)?.name || 'Habit'
              : linked!,
        done: false,
      },
    ]);
    setTitle('');
  };
  const save = () =>
    window.workspaceAPI.invoke('plan:save', { date, priorities, studyTopicIds: topics });
  const changeTopics = (next: string[]) => {
    setTopics(next);
    void action.run(
      () => window.workspaceAPI.invoke('plan:save', { date, priorities, studyTopicIds: next }),
      'Study plan updated',
    );
  };
  const selectedTopics = topics
    .map((id) => source.study.topics.find((t) => t.id === id))
    .filter((t) => t !== undefined);
  const close = async () => {
    await save();
    await window.workspaceAPI.invoke('plan:evening', {
      date,
      doneIds: priorities.filter((p) => p.done).map((p) => p.id),
      sleep: sleep === '' ? null : Number(sleep),
      energy: energy === '' ? null : Number(energy),
    });
  };
  return (
    <div className="reflection-page plan-page">
      <PageHeader
        title="Daily plan"
        description="Give today a clear direction. Three priorities are enough."
        action={
          <Input
            className="reflection-date"
            aria-label="Plan date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        }
      />
      <div className="plan-context">
        <span>
          {priorities.filter((p) => p.done).length} / {priorities.length} priorities complete
        </span>
        <Link to={`/journal?date=${date}`}>Open today’s journal</Link>
        <Link to="/goals">Your goals</Link>
        <Link to="/review">Review this week</Link>
      </div>
      <ActionError error={action.error} />
      <div className="reflection-layout">
        <div className="reflection-stack">
          <Panel
            title="Your priorities"
            description={`${priorities.length} of 3 priorities · ${saved?.evening.completedAt ? 'Evening review saved' : 'Choose what matters, then review it this evening.'}`}
          >
            {!priorities.length && (
              <Empty
                icon={<CalendarCheck />}
                title="Make room for what matters"
                description="Link a task, habit or study topic, or write a priority in your own words."
              />
            )}
            <ul className="reflection-list">
              {priorities.map((p, index) => (
                <li key={p.id} className="reflection-row">
                  <Checkbox
                    id={`priority-${p.id}`}
                    checked={p.done}
                    onCheckedChange={(done) =>
                      setPriorities(
                        priorities.map((q) => (q.id === p.id ? { ...q, done: done === true } : q)),
                      )
                    }
                  />
                  <label htmlFor={`priority-${p.id}`}>
                    {privacy && p.kind === 'habit' ? 'Private habit' : p.title}
                    <div>
                      <Badge variant="secondary">{p.kind}</Badge>
                    </div>
                  </label>
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Move ${privacy && p.kind === 'habit' ? 'private habit' : p.title} up`}
                      onClick={() => {
                        const next = [...priorities];
                        [next[index - 1], next[index]] = [next[index], next[index - 1]];
                        setPriorities(next);
                      }}
                    >
                      <ArrowUp />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${privacy && p.kind === 'habit' ? 'private habit' : p.title}`}
                    onClick={() => setPriorities(priorities.filter((q) => q.id !== p.id))}
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
            {priorities.length < 3 && (
              <div className="reflection-stack">
                <Field label="Add a priority">
                  <SearchPicker
                    label="Link a priority"
                    value={choice === 'free' ? '' : choice}
                    options={options}
                    onChange={(value) => setChoice(value || 'free')}
                    emptyLabel="Write a priority"
                    allowClear
                    clearLabel="Write a priority"
                  />
                </Field>
                {choice === 'free' && (
                  <Input
                    aria-label="Priority title"
                    placeholder="What deserves your attention?"
                    maxLength={500}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        add();
                      }
                    }}
                  />
                )}
                <Button
                  variant="secondary"
                  onClick={add}
                  disabled={choice === 'free' && !title.trim()}
                >
                  <Plus />
                  Add priority
                </Button>
              </div>
            )}
            <div className="reflection-actions">
              <Button
                disabled={action.busy}
                onClick={() => void action.run(save, 'Daily plan saved')}
              >
                Save priorities
              </Button>
              <span className="reflection-caption">
                Plan completions keep linked records separate.
              </span>
            </div>
          </Panel>
          <details className="plan-evening">
            <summary>Close the day · sleep and energy</summary>
            <Panel
              title="Evening reflection"
              description="Record what happened. Completion here describes your plan; linked records keep their own history."
            >
              <div className="reflection-stack">
                <Link to={`/journal?date=${date}`} className="text-link">
                  Write freely in your daily journal →
                </Link>
                <div className="reflection-grid">
                  <Field label="Sleep hours (optional)">
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={sleep}
                      onChange={(e) => setSleep(e.target.value)}
                    />
                  </Field>
                  <Field label="Energy (optional)">
                    <Select value={energy} onChange={(e) => setEnergy(e.target.value)}>
                      <option value="">Not recorded</option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} / 5
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="reflection-actions">
                  <Button
                    disabled={action.busy}
                    onClick={() => void action.run(close, 'Evening reflection saved')}
                  >
                    Save evening reflection
                  </Button>
                </div>
              </div>
            </Panel>
          </details>
        </div>
        <Panel
          title="Today’s study plan"
          description={`${topics.length} chosen for ${date === localDate() ? 'today' : 'this day'}. Choose a few topics, then start with one.`}
        >
          <div className="reflection-stack">
            <SearchPicker
              label="Add study topic"
              value=""
              options={studyOptions(source.study).filter((o) => !topics.includes(o.value.slice(6)))}
              disabled={action.busy}
              emptyLabel="Find a topic to study"
              onChange={(value) => changeTopics([...topics, value.slice(6)])}
            />
            <div className="plan-study-list" aria-label="Selected study topics">
              {selectedTopics.map((t) => (
                <div key={t.id} className="plan-study-row">
                  <div>
                    <strong>{t.title}</strong>
                    <small className="muted">
                      {source.study.curricula.find((c) => c.id === t.curriculumId)?.title}
                      {t.reviewDue && t.reviewDue <= date ? ' · Review due' : ''}
                    </small>
                    {source.productivity.timer.startedAt === null ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={action.busy}
                        onClick={() =>
                          void action.run(async () => {
                            await save();
                            await window.workspaceAPI.invoke('focus:command', {
                              action: 'configure',
                              timerMode: 'pomodoro',
                              phase: 'focus',
                              link: {
                                type: 'study',
                                id: t.id,
                                name: t.title,
                                curriculumId: t.curriculumId,
                              },
                            });
                            await window.workspaceAPI.invoke('focus:command', { action: 'start' });
                            navigate('/focus');
                          }, 'Study focus started')
                        }
                      >
                        <Timer />
                        Start focus
                      </Button>
                    ) : (
                      <Link to="/focus">Open active focus</Link>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={action.busy}
                    aria-label={`Remove study topic ${t.title}`}
                    onClick={() => changeTopics(topics.filter((id) => id !== t.id))}
                  >
                    <X />
                  </Button>
                </div>
              ))}
            </div>
            {!topics.length && (
              <p className="muted">
                Your whole roadmap stays in Study. Only the topics you choose appear here.
              </p>
            )}
            <p className="muted small">
              Topic choices save automatically. Time is logged to the topic and its parent chapters.
            </p>
            <Link to="/study" className="reflection-widget-link">
              Open Study
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
