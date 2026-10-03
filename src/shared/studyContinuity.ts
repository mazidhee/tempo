import { localDate, type Session, type Timer } from './productivity';
import type { Curriculum, StudySnapshot, StudyTopic } from './study';
export function activeStudyTopics(snapshot: StudySnapshot, curriculumId: string) {
  const all = new Map(snapshot.topics.map((t) => [t.id, t]));
  return snapshot.topics
    .filter((t) => {
      if (t.curriculumId !== curriculumId || t.archived) return false;
      let p: StudyTopic | undefined = t;
      const seen = new Set<string>();
      while (p) {
        if (p.archived || seen.has(p.id)) return false;
        seen.add(p.id);
        p = p.parentId ? all.get(p.parentId) : undefined;
      }
      return true;
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}
export function topicPath(snapshot: StudySnapshot, topic: StudyTopic) {
  const all = new Map(snapshot.topics.map((t) => [t.id, t]));
  const path: StudyTopic[] = [],
    seen = new Set<string>();
  let current: StudyTopic | undefined = topic;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);
    current = current.parentId ? all.get(current.parentId) : undefined;
  }
  return path;
}
export function isStudyFocus(curriculum: Curriculum, today = localDate()) {
  return (
    !curriculum.archived &&
    !!curriculum.studyFocus &&
    (!curriculum.focusUntil || curriculum.focusUntil >= today)
  );
}
/** Resume real unfinished work; otherwise choose the first unlearned leaf in outline order. */
export function studyContinuation(
  snapshot: StudySnapshot,
  curriculum: Curriculum,
  sessions: Session[],
  timer?: Timer,
) {
  const active = activeStudyTopics(snapshot, curriculum.id),
    parents = new Set(active.map((t) => t.parentId));
  const leaves = active.filter((t) => !parents.has(t.id)),
    unfinished = leaves.filter((t) => !t.learnedAt);
  const linked = sessions
    .filter(
      (s) =>
        s.phase === 'focus' && s.link?.type === 'study' && active.some((t) => t.id === s.link?.id),
    )
    .sort((a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt));
  const running =
    timer?.startedAt !== null && timer?.link?.type === 'study'
      ? unfinished.find((t) => t.id === timer.link?.id)
      : undefined;
  const topic =
    running ??
    unfinished.find((t) => t.id === curriculum.currentTopicId) ??
    unfinished.find((t) => t.id === linked[0]?.link?.id) ??
    unfinished[0];
  const next = topic ? unfinished[unfinished.findIndex((t) => t.id === topic.id) + 1] : undefined;
  const lastSession = topic ? linked.find((s) => s.link?.id === topic.id) : undefined;
  return {
    topic,
    next,
    lastSession,
    path: topic ? topicPath(snapshot, topic) : [],
    complete: !!leaves.length && !unfinished.length,
  };
}
