import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, Timer, Pencil, Trash2, ListTodo, CalendarDays, Search } from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { localDate, newTimer, focusRequest, type Task } from '../../shared/productivity';
import { PageHeader, Empty, Modal } from '../components/ui';
export default function Tasks() {
  const { state, update } = useProductivity();
  const navigate = useNavigate();
  const [view, setView] = useState('Today');
  const [quick, setQuick] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Task | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const today = localDate();
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
    due: view === 'Today' ? today : '',
    priority: 'medium',
    project: '',
    tags: [],
    subtasks: [],
    createdAt: new Date().toISOString(),
    completedAt: null,
  });
  const toggle = (task: Task) =>
    save({ ...task, completedAt: task.completedAt ? null : new Date().toISOString() });
  const tasks = state.tasks
    .filter(
      (t) =>
        (view === 'Completed' ? !!t.completedAt : !t.completedAt) &&
        (view !== 'Today' || (!!t.due && t.due <= today)) &&
        (view !== 'Upcoming' || t.due > today) &&
        `${t.title} ${t.project} ${t.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        (a.due || '9999').localeCompare(b.due || '9999') ||
        ['high', 'medium', 'low'].indexOf(a.priority) -
          ['high', 'medium', 'low'].indexOf(b.priority),
    );
  const focus = (task: Task) => {
    const link = { type: 'task' as const, id: task.id, name: task.title, project: task.project };
    const action = focusRequest(state.timer, link);
    if (action === 'resume') {
      navigate('/focus');
      return;
    }
    if (action === 'confirm') {
      if (!window.confirm('Replace the current focus session? Unfinished time will not be logged.'))
        return;
    }
    update((s) => ({
      ...s,
      timer: newTimer(
        s.presets.find((p) => p.id === s.timer.presetId)!,
        'focus',
        s.timer.completed,
        { type: 'task', id: task.id, name: task.title, project: task.project },
      ),
    }));
    navigate('/focus');
  };
  return (
    <div className="page">
      <PageHeader
        eyebrow="MAKE SPACE FOR WHAT MATTERS"
        title="Tasks"
        description="A clear mind starts with a clear list."
        action={
          <button className="btn-primary" onClick={() => setEditing(null)}>
            <Plus />
            New task
          </button>
        }
      />
      <div className="task-toolbar">
        <div className="tabs" aria-label="Task views">
          {['Today', 'Upcoming', 'All', 'Completed'].map((v) => (
            <button
              key={v}
              className={view === v ? 'selected' : ''}
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="search-field">
          <Search />
          <input
            aria-label="Search tasks"
            placeholder="Search tasks, projects, tags"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <form
        className="quick-add"
        onSubmit={(e) => {
          e.preventDefault();
          if (quick.trim()) {
            save(create(quick));
            setQuick('');
          }
        }}
      >
        <Plus />
        <input
          aria-label="Quick add task"
          placeholder="What needs your attention? Enter to add a task…"
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
        />
        <button className="btn-secondary" disabled={!quick.trim()}>
          Add task
        </button>
      </form>
      <section className="panel task-panel">
        <div className="section-heading">
          <h2>
            {view === 'Today'
              ? 'Today’s priorities'
              : view === 'Completed'
                ? 'Done & dusted'
                : view === 'Upcoming'
                  ? 'On the horizon'
                  : 'Your open tasks'}
          </h2>
          <span className="count-badge">{tasks.length}</span>
        </div>
        {!tasks.length ? (
          <Empty
            icon={<ListTodo />}
            title={
              query
                ? 'No matching tasks'
                : view === 'Completed'
                  ? 'Progress will live here'
                  : view === 'Today'
                    ? 'A little breathing room'
                    : 'A fresh page'
            }
            description={
              query
                ? 'Try another title, tag or project.'
                : view === 'Completed'
                  ? 'Complete a task and celebrate a small win.'
                  : 'Add a task above, or plan something for later.'
            }
          />
        ) : (
          tasks.map((task) => (
            <article className={`task-row ${task.completedAt ? 'is-completed' : ''}`} key={task.id}>
              <div className="task-row-main">
                <button
                  className={`check-button ${task.completedAt ? 'checked' : ''}`}
                  aria-label={`${task.completedAt ? 'Reopen' : 'Complete'} ${task.title}`}
                  aria-pressed={!!task.completedAt}
                  onClick={() => toggle(task)}
                >
                  {task.completedAt && <Check />}
                </button>
                <div className="task-details">
                  <strong>{task.title}</strong>
                  <div className="task-meta">
                    {task.due && (
                      <span className={task.due < today && !task.completedAt ? 'overdue' : ''}>
                        <CalendarDays />
                        {task.due === today ? 'Today' : task.due}
                        {task.due < today && !task.completedAt ? ' · overdue' : ''}
                      </span>
                    )}
                    <span className={`priority ${task.priority}`}>
                      <i />
                      {task.priority}
                    </span>
                    {task.project && <span>{task.project}</span>}
                    {task.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        #{tag}
                      </span>
                    ))}
                    {task.subtasks.length > 0 && (
                      <span>
                        {task.subtasks.filter((x) => x.done).length}/{task.subtasks.length} subtasks
                      </span>
                    )}
                  </div>
                </div>
                <div className="row-actions">
                  {!task.completedAt && (
                    <button
                      className="icon-button"
                      aria-label={`Start focus session for ${task.title}`}
                      title="Start focus session"
                      onClick={() => focus(task)}
                    >
                      <Timer />
                    </button>
                  )}
                  <button
                    className="icon-button"
                    aria-label={`Edit ${task.title}`}
                    onClick={() => setEditing(task)}
                  >
                    <Pencil />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Delete ${task.title}`}
                    onClick={() => setDeleting(task)}
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
              {task.subtasks.length > 0 && (
                <div className="subtasks">
                  {task.subtasks.map((sub) => (
                    <label key={sub.id}>
                      <input
                        type="checkbox"
                        checked={sub.done}
                        onChange={() =>
                          save({
                            ...task,
                            subtasks: task.subtasks.map((x) =>
                              x.id === sub.id ? { ...x, done: !x.done } : x,
                            ),
                          })
                        }
                      />
                      <span className={sub.done ? 'done-text' : ''}>{sub.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </section>
      <p className="muted page-footnote">
        Today includes overdue tasks. Undated tasks live in All.
      </p>
      {editing !== undefined && (
        <TaskForm
          task={editing || create('')}
          onSave={save}
          onClose={() => setEditing(undefined)}
        />
      )}
      {deleting && (
        <Modal title="Delete task?" onClose={() => setDeleting(null)}>
          <p className="muted">
            “{deleting.title}” will be removed. Its completed focus sessions stay in your
            statistics.
          </p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== deleting.id) }));
                setDeleting(null);
              }}
            >
              Delete task
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
            onChange={(e) => setDraft({ ...draft, project: e.target.value })}
          />
        </label>
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
