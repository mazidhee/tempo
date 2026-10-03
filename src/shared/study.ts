import { localDate } from './productivity';
import { shiftDay } from './habits';
import type { Session } from './productivity';

export interface Curriculum {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  archived: boolean;
  studyFocus?: boolean;
  focusUntil?: string | null;
  currentTopicId?: string | null;
  coverImage?: string | null;
}
export interface StudyTopic {
  details?: string;
  id: string;
  curriculumId: string;
  parentId: string | null;
  title: string;
  order: number;
  learnedAt: string | null;
  reviewDue: string | null;
  interval: number;
  archived: boolean;
}
export type ReviewGrade = 0 | 1 | 2 | 3;
export interface StudyReview {
  id: string;
  topicId: string;
  reviewedAt: string;
  grade: ReviewGrade;
  interval: number;
}
export interface StudySnapshot {
  curricula: Curriculum[];
  topics: StudyTopic[];
  reviews: StudyReview[];
  imports?: StudyImport[];
}
export interface StudyImport {
  id: string;
  curriculumId: string;
  title: string;
  markdown: string;
}
/** Each session contributes once to its topic, ancestors, and curriculum. */
export function studyTimeTotals(snapshot: StudySnapshot, sessions: Session[]) {
  const topics = new Map(snapshot.topics.map((t) => [t.id, t]));
  const topicSeconds: Record<string, number> = {},
    curriculumSeconds: Record<string, number> = {};
  const seen = new Set<string>();
  for (const session of sessions) {
    if (session.phase !== 'focus' || session.link?.type !== 'study' || seen.has(session.id))
      continue;
    seen.add(session.id);
    const curriculum =
      session.link.curriculumId ?? topics.get(session.link.id)?.curriculumId ?? session.link.id;
    curriculumSeconds[curriculum] = (curriculumSeconds[curriculum] || 0) + session.duration;
    let topic = topics.get(session.link.id);
    const ancestors = new Set<string>();
    while (topic && !ancestors.has(topic.id)) {
      ancestors.add(topic.id);
      topicSeconds[topic.id] = (topicSeconds[topic.id] || 0) + session.duration;
      topic = topic.parentId ? topics.get(topic.parentId) : undefined;
    }
  }
  return { topicSeconds, curriculumSeconds };
}
export const reviewGrades = ['Again', 'Hard', 'Good', 'Easy'] as const;
/** Simple transparent calendar-day scheduling, independent of DST length. */
export function nextStudyReview(
  topic: Pick<StudyTopic, 'interval'>,
  grade: ReviewGrade,
  now = new Date(),
) {
  const previous = Math.max(1, topic.interval);
  const interval = Math.min(3650, grade === 0 ? 1 : Math.ceil(previous * [1, 1.2, 2, 3][grade]));
  return { interval, reviewDue: shiftDay(localDate(now), interval) };
}
export function curriculumProgress(snapshot: StudySnapshot, id: string) {
  const topics = snapshot.topics.filter((topic) => topic.curriculumId === id && !topic.archived);
  const learned = topics.filter((topic) => topic.learnedAt).length;
  return {
    learned,
    total: topics.length,
    percent: topics.length ? (learned / topics.length) * 100 : 0,
  };
}
