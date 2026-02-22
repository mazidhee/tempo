import { ipcMain, dialog } from 'electron';
import { writeFileSync } from 'fs';
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
} from '../database/db';

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function isDateLocked(logDate: string): boolean {
  const today = getTodayStr();
  return logDate < today;
}

export function registerIpcHandlers(): void {
  ipcMain.handle('habits:getAll', (_event, includeArchived?: boolean) => {
    return getAllHabits(includeArchived);
  });

  ipcMain.handle('habits:add', (_event, data: { name: string; description?: string; frequency: string; time_of_day: string; days_of_week?: string; scheduled_time?: string }) => {
    if (!data.name || !data.name.trim()) {
      throw new Error('Habit name is required');
    }
    if (!['daily', 'weekly'].includes(data.frequency)) {
      throw new Error('Invalid frequency');
    }
    if (!['morning', 'afternoon', 'evening', 'anytime'].includes(data.time_of_day)) {
      throw new Error('Invalid time_of_day');
    }
    return addHabit(data);
  });

  ipcMain.handle('habits:edit', (_event, data: { id: number; name: string; description?: string; frequency: string; time_of_day: string; days_of_week?: string; scheduled_time?: string }) => {
    if (!data.id) throw new Error('Habit ID is required');
    if (!data.name || !data.name.trim()) throw new Error('Habit name is required');
    if (!['daily', 'weekly'].includes(data.frequency)) throw new Error('Invalid frequency');
    if (!['morning', 'afternoon', 'evening', 'anytime'].includes(data.time_of_day)) throw new Error('Invalid time_of_day');
    return editHabit(data);
  });

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

  ipcMain.handle('logs:toggle', (_event, data: { habitId: number; logDate: string; isCompleted: boolean; note?: string }) => {
    if (!data.habitId) throw new Error('Habit ID is required');
    if (!data.logDate) throw new Error('Log date is required');

    // past days should not be editable
    if (isDateLocked(data.logDate)) {
      throw new Error('Cannot modify a locked day. Only missed reasons can be added to past days.');
    }

    return toggleLog(data.habitId, data.logDate, data.isCompleted, data.note);
  });

  ipcMain.handle('logs:addNote', (_event, data: { habitId: number; logDate: string; note: string }) => {
    if (!data.habitId) throw new Error('Habit ID is required');
    if (!data.logDate) throw new Error('Log date is required');

    if (isDateLocked(data.logDate)) {
      throw new Error('Cannot add notes to a locked day.');
    }

    return addNote(data.habitId, data.logDate, data.note);
  });

  ipcMain.handle('logs:addMissedReason', (_event, data: { habitId: number; logDate: string; reason: string }) => {
    if (!data.habitId) throw new Error('Habit ID is required');
    if (!data.logDate) throw new Error('Log date is required');
    if (!data.reason || !data.reason.trim()) throw new Error('Reason is required');
    // only missed reason is allowed for past days
    return addMissedReason(data.habitId, data.logDate, data.reason);
  });

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

  // TODO: add json export also later
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
