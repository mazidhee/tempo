import { localDate, type Link, type Phase, type Productivity, type Timer } from './productivity';
import { validDate } from './habits';
import type { ManualSessionInput } from './time';
export interface Blocklist {
  id: string;
  name: string;
  apps: string[];
  websites: string[];
}
export interface FocusSettings {
  enabled: boolean;
  blockBreaks: boolean;
  strict: boolean;
  mode: 'gentle' | 'close';
  selected: string[];
  blocklists: Blocklist[];
  shortcuts: { toggle: string; skip: string; stop: string };
}
export interface FocusBreak {
  id: string;
  runId: string;
  at: string;
  kind: 'attempt' | 'emergency';
  target: string;
}
export function focusEventsInRange(events: FocusBreak[], start = localDate(), end = start) {
  if (!validDate(start) || !validDate(end) || end < start)
    throw new Error('Choose a valid Focus history date range.');
  return events.filter((event) => {
    const day = localDate(new Date(event.at));
    return day >= start && day <= end;
  });
}
export interface RunningApp {
  pid: number;
  name: string;
  executable: string;
}
export interface FocusSnapshot {
  productivity: Productivity;
  settings: FocusSettings;
  events: FocusBreak[];
  guard: { active: boolean; error: string; repairedAt: string | null };
  shortcutErrors: string[];
  emergencyReadyAt: number | null;
}
export interface FocusCommand {
  timerMode?: 'pomodoro' | 'stopwatch';
  action: 'start' | 'pause' | 'skip' | 'stop' | 'configure';
  presetId?: string;
  phase?: Phase;
  link?: Link | null;
}
export const emergencyPhrase = 'I choose to end this focus';
export const defaultFocusSettings = (): FocusSettings => ({
  enabled: false,
  blockBreaks: false,
  strict: false,
  mode: 'gentle',
  selected: ['messaging'],
  blocklists: [
    {
      id: 'messaging',
      name: 'Messaging',
      apps: ['WhatsApp.exe', 'WhatsApp'],
      websites: ['web.whatsapp.com'],
    },
    {
      id: 'social',
      name: 'Social',
      apps: [],
      websites: [
        'facebook.com',
        'www.facebook.com',
        'instagram.com',
        'www.instagram.com',
        'x.com',
        'www.x.com',
      ],
    },
    {
      id: 'video',
      name: 'Video',
      apps: [],
      websites: [
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'netflix.com',
        'www.netflix.com',
      ],
    },
  ],
  shortcuts: {
    toggle: 'CommandOrControl+Shift+F',
    skip: 'CommandOrControl+Shift+S',
    stop: 'CommandOrControl+Shift+X',
  },
});
export const validDomain = (x: unknown): x is string =>
  typeof x === 'string' &&
  x.length <= 253 &&
  /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i.test(x);
const unsafeApps =
  /^(?:system|idle|registry|smss|csrss|wininit|services|lsass|svchost|dwm|explorer|conhost|powershell|pwsh|cmd|taskkill|electron|habit-tracker|tempo|sudo|pkexec|systemd|init|launchd)(?:\.exe)?$/i;
export const validAppName = (x: unknown): x is string =>
  typeof x === 'string' && /^[\w .()-]{1,120}$/.test(x) && !unsafeApps.test(x);
export function validateFocusSettings(input: unknown): FocusSettings {
  const s = input as FocusSettings;
  if (
    !s ||
    ['enabled', 'blockBreaks', 'strict'].some(
      (k) => typeof s[k as keyof FocusSettings] !== 'boolean',
    ) ||
    !['gentle', 'close'].includes(s.mode) ||
    !Array.isArray(s.blocklists) ||
    s.blocklists.length > 50 ||
    !Array.isArray(s.selected) ||
    !s.shortcuts
  )
    throw new Error('Invalid Focus settings.');
  const ids = new Set<string>();
  for (const b of s.blocklists) {
    if (
      !b ||
      typeof b.id !== 'string' ||
      !b.id ||
      ids.has(b.id) ||
      typeof b.name !== 'string' ||
      !b.name.trim() ||
      b.name.length > 120 ||
      !Array.isArray(b.apps) ||
      b.apps.length > 100 ||
      !b.apps.every(validAppName) ||
      !Array.isArray(b.websites) ||
      b.websites.length > 200 ||
      !b.websites.every(validDomain)
    )
      throw new Error('Use app names from the picker and plain website domains.');
    ids.add(b.id);
  }
  if (
    !s.selected.every((x) => typeof x === 'string' && ids.has(x)) ||
    !['toggle', 'skip', 'stop'].every(
      (k) =>
        typeof s.shortcuts[k as keyof typeof s.shortcuts] === 'string' &&
        s.shortcuts[k as keyof typeof s.shortcuts].length <= 100,
    )
  )
    throw new Error('Invalid selection or shortcut.');
  return structuredClone(s);
}
export function validateFocusBreak(input: unknown): FocusBreak {
  const e = input as FocusBreak;
  if (
    !e ||
    !['id', 'runId', 'at', 'target'].every((k) => typeof e[k as keyof FocusBreak] === 'string') ||
    !e.id ||
    !Number.isFinite(Date.parse(e.at)) ||
    !['attempt', 'emergency'].includes(e.kind) ||
    e.target.length > 250
  )
    throw new Error('Invalid focus break event.');
  return { ...e };
}
export function selectedTargets(settings: FocusSettings) {
  const blocks = settings.blocklists.filter((b) => settings.selected.includes(b.id));
  return {
    apps: [...new Set(blocks.flatMap((b) => b.apps).map((a) => a.toLowerCase()))],
    websites: [...new Set(blocks.flatMap((b) => b.websites).map((a) => a.toLowerCase()))],
  };
}
export const matchesApp = (name: string, selected: string[]) =>
  selected.some((x) => x.toLowerCase() === name.toLowerCase());
export const guardShouldRun = (settings: FocusSettings, timer: Timer) =>
  settings.enabled && timer.startedAt !== null && (timer.phase === 'focus' || settings.blockBreaks);
export const shortcutIdentity = (accelerator: string) =>
  accelerator
    .toLowerCase()
    .split('+')
    .map((part) =>
      [
        'commandorcontrol',
        'cmdorctrl',
        'command',
        'cmd',
        'control',
        'ctrl',
        'meta',
        'super',
      ].includes(part.trim())
        ? 'mod'
        : part.trim(),
    )
    .sort()
    .join('+');
export const reservedFocusShortcut = (accelerator: string) =>
  ['CommandOrControl+Shift+P', 'CommandOrControl+K', 'CommandOrControl+B'].some(
    (x) => shortcutIdentity(x) === shortcutIdentity(accelerator),
  );
declare module './workspace' {
  interface WorkspaceRequests {
    'focus:snapshot': { input: undefined; output: FocusSnapshot };
    'focus:command': { input: FocusCommand; output: FocusSnapshot };
    'focus:saveSession': { input: ManualSessionInput; output: FocusSnapshot };
    'focus:deleteSession': { input: string; output: FocusSnapshot };
    'focus:legacyTimer': { input: { expectedRunId: string; timer: Timer }; output: FocusSnapshot };
    'focus:settings': { input: FocusSettings; output: FocusSnapshot };
    'focus:runningApps': { input: undefined; output: RunningApp[] };
    'focus:repair': { input: undefined; output: FocusSnapshot };
    'focus:emergencyBegin': { input: undefined; output: FocusSnapshot };
    'focus:emergencyExit': { input: { phrase?: string }; output: FocusSnapshot };
  }
  interface WorkspaceEvents {
    'focus:changed': FocusSnapshot;
  }
}
