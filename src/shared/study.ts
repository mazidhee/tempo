import { localDate } from './productivity';
import { shiftDay } from './habits';

export interface Curriculum {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  archived: boolean;
}
export interface StudyTopic {
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
