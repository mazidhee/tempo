import type { Productivity, Task } from './productivity';
import type { Link } from './productivity';
export type TaskArea = 'personal' | 'work' | 'study';
export const taskArea = (task: Task): TaskArea => task.area ?? 'personal';
export const activeTask = (task: Task) => !task.completedAt && !task.archivedAt && !task.trashedAt;
export const taskFocusLink = (task: Task): Link => ({ type:'task', id:task.id, name:task.title, project:task.project, area:taskArea(task), ...(task.workProjectId ? { workProjectId:task.workProjectId } : {}) });
export function cleanUpTasks(state: Productivity, now = Date.now()): Productivity {
  if (state.settings.taskCleanup === false) return state;
  const days = state.settings.taskRetentionDays ?? 30;
  const timestamp = new Date(now).toISOString();
  let changed = false;
  const tasks = state.tasks.map(task => {
    if (task.keep || task.trashedAt) return task;
    // If archived after completion, count from the later action.
    const dates = [task.completedAt, task.archivedAt].filter(Boolean).map(v => Date.parse(v!)).filter(Number.isFinite);
    if (!dates.length || now - Math.max(...dates) < days * 86400000) return task;
    changed = true;
    return { ...task, trashedAt: timestamp };
  });
  return changed ? { ...state, tasks } : state;
}
export const restoreTask = (task: Task): Task => ({ ...task, trashedAt: null, keep: true });
