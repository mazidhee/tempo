import type { Task } from './productivity';
import { activeTask } from './taskLifecycle';

export const boardLanes = ['inbox', 'next', 'doing', 'done'] as const;
export type BoardLane = (typeof boardLanes)[number];
export const boardLane = (task: Task): BoardLane =>
  task.completedAt ? 'done' : (task.boardStatus ?? (task.due ? 'next' : 'inbox'));
export const moveTask = (task: Task, lane: BoardLane, now = new Date().toISOString()): Task => ({
  ...task,
  boardStatus: lane === 'done' ? (task.boardStatus ?? 'next') : lane,
  completedAt: lane === 'done' ? (task.completedAt ?? now) : null,
});
export function tasksForDay(tasks: Task[], date: string, today: string): Task[] {
  return tasks
    .filter(
      (t) =>
        !t.archivedAt &&
        !t.trashedAt &&
        !!t.due &&
        (t.due === date || (date === today && t.due < date && activeTask(t))),
    )
    .sort(
      (a, b) =>
        Number(!!a.completedAt) - Number(!!b.completedAt) ||
        (a.due + (a.scheduledTime || '99:99')).localeCompare(
          b.due + (b.scheduledTime || '99:99'),
        ) ||
        ['high', 'medium', 'low'].indexOf(a.priority) -
          ['high', 'medium', 'low'].indexOf(b.priority),
    );
}
