import { app, BrowserWindow, Notification, ipcMain } from 'electron';
import path from 'path';
import { initDatabase, getIncompleteCount, getDb } from './database/db';
import { registerIpcHandlers } from './ipc/handlers';
import { registerProductivityHandlers } from './ipc/productivity';
import { localDate } from '../shared/productivity';
import { mainModules } from './modules/registry';
import type { ModuleLifecycle } from './modules/contracts';

if (process.env.HABIT_TRACKER_DATA_DIR)
  app.setPath('userData', path.resolve(process.env.HABIT_TRACKER_DATA_DIR));
const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();

let mainWindow: BrowserWindow | null = null;
let quitting = false;
let initialized = false;
const lifecycles: ModuleLifecycle[] = [];

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 360,
    minHeight: 600,
    title: 'Tempo',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    frame: process.platform === 'darwin',
    ...(process.platform === 'win32' ? { backgroundMaterial: 'mica' as const } : {}),
    ...(process.platform === 'darwin' ? { vibrancy: 'sidebar' as const } : {}),
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#010102',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!quitting && lifecycles.some((module) => module.onWindowClose?.())) event.preventDefault();
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function scheduleEndOfDayReminder(): void {
  const checkInterval = 60_000;

  setInterval(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // sending reminder at 11:30 PM
    if (hours === 23 && minutes === 30) {
      const today = localDate(now);
      const settings = JSON.parse(
        (
          getDb().prepare('SELECT json FROM productivity_state WHERE id=1').get() as {
            json: string;
          }
        ).json,
      ).settings;
      if (!settings.reminder) return;
      const incomplete = getIncompleteCount(today);

      if (incomplete > 0 && Notification.isSupported()) {
        new Notification({
          title: 'Habit Tracker Reminder',
          body: `You have ${incomplete} habit${incomplete > 1 ? 's' : ''} incomplete today. Lock happens at midnight!`,
          icon: undefined,
        }).show();
      }
    }
  }, checkInterval);
}

app.whenReady().then(() => {
  if (!hasLock) return;
  initDatabase();
  initialized = true;
  registerIpcHandlers();
  registerProductivityHandlers();
  createWindow();
  ipcMain.handle('window:control', (_event, action: unknown) => {
    if (action === 'minimize') mainWindow?.minimize();
    else if (action === 'maximize') {
      if (mainWindow?.isMaximized()) mainWindow.unmaximize();
      else mainWindow?.maximize();
    } else if (action === 'close') mainWindow?.close();
    else throw new Error('Unsupported window action.');
  });
  for (const register of mainModules) {
    const lifecycle = register({
      db: getDb(),
      getWindow: () => mainWindow,
      showWindow: () => {
        if (!mainWindow) createWindow();
        mainWindow?.show();
        mainWindow?.focus();
      },
      isQuitting: () => quitting,
    });
    if (lifecycle) lifecycles.push(lifecycle);
  }
  if (!process.env.HABIT_TRACKER_DATA_DIR) scheduleEndOfDayReminder();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on('before-quit', (event) => {
  if (quitting || !initialized || !hasLock) return;
  event.preventDefault();
  quitting = true;
  void Promise.all(lifecycles.map((module) => module.beforeQuit?.()))
    .then(() => {
      getDb().close();
      app.quit();
    })
    .catch((error) => {
      // Guard cleanup failures must remain visible and repairable, never ignored.
      quitting = false;
      mainWindow?.show();
      console.error('Could not safely quit:', error);
    });
});

app.on('second-instance', () => {
  mainWindow?.show();
  mainWindow?.focus();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
