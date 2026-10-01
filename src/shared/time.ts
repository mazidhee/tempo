import type { Session, Link } from './productivity';
import { localDate } from './productivity';
import type { StudySnapshot } from './study';
export const sessionStart = (session: Session) =>
  Date.parse(session.startedAt ?? session.endedAt) -
  (session.startedAt ? 0 : session.duration * 1000);
export const formatStudyTime = (seconds: number) => {
  const whole = Math.max(0, Math.floor(seconds)),
    hours = Math.floor(whole / 3600),
    minutes = Math.floor((whole % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : minutes ? `${minutes}m ${whole % 60}s` : `${whole}s`;
};
export interface ManualSessionInput {
  id?: string;
  startedAt: string;
  endedAt: string;
  link: Link | null;
  note?: string;
  allowOverlap?: boolean;
  preserveDuration?: boolean;
}
export function manualSession(
  input: ManualSessionInput,
  sessions: Session[],
  now = Date.now(),
): Session {
  if (!input || typeof input.startedAt !== 'string' || typeof input.endedAt !== 'string')
    throw new Error('Choose a start and end time.');
  const start = Date.parse(input.startedAt),
    end = Date.parse(input.endedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end > now + 60000)
    throw new Error('End must follow start and cannot be in the future.');
  if (input.id && !sessions.some((s) => s.id === input.id && s.phase === 'focus'))
    throw new Error('Focus session not found.');
  if (input.note !== undefined && (typeof input.note !== 'string' || input.note.length > 1000))
    throw new Error('Keep the note under 1,000 characters.');
  const overlaps = sessions.some(
    (s) =>
      s.id !== input.id &&
      s.phase === 'focus' &&
      sessionStart(s) < end &&
      Date.parse(s.endedAt) > start,
  );
  if (overlaps && input.allowOverlap !== true)
    throw new Error('This overlaps another entry. Confirm the overlap before saving.');
  const previous = sessions.find((s) => s.id === input.id);
  const preserve =
    input.preserveDuration === true &&
    previous &&
    start === sessionStart(previous) &&
    end === Date.parse(previous.endedAt);
  return {
    id: input.id || crypto.randomUUID(),
    date: localDate(new Date(end)),
    startedAt: new Date(start).toISOString(),
    endedAt: new Date(end).toISOString(),
    duration: preserve ? previous.duration : (end - start) / 1000,
    phase: 'focus',
    presetId: previous?.presetId ?? 'manual',
    presetName: previous?.presetName ?? 'Manual entry',
    link: input.link,
    source: 'manual',
    ...(input.note ? { note: input.note.trim() } : {}),
  };
}
export interface TimeNode {
  id: string;
  name: string;
  seconds: number;
  children: TimeNode[];
}
export interface TimeSlice {
  node: TimeNode;
  start: number;
  end: number;
  depth: number;
}
export function timeSlices(root: TimeNode, maxDepth = 3): TimeSlice[] {
  const slices: TimeSlice[] = [];
  const walk = (node: TimeNode, start: number, end: number, depth: number) => {
    if (!node.seconds || depth > maxDepth) return;
    if (depth) slices.push({ node, start, end, depth });
    let angle = start;
    for (const child of node.children) {
      const next = angle + ((end - start) * child.seconds) / node.seconds;
      walk(child, angle, next, depth + 1);
      angle = next;
    }
  };
  walk(root, 0, Math.PI * 2, 0);
  return slices;
}
/** Use leaves for allocation; a parent's own time is a separate Direct study slice. */
export function studyTimeTree(study: StudySnapshot, sessions: Session[]): TimeNode {
  const direct = new Map<string, number>();
  const seen = new Set<string>();
  for (const session of sessions)
    if (session.phase === 'focus' && session.link?.type === 'study' && !seen.has(session.id)) {
      seen.add(session.id);
      direct.set(session.link.id, (direct.get(session.link.id) || 0) + session.duration);
    }
  const build = (
    id: string,
    name: string,
    topics: typeof study.topics,
    visited = new Set<string>(),
  ): TimeNode => {
    if (visited.has(id)) return { id, name, seconds: 0, children: [] };
    const branch = new Set(visited).add(id);
    const children = topics
      .filter((t) => t.parentId === id)
      .map((t) => build(t.id, t.title, topics, branch))
      .filter((n) => n.seconds > 0);
    const own = direct.get(id) || 0;
    if (own && children.length)
      children.unshift({ id: `direct:${id}`, name: 'Direct study', seconds: own, children: [] });
    return {
      id,
      name,
      seconds:
        own +
        children.filter((n) => !n.id.startsWith('direct:')).reduce((sum, n) => sum + n.seconds, 0),
      children,
    };
  };
  const children = study.curricula
    .map((c) => {
      const topics = study.topics.filter((t) => t.curriculumId === c.id);
      const roots = topics.filter((t) => !t.parentId || !topics.some((p) => p.id === t.parentId));
      const nested = roots.map((t) => build(t.id, t.title, topics)).filter((n) => n.seconds > 0);
      const own = direct.get(c.id) || 0;
      if (own)
        nested.unshift({
          id: `direct:${c.id}`,
          name: 'Direct curriculum study',
          seconds: own,
          children: [],
        });
      return {
        id: c.id,
        name: c.title,
        seconds: nested.reduce((sum, n) => sum + n.seconds, 0),
        children: nested,
      };
    })
    .filter((c) => c.seconds > 0);
  const known = new Set([...study.curricula, ...study.topics].map((item) => item.id));
  const orphaned = [...direct].filter(([id]) => !known.has(id));
  if (orphaned.length)
    children.push({
      id: 'unassigned',
      name: 'Unassigned study',
      seconds: orphaned.reduce((sum, [, seconds]) => sum + seconds, 0),
      children: orphaned.map(([id, seconds]) => ({
        id,
        name: sessions.find((s) => s.link?.id === id)?.link?.name || 'Previous topic',
        seconds,
        children: [],
      })),
    });
  return {
    id: 'all',
    name: 'All study',
    seconds: children.reduce((sum, n) => sum + n.seconds, 0),
    children,
  };
}
