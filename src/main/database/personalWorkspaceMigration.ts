import type { Migration } from './migrationRegistry';
import type { Productivity } from '../../shared/productivity';
import { defaultThoughtLibrary } from '../../shared/thoughts';
export const thoughtMigration: Migration = {
  version: 207, name: 'Local daily thoughts and immutable dated selections',
  apply(db) {
    const state: Productivity = JSON.parse((db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as {json:string}).json);
    state.settings.thoughtLibrary ??= defaultThoughtLibrary();
    db.prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(state));
  },
};
export const taskWorkspaceMigration: Migration = {
  version: 208, name: 'Task areas and recoverable retention',
  apply(db) {
    const state: Productivity = JSON.parse((db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as {json:string}).json);
    state.settings.taskCleanup ??= true;
    state.settings.taskRetentionDays ??= 30;
    state.tasks = state.tasks.map(task => ({ ...task, area: task.area ?? 'personal',
      archivedAt: task.archivedAt ?? null, trashedAt: task.trashedAt ?? null, keep: task.keep ?? false }));
    db.prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(state));
  },
};
export const workProjectMigration: Migration = {
  version: 209, name: 'Local work projects and milestones',
  apply(db) {
    const state: Productivity = JSON.parse((db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as {json:string}).json);
    state.settings.workProjects ??= [];
    db.prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(state));
  },
};
