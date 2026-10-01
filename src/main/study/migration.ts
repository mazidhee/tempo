import type Database from '../database/sqlite';
export const studyMigration = {
  version: 4,
  name: 'study-foundation',
  apply(db: Database) {
    db.exec(`CREATE TABLE study_curricula (id TEXT PRIMARY KEY, json TEXT NOT NULL);
      CREATE TABLE study_topics (id TEXT PRIMARY KEY, curriculum_id TEXT NOT NULL REFERENCES study_curricula(id), json TEXT NOT NULL);
      CREATE INDEX idx_study_topics_curriculum ON study_topics(curriculum_id);
      CREATE TABLE study_reviews (id TEXT PRIMARY KEY, topic_id TEXT NOT NULL REFERENCES study_topics(id), reviewed_at TEXT NOT NULL, json TEXT NOT NULL);
      CREATE INDEX idx_study_reviews_topic ON study_reviews(topic_id, reviewed_at);`);
  },
};
