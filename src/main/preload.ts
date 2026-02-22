import { contextBridge, ipcRenderer } from 'electron';

const api = {
  getHabits: (includeArchived?: boolean) => ipcRenderer.invoke('habits:getAll', includeArchived),
  addHabit: (data: { name: string; description?: string; frequency: string; time_of_day: string; days_of_week?: string; scheduled_time?: string }) =>
    ipcRenderer.invoke('habits:add', data),
  editHabit: (data: { id: number; name: string; description?: string; frequency: string; time_of_day: string; days_of_week?: string; scheduled_time?: string }) =>
    ipcRenderer.invoke('habits:edit', data),
  archiveHabit: (id: number) => ipcRenderer.invoke('habits:archive', id),
  restoreHabit: (id: number) => ipcRenderer.invoke('habits:restore', id),
  deleteHabit: (id: number) => ipcRenderer.invoke('habits:delete', id),

  getLogsByDate: (date: string) => ipcRenderer.invoke('logs:getByDate', date),
  getLogsByHabit: (habitId: number) => ipcRenderer.invoke('logs:getByHabit', habitId),
  toggleLog: (data: { habitId: number; logDate: string; isCompleted: boolean; note?: string }) =>
    ipcRenderer.invoke('logs:toggle', data),
  addNote: (data: { habitId: number; logDate: string; note: string }) =>
    ipcRenderer.invoke('logs:addNote', data),
  addMissedReason: (data: { habitId: number; logDate: string; reason: string }) =>
    ipcRenderer.invoke('logs:addMissedReason', data),

  getWeeklyData: (data: { startDate: string; endDate: string }) =>
    ipcRenderer.invoke('logs:getWeekly', data),

  getHistory: () => ipcRenderer.invoke('logs:getHistory'),

  getStreaks: () => ipcRenderer.invoke('analytics:getStreaks'),
  getCompletionRates: () => ipcRenderer.invoke('analytics:getCompletionRates'),
  getHeatmapData: () => ipcRenderer.invoke('analytics:getHeatmapData'),
  getBestWorstDay: () => ipcRenderer.invoke('analytics:getBestWorstDay'),
  getHabitTrend: (habitId: number) => ipcRenderer.invoke('analytics:getHabitTrend', habitId),

  exportCSV: () => ipcRenderer.invoke('export:csv'),
};

contextBridge.exposeInMainWorld('habitAPI', api);

export type HabitAPI = typeof api;
