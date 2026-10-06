import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Check, Timer, Pencil, Trash2, Search, Flag, ChevronDown, Archive, Undo2 } from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { localDate, focusRequest, type Task } from '../../shared/productivity';
import { shiftDay } from '../../shared/habits';
import { Modal } from '../components/ui';
import { Button } from '../components/ui/button';
import '../styles/task-page.css';
import { activeTask, taskArea, taskFocusLink, restoreTask, type TaskArea } from '../../shared/taskLifecycle';
export default function Tasks() {
  const { state, update, ready } = useProductivity();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const views = ['Today', 'Upcoming', 'All', 'Completed', 'Archived', 'Trash'];
  const view = views.includes(params.get('view') || '') ? params.get('view')! : 'Today';
  const [quick, setQuick] = useState('');
  const area = ['personal', 'work', 'study'].includes(params.get('area') || '') ? params.get('area')! : 'all';
  const projectId = params.get('project') || '';
  const setView = (value: string) => { setParams(p => { p.set('view', value); return p; }); };
  const [query, setQuery] = useState(''),
    [priorityFilter, setPriorityFilter] = useState('all');
  const [editing, setEditing] = useState<Task | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const today = localDate();
  const focusPending = useRef(false);
  const [focusBusy, setFocusBusy] = useState(false),
    [focusError, setFocusError] = useState('');
  const save = (task: Task) => {
    update((s) => ({
      ...s,
      tasks: s.tasks.some((t) => t.id === task.id)
        ? s.tasks.map((t) => (t.id === task.id ? task : t))
        : [...s.tasks, task],
    }));
    setEditing(undefined);
  };
  const create = (title: string): Task => ({
    id: crypto.randomUUID(),
    title: title.trim(),
    due: view === 'Today' ? today : view === 'Upcoming' ? shiftDay(today, 1) : '',
    priority: priorityFilter === 'all' ? 'medium' : (priorityFilter as Task['priority']),
    tags: [],
    subtasks: [],
    createdAt: new Date().toISOString(),
    completedAt: null,
    area: area === 'all' ? 'personal' : area as TaskArea,
    workProjectId: area === 'work' && projectId ? projectId : undefined,
    project: area === 'work' && projectId ? state.settings.workProjects?.find(p => p.id === projectId)?.title ?? '' : '',
  });
  const tasks = state.tasks
    .filter(
      (t) =>
        (view === 'Trash' ? !!t.trashedAt : view === 'Archived' ? !!t.archivedAt && !t.trashedAt :
          view === 'Completed' ? !!t.completedAt && !t.archivedAt && !t.trashedAt : activeTask(t)) &&
        (area === 'all' || taskArea(t) === area) &&
        (!projectId || t.workProjectId === projectId) &&
        (view !== 'Today' || (!!t.due && t.due <= today)) &&
        (view !== 'Upcoming' || t.due > today) &&
        (priorityFilter === 'all' || t.priority === priorityFilter) &&
        `${t.title} ${t.project} ${t.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      view === 'Completed'
        ? (b.completedAt || '').localeCompare(a.completedAt || '')
        : (a.due || '9999').localeCompare(b.due || '9999') ||
          ['high', 'medium', 'low'].indexOf(a.priority) -
            ['high', 'medium', 'low'].indexOf(b.priority),
    );
  const dateLabel = (date: string) =>
    !date
      ? 'No date'
      : date === today
        ? 'Today'
        : date === shiftDay(today, 1)
          ? 'Tomorrow'
          : new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });
  const groupLabel = (t: Task) =>
    view === 'Today'
      ? t.due < today
        ? 'Overdue'
        : 'Today'
      : view === 'Upcoming'
        ? dateLabel(t.due)
        : view === 'Completed'
          ? dateLabel((t.completedAt || '').slice(0, 10))
          : t.project || (taskArea(t) === 'work' ? 'Work' : taskArea(t) === 'study' ? 'Study' : 'Personal');
  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = groupLabel(task);
    groups.set(key, [...(groups.get(key) || []), task]);
  }
  const focus = async (task: Task) => {
    if (focusPending.current) return;
    const link = taskFocusLink(task);
    const request = focusRequest(state.timer, link);
    if (request === 'resume') {
      navigate('/focus');
      return;
    }
    if (
      request === 'confirm' &&
      !window.confirm(
        state.timer.stopwatch
          ? 'Save the current tracked time and switch to this task?'
          : 'Replace the current focus session? Unfinished time will not be logged.',
      )
    )
      return;
    focusPending.current = true;
    setFocusBusy(true);
    setFocusError('');
    try {
      if (state.timer.startedAt !== null)
        await window.workspaceAPI.invoke('focus:command', { action: 'stop' });
      await window.workspaceAPI.invoke('focus:command', {
        action: 'configure',
        phase: 'focus',
        timerMode: 'pomodoro',
        link,
      });
      await window.workspaceAPI.invoke('focus:command', { action: 'start' });
      navigate('/focus');
    } catch (e) {
      setFocusError('Could not start focus. ' + (e as Error).message);
    } finally {
      focusPending.current = false;
      setFocusBusy(false);
    }
  };
  return (
    <div className="tasks-page">
      <header className="tasks-page-header">
        <div>
          <h1>{view === 'All' ? 'All tasks' : view === 'Completed' ? 'Logbook' : view}</h1>
          <p>
            {view === 'Today'
              ? 'A little clarity for the day ahead.'
              : view === 'Upcoming'
                ? 'Make space for what comes next.'
                : view === 'Completed'
                  ? 'The small steps that moved you forward.'
                  : 'Everything you are working towards.'}
          </p>
        </div>
        <Button variant="ghost" size="sm" disabled={!ready} onClick={() => setEditing(null)}>
          <Plus />
          New task
        </Button>
      </header>
      {focusError && (
        <p className="inline-error" role="alert">
          {focusError}
        </p>
      )}
      <div className="tasks-viewbar">
        <div className="tasks-views" aria-label="Task views">
          {views.map((v) => (
            <button
              key={v}
              aria-pressed={view === v}
              className={view === v ? 'selected' : ''}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <span className="tasks-count">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>
      <div className="tasks-filters">
        <select aria-label="Task area" value={area} onChange={e => setParams(p => { p.set('area', e.target.value); p.delete('project'); return p; })}>
          <option value="all">All areas</option><option value="personal">Personal</option><option value="work">Work</option><option value="study">Study</option>
        </select>
        <label className="tasks-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            aria-label="Search tasks"
            placeholder="Search tasks, projects, tags"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter task priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All priorities</option>
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
      </div>
      {projectId && <p className="tasks-footnote">Project: {state.settings.workProjects?.find(p => p.id === projectId)?.title || 'Saved project'} · <Link to="/work">Back to Work</Link></p>}
      {view === 'Trash' && <p className="tasks-footnote">Restore tasks whenever you need them. Trash is never emptied automatically.</p>}
      <div className="tasks-lists">
        {[...groups].map(([heading, items]) => (
          <section className="tasks-group" key={heading} aria-label={heading + ' tasks'}>
            <h2>{heading}</h2>
            <ul>
              {items.map((task) => (
                <li className="task-list-item" key={task.id}>
                  <button
                    disabled={!ready || !!task.trashedAt || !!task.archivedAt}
                    className={`check-button ${task.completedAt ? 'checked' : ''}`}
                    aria-label={`${task.completedAt ? 'Reopen' : 'Complete'} ${task.title}`}
                    aria-pressed={!!task.completedAt}
                    onClick={() =>
                      save({
                        ...task,
                        completedAt: task.completedAt ? null : new Date().toISOString(),
                      })
                    }
                  >
                    {task.completedAt && <Check />}
                  </button>
                  <div className="task-list-content">
                    <button
                      className={task.completedAt ? 'task-title done-text' : 'task-title'}
                      onClick={() => setEditing(task)}
                    >
                      {task.title}
                    </button>
                    <div className="task-list-meta">
                      {task.due && (
                        <span className={task.due < today && !task.completedAt ? 'overdue' : ''}>
                          {dateLabel(task.due)}
                        </span>
                      )}
                      {task.project && view !== 'All' && <span>{task.project}</span>}
                      <span className="task-list-priority">
                        {task.priority === 'high' && <Flag aria-hidden="true" />}
                        {task.priority} priority
                      </span>
                      {task.tags.map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                      <span>{taskArea(task) === 'work' ? 'Work' : taskArea(task) === 'study' ? 'Study' : 'Personal'}</span>
                      {task.keep && <span>Keep</span>}
                    </div>
                    {!!task.subtasks.length && (
                      <details className="task-steps">
                        <summary>
                          <ChevronDown />
                          {task.subtasks.filter((s) => s.done).length} / {task.subtasks.length}{' '}
                          steps
                        </summary>
                        <div>
                          {task.subtasks.map((sub) => (
                            <label key={sub.id}>
                              <input
                                type="checkbox"
                                checked={sub.done}
                                onChange={() =>
                                  save({
                                    ...task,
                                    subtasks: task.subtasks.map((s) =>
                                      s.id === sub.id ? { ...s, done: !s.done } : s,
                                    ),
                                  })
                                }
                              />
                              <span className={sub.done ? 'done-text' : ''}>{sub.title}</span>
                            </label>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                  <div className="task-list-actions">
                    {activeTask(task) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!ready || focusBusy}
                        aria-label={`Start focus session for ${task.title}`}
                        onClick={() => void focus(task)}
                      >
                        <Timer />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${task.title}`}
                      onClick={() => setEditing(task)}
                    >
                      <Pencil />
                    </Button>
                    {task.trashedAt || task.archivedAt ? <Button variant="ghost" size="icon" aria-label={`Restore ${task.title}`} onClick={() => save(task.trashedAt ? restoreTask(task) : { ...task, archivedAt: null, keep: true })}><Undo2 /></Button>
                      : <Button variant="ghost" size="icon" aria-label={`Archive ${task.title}`} onClick={() => save({ ...task, archivedAt: new Date().toISOString() })}><Archive /></Button>}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${task.trashedAt ? 'Delete permanently' : 'Move to Trash'} ${task.title}`}
                      onClick={() => setDeleting(task)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {!tasks.length && (
        <div className="tasks-empty">
          <h2>
            {query || priorityFilter !== 'all'
              ? 'No matching tasks'
              : view === 'Completed'
                ? 'Your progress belongs here.'
                : 'A little breathing room.'}
          </h2>
          <p>
            {query || priorityFilter !== 'all'
              ? 'Try another title, project, tag or priority.'
              : view === 'Completed'
                ? 'Completed tasks will appear in your logbook.'
                : 'Write a task below, or use New task to add the details.'}
          </p>
          {(query || priorityFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setPriorityFilter('all');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
      {!['Completed', 'Archived', 'Trash'].includes(view) && (
        <form
          className="tasks-quick-add"
          onSubmit={(e) => {
            e.preventDefault();
            if (quick.trim()) {
              save(create(quick));
              setQuick('');
            }
          }}
        >
          <Plus aria-hidden="true" />
          <input
            aria-label="Quick add task"
            maxLength={500}
            placeholder="Add a task…"
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            disabled={!ready}
          />
          <Button variant="ghost" size="sm" disabled={!ready || !quick.trim()}>
            Add task
          </Button>
        </form>
      )}
      <p className="tasks-footnote">
        {view === 'Today'
          ? 'Today includes overdue tasks. Undated tasks live in All.'
          : view === 'Upcoming'
            ? 'Quick-added tasks are scheduled for tomorrow. Open a task to choose another date.'
            : view === 'All'
              ? 'Open a task to set its date, project, tags and next steps.'
              : 'Reopen a completed task whenever you need it.'}
      </p>
      {editing !== undefined && (
        <TaskForm
          task={editing || create('')}
          onSave={(task) => {
            const isNew = !state.tasks.some((t) => t.id === task.id);
            save(task);
            if (isNew && view === 'Completed') setView('All');
          }}
          onClose={() => setEditing(undefined)}
        />
      )}
      {deleting && (
        <Modal title={deleting.trashedAt ? 'Delete task permanently?' : 'Move task to Trash?'} onClose={() => setDeleting(null)}>
          <p className="muted">
            {deleting.trashedAt ? `“${deleting.title}” will be permanently removed, including its task completion record. Focus sessions remain saved. This cannot be undone.` : `“${deleting.title}” can be restored from Trash. Its completion record and focus history stay saved.`}
          </p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                update((s) => ({ ...s, tasks: deleting.trashedAt ? s.tasks.filter(t => t.id !== deleting.id) : s.tasks.map(t => t.id === deleting.id ? { ...t, trashedAt: new Date().toISOString() } : t) }));
                setDeleting(null);
              }}
            >
              {deleting.trashedAt ? 'Delete permanently' : 'Move to Trash'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function TaskForm({
  task,
  onSave,
  onClose,
}: {
  task: Task;
  onSave: (t: Task) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(task);
  const { state } = useProductivity();
  const [tags, setTags] = useState(task.tags.join(', '));
  const [sub, setSub] = useState('');
  return (
    <Modal title={task.title ? 'Edit task' : 'New task'} onClose={onClose}>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.title.trim())
            onSave({
              ...draft,
              title: draft.title.trim(),
              tags: [
                ...new Set(
                  tags
                    .split(',')
                    .map((t) => t.trim().replace(/^#/, ''))
                    .filter(Boolean),
                ),
              ],
            });
        }}
      >
        <label>
          Title
          <input
            className="input"
            autoFocus
            required
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Due date
            <input
              className="input"
              type="date"
              value={draft.due}
              onChange={(e) => setDraft({ ...draft, due: e.target.value })}
            />
          </label>
          <label>
            Priority
            <select
              className="input"
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: e.target.value as Task['priority'] })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
        <label>
          Project
          <input
            className="input"
            placeholder="e.g. Personal, University"
            value={draft.project}
            onChange={(e) => setDraft({ ...draft, project: e.target.value, workProjectId: undefined })}
          />
        </label>
        <label>Area<select className="input" aria-label="Task form area" value={draft.area ?? 'personal'} onChange={e => setDraft({ ...draft, area: e.target.value as TaskArea, workProjectId: undefined })}>
          <option value="personal">Personal</option><option value="work">Work</option><option value="study">Study</option>
        </select></label>
        {draft.area === 'work' && <label>Work project<select className="input" aria-label="Work project" value={draft.workProjectId ?? ''} onChange={e => {
          const project = state.settings.workProjects?.find(p => p.id === e.target.value);
          setDraft({ ...draft, workProjectId: project?.id, project: project?.title ?? draft.project });
        }}><option value="">No work project</option>{state.settings.workProjects?.filter(p => !p.archived || p.id === draft.workProjectId).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>}
        <label className="row-actions"><input type="checkbox" checked={draft.keep ?? false} onChange={e => setDraft({ ...draft, keep: e.target.checked })} />Keep this task · exempt from automatic cleanup</label>
        <label>
          Tags <span className="muted">(comma separated)</span>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
        </label>
        <div>
          <label htmlFor="subtask-input">Subtasks</label>
          <div className="inline-field">
            <input
              id="subtask-input"
              className="input"
              placeholder="Break it into a small step"
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (sub.trim()) {
                    setDraft({
                      ...draft,
                      subtasks: [
                        ...draft.subtasks,
                        { id: crypto.randomUUID(), title: sub.trim(), done: false },
                      ],
                    });
                    setSub('');
                  }
                }
              }}
            />
            <button
              className="icon-button"
              type="button"
              aria-label="Add subtask"
              onClick={() => {
                if (sub.trim()) {
                  setDraft({
                    ...draft,
                    subtasks: [
                      ...draft.subtasks,
                      { id: crypto.randomUUID(), title: sub.trim(), done: false },
                    ],
                  });
                  setSub('');
                }
              }}
            >
              <Plus />
            </button>
          </div>
          {draft.subtasks.map((x) => (
            <div className="subtask-edit" key={x.id}>
              <input
                className="input"
                aria-label="Subtask title"
                value={x.title}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    subtasks: draft.subtasks.map((s) =>
                      s.id === x.id ? { ...s, title: e.target.value } : s,
                    ),
                  })
                }
              />
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove subtask ${x.title}`}
                onClick={() =>
                  setDraft({ ...draft, subtasks: draft.subtasks.filter((s) => s.id !== x.id) })
                }
              >
                <Trash2 />
              </button>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={!draft.title.trim()}>
            Save task
          </button>
        </div>
      </form>
    </Modal>
  );
}
