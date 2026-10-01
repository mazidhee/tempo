import type Database from '../database/sqlite';
import { localDate } from '../../shared/productivity';
import { shiftDay } from '../../shared/habits';
import {
  nextStudyReview,
  type Curriculum,
  type StudyTopic,
  type StudyReview,
  type StudySnapshot,
  type ReviewGrade,
} from '../../shared/study';
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid study request.');
  return value as Record<string, unknown>;
}
function text(value: unknown, label: string, limit = 200, optional = false) {
  if (optional && value === undefined) return '';
  if (typeof value !== 'string' || value.length > limit || (!optional && !value.trim()))
    throw new Error(`Enter a valid ${label}.`);
  return value.trim();
}
function flag(value: unknown, fallback: boolean) {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') throw new Error('Invalid archive state.');
  return value;
}
export class StudyStore {
  constructor(private db: Database) {}
  snapshot(): StudySnapshot {
    const rows = <T>(table: string) =>
      (this.db.prepare(`SELECT json FROM ${table}`).all() as { json: string }[]).map(
        (row) => JSON.parse(row.json) as T,
      );
    return {
      curricula: rows<Curriculum>('study_curricula'),
      topics: rows<StudyTopic>('study_topics').sort((a, b) => a.order - b.order),
      reviews: rows<StudyReview>('study_reviews'),
    };
  }
  saveCurriculum(input: unknown) {
    const data = object(input);
    const previous =
      data.id === undefined
        ? undefined
        : this.snapshot().curricula.find((c) => c.id === text(data.id, 'curriculum ID', 100));
    if (data.id !== undefined && !previous) throw new Error('Curriculum not found.');
    const curriculum: Curriculum = {
      id: previous?.id || crypto.randomUUID(),
      title: text(data.title, 'curriculum title'),
      description: text(data.description, 'description', 2000, true),
      createdAt: previous?.createdAt || new Date().toISOString(),
      archived: flag(data.archived, previous?.archived || false),
    };
    this.db
      .prepare(
        'INSERT INTO study_curricula(id,json) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json',
      )
      .run(curriculum.id, JSON.stringify(curriculum));
    return curriculum;
  }
  saveTopic(input: unknown) {
    const data = object(input),
      snapshot = this.snapshot();
    const curriculumId = text(data.curriculumId, 'curriculum ID', 100);
    if (!snapshot.curricula.some((c) => c.id === curriculumId && !c.archived))
      throw new Error('Choose an active curriculum.');
    const previous =
      data.id === undefined
        ? undefined
        : snapshot.topics.find((t) => t.id === text(data.id, 'topic ID', 100));
    if (data.id !== undefined && !previous) throw new Error('Topic not found.');
    if (previous && previous.curriculumId !== curriculumId)
      throw new Error('A topic cannot move to another curriculum.');
    const parentId =
      data.parentId === undefined
        ? previous?.parentId || null
        : data.parentId === null
          ? null
          : text(data.parentId, 'parent topic', 100);
    if (parentId) {
      let parent = snapshot.topics.find((t) => t.id === parentId);
      if (!parent || parent.curriculumId !== curriculumId || parent.archived)
        throw new Error('Choose a parent in this curriculum.');
      const visited = new Set<string>();
      while (parent) {
        if (parent.id === previous?.id || visited.has(parent.id))
          throw new Error('Topic nesting cannot contain a cycle.');
        visited.add(parent.id);
        parent = snapshot.topics.find((t) => t.id === parent!.parentId);
      }
    }
    const order =
      data.order ??
      previous?.order ??
      snapshot.topics.filter((t) => t.curriculumId === curriculumId).length;
    if (typeof order !== 'number' || !Number.isInteger(order) || order < 0 || order > 100000)
      throw new Error('Invalid topic order.');
    const topic: StudyTopic = {
      id: previous?.id || crypto.randomUUID(),
      curriculumId,
      title: text(data.title, 'topic title'),
      parentId,
      order,
      learnedAt: previous?.learnedAt || null,
      reviewDue: previous?.reviewDue || null,
      interval: previous?.interval || 0,
      archived: flag(data.archived, previous?.archived || false),
    };
    this.writeTopic(topic);
    return topic;
  }
  private topic(id: unknown) {
    const topic = this.snapshot().topics.find((t) => t.id === text(id, 'topic ID', 100));
    if (!topic) throw new Error('Topic not found.');
    return topic;
  }
  private writeTopic(topic: StudyTopic) {
    this.db
      .prepare(
        'INSERT INTO study_topics(id,curriculum_id,json) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json',
      )
      .run(topic.id, topic.curriculumId, JSON.stringify(topic));
  }
  learn(input: unknown) {
    const data = object(input),
      topic = this.topic(data.id);
    if (typeof data.learned !== 'boolean') throw new Error('Invalid learned state.');
    if (
      topic.archived ||
      this.snapshot().curricula.find((c) => c.id === topic.curriculumId)?.archived
    )
      throw new Error('Restore this topic and curriculum before studying.');
    if (data.learned && !topic.learnedAt)
      Object.assign(topic, {
        learnedAt: new Date().toISOString(),
        reviewDue: shiftDay(localDate(), 1),
        interval: 1,
      });
    if (!data.learned) Object.assign(topic, { learnedAt: null, reviewDue: null, interval: 0 });
    this.writeTopic(topic);
    return topic;
  }
  grade(input: unknown) {
    const data = object(input),
      topic = this.topic(data.id);
    if (
      !topic.learnedAt ||
      topic.archived ||
      this.snapshot().curricula.find((c) => c.id === topic.curriculumId)?.archived
    )
      throw new Error('Learn or restore the topic and curriculum before reviewing.');
    if (!Number.isInteger(data.grade) || ![0, 1, 2, 3].includes(data.grade as number))
      throw new Error('Choose Again, Hard, Good or Easy.');
    const grade = data.grade as ReviewGrade;
    const next = { ...topic, ...nextStudyReview(topic, grade) };
    this.db.transaction(() => {
      this.writeTopic(next);
      const review: StudyReview = {
        id: crypto.randomUUID(),
        topicId: topic.id,
        reviewedAt: new Date().toISOString(),
        grade,
        interval: next.interval,
      };
      this.db
        .prepare('INSERT INTO study_reviews(id,topic_id,reviewed_at,json) VALUES(?,?,?,?)')
        .run(review.id, review.topicId, review.reviewedAt, JSON.stringify(review));
    })();
    return next;
  }
  deleteTopic(id: unknown) {
    const topic = this.topic(id),
      snapshot = this.snapshot();
    if (topic.learnedAt || snapshot.reviews.some((r) => r.topicId === topic.id))
      throw new Error('Archive a studied topic to preserve its history.');
    this.db.transaction(() => {
      snapshot.topics
        .filter((t) => t.parentId === topic.id)
        .forEach((child) => this.writeTopic({ ...child, parentId: null }));
      this.db.prepare('DELETE FROM study_topics WHERE id=?').run(topic.id);
    })();
    return true;
  }
}
