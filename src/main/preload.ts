import { contextBridge, ipcRenderer } from 'electron';
import type { WorkspaceAPI, WorkspaceEvents } from '../shared/workspace';

const api = {
  getProductivity: () => ipcRenderer.invoke('productivity:get'),
  saveProductivity: (state: import('../shared/productivity').Productivity) =>
    ipcRenderer.invoke('productivity:save', state),
  notify: (body: string) => ipcRenderer.invoke('productivity:notify', body),
  exportBackup: () => ipcRenderer.invoke('backup:export'),
  importBackup: (data: unknown) => ipcRenderer.invoke('backup:import', data),
  getHabits: (includeArchived?: boolean) => ipcRenderer.invoke('habits:getAll', includeArchived),
  addHabit: (data: import('../shared/habitValidation').HabitInput) =>
    ipcRenderer.invoke('habits:add', data),
  editHabit: (data: import('../shared/habitValidation').HabitInput & { id: number }) =>
    ipcRenderer.invoke('habits:edit', data),
  getHabitSnapshot: () => ipcRenderer.invoke('habits:snapshot'),
  importHabitEvents: (id: number, csv: string) =>
    ipcRenderer.invoke('habits:importEvents', id, csv),
  recordHabit: (data: import('./database/db').HabitRecord) =>
    ipcRenderer.invoke('logs:record', data),
  addPause: (data: { habitId: number; start_date: string; end_date: string; reason: string }) =>
    ipcRenderer.invoke('pauses:add', data),
  removePause: (id: number) => ipcRenderer.invoke('pauses:remove', id),
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
const workspaceAPI: WorkspaceAPI = {
  invoke(channel, ...args) {
    if (!/^(focus|plan|journal|review|goals|study|window|backup|notes):[a-zA-Z]+$/.test(channel))
      throw new Error('Unsupported workspace channel.');
    return ipcRenderer.invoke(channel, ...args);
  },
  on<K extends keyof WorkspaceEvents>(channel: K, listener: (payload: WorkspaceEvents[K]) => void) {
    if (
      !/^(focus|plan|journal|review|goals|study|notes):changed$/.test(channel) &&
      channel !== 'window:navigate'
    )
      throw new Error('Unsupported workspace event.');
    const handler = (_event: Electron.IpcRendererEvent, payload: unknown) =>
      listener(payload as WorkspaceEvents[K]);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
};
contextBridge.exposeInMainWorld('workspaceAPI', workspaceAPI);

export type HabitAPI = typeof api;
