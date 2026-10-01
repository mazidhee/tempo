export type Phase = 'focus' | 'short' | 'long';
export interface Task {
  id: string;
  title: string;
  due: string;
  priority: 'low' | 'medium' | 'high';
  project: string;
  tags: string[];
  subtasks: { id: string; title: string; done: boolean }[];
  createdAt: string;
  completedAt: string | null;
}
export interface Preset {
  id: string;
  name: string;
  focus: number;
  short: number;
  long: number;
  cycles: number;
}
export interface Link {
  type: 'task' | 'habit' | 'study';
  id: string;
  name: string;
  project?: string;
  curriculumId?: string;
}
export interface Timer {
  phase: Phase;
  presetId: string;
  duration: number;
  remaining: number;
  deadline: number | null;
  startedAt: number | null;
  completed: number;
  runId: string;
  link: Link | null;
  presetName: string;
}
export interface Session {
  id: string;
  date: string;
  endedAt: string;
  duration: number;
  phase: Phase;
  presetId: string;
  presetName: string;
  link: Link | null;
}
export interface Productivity {
  version: 1;
  tasks: Task[];
  presets: Preset[];
  sessions: Session[];
  timer: Timer;
  settings: {
    name: string;
    theme: 'system' | 'light' | 'dark';
    sound: boolean;
    notifications: boolean;
    reminder: boolean;
  };
}
export const localDate = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const presets: Preset[] = [
  { id: 'classic', name: 'Classic', focus: 25 * 60, short: 5 * 60, long: 15 * 60, cycles: 4 },
  { id: 'deep', name: 'Deep work', focus: 50 * 60, short: 10 * 60, long: 30 * 60, cycles: 3 },
  { id: 'quick', name: 'Quick reset', focus: 15 * 60, short: 3 * 60, long: 10 * 60, cycles: 4 },
];
export function newTimer(
  preset: Preset,
  phase: Phase = 'focus',
  completed = 0,
  link: Link | null = null,
): Timer {
  const duration = preset[phase];
  return {
    phase,
    presetId: preset.id,
    presetName: preset.name,
    duration,
    remaining: duration,
    deadline: null,
    startedAt: null,
    completed,
    runId: crypto.randomUUID(),
    link,
  };
}
export function defaultProductivity(): Productivity {
  return {
    version: 1,
    tasks: [],
    presets: presets.map((p) => ({ ...p })),
    sessions: [],
    timer: newTimer(presets[0]),
    settings: { name: '', theme: 'system', sound: false, notifications: false, reminder: true },
  };
}
export const secondsLeft = (timer: Timer, now: number): number =>
  timer.deadline === null ? timer.remaining : Math.max(0, (timer.deadline - now) / 1000);
export function startTimer(timer: Timer, now: number): Timer {
  return { ...timer, startedAt: timer.startedAt ?? now, deadline: now + timer.remaining * 1000 };
}
// Navigation preserves any in-progress phase, including a paused phase.
export function focusRequest(timer: Timer, link?: Link): 'resume' | 'replace' | 'confirm' {
  if (timer.startedAt === null && timer.deadline === null) return 'replace';
  if (!link || (timer.link?.type === link.type && timer.link.id === link.id)) return 'resume';
  return 'confirm';
}
export function pauseTimer(timer: Timer, now: number): Timer {
  return { ...timer, remaining: secondsLeft(timer, now), deadline: null };
}
// Finishing a phase is deterministic and idempotent. Breaks wait for an explicit start,
// so an unattended overnight timer never fabricates hours of focus.
export function finishTimer(state: Productivity, now: number, skipped = false): Productivity {
  const timer = state.timer;
  const preset = state.presets.find((p) => p.id === timer.presetId) ?? state.presets[0];
  const completed = timer.completed + (timer.phase === 'focus' && !skipped ? 1 : 0);
  const phase =
    timer.phase === 'focus'
      ? completed > 0 && completed % preset.cycles === 0
        ? 'long'
        : 'short'
      : 'focus';
  const ended = new Date(timer.deadline ?? now);
  const session: Session = {
    id: timer.runId,
    date: localDate(ended),
    endedAt: ended.toISOString(),
    duration: timer.duration,
    phase: timer.phase,
    presetId: timer.presetId,
    presetName: timer.presetName,
    link: timer.link,
  };
  return {
    ...state,
    sessions:
      !skipped && !state.sessions.some((s) => s.id === session.id)
        ? [...state.sessions, session]
        : state.sessions,
    timer: newTimer(preset, phase, completed, timer.link),
  };
}
export function validProductivity(value: unknown): value is Productivity {
  if (!value || typeof value !== 'object') return false;
  const s = value as Productivity;
  const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  const text = (v: unknown) => typeof v === 'string';
  const link = (l: Link | null) =>
    l === null ||
    (!!l &&
      ['task', 'habit', 'study'].includes(l.type) &&
      text(l.id) &&
      text(l.name) &&
      (l.project === undefined || text(l.project)) &&
      (l.curriculumId === undefined || text(l.curriculumId)));
  return (
    s.version === 1 &&
    Array.isArray(s.tasks) &&
    s.tasks.every(
      (t) =>
        t &&
        text(t.id) &&
        text(t.title) &&
        !!t.title.trim() &&
        text(t.due) &&
        (!t.due || /^\d{4}-\d{2}-\d{2}$/.test(t.due)) &&
        ['low', 'medium', 'high'].includes(t.priority) &&
        text(t.project) &&
        Array.isArray(t.tags) &&
        t.tags.every(text) &&
        Array.isArray(t.subtasks) &&
        t.subtasks.every((x) => x && text(x.id) && text(x.title) && typeof x.done === 'boolean') &&
        text(t.createdAt) &&
        (t.completedAt === null || text(t.completedAt)),
    ) &&
    Array.isArray(s.presets) &&
    s.presets.length > 0 &&
    s.presets.every(
      (p) =>
        p &&
        text(p.id) &&
        text(p.name) &&
        !!p.name.trim() &&
        [p.focus, p.short, p.long].every((n) => finite(n) && n > 0) &&
        Number.isInteger(p.cycles) &&
        p.cycles > 0,
    ) &&
    Array.isArray(s.sessions) &&
    s.sessions.every(
      (x) =>
        x &&
        text(x.id) &&
        text(x.date) &&
        text(x.endedAt) &&
        finite(x.duration) &&
        ['focus', 'short', 'long'].includes(x.phase) &&
        text(x.presetId) &&
        text(x.presetName) &&
        link(x.link),
    ) &&
    !!s.timer &&
    ['focus', 'short', 'long'].includes(s.timer.phase) &&
    s.presets.some((p) => p.id === s.timer.presetId) &&
    finite(s.timer.duration) &&
    s.timer.duration > 0 &&
    finite(s.timer.remaining) &&
    finite(s.timer.completed) &&
    text(s.timer.runId) &&
    text(s.timer.presetName) &&
    (s.timer.deadline === null || finite(s.timer.deadline)) &&
    (s.timer.startedAt === null || finite(s.timer.startedAt)) &&
    link(s.timer.link) &&
    !!s.settings &&
    text(s.settings.name) &&
    ['system', 'light', 'dark'].includes(s.settings.theme) &&
    ['sound', 'notifications', 'reminder'].every(
      (k) => typeof s.settings[k as keyof Productivity['settings']] === 'boolean',
    )
  );
}
