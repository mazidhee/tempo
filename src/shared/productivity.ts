export type Phase = 'focus' | 'short' | 'long';
export interface Task {
  area?: 'personal' | 'work' | 'study';
  archivedAt?: string | null;
  trashedAt?: string | null;
  keep?: boolean;
  workProjectId?: string;
  boardStatus?: 'inbox' | 'next' | 'doing';
  scheduledTime?: string;
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
  area?: 'personal' | 'work' | 'study';
  workProjectId?: string;
  type: 'task' | 'habit' | 'study';
  id: string;
  name: string;
  project?: string;
  curriculumId?: string;
}
export interface Timer {
  stopwatch?: { elapsed: number; runningSince: number | null };
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
  source?: 'tracked' | 'manual';
  startedAt?: string;
  note?: string;
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
    accent?: AccentId;
    themePalette?: ThemePalette;
    avatar?: string | null;
    greetingStyle?: 'mixed' | 'simple' | 'stoic';
    thoughtLibrary?: ThoughtLibrary;
    taskCleanup?: boolean;
    taskRetentionDays?: number;
    workProjects?: WorkProject[];
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
    settings: {
      name: '',
      theme: 'system',
      sound: false,
      notifications: false,
      reminder: true,
      accent: 'lavender',
      themePalette: 'default',
      avatar: null,
      greetingStyle: 'mixed',
      thoughtLibrary: defaultThoughtLibrary(),
      taskCleanup: true,
      taskRetentionDays: 30,
      workProjects: [],
    },
  };
}
export const secondsLeft = (timer: Timer, now: number): number =>
  timer.deadline === null ? timer.remaining : Math.max(0, (timer.deadline - now) / 1000);
export function startTimer(timer: Timer, now: number): Timer {
  if (timer.stopwatch)
    return {
      ...timer,
      startedAt: timer.startedAt ?? now,
      stopwatch: { ...timer.stopwatch, runningSince: timer.stopwatch.runningSince ?? now },
    };
  return { ...timer, startedAt: timer.startedAt ?? now, deadline: now + timer.remaining * 1000 };
}
// Navigation preserves any in-progress phase, including a paused phase.
export function focusRequest(timer: Timer, link?: Link): 'resume' | 'replace' | 'confirm' {
  if (timer.startedAt === null && timer.deadline === null) return 'replace';
  if (!link || (timer.link?.type === link.type && timer.link.id === link.id)) return 'resume';
  return 'confirm';
}
export function pauseTimer(timer: Timer, now: number): Timer {
  if (timer.stopwatch)
    return { ...timer, stopwatch: { elapsed: stopwatchSeconds(timer, now), runningSince: null } };
  return { ...timer, remaining: secondsLeft(timer, now), deadline: null };
}
export const timerIsRunning = (timer: Timer) =>
  timer.stopwatch ? timer.stopwatch.runningSince !== null : timer.deadline !== null;
export const stopwatchSeconds = (timer: Timer, now: number) =>
  timer.stopwatch
    ? timer.stopwatch.elapsed +
      (timer.stopwatch.runningSince === null
        ? 0
        : Math.max(0, now - timer.stopwatch.runningSince) / 1000)
    : 0;
export const newStopwatch = (preset: Preset, completed = 0, link: Link | null = null): Timer => ({
  ...newTimer(preset, 'focus', completed, link),
  presetName: 'Time tracking',
  stopwatch: { elapsed: 0, runningSince: null },
});
export function saveTrackedTime(state: Productivity, now: number): Productivity {
  const duration = stopwatchSeconds(state.timer, now);
  const session: Session = {
    id: state.timer.runId,
    date: localDate(new Date(now)),
    endedAt: new Date(now).toISOString(),
    startedAt: new Date(state.timer.startedAt ?? now - duration * 1000).toISOString(),
    duration,
    phase: 'focus',
    presetId: state.timer.presetId,
    presetName: 'Time tracking',
    link: state.timer.link,
    source: 'tracked',
  };
  return {
    ...state,
    sessions:
      duration > 0 && !state.sessions.some((s) => s.id === session.id)
        ? [...state.sessions, session]
        : state.sessions,
    timer: newStopwatch(
      state.presets.find((p) => p.id === state.timer.presetId) ?? state.presets[0],
      state.timer.completed,
      state.timer.link,
    ),
  };
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
    ...(timer.startedAt !== null ? { startedAt: new Date(timer.startedAt).toISOString() } : {}),
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
      (l.area === undefined || ['personal', 'work', 'study'].includes(l.area)) &&
      (l.workProjectId === undefined || text(l.workProjectId)) &&
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
        (t.completedAt === null || text(t.completedAt)) &&
        (t.area === undefined || ['personal', 'work', 'study'].includes(t.area)) &&
        (t.keep === undefined || typeof t.keep === 'boolean') &&
        (t.workProjectId === undefined || text(t.workProjectId)) &&
        (t.boardStatus === undefined || ['inbox', 'next', 'doing'].includes(t.boardStatus)) &&
        (t.scheduledTime === undefined ||
          (text(t.scheduledTime) &&
            (!t.scheduledTime || /^([01]\d|2[0-3]):[0-5]\d$/.test(t.scheduledTime)))) &&
        [t.archivedAt, t.trashedAt].every(
          (v) => v === undefined || v === null || (text(v) && Number.isFinite(Date.parse(v!))),
        ),
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
        (x.source === undefined || ['tracked', 'manual'].includes(x.source)) &&
        (x.startedAt === undefined ||
          (text(x.startedAt) && Number.isFinite(Date.parse(x.startedAt)))) &&
        (x.note === undefined || (text(x.note) && x.note.length <= 1000)) &&
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
    (s.timer.stopwatch === undefined ||
      (!!s.timer.stopwatch &&
        s.timer.phase === 'focus' &&
        s.timer.deadline === null &&
        finite(s.timer.stopwatch.elapsed) &&
        (s.timer.stopwatch.runningSince === null ||
          (finite(s.timer.stopwatch.runningSince) && s.timer.startedAt !== null)))) &&
    !!s.settings &&
    text(s.settings.name) &&
    (s.settings.accent === undefined || validAccent(s.settings.accent)) &&
    (s.settings.themePalette === undefined || validThemePalette(s.settings.themePalette)) &&
    (s.settings.avatar === undefined || validAvatar(s.settings.avatar)) &&
    (s.settings.greetingStyle === undefined ||
      ['mixed', 'simple', 'stoic'].includes(s.settings.greetingStyle)) &&
    (s.settings.thoughtLibrary === undefined || validThoughtLibrary(s.settings.thoughtLibrary)) &&
    (s.settings.taskCleanup === undefined || typeof s.settings.taskCleanup === 'boolean') &&
    (s.settings.workProjects === undefined || validWorkProjects(s.settings.workProjects)) &&
    (s.settings.taskRetentionDays === undefined ||
      (Number.isInteger(s.settings.taskRetentionDays) &&
        s.settings.taskRetentionDays >= 1 &&
        s.settings.taskRetentionDays <= 365)) &&
    ['system', 'light', 'dark'].includes(s.settings.theme) &&
    ['sound', 'notifications', 'reminder'].every(
      (k) => typeof s.settings[k as keyof Productivity['settings']] === 'boolean',
    )
  );
}
import {
  validAccent,
  validAvatar,
  validThemePalette,
  type AccentId,
  type ThemePalette,
} from './appearance';
import { defaultThoughtLibrary, validThoughtLibrary, type ThoughtLibrary } from './thoughts';
import { validWorkProjects, type WorkProject } from './work';
