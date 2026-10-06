import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  X,
  ArrowUp,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Check,
  Timer,
  Moon,
} from 'lucide-react';
import { usePrivacy } from '../../hooks/PrivacyContext';
import { useStudyFocus } from '../../hooks/useStudyFocus';
import { localDate } from '../../../shared/productivity';
import { activeTask } from '../../../shared/taskLifecycle';
import { shiftDay, validDate } from '../../../shared/habits';
import { planPriorityLimit, type PriorityKind } from '../../../shared/reflection';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { SearchPicker } from '../../components/SearchPicker';
import { studyOptions } from '../../../shared/picker';
import { useReflection } from './useReflection';
import { usePlanDraft } from './usePlanDraft';
import { usePlanAutosave } from './usePlanAutosave';
import { ActionError, Field, LoadState, Select, useAction } from './ui';
import './daily-plan.css';
export default function Plan() {
  const privacy = usePrivacy(),
    focus = useStudyFocus(),
    action = useAction();
  const { snapshot } = useReflection();
  const [date, setDate] = useState(localDate());
  const [editing, setEditing] = useState<string | null>(null),
    [editTitle, setEditTitle] = useState('');
  const saved = snapshot?.plans.find((p) => p.date === date);
  const draft = usePlanDraft(date, saved, !!snapshot);
  const {
    priorities,
    setPriorities,
    topics,
    setTopics,
    title,
    setTitle,
    sleep,
    setSleep,
    energy,
    setEnergy,
    setChoice,
  } = draft;
  const ready = !!snapshot && draft.date === date;
  const autosave = usePlanAutosave(date, priorities, topics, ready, saved);
  if (!snapshot) return <LoadState />;
  const source = snapshot.source;
  const options = [
    ...source.productivity.tasks
      .filter(activeTask)
      .map((t) => ({
        value: 'task:' + t.id,
        label: t.title,
        group: 'task',
        groupLabel: t.area === 'work' ? 'Work tasks' : 'Tasks',
      })),
    ...source.habits
      .filter((h) => !h.is_archived)
      .map((h) => ({
        value: 'habit:' + h.id,
        label: privacy ? 'Private habit' : h.name || 'Habit',
        group: 'habit',
        groupLabel: 'Habits',
      })),
    ...studyOptions(source.study),
  ];
  const label = (p: (typeof priorities)[number]) =>
    privacy && p.kind === 'habit' ? 'Private habit' : p.title;
  const add = (choice = 'free') => {
    if (!ready || priorities.length >= planPriorityLimit) return;
    const [kind, ...parts] = choice.split(':'),
      linkId = parts.join(':') || null;
    const selected = options.find((o) => o.value === choice);
    const nextTitle =
      choice === 'free'
        ? title.trim()
        : kind === 'habit'
          ? source.habits.find((h) => String(h.id) === linkId)?.name
          : selected?.label;
    if (!nextTitle) return;
    setPriorities([
      ...priorities,
      {
        id: crypto.randomUUID(),
        kind: kind as PriorityKind,
        linkId,
        title: nextTitle,
        done: false,
      },
    ]);
    setTitle('');
    setChoice('free');
  };
  const openDate = (next: string) => {
    if (!validDate(next) || next < '1900-01-01' || next > '2200-12-31') return;
    void autosave.saveNow().catch(() => undefined);
    setEditing(null);
    setDate(next);
  };
  const selectedTopics = topics
    .map((id) => source.study.topics.find((t) => t.id === id))
    .filter((t) => t !== undefined);
  const dayTitle = new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const commitEdit = () => {
    if (editing && editTitle.trim())
      setPriorities(
        priorities.map((p) => (p.id === editing ? { ...p, title: editTitle.trim() } : p)),
      );
    setEditing(null);
  };
  const closeDay = async () => {
    await autosave.saveNow();
    await window.workspaceAPI.invoke('plan:evening', {
      date,
      doneIds: priorities.filter((p) => p.done).map((p) => p.id),
      sleep: sleep === '' ? null : Number(sleep),
      energy: energy === '' ? null : Number(energy),
    });
  };
  return (
    <div className="daily-plan">
      <div className="daily-plan-datebar">
        <Input
          aria-label="Plan date"
          type="date"
          min="1900-01-01"
          max="2200-12-31"
          value={date}
          onChange={(e) => openDate(e.target.value)}
        />
        <div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous plan day"
            disabled={!ready || date === '1900-01-01'}
            onClick={() => openDate(shiftDay(date, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openDate(localDate())}>
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next plan day"
            disabled={!ready || date === '2200-12-31'}
            onClick={() => openDate(shiftDay(date, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <header className="daily-plan-header">
        <h1>{date === localDate() ? 'Make room for today.' : dayTitle}</h1>
        <p>A clear place to begin. Choose what matters, then take the first step.</p>
      </header>
      <ActionError error={action.error || draft.draftError || autosave.error || focus.error} />
      <section aria-labelledby="plan-priorities-heading">
        <div className="daily-plan-section-heading">
          <h2 id="plan-priorities-heading">Your priorities</h2>
          <span>
            {priorities.filter((p) => p.done).length} of {priorities.length} complete
          </span>
        </div>
        <ul className="daily-priority-list">
          {priorities.map((p, index) => (
            <li key={p.id} className={p.done ? 'daily-priority done' : 'daily-priority'}>
              <Checkbox
                id={'priority-' + p.id}
                checked={p.done}
                disabled={!ready}
                onCheckedChange={(checked) =>
                  setPriorities(
                    priorities.map((q) => (q.id === p.id ? { ...q, done: checked === true } : q)),
                  )
                }
              />
              <div className="daily-priority-copy">
                {editing === p.id ? (
                  <Input
                    autoFocus
                    aria-label="Edit priority title"
                    maxLength={500}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitEdit();
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setEditing(null);
                      }
                    }}
                  />
                ) : (
                  <label htmlFor={'priority-' + p.id}>{label(p)}</label>
                )}
                {p.kind !== 'free' && (
                  <span className="daily-priority-meta">
                    {p.kind === 'study' ? 'Study' : p.kind === 'habit' ? 'Habit' : 'Task'}
                  </span>
                )}
              </div>
              <div className="daily-priority-actions">
                {p.kind === 'free' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={'Edit ' + label(p)}
                    onClick={() => {
                      setEditTitle(p.title);
                      setEditing(p.id);
                    }}
                  >
                    <Pencil />
                  </Button>
                )}
                {index > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={'Move ' + label(p) + ' up'}
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
                  aria-label={'Remove ' + label(p)}
                  onClick={() => setPriorities(priorities.filter((q) => q.id !== p.id))}
                >
                  <X />
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {!priorities.length && (
          <p className="daily-plan-empty">
            Start with one thing that would make today feel worthwhile.
          </p>
        )}
        <div className="daily-priority-add">
          <Plus aria-hidden="true" />
          <Input
            aria-label="Priority title"
            placeholder="Add another priority…"
            value={title}
            maxLength={500}
            disabled={!ready || priorities.length >= planPriorityLimit}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
          />
          {title.trim() ? (
            <Button variant="ghost" size="sm" onClick={() => add()} disabled={!ready}>
              Add <Check />
            </Button>
          ) : (
            <SearchPicker
              label="Link a priority"
              value=""
              options={options}
              onChange={(value) => {
                if (value) add(value);
              }}
              emptyLabel="Link existing"
              disabled={!ready || priorities.length >= planPriorityLimit}
              className="plan-inline-picker"
            />
          )}
        </div>
        {priorities.length >= planPriorityLimit && (
          <p className="daily-plan-empty">
            This day has reached the safety limit of {planPriorityLimit} priorities.
          </p>
        )}
        <div className="daily-plan-save">
          <span role="status">{autosave.status}</span>
          <Button
            size="sm"
            variant="ghost"
            disabled={!ready || action.busy}
            onClick={() => void action.run(() => autosave.saveNow(), 'Daily plan saved')}
          >
            {autosave.error ? 'Retry saving' : 'Save now'}
          </Button>
        </div>
      </section>
      <section aria-labelledby="plan-study-heading">
        <div className="daily-plan-section-heading">
          <h2 id="plan-study-heading">A little time to learn</h2>
          <SearchPicker
            label="Add study topic"
            value=""
            options={studyOptions(source.study).filter((o) => !topics.includes(o.value.slice(6)))}
            emptyLabel="Choose topics"
            className="plan-inline-picker"
            disabled={!ready || topics.length >= 500}
            onChange={(value) => {
              if (value) setTopics([...topics, value.slice(6)]);
            }}
          />
        </div>
        <div className="daily-study-list" aria-label="Selected study topics">
          {selectedTopics.map((t) => (
            <div key={t.id} className="daily-study-row">
              <div>
                <Link to={'/study/' + t.curriculumId + '?topic=' + t.id}>{t.title}</Link>
                <span>
                  {source.study.curricula.find((c) => c.id === t.curriculumId)?.title}
                  {t.reviewDue && t.reviewDue <= date ? ' · Review due' : ''}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="daily-study-focus"
                disabled={focus.busy || !ready}
                onClick={() =>
                  void action.run(async () => {
                    await autosave.saveNow();
                    const curriculum = source.study.curricula.find((c) => c.id === t.curriculumId);
                    if (curriculum) await focus.start(curriculum, t);
                  }, 'Study focus opened')
                }
              >
                <Timer />
                Start focus
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={'Remove study topic ' + t.title}
                onClick={() => setTopics(topics.filter((id) => id !== t.id))}
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
        {!topics.length && (
          <p className="daily-plan-empty">
            Choose a topic for today. Your full roadmaps stay in <Link to="/study">Study</Link>.
          </p>
        )}
      </section>
      <details className="daily-plan-evening">
        <summary>
          <span>
            <Moon />
            When the day winds down
          </span>
          <small>{saved?.evening.completedAt ? 'Reflection saved' : 'Open reflection'}</small>
        </summary>
        <div className="daily-plan-evening-content">
          <p>Review your priorities, then make a little space to reflect.</p>
          <div className="daily-plan-evening-fields">
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
          <div className="daily-plan-evening-footer">
            <Link to={'/journal?date=' + date}>Write in this day’s journal</Link>
            <Button
              size="sm"
              disabled={action.busy || !ready}
              onClick={() => void action.run(closeDay, 'Evening reflection saved')}
            >
              Save evening reflection
            </Button>
          </div>
          <p className="daily-plan-footnote">
            Checking a priority updates this plan. Linked tasks and habits keep their own completion
            history.
          </p>
        </div>
      </details>
      <footer className="daily-plan-links">
        <Link to={'/journal?date=' + date}>Open journal</Link>
        <Link to="/goals">Your goals</Link>
        <Link to="/review">This week</Link>
      </footer>
    </div>
  );
}
