import type Database from '../database/sqlite';
import type { BackupLinks, ModuleBackupAdapter } from '../database/moduleBackup';
import type { StudySnapshot } from '../../shared/study';
import { validDate } from '../../shared/habits';
import { StudyStore } from './store';
const text = (value: unknown, limit: number) => typeof value === 'string' && value.length <= limit;
const id = (value: unknown) => text(value, 100) && !!(value as string).trim();
const timestamp = (value: unknown) =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));
export function validateStudySnapshot(value: unknown): asserts value is StudySnapshot {
  const fail = () => {
    throw new Error('Invalid Study data in backup. Nothing was changed.');
  };
  if (!value || typeof value !== 'object') fail();
  const data = value as StudySnapshot;
  if (!Array.isArray(data.curricula) || !Array.isArray(data.topics) || !Array.isArray(data.reviews))
    fail();
  const curricula = new Set(data.curricula.map((c) => c?.id)),
    topics = new Set(data.topics.map((t) => t?.id)),
    reviews = new Set(data.reviews.map((r) => r?.id));
  if (
    curricula.size !== data.curricula.length ||
    topics.size !== data.topics.length ||
    reviews.size !== data.reviews.length
  )
    fail();
  for (const c of data.curricula)
    if (
      !c ||
      !id(c.id) ||
      !text(c.title, 200) ||
      !c.title.trim() ||
      !text(c.description, 2000) ||
      !timestamp(c.createdAt) ||
      typeof c.archived !== 'boolean'
    )
      fail();
  for (const t of data.topics) {
    if (
      !t ||
      !id(t.id) ||
      !curricula.has(t.curriculumId) ||
      !text(t.title, 200) ||
      !t.title.trim() ||
      !Number.isInteger(t.order) ||
      t.order < 0 ||
      t.order > 100000 ||
      typeof t.archived !== 'boolean' ||
      !Number.isInteger(t.interval) ||
      t.interval < 0 ||
      t.interval > 3650 ||
      !(t.learnedAt === null || timestamp(t.learnedAt)) ||
      !(t.reviewDue === null || validDate(t.reviewDue))
    )
      fail();
    if (
      t.learnedAt === null
        ? t.reviewDue !== null || t.interval !== 0
        : t.reviewDue === null || t.interval < 1
    )
      fail();
    let parent = t.parentId;
    const visited = new Set([t.id]);
    while (parent !== null) {
      const p = data.topics.find((topic) => topic.id === parent);
      if (!p || p.curriculumId !== t.curriculumId || visited.has(p.id)) fail();
      visited.add(p!.id);
      parent = p!.parentId;
    }
  }
  for (const r of data.reviews)
    if (
      !r ||
      !id(r.id) ||
      !topics.has(r.topicId) ||
      !timestamp(r.reviewedAt) ||
      ![0, 1, 2, 3].includes(r.grade) ||
      !Number.isInteger(r.interval) ||
      r.interval < 1 ||
      r.interval > 3650
    )
      fail();
}
function mergeStudy(db: Database, value: unknown, links: BackupLinks) {
  validateStudySnapshot(value);
  const old = new StudyStore(db).snapshot();
  for (const c of value.curricula) {
    const existing = old.curricula.find((item) => item.id === c.id);
    const mapped = existing && existing.createdAt !== c.createdAt ? crypto.randomUUID() : c.id;
    links.studyCurricula.set(c.id, mapped);
    if (!existing || mapped !== c.id)
      db.prepare('INSERT INTO study_curricula(id,json) VALUES(?,?)').run(
        mapped,
        JSON.stringify({ ...c, id: mapped }),
      );
  }
  for (const t of value.topics) {
    const existing = old.topics.find((item) => item.id === t.id);
    links.studyTopics.set(
      t.id,
      existing && existing.curriculumId !== links.studyCurricula.get(t.curriculumId)
        ? crypto.randomUUID()
        : t.id,
    );
  }
  for (const t of value.topics) {
    const mapped = links.studyTopics.get(t.id)!;
    if (old.topics.some((item) => item.id === mapped)) continue;
    const topic = {
      ...t,
      id: mapped,
      curriculumId: links.studyCurricula.get(t.curriculumId)!,
      parentId: t.parentId ? links.studyTopics.get(t.parentId)! : null,
    };
    db.prepare('INSERT INTO study_topics(id,curriculum_id,json) VALUES(?,?,?)').run(
      mapped,
      topic.curriculumId,
      JSON.stringify(topic),
    );
  }
  for (const r of value.reviews) {
    const existing = old.reviews.find((item) => item.id === r.id);
    const topicId = links.studyTopics.get(r.topicId)!;
    if (existing && existing.topicId === topicId && existing.reviewedAt === r.reviewedAt) continue;
    const review = { ...r, id: existing ? crypto.randomUUID() : r.id, topicId };
    db.prepare('INSERT INTO study_reviews(id,topic_id,reviewed_at,json) VALUES(?,?,?,?)').run(
      review.id,
      review.topicId,
      review.reviewedAt,
      JSON.stringify(review),
    );
  }
}
export const studyBackup: ModuleBackupAdapter = {
  key: 'study',
  export: (db) => new StudyStore(db).snapshot(),
  validate: validateStudySnapshot,
  merge: mergeStudy,
};
