import { ipcMain, dialog } from 'electron';
import { writeFileSync } from 'fs';
import { localDate } from '../../shared/productivity';
import { importHabitEvents } from '../database/habitEventMigration';
import { getDb } from '../database/db';
import {
  getAllHabits,
  addHabit,
  editHabit,
  archiveHabit,
  restoreHabit,
  deleteHabit,
  getLogsByDate,
  getLogsByHabit,
  toggleLog,
  addNote,
  addMissedReason,
  getStreaks,
  getCompletionRates,
  getHeatmapData,
  getBestWorstDay,
  getHabitTrend,
  getWeeklyData,
  getHistoryData,
  exportCSV,
  recordHabit,
  addPause,
  removePause,
  habitSnapshot,
  type HabitRecord,
} from '../database/db';

function getTodayStr(): string {
  return localDate();
}

function isDateLocked(logDate: string): boolean {
  const today = getTodayStr();
  return logDate !== today;
}

export function registerIpcHandlers(): void {
  ipcMain.handle('habits:getAll', (_event, includeArchived?: boolean) => {
    return getAllHabits(includeArchived);
  });

  ipcMain.handle('habits:add', (_event, data: import('../../shared/habitValidation').HabitInput) =>
    addHabit(data),
  );
  ipcMain.handle(
    'habits:edit',
    (_event, data: import('../../shared/habitValidation').HabitInput & { id: number }) =>
      editHabit(data),
  );
  ipcMain.handle('habits:snapshot', () => habitSnapshot());
  ipcMain.handle('habits:importEvents', (_event, id:number,csv:string) => importHabitEvents(getDb(),id,csv));
  ipcMain.handle('logs:record', (_event, data: HabitRecord) => recordHabit(data));
  ipcMain.handle(
    'pauses:add',
    (_event, data: { habitId: number; start_date: string; end_date: string; reason: string }) =>
      addPause(data),
  );
  ipcMain.handle('pauses:remove', (_event, id: number) => removePause(id));

  ipcMain.handle('habits:archive', (_event, id: number) => {
    if (!id) throw new Error('Habit ID is required');
    return archiveHabit(id);
  });

  ipcMain.handle('habits:restore', (_event, id: number) => {
    if (!id) throw new Error('Habit ID is required');
    return restoreHabit(id);
  });

  ipcMain.handle('habits:delete', (_event, id: number) => {
    if (!id) throw new Error('Habit ID is required');
    return deleteHabit(id);
  });

  ipcMain.handle('logs:getByDate', (_event, date: string) => {
    if (!date) throw new Error('Date is required');
    return getLogsByDate(date);
  });

  ipcMain.handle('logs:getByHabit', (_event, habitId: number) => {
    if (!habitId) throw new Error('Habit ID is required');
    return getLogsByHabit(habitId);
  });

  ipcMain.handle(
    'logs:toggle',
    (_event, data: { habitId: number; logDate: string; isCompleted: boolean; note?: string }) => {
      if (!data.habitId) throw new Error('Habit ID is required');
      if (!data.logDate) throw new Error('Log date is required');

      // past days should not be editable
      if (isDateLocked(data.logDate)) {
        throw new Error(
          'Cannot modify a locked day. Only missed reasons can be added to past days.',
        );
      }

      return toggleLog(data.habitId, data.logDate, data.isCompleted, data.note);
    },
  );

  ipcMain.handle(
    'logs:addNote',
    (_event, data: { habitId: number; logDate: string; note: string }) => {
      if (!data.habitId) throw new Error('Habit ID is required');
      if (!data.logDate) throw new Error('Log date is required');

      if (isDateLocked(data.logDate)) {
        throw new Error('Cannot add notes to a locked day.');
      }

      return addNote(data.habitId, data.logDate, data.note);
    },
  );

  ipcMain.handle(
    'logs:addMissedReason',
    (_event, data: { habitId: number; logDate: string; reason: string }) => {
      if (!data.habitId) throw new Error('Habit ID is required');
      if (!data.logDate) throw new Error('Log date is required');
      if (!data.reason || !data.reason.trim()) throw new Error('Reason is required');
      // only missed reason is allowed for past days
      return addMissedReason(data.habitId, data.logDate, data.reason);
    },
  );

  ipcMain.handle('logs:getWeekly', (_event, data: { startDate: string; endDate: string }) => {
    if (!data.startDate || !data.endDate) throw new Error('Start and end dates are required');
    return getWeeklyData(data.startDate, data.endDate);
  });

  ipcMain.handle('logs:getHistory', () => {
    return getHistoryData();
  });

  ipcMain.handle('analytics:getStreaks', () => {
    return getStreaks();
  });

  ipcMain.handle('analytics:getCompletionRates', () => {
    return getCompletionRates();
  });

  ipcMain.handle('analytics:getHeatmapData', () => {
    return getHeatmapData();
  });

  ipcMain.handle('analytics:getBestWorstDay', () => {
    return getBestWorstDay();
  });

  ipcMain.handle('analytics:getHabitTrend', (_event, habitId: number) => {
    if (!habitId) throw new Error('Habit ID is required');
    return getHabitTrend(habitId);
  });

  ipcMain.handle('export:csv', async (event) => {
    const csvContent = exportCSV();
    const win = require('electron').BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win!, {
      title: 'Export Habit Data',
      defaultPath: `habit-tracker-export-${getTodayStr()}.csv`,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
    });

    if (!result.canceled && result.filePath) {
      writeFileSync(result.filePath, csvContent, 'utf-8');
      return { success: true, path: result.filePath };
    }
    return { success: false };
  });
}
