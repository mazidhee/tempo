import { ipcMain, Notification } from 'electron';
import { getDb } from '../database/db';
import { validProductivity } from '../../shared/productivity';
import { exportBackup, importBackup } from './backup';
import { preserveMainFocus } from '../focus/store';
import { cleanUpTasks } from '../../shared/taskLifecycle';
import { applyInterfaceScale } from '../interfaceScale';
export function registerProductivityHandlers() {
  ipcMain.handle('productivity:get', () => {
    const current = JSON.parse(
      (getDb().prepare('SELECT json FROM productivity_state WHERE id=1').get() as { json: string })
        .json,
    );
    const next = cleanUpTasks(current);
    if (next !== current)
      getDb().prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(next));
    return next;
  });
  ipcMain.handle('productivity:save', (_e, state: unknown) => {
    if (!validProductivity(state))
      throw new Error('Invalid productivity data. Nothing was changed.');
    const next = cleanUpTasks(preserveMainFocus(getDb(), state));
    getDb().prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(next));
    applyInterfaceScale();
    return true;
  });
  ipcMain.handle('productivity:notify', (_e, body: string) => {
    if (Notification.isSupported())
      new Notification({ title: 'Tempo · Focus', body: String(body).slice(0, 250) }).show();
  });
  ipcMain.handle('backup:export', () => exportBackup(getDb()));
  ipcMain.handle('backup:import', (_e, input: unknown) => importBackup(getDb(), input));
}
