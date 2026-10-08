import { app, ipcMain } from 'electron';
import path from 'node:path';
import type { ModuleContext } from '../modules/contracts';
import { KnowledgeStore } from './store';
import { StudyStore } from '../study/store';
import { buildKnowledgeGraph } from '../../shared/knowledge';
import type { Productivity } from '../../shared/productivity';
export function registerKnowledge(context: ModuleContext) {
  const store = new KnowledgeStore(context.db, path.join(app.getPath('userData'), 'notes'));
  store.reconcile();
  ipcMain.handle('notes:snapshot', () => {
    store.reconcile();
    return store.snapshot();
  });
  for (const operation of ['save', 'folder'] as const)
    ipcMain.handle(`notes:${operation}`, (_event, input: unknown) => {
      const result = store[operation](input);
      context.getWindow()?.webContents.send('notes:changed', result);
      return result;
    });
  ipcMain.handle('notes:graph', () => {
    const row = context.db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as {
      json: string;
    };
    return buildKnowledgeGraph(
      store.snapshot().notes,
      new StudyStore(context.db).snapshot(),
      JSON.parse(row.json) as Productivity,
    );
  });
}
