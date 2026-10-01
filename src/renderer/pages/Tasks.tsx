import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, Timer, Pencil, Trash2, ListTodo, Search } from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { localDate, newTimer, focusRequest, type Task } from '../../shared/productivity';
import { PageHeader, Empty, Modal } from '../components/ui';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/table';
const taskFeatures = tableFeatures({});
const taskColumns = createColumnHelper<typeof taskFeatures, Task>();
export default function Tasks() {
  const { state, update } = useProductivity();
  const navigate = useNavigate();
  const [view, setView] = useState('Today');
  const [quick, setQuick] = useState('');
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
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
    priority: priorityFilter === 'all' ? 'medium' : (priorityFilter as Task['priority']),
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
        (priorityFilter === 'all' || t.priority === priorityFilter) &&
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
  const columns = useMemo(
    () =>
      taskColumns.columns([
        taskColumns.display({
          id: 'task',
          header: 'Task',
          cell: ({ row }) => {
            const task = row.original;
            return (
              <div className="task-table-title">
                <button
                  className={`check-button ${task.completedAt ? 'checked' : ''}`}
                  aria-label={`${task.completedAt ? 'Reopen' : 'Complete'} ${task.title}`}
                  aria-pressed={!!task.completedAt}
                  onClick={() => toggle(task)}
                >
                  {task.completedAt && <Check />}
                </button>
                <div>
                  <strong className={task.completedAt ? 'done-text' : ''}>{task.title}</strong>
                  <div className="task-meta">
                    {task.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        #{tag}
                      </span>
                    ))}
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
                </div>
              </div>
            );
          },
        }),
        taskColumns.accessor('due', {
          header: 'Due',
          cell: ({ row }) => (
            <span
              className={
                row.original.due < today && !row.original.completedAt && row.original.due
                  ? 'overdue'
                  : ''
              }
            >
              {row.original.due === today ? 'Today' : row.original.due || 'No date'}
            </span>
          ),
        }),
        taskColumns.accessor('priority', { header: 'Priority' }),
        taskColumns.accessor('project', {
          header: 'Project',
          cell: ({ row }) => row.original.project || '—',
        }),
        taskColumns.display({
          id: 'actions',
          header: 'Actions',
          cell: ({ row }) => (
            <div className="row-actions">
              {!row.original.completedAt && (
                <button
                  className="icon-button"
                  aria-label={`Start focus session for ${row.original.title}`}
                  onClick={() => focus(row.original)}
                >
                  <Timer />
                </button>
              )}
              <button
                className="icon-button"
                aria-label={`Edit ${row.original.title}`}
                onClick={() => setEditing(row.original)}
              >
                <Pencil />
              </button>
              <button
                className="icon-button"
                aria-label={`Delete ${row.original.title}`}
                onClick={() => setDeleting(row.original)}
              >
                <Trash2 />
              </button>
            </div>
          ),
        }),
      ]),
    [state.tasks, state.timer, state.presets, view],
  );
  const table = useTable({ features: taskFeatures, columns, data: tasks });
  return (
    <div className="page">
      <PageHeader
        title="Tasks"
        description="Plan, complete and focus on your work."
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
        <select
          className="input task-priority-filter"
          aria-label="Filter task priority"
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
        >
          <option value="all">All priorities</option>
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
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
                ? 'Completed tasks'
                : view === 'Upcoming'
                  ? 'Upcoming tasks'
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
          <Table className="tasks-data-table">
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <TableHead key={header.id} scope="col">
                      <table.FlexRender header={header} />
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
