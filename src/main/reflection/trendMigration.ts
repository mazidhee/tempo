import type { Migration } from '../database/migrationRegistry';
import type { WeeklyReview } from '../../shared/reflection';

/** Preserve saved totals and writing; absent historical detail is not reconstructed. */
export const trendMigration: Migration = {
  version: 206,
  name: 'weekly-review-daily-focus-detail',
  apply(db) {
    for (const row of db.prepare('SELECT start,json FROM reflection_reviews').all() as {
      start: string;
      json: string;
    }[]) {
      const review = JSON.parse(row.json) as WeeklyReview;
      if (review.summary.focus.daily === undefined) {
        review.summary.focus.daily = null;
        db.prepare('UPDATE reflection_reviews SET json=? WHERE start=?').run(
          JSON.stringify(review),
          row.start,
        );
      }
    }
  },
};
