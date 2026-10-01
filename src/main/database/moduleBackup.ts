import type Database from './sqlite';
import { studyBackup } from '../study/backup';
export interface BackupLinks {
  habits: Map<number, number>;
  studyTopics: Map<string, string>;
  studyCurricula: Map<string, string>;
}
export interface ModuleBackupAdapter {
  key: string;
  export: (db: Database) => unknown;
  validate: (value: unknown) => void;
  /** Called inside the backup import's single transaction; never begin another. */
  merge: (db: Database, value: unknown, links: BackupLinks) => void;
}
export const moduleBackupAdapters: ModuleBackupAdapter[] = [studyBackup];
export function exportModuleData(db: Database) {
  return Object.fromEntries(
    moduleBackupAdapters.map((adapter) => [adapter.key, adapter.export(db)]),
  );
}
export function validateModuleData(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid module data in backup. Nothing was changed.');
  const data = value as Record<string, unknown>;
  for (const key of Object.keys(data)) {
    const adapter = moduleBackupAdapters.find((module) => module.key === key);
    if (!adapter) throw new Error(`This backup needs a newer app to read its ${key} module.`);
    adapter.validate(data[key]);
  }
  return data;
}
export function mergeModuleData(db: Database, data: Record<string, unknown>, links: BackupLinks) {
  for (const adapter of moduleBackupAdapters)
    if (data[adapter.key] !== undefined) adapter.merge(db, data[adapter.key], links);
}
