import { usePrivacy } from '../../hooks/PrivacyContext';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, ArrowUp, CalendarCheck } from 'lucide-react';
import { localDate } from '../../../shared/productivity';
import type { PlanPriority, PriorityKind } from '../../../shared/reflection';
import { PageHeader, Empty } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { useReflection } from './useReflection';
import { ActionError, Field, LoadState, Panel, ReflectionNav, Select, useAction } from './ui';
export default function Plan() {
  const privacy = usePrivacy();
  const { snapshot } = useReflection(),
    action = useAction(),
    [date, setDate] = useState(localDate()),
    [priorities, setPriorities] = useState<PlanPriority[]>([]),
    [topics, setTopics] = useState<string[]>([]),
    [journal, setJournal] = useState(''),
    [sleep, setSleep] = useState(''),
    [energy, setEnergy] = useState(''),
    [choice, setChoice] = useState('free'),
    [title, setTitle] = useState('');
  const saved = snapshot?.plans.find((p) => p.date === date),
    savedJournal = snapshot?.journal.find((j) => j.date === date);
  useEffect(() => {
    setPriorities(saved?.priorities || []);
    setTopics(saved?.studyTopicIds || []);
    setJournal(savedJournal?.text || '');
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
  }, [date, saved?.updatedAt, savedJournal?.updatedAt]);
  if (!snapshot) return <LoadState />;
  const source = snapshot.source,
    options = [
      ...source.productivity.tasks
        .filter((t) => !t.completedAt)
        .map((t) => ({ value: `task:${t.id}`, label: `Task · ${t.title}` })),
      ...source.habits
        .filter((h) => !h.is_archived)
        .map((h) => ({
          value: `habit:${h.id}`,
          label: `Habit · ${privacy ? 'Private habit' : h.name}`,
        })),
      ...source.study.topics
        .filter(
          (t) =>
            !t.archived &&
            source.study.curricula.some((c) => c.id === t.curriculumId && !c.archived),
        )
        .map((t) => ({ value: `study:${t.id}`, label: `Study · ${t.title}` })),
    ];
  const add = () => {
    if (priorities.length >= 3) return;
    const [kind, ...rest] = choice.split(':'),
      linkId = rest.join(':') || null;
    const linked = options
      .find((o) => o.value === choice)
      ?.label.split(' · ')
      .slice(1)
      .join(' · ');
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
  const close = async () => {
    await save();
    await window.workspaceAPI.invoke('plan:evening', {
      date,
      doneIds: priorities.filter((p) => p.done).map((p) => p.id),
      journal,
      sleep: sleep === '' ? null : Number(sleep),
      energy: energy === '' ? null : Number(energy),
    });
  };
  return (
    <div className="reflection-page">
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
      <ReflectionNav />
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
                  <Select value={choice} onChange={(e) => setChoice(e.target.value)}>
                    <option value="free">Write a priority</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
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
          </Panel>
          <Panel
            title="Evening reflection"
            description="Record what happened. Completion here describes your plan; linked records keep their own history."
          >
            <div className="reflection-stack">
              <Field label="A sentence about your day">
                <textarea
                  className="reflection-textarea"
                  maxLength={20000}
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  placeholder="What would you like to remember?"
                />
              </Field>
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
                <Button
                  variant="secondary"
                  disabled={action.busy}
                  onClick={() => void action.run(save, 'Daily plan saved')}
                >
                  Save plan
                </Button>
              </div>
            </div>
          </Panel>
        </div>
        <Panel
          title="Today’s study plan"
          description="Keep your learning commitments alongside your priorities."
        >
          <div className="reflection-stack">
            {source.study.topics
              .filter(
                (t) =>
                  !t.archived &&
                  source.study.curricula.some((c) => c.id === t.curriculumId && !c.archived),
              )
              .map((t) => (
                <label key={t.id} className="reflection-check">
                  <Checkbox
                    checked={topics.includes(t.id)}
                    onCheckedChange={(checked) =>
                      setTopics(checked ? [...topics, t.id] : topics.filter((id) => id !== t.id))
                    }
                  />
                  <span>
                    {t.title}
                    <span className="reflection-caption">
                      {' '}
                      · {source.study.curricula.find((c) => c.id === t.curriculumId)?.title}
                      {t.reviewDue && t.reviewDue <= date ? ' · Review due' : ''}
                    </span>
                  </span>
                </label>
              ))}
            {!source.study.topics.length && (
              <p className="muted">
                Add a curriculum and topics in Study to plan a learning session.
              </p>
            )}
            <Link to="/study" className="reflection-widget-link">
              Open Study
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
