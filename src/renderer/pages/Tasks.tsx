import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Check, Timer, Trash2, Search, Archive, Undo2, MoreHorizontal } from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { localDate, type Task } from '../../shared/productivity';
import { activeTask, taskArea, restoreTask, type TaskArea } from '../../shared/taskLifecycle';
import { boardLanes, boardLane, moveTask, type BoardLane } from '../../shared/taskBoard';
import { useTaskFocus } from '../hooks/useTaskFocus';
import { Modal } from '../components/ui';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/ui/dropdown-menu';
import '../styles/task-page.css';
import '../styles/approved-workspace.css';
export default function Tasks() {
  const { state, update, ready } = useProductivity(),
    focus = useTaskFocus();
  const [params, setParams] = useSearchParams();
  const collection =
    params.get('view') === 'Trash'
      ? 'Trash'
      : params.get('view') === 'Archived'
        ? 'Archived'
        : 'Board';
  const area = params.get('area') || 'all',
    projectId = params.get('project') || '';
  const [query, setQuery] = useState(''),
    [priority, setPriority] = useState('all');
  const [editing, setEditing] = useState<Task | null>(null),
    [deleting, setDeleting] = useState<Task | null>(null);
  const [dragged, setDragged] = useState<string | null>(null),
    [dropLane, setDropLane] = useState<BoardLane | null>(null);
  const [quick, setQuick] = useState<Partial<Record<BoardLane, string>>>({});
  const save = (task: Task) => {
    update((s) => ({
      ...s,
      tasks: s.tasks.some((t) => t.id === task.id)
        ? s.tasks.map((t) => (t.id === task.id ? task : t))
        : [...s.tasks, task],
    }));
    setEditing(null);
  };
  const create = (title = '', lane: BoardLane = 'inbox'): Task => ({
    id: crypto.randomUUID(),
    title: title.trim(),
    due: '',
    priority: 'medium',
    project: '',
    tags: [],
    subtasks: [],
    createdAt: new Date().toISOString(),
    completedAt: lane === 'done' ? new Date().toISOString() : null,
    boardStatus: lane === 'done' ? 'next' : lane,
    area: (area === 'all' ? 'personal' : area) as TaskArea,
    ...(area === 'work' && projectId
      ? {
          workProjectId: projectId,
          project: state.settings.workProjects?.find((p) => p.id === projectId)?.title ?? '',
        }
      : {}),
  });
  const tasks = state.tasks
    .filter(
      (t) =>
        (collection === 'Trash'
          ? !!t.trashedAt
          : collection === 'Archived'
            ? !!t.archivedAt && !t.trashedAt
            : !t.archivedAt && !t.trashedAt) &&
        (area === 'all' || taskArea(t) === area) &&
        (!projectId || t.workProjectId === projectId) &&
        (priority === 'all' || t.priority === priority) &&
        `${t.title} ${t.project} ${t.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        (a.due || '9999').localeCompare(b.due || '9999') ||
        (a.scheduledTime || '99').localeCompare(b.scheduledTime || '99'),
    );
  const move = (task: Task, lane: BoardLane) => save(moveTask(task, lane));
  const card = (task: Task) => (
    <article
      key={task.id}
      className={`board-card${task.completedAt ? ' is-done' : ''}${dragged === task.id ? ' is-dragging' : ''}`}
      draggable={collection === 'Board'}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        setDragged(task.id);
      }}
      onDragEnd={() => {
        setDragged(null);
        setDropLane(null);
      }}
      data-task-id={task.id}
    >
      <div className="board-card-heading">
        {collection === 'Board' && (
          <button
            className={`check-button ${task.completedAt ? 'checked' : ''}`}
            aria-label={`${task.completedAt ? 'Reopen' : 'Complete'} task ${task.title}`}
            aria-pressed={!!task.completedAt}
            onClick={() => move(task, task.completedAt ? (task.boardStatus ?? 'next') : 'done')}
          >
            {task.completedAt && <Check />}
          </button>
        )}
        <button className="board-card-title" onClick={() => setEditing(task)}>
          {task.title}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="icon-button" aria-label={`Options for ${task.title}`}>
              <MoreHorizontal />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditing(task)}>Edit task</DropdownMenuItem>
            {collection === 'Board' && (
              <DropdownMenuItem
                onSelect={() => save({ ...task, archivedAt: new Date().toISOString() })}
              >
                <Archive />
                Archive
              </DropdownMenuItem>
            )}
            {collection === 'Archived' && (
              <DropdownMenuItem onSelect={() => save({ ...task, archivedAt: null, keep: true })}>
                <Undo2 />
                Restore
              </DropdownMenuItem>
            )}
            {collection === 'Trash' && (
              <DropdownMenuItem onSelect={() => save(restoreTask(task))}>
                <Undo2 />
                Restore
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => save({ ...task, keep: !task.keep })}>
              {task.keep ? 'Allow automatic cleanup' : 'Keep task'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDeleting(task)}>
              <Trash2 />
              {task.trashedAt ? 'Delete permanently…' : 'Move to Trash…'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {(task.project || task.due || task.priority === 'high' || task.subtasks.length > 0) && (
        <div className="board-card-meta">
          {task.project && <span>{task.project}</span>}
          {task.due && (
            <span className={!task.completedAt && task.due < localDate() ? 'overdue' : ''}>
              {task.due === localDate()
                ? 'Today'
                : new Date(task.due + 'T12:00:00').toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
              {task.scheduledTime && ' · ' + task.scheduledTime}
            </span>
          )}
          {task.priority === 'high' && <span className="board-urgent">Urgent</span>}
          {!!task.subtasks.length && (
            <span>
              {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
            </span>
          )}
        </div>
      )}
      {collection === 'Board' && (
        <div className="board-card-controls">
          <select
            aria-label={`Move ${task.title}`}
            value={boardLane(task)}
            onChange={(e) => move(task, e.target.value as BoardLane)}
          >
            {boardLanes.map((l) => (
              <option key={l} value={l}>
                {l === 'next' ? 'Next' : l[0].toUpperCase() + l.slice(1)}
              </option>
            ))}
          </select>
          {activeTask(task) && (
            <button
              className="icon-button"
              disabled={focus.busy}
              aria-label={`Focus on ${task.title}`}
              onClick={() => void focus.start(task)}
            >
              <Timer />
            </button>
          )}
        </div>
      )}
    </article>
  );
  return (
    <div className="tasks-page workspace-board">
      <header className="workspace-header">
        <h1>Tasks</h1>
        <button className="btn-ghost" disabled={!ready} onClick={() => setEditing(create())}>
          <Plus />
          New task
        </button>
      </header>
      <div className="workspace-toolbar">
        <label className="workspace-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            aria-label="Search tasks"
            placeholder="Search tasks"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Task area"
          value={area}
          onChange={(e) =>
            setParams((p) => {
              p.set('area', e.target.value);
              p.delete('project');
              return p;
            })
          }
        >
          <option value="all">All areas</option>
          <option value="personal">Personal</option>
          <option value="work">Work</option>
          <option value="study">Study</option>
        </select>
        <select
          aria-label="Task priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="all">All priorities</option>
          <option value="high">Urgent</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          aria-label="Task collection"
          value={collection}
          onChange={(e) =>
            setParams((p) => {
              p.set('view', e.target.value);
              return p;
            })
          }
        >
          <option>Board</option>
          <option>Archived</option>
          <option>Trash</option>
        </select>
        {projectId && (
          <button
            className="btn-ghost"
            onClick={() =>
              setParams((p) => {
                p.delete('project');
                return p;
              })
            }
          >
            Clear project
          </button>
        )}
      </div>
      {focus.error && (
        <p className="inline-error" role="alert">
          {focus.error}
        </p>
      )}
      {!ready ? (
        <p role="status">Loading tasks…</p>
      ) : collection !== 'Board' ? (
        <div className="task-saved-list">
          {tasks.map(card)}
          {!tasks.length && <p className="workspace-empty">No {collection.toLowerCase()} tasks</p>}
        </div>
      ) : (
        <div className="task-board">
          {boardLanes.map((lane) => (
            <section
              key={lane}
              className={`board-lane${dropLane === lane ? ' drop-target' : ''}`}
              aria-label={lane + ' tasks'}
              onDragOver={(e) => {
                if (dragged) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDropLane(lane);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const task = state.tasks.find((t) => t.id === dragged);
                if (task && !task.archivedAt && !task.trashedAt) move(task, lane);
                setDragged(null);
                setDropLane(null);
              }}
            >
              <header>
                <h2>{lane === 'next' ? 'Next' : lane[0].toUpperCase() + lane.slice(1)}</h2>
                <span>{tasks.filter((t) => boardLane(t) === lane).length}</span>
              </header>
              <div className="board-lane-items">
                {tasks.filter((t) => boardLane(t) === lane).map(card)}
              </div>
              {lane !== 'done' && (
                <form
                  className="board-add"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (quick[lane]?.trim()) {
                      save(create(quick[lane], lane));
                      setQuick((q) => ({ ...q, [lane]: '' }));
                    }
                  }}
                >
                  <Plus />
                  <input
                    aria-label={`Add ${lane} task`}
                    maxLength={500}
                    placeholder="Add task"
                    value={quick[lane] ?? ''}
                    onChange={(e) => setQuick((q) => ({ ...q, [lane]: e.target.value }))}
                  />
                  <button className="btn-ghost" disabled={!quick[lane]?.trim()}>
                    Add
                  </button>
                </form>
              )}
            </section>
          ))}
        </div>
      )}
      {editing && <TaskForm task={editing} onSave={save} onClose={() => setEditing(null)} />}
      {deleting && (
        <Modal
          title={deleting.trashedAt ? 'Delete task permanently?' : 'Move task to Trash?'}
          onClose={() => setDeleting(null)}
        >
          <p>
            {deleting.trashedAt
              ? 'The task and its completion record will be removed permanently. Focus history remains.'
              : 'You can restore this task from Trash.'}
          </p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                update((s) => ({
                  ...s,
                  tasks: deleting.trashedAt
                    ? s.tasks.filter((t) => t.id !== deleting.id)
                    : s.tasks.map((t) =>
                        t.id === deleting.id ? { ...t, trashedAt: new Date().toISOString() } : t,
                      ),
                }));
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
        <div className="form-grid">
          <label>
            Board column
            <select
              className="input"
              aria-label="Board column"
              value={boardLane(draft)}
              onChange={(e) => setDraft(moveTask(draft, e.target.value as BoardLane))}
            >
              {boardLanes.map((l) => (
                <option value={l} key={l}>
                  {l[0].toUpperCase() + l.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Scheduled time
            <input
              className="input"
              aria-label="Scheduled time"
              type="time"
              value={draft.scheduledTime ?? ''}
              onChange={(e) => setDraft({ ...draft, scheduledTime: e.target.value })}
            />
          </label>
        </div>
        <label>
          Project
          <input
            className="input"
            placeholder="e.g. Personal, University"
            value={draft.project}
            onChange={(e) =>
              setDraft({ ...draft, project: e.target.value, workProjectId: undefined })
            }
          />
        </label>
        <label>
          Area
          <select
            className="input"
            aria-label="Task form area"
            value={draft.area ?? 'personal'}
            onChange={(e) =>
              setDraft({ ...draft, area: e.target.value as TaskArea, workProjectId: undefined })
            }
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="study">Study</option>
          </select>
        </label>
        {draft.area === 'work' && (
          <label>
            Work project
            <select
              className="input"
              aria-label="Work project"
              value={draft.workProjectId ?? ''}
              onChange={(e) => {
                const project = state.settings.workProjects?.find((p) => p.id === e.target.value);
                setDraft({
                  ...draft,
                  workProjectId: project?.id,
                  project: project?.title ?? draft.project,
                });
              }}
            >
              <option value="">No work project</option>
              {state.settings.workProjects
                ?.filter((p) => !p.archived || p.id === draft.workProjectId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label className="row-actions">
          <input
            type="checkbox"
            checked={draft.keep ?? false}
            onChange={(e) => setDraft({ ...draft, keep: e.target.checked })}
          />
          Keep this task · exempt from automatic cleanup
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
