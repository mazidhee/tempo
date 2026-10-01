import { app, BrowserWindow, Notification } from 'electron';
import path from 'path';
import { initDatabase, getIncompleteCount, getDb } from './database/db';
import { registerIpcHandlers } from './ipc/handlers';
import { registerProductivityHandlers } from './ipc/productivity';
import { localDate } from '../shared/productivity';

if (process.env.HABIT_TRACKER_DATA_DIR)
  app.setPath('userData', path.resolve(process.env.HABIT_TRACKER_DATA_DIR));
const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();

let mainWindow: BrowserWindow | null = null;

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
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#f7f8fa',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

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
  registerIpcHandlers();
  registerProductivityHandlers();
  createWindow();
  if (!process.env.HABIT_TRACKER_DATA_DIR) scheduleEndOfDayReminder();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
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
