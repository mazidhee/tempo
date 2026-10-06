import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, ArrowUp, Pencil, ChevronLeft, ChevronRight, Check, Timer } from 'lucide-react';
import { usePrivacy } from '../../hooks/PrivacyContext';
import { useStudyFocus } from '../../hooks/useStudyFocus';
import { localDate } from '../../../shared/productivity';
import { tasksForDay } from '../../../shared/taskBoard';
import { useProductivity } from '../../hooks/ProductivityProvider';
import { useTaskFocus } from '../../hooks/useTaskFocus';
import '../../styles/approved-workspace.css';
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
import { ActionError, LoadState, useAction } from './ui';
import './daily-plan.css';
export default function Plan() {
  const privacy = usePrivacy(),
    focus = useStudyFocus(),
    action = useAction();
  const { snapshot } = useReflection();
  const { state, update } = useProductivity(),
    taskFocus = useTaskFocus();
  const [date, setDate] = useState(localDate());
  const [editing, setEditing] = useState<string | null>(null),
    [editTitle, setEditTitle] = useState('');
  const saved = snapshot?.plans.find((p) => p.date === date);
  const draft = usePlanDraft(date, saved, !!snapshot);
  const { priorities, setPriorities, topics, setTopics, title, setTitle, setChoice } = draft;
  const ready = !!snapshot && draft.date === date;
  const autosave = usePlanAutosave(date, priorities, topics, ready, saved);
  if (!snapshot) return <LoadState />;
  const source = snapshot.source;
  const options = [
    ...state.tasks.filter(activeTask).map((t) => ({
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
    if (kind === 'task' && linkId) {
      update((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === linkId ? { ...t, due: date } : t)),
      }));
      return;
    }
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
  const scheduled = tasksForDay(state.tasks, date, localDate());
  const linked = state.tasks.filter(
    (t) =>
      !t.archivedAt &&
      !t.trashedAt &&
      priorities.some((p) => p.kind === 'task' && p.linkId === t.id),
  );
  const queue = [...scheduled, ...linked.filter((t) => !scheduled.some((q) => q.id === t.id))];
  const lead = queue.find((t) => !t.completedAt);
  const manualPriorities = priorities.filter(
    (p) =>
      p.kind !== 'task' ||
      !state.tasks.some((t) => t.id === p.linkId && !t.archivedAt && !t.trashedAt),
  );
  return (
    <div className="daily-plan workspace-plan">
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
        <h1>{date === localDate() ? 'Today' : dayTitle}</h1>
      </header>
      <ActionError
        error={action.error || draft.draftError || autosave.error || focus.error || taskFocus.error}
      />
      <section className="plan-task-queue" aria-label="Daily task queue">
        {lead && (
          <div className="plan-lead">
            <div>
              <span className="plan-lead-time">
                {lead.scheduledTime || (lead.due < date ? 'Overdue' : 'Up next')}
              </span>
              <h2>{lead.title}</h2>
              {lead.project && <span className="muted">{lead.project}</span>}
            </div>
            <Button disabled={taskFocus.busy} onClick={() => void taskFocus.start(lead)}>
              <Timer />
              Start focus
            </Button>
          </div>
        )}
        <div className="daily-plan-section-heading">
          <h2>Queue</h2>
          <Link to="/tasks">Open board</Link>
        </div>
        {queue.map((t) => (
          <div className={`plan-queue-row${t.completedAt ? ' is-done' : ''}`} key={t.id}>
            <button
              className={`check-button ${t.completedAt ? 'checked' : ''}`}
              aria-pressed={!!t.completedAt}
              aria-label={`${t.completedAt ? 'Reopen' : 'Complete'} task ${t.title}`}
              onClick={() => {
                const completedAt = t.completedAt ? null : new Date().toISOString();
                update((s) => ({
                  ...s,
                  tasks: s.tasks.map((task) =>
                    task.id === t.id ? { ...task, completedAt } : task,
                  ),
                }));
                setPriorities(
                  priorities.map((p) =>
                    p.kind === 'task' && p.linkId === t.id ? { ...p, done: !!completedAt } : p,
                  ),
                );
              }}
            >
              {t.completedAt && <Check />}
            </button>
            <div className="queue-task-copy">
              <strong>{t.title}</strong>
              {t.project && <small>{t.project}</small>}
            </div>
            <input
              type="time"
              aria-label={`Time for ${t.title}`}
              value={t.scheduledTime ?? ''}
              onChange={(e) =>
                update((s) => ({
                  ...s,
                  tasks: s.tasks.map((task) =>
                    task.id === t.id ? { ...task, scheduledTime: e.target.value } : task,
                  ),
                }))
              }
            />
            {!t.completedAt && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Focus on ${t.title}`}
                disabled={taskFocus.busy}
                onClick={() => void taskFocus.start(t)}
              >
                <Timer />
              </Button>
            )}
          </div>
        ))}
        {!queue.length && <p className="workspace-empty">No tasks scheduled</p>}
        <SearchPicker
          label="Schedule a task"
          value=""
          options={options.filter(
            (o) => o.group === 'task' && !queue.some((t) => o.value === 'task:' + t.id),
          )}
          emptyLabel="Add from board"
          className="plan-inline-picker"
          onChange={(value) => {
            if (value) add(value);
          }}
          disabled={!ready}
        />
      </section>
      <section aria-labelledby="plan-priorities-heading">
        <div className="daily-plan-section-heading">
          <h2 id="plan-priorities-heading">Priorities</h2>
          <span>
            {manualPriorities.filter((p) => p.done).length}/{manualPriorities.length} complete
          </span>
        </div>
        <ul className="daily-priority-list">
          {manualPriorities.map((p, index) => (
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
                      const currentIndex = next.findIndex((q) => q.id === p.id);
                      const previousIndex = next.findIndex(
                        (q) => q.id === manualPriorities[index - 1].id,
                      );
                      [next[previousIndex], next[currentIndex]] = [
                        next[currentIndex],
                        next[previousIndex],
                      ];
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
        {!manualPriorities.length && <p className="daily-plan-empty">No additional priorities</p>}
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
          <h2 id="plan-study-heading">Study</h2>
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
        {!topics.length && <p className="daily-plan-empty">No topics selected</p>}
      </section>

      <footer className="daily-plan-links">
        <Link to={'/journal?date=' + date}>Open journal</Link>
        <Link to="/goals">Your goals</Link>
        <Link to="/review">This week</Link>
      </footer>
    </div>
  );
}
