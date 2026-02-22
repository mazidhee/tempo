import { app, BrowserWindow, Notification } from 'electron';
import path from 'path';
import { initDatabase, getIncompleteCount } from './database/db';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'Habit Tracker',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0f172a',
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
      const today = now.toISOString().split('T')[0];
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
  initDatabase();
  registerIpcHandlers();
  createWindow();
  scheduleEndOfDayReminder();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
