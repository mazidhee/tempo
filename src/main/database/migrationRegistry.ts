import type Database from './sqlite';
import { studyMigration } from '../study/migration';
import { focusMigration } from '../focus/migration';
export interface Migration {
  version: number;
  name: string;
  apply: (db: Database) => void;
}
export const migrations: Migration[] = [studyMigration, focusMigration];
/** A batch gets one consistent safety snapshot; every migration is atomic. */
export function runModuleMigrations(db: Database, backup = true) {
  if (
    new Set(migrations.map((m) => m.version)).size !== migrations.length ||
    migrations.some((m) => !Number.isInteger(m.version) || m.version < 4)
  )
    throw new Error('Invalid or duplicate module migration version.');
  const versions = new Set(
    (db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[]).map(
      (row) => row.version,
    ),
  );
  const pending = [...migrations]
    .sort((a, b) => a.version - b.version)
    .filter((m) => !versions.has(m.version));
  if (!pending.length) return;
  if (backup && db.name !== ':memory:') {
    const destination = `${db.name}.before-modules-${Date.now()}.bak`;
    db.exec(`VACUUM INTO '${destination.replace(/'/g, "''")}'`);
  }
  for (const migration of pending)
    db.transaction(() => {
      migration.apply(db);
      db.prepare('INSERT INTO schema_migrations(version,applied_at) VALUES(?,?)').run(
        migration.version,
        new Date().toISOString(),
      );
    })();
}
