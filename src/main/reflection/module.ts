import { ipcMain, Notification } from 'electron';
import type { ModuleContext } from '../modules/contracts';
import { ReflectionStore } from './store';
import { reminderTick } from './reminders';
export function registerReflection(context: ModuleContext) {
  const store = new ReflectionStore(context.db);
  const emit = (namespace: string) =>
    context.getWindow()?.webContents.send(`${namespace}:changed`, store.snapshot());
  ipcMain.handle('plan:snapshot', () => store.snapshot());
  const reads: [string, (input: unknown) => unknown][] = [
    ['journal:search', store.search],
    ['journal:lookup', store.lookup],
    ['journal:lookupDates', store.lookupDates],
  ];
  for (const [channel, operation] of reads)
    ipcMain.handle(channel, (_event, input: unknown) => operation.call(store, input));
  const writes: [string, (input: unknown) => unknown][] = [
    ['plan:save', store.savePlan],
    ['plan:evening', store.evening],
    ['plan:saveSettings', store.saveSettings],
    ['journal:save', store.saveJournal],
    ['review:generate', store.generate],
    ['review:save', store.saveReview],
    ['goals:save', store.saveGoal],
    ['goals:archive', store.archiveGoal],
  ];
  for (const [channel, operation] of writes)
    ipcMain.handle(channel, (_event, input: unknown) => {
      const result = operation.call(store, input);
      emit(channel.split(':')[0]);
      if (channel === 'plan:evening') emit('journal');
      return result;
    });
  const tick = () => {
    if (context.isQuitting()) return;
    try {
      if (
        reminderTick(
          store,
          new Date(),
          (title, body) => {
            if (Notification.isSupported()) {
              const notification = new Notification({ title: `Tempo · ${title}`, body });
              notification.on('click', () => context.showWindow());
              notification.show();
            }
          },
          !process.env.HABIT_TRACKER_DATA_DIR,
        )
      )
        emit('review');
    } catch (error) {
      console.error('Reflection scheduler:', error);
    }
  };
  tick();
  const timer = setInterval(tick, 30000);
  return { beforeQuit: () => clearInterval(timer) };
}
