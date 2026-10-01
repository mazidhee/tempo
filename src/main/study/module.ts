import { ipcMain } from 'electron';
import type { ModuleContext } from '../modules/contracts';
import { StudyStore } from './store';
export function registerStudy(context: ModuleContext) {
  const store = new StudyStore(context.db);
  ipcMain.handle('study:snapshot', () => store.snapshot());
  const operations: [string, (input: unknown) => unknown][] = [
    ['saveCurriculum', store.saveCurriculum],
    ['saveTopic', store.saveTopic],
    ['learn', store.learn],
    ['grade', store.grade],
    ['deleteTopic', store.deleteTopic],
    ['importOutlines', store.importOutlines],
  ];
  for (const [channel, method] of operations)
    ipcMain.handle(`study:${channel}`, (_event, input: unknown) => {
      const result = method.call(store, input);
      context.getWindow()?.webContents.send('study:changed', store.snapshot());
      return result;
    });
}
