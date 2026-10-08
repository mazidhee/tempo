import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import type { ModuleContext } from '../modules/contracts';
import type { FocusSnapshot } from '../../shared/focus';
import { applyInterfaceScale } from '../interfaceScale';
import {
  defaultWidgetPreferences,
  widgetOpacity,
  type FocusWidgetPreferences,
} from '../../shared/focusWidget';
export class FocusWidgetWindow {
  private window: BrowserWindow | null = null;
  private dismissedRun: string | null = null;
  private current: FocusSnapshot | null = null;
  private manuallyShown = false;
  private preferences: FocusWidgetPreferences = { ...defaultWidgetPreferences };
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private file = path.join(app.getPath('userData'), 'focus-widget.json');
  constructor(private context: ModuleContext) {
    try {
      const stored = JSON.parse(readFileSync(this.file, 'utf8'));
      this.preferences = {
        opacity: widgetOpacity(stored.opacity),
        width: Math.min(480, Math.max(220, Number(stored.width) || defaultWidgetPreferences.width)),
        height: Math.min(
          320,
          Math.max(136, Number(stored.height) || defaultWidgetPreferences.height),
        ),
        ...(Number.isFinite(stored.x) && Number.isFinite(stored.y)
          ? { x: stored.x, y: stored.y }
          : {}),
      };
    } catch {
      /* A missing/damaged preference file uses the compact default. */
    }
    ipcMain.handle('window:widgetShow', () => {
      this.dismissedRun = null;
      this.manuallyShown = true;
      if (this.current) this.show();
    });
    ipcMain.handle('window:widgetHide', () => this.hide());
    ipcMain.handle('window:widgetOpen', () => {
      context.showWindow();
      context.getWindow()?.webContents.send('window:navigate', '/focus');
    });
    ipcMain.handle('window:widgetPreferences', () => this.preferences);
    ipcMain.handle('window:widgetOpacity', (_event, value: unknown) => {
      this.preferences.opacity = widgetOpacity(value);
      this.window?.setOpacity(this.preferences.opacity);
      this.save();
      return this.preferences;
    });
  }
  private save() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.persist(), 250);
  }
  private persist() {
    try {
      writeFileSync(this.file + '.tmp', JSON.stringify(this.preferences), { mode: 0o600 });
      renameSync(this.file + '.tmp', this.file);
    } catch (e) {
      console.error('Floating timer preferences:', e);
    }
  }
  private show() {
    if (this.context.isQuitting()) return;
    if (!this.window || this.window.isDestroyed()) {
      const area = screen.getPrimaryDisplay().workArea,
        p = this.preferences;
      const proposed = {
        x: p.x ?? area.x + area.width - p.width - 24,
        y: p.y ?? area.y + area.height - p.height - 24,
        width: p.width,
        height: p.height,
      };
      const matching = screen.getDisplayMatching(proposed).workArea;
      const x = Math.max(matching.x, Math.min(matching.x + matching.width - p.width, proposed.x));
      const y = Math.max(matching.y, Math.min(matching.y + matching.height - p.height, proposed.y));
      const win = (this.window = new BrowserWindow({
        title: 'Tempo · Floating focus',
        width: p.width,
        height: p.height,
        x,
        y,
        minWidth: 220,
        minHeight: 136,
        maxWidth: 480,
        maxHeight: 320,
        frame: false,
        resizable: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        show: false,
        backgroundColor: '#18191a',
        webPreferences: {
          preload: path.join(__dirname, '../preload/preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
          backgroundThrottling: false,
        },
      }));
      let restored = false;
      let sizeOffset = { width: 0, height: 0 };
      win.setOpacity(p.opacity);
      win.setMenu(null);
      win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      win.webContents.on('did-finish-load', applyInterfaceScale);
      win.webContents.on('will-navigate', (e) => e.preventDefault());
      if (process.env.VITE_DEV_SERVER_URL)
        void win.loadURL(process.env.VITE_DEV_SERVER_URL + '/#/focus-widget');
      else
        void win.loadFile(path.join(__dirname, '../../dist/index.html'), { hash: '/focus-widget' });
      win.once('ready-to-show', () => {
        // Windows can add a scaled resize frame to constructor dimensions.
        // Restore outer bounds explicitly so they do not grow on every launch.
        if (
          this.current &&
          (this.manuallyShown ||
            (this.current.productivity.timer.startedAt !== null &&
              this.current.productivity.timer.runId !== this.dismissedRun)) &&
          !this.context.isQuitting()
        ) {
          win.showInactive();
          win.setBounds({ x, y, width: p.width, height: p.height });
        }
        const actual = win.getBounds();
        sizeOffset = { width: actual.width - p.width, height: actual.height - p.height };
        this.preferences = { ...p, x: actual.x, y: actual.y };
        restored = true;
        this.save();
      });
      win.on('close', (e) => {
        if (!this.context.isQuitting()) {
          e.preventDefault();
          this.hide();
        }
      });
      const remember = () => {
        if (!restored) return;
        const bounds = win.getBounds();
        this.preferences = {
          ...this.preferences,
          ...bounds,
          width: Math.max(220, bounds.width - sizeOffset.width),
          height: Math.max(136, bounds.height - sizeOffset.height),
        };
        this.save();
      };
      win.on('resize', remember);
      win.on('move', remember);
    } else this.window.showInactive();
  }
  hide() {
    this.manuallyShown = false;
    this.dismissedRun = this.current?.productivity.timer.runId || null;
    this.window?.hide();
  }
  sync(snapshot: FocusSnapshot) {
    this.current = snapshot;
    if (
      snapshot.productivity.timer.startedAt !== null &&
      snapshot.productivity.timer.runId !== this.dismissedRun
    )
      this.show();
    else if (!this.manuallyShown) this.window?.hide();
    this.window?.webContents.send('focus:changed', snapshot);
  }
  dispose() {
    clearTimeout(this.saveTimer);
    this.persist();
    this.window?.destroy();
    this.window = null;
  }
}
