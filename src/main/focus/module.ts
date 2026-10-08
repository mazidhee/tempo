import {
  app,
  ipcMain,
  globalShortcut,
  Menu,
  nativeImage,
  Notification,
  shell,
  Tray,
} from 'electron';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import type { ModuleContext } from '../modules/contracts';
import {
  reservedFocusShortcut,
  shortcutIdentity,
  type FocusSnapshot,
  type FocusSettings,
} from '../../shared/focus';
import { FocusStore } from './store';
import { FocusWidgetWindow } from './widget';
import { cleanUpTasks } from '../../shared/taskLifecycle';
import { FocusGuard } from './guard';
import { FileHostsAdapter, SystemHostsAdapter } from './hosts';
import { NoProcessAdapter, SystemProcessAdapter } from './processes';
import {
  secondsLeft,
  stopwatchSeconds,
  timerIsRunning,
  type Productivity,
} from '../../shared/productivity';
export function registerFocus(context: ModuleContext) {
  const widget = new FocusWidgetWindow(context);
  const store = new FocusStore(context.db, Date.now, (ended) => phaseEnded(ended)),
    isolated = !!process.env.HABIT_TRACKER_DATA_DIR;
  const fixture = path.join(app.getPath('userData'), 'guard-hosts.fixture');
  const nativeNotify = (body: string) => {
    const s = store.productivity();
    if (Notification.isSupported() && s.settings.notifications)
      new Notification({ title: 'Tempo · Focus', body, silent: !s.settings.sound }).show();
  };
  function phaseEnded(ended: Productivity) {
    const n = store
      .events()
      .filter((e) => e.runId === ended.timer.runId && e.kind === 'attempt').length;
    nativeNotify(
      `${ended.timer.phase === 'focus' ? 'Focus session' : 'Break'} complete.${n ? ` You tried to open blocked apps ${n} times.` : ''}`,
    );
    if (ended.settings.sound && !isolated) shell.beep();
  }
  const guard = new FocusGuard(
    isolated
      ? new FileHostsAdapter(fixture)
      : new SystemHostsAdapter(path.join(app.getPath('userData'), 'guard-hosts.lease')),
    isolated ? new NoProcessAdapter() : new SystemProcessAdapter(),
    (name) => {
      store.event('attempt', name);
      emit();
    },
    nativeNotify,
  );
  let shortcutErrors: string[] = [],
    ownedShortcuts: string[] = [],
    tray: Tray | null = null,
    lastTraySecond = '',
    disposed = false;
  let shortcutConfiguration = '';
  let queue: Promise<unknown> = Promise.resolve(),
    lastPoll = 0;
  let lastCleanup = 0;
  let nativeQueue: Promise<unknown> = Promise.resolve(),
    nativePending = 0,
    syncScheduled = false;
  const snapshot = (): FocusSnapshot => ({
    productivity: store.productivity(),
    settings: store.settings(),
    events: store.events(),
    guard: {
      active: guard.active,
      error: guard.error,
      repairedAt: guard.repairedAt,
      pending: nativePending > 0,
      appsActive: guard.appsActive,
      websitesActive: guard.websitesActive,
      diagnostics: guard.diagnostics,
    },
    shortcutErrors,
    emergencyReadyAt: store.emergencyReadyAt,
  });
  const emit = () => {
    const data = snapshot();
    context.getWindow()?.webContents.send('focus:changed', data);
    widget.sync(data);
    updateTray();
    return data;
  };
  const enqueue = <T>(operation: () => Promise<T> | T): Promise<T> => {
    const result = queue.then(operation);
    queue = result.catch(() => undefined);
    return result;
  };
  // Native effects may wait for UAC or another process. They never share the
  // timer's write queue, and polling is coalesced rather than building a backlog.
  const nativeEnqueue = <T>(operation: () => Promise<T>): Promise<T> => {
    nativePending++;
    const result = nativeQueue.then(operation).finally(() => {
      nativePending--;
      emit();
    });
    nativeQueue = result.catch(() => undefined);
    return result;
  };
  const signature = () => JSON.stringify([store.settings(), store.productivity().timer]);
  const sync = () => {
    if (context.isQuitting() || disposed || syncScheduled) return;
    syncScheduled = true;
    let before = '';
    void nativeEnqueue(async () => {
      before = signature();
      if (!context.isQuitting())
        await guard.sync(
          store.settings(),
          store.productivity().timer,
          () => before === signature(),
        );
    })
      .finally(() => {
        syncScheduled = false;
        if (before !== signature()) sync();
      })
      .catch(() => undefined);
  };
  const action = (input: unknown) =>
    enqueue(() => {
      if (context.isQuitting()) throw new Error('Tempo is releasing Guard before quitting.');
      store.command(input);
      sync();
      return emit();
    });
  const shortcuts = (settings: FocusSettings) => {
    shortcutConfiguration = JSON.stringify(settings.shortcuts);
    ownedShortcuts.forEach((s) => globalShortcut.unregister(s));
    ownedShortcuts = [];
    shortcutErrors = [];
    const entries = Object.entries(settings.shortcuts);
    for (const [key, accelerator] of entries) {
      if (!accelerator) continue;
      if (
        reservedFocusShortcut(accelerator) ||
        ownedShortcuts.some((x) => shortcutIdentity(x) === shortcutIdentity(accelerator))
      ) {
        shortcutErrors.push(`${key}: ${accelerator} conflicts with another Tempo shortcut.`);
        continue;
      }
      try {
        const ok = globalShortcut.register(accelerator, () => {
          const actionName =
            key === 'toggle'
              ? !timerIsRunning(store.productivity().timer)
                ? 'start'
                : 'pause'
              : key === 'skip'
                ? 'skip'
                : 'stop';
          void action({ action: actionName }).catch((e) => {
            guard.error = (e as Error).message;
            emit();
            context.showWindow();
          });
        });
        if (ok) ownedShortcuts.push(accelerator);
        else shortcutErrors.push(`${key}: ${accelerator} is already in use.`);
      } catch {
        shortcutErrors.push(`${key}: ${accelerator} is not a valid shortcut.`);
      }
    }
  };
  // Neutral dynamic icon: each second encodes the remaining proportion without a second accent.
  const trayIcon = (progress: number) => {
    const size = 16,
      data = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const distance = Math.hypot(x - 7.5, y - 7.5),
          angle = (Math.atan2(y - 7.5, x - 7.5) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
        const on = distance >= 5 && distance <= 7 && angle <= Math.PI * 2 * progress;
        const offset = (y * size + x) * 4;
        data[offset] = data[offset + 1] = data[offset + 2] = on ? 210 : 110;
        data[offset + 3] = distance >= 5 && distance <= 7 ? 255 : 0;
      }
    return nativeImage.createFromBitmap(data, { width: size, height: size, scaleFactor: 1 });
  };
  function updateTray() {
    if (!tray) return;
    const s = store.productivity(),
      t = s.timer,
      left = Math.ceil(t.stopwatch ? stopwatchSeconds(t, Date.now()) : secondsLeft(t, Date.now())),
      label = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    const signature = `${t.runId}:${left}:${timerIsRunning(t)}:${guard.active}`;
    if (lastTraySecond === signature) return;
    lastTraySecond = signature;
    const attempts = store
      .events()
      .filter((e) => e.runId === t.runId && e.kind === 'attempt').length;
    tray.setToolTip(
      `Tempo · ${t.stopwatch ? 'Tracking' : t.phase} ${label} · ${attempts} attempts`,
    );
    tray.setImage(trayIcon(t.stopwatch ? 1 : Math.max(0.05, left / t.duration)));
    if (process.platform === 'darwin') tray.setTitle(label);
    const run = (c: unknown) =>
      void action(c).catch((e) => {
        guard.error = (e as Error).message;
        emit();
        context.showWindow();
      });
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: `${t.presetName} · ${label}${!timerIsRunning(t) ? ' · paused' : ''}`,
          enabled: false,
        },
        {
          label: 'Start preset',
          submenu: s.presets.map((p) => ({
            label: p.name,
            enabled: t.startedAt === null,
            click: () => {
              void enqueue(async () => {
                store.command({ action: 'configure', presetId: p.id, timerMode: 'pomodoro' });
                store.command({ action: 'start' });
                sync();
                emit();
              }).catch((e) => {
                guard.error = (e as Error).message;
                emit();
              });
            },
          })),
        },
        {
          label: !timerIsRunning(t) ? 'Start / Resume' : 'Pause',
          enabled: !(store.settings().strict && timerIsRunning(t)),
          click: () => run({ action: !timerIsRunning(t) ? 'start' : 'pause' }),
        },
        {
          label: 'Skip phase',
          enabled: !t.stopwatch && (!store.settings().strict || t.startedAt === null),
          click: () => run({ action: 'skip' }),
        },
        {
          label: t.stopwatch ? 'Save and stop' : 'Stop',
          enabled: !store.settings().strict || t.startedAt === null,
          click: () => run({ action: 'stop' }),
        },
        { type: 'separator' },
        { label: 'Open Tempo / Emergency exit', click: context.showWindow },
        { label: 'Quit Tempo', click: () => app.quit() },
      ]),
    );
  }
  const initialization = enqueue(async () => {
    if (isolated) {
      await mkdir(path.dirname(fixture), { recursive: true });
      await writeFile(fixture, '# Isolated Focus Guard fixture\n', { flag: 'wx' }).catch(
        (e: NodeJS.ErrnoException) => {
          if (e.code !== 'EEXIST') throw e;
        },
      );
    }
    tray = new Tray(trayIcon(1));
    tray.on('click', context.showWindow);
    shortcuts(store.settings());
    void nativeEnqueue(() => guard.repair()).catch(() => undefined);
    store.complete();
    sync();
    emit();
  });
  initialization.catch((e) => {
    guard.error = `Startup repair: ${(e as Error).message}`;
    emit();
    context.showWindow();
  });
  ipcMain.handle('focus:snapshot', () => snapshot());
  ipcMain.handle('focus:command', (_e, input) => action(input));
  ipcMain.handle('focus:saveSession', (_e, input) =>
    enqueue(() => {
      store.saveSession(input);
      return emit();
    }),
  );
  ipcMain.handle('focus:deleteSession', (_e, input) =>
    enqueue(() => {
      store.deleteSession(input);
      return emit();
    }),
  );
  ipcMain.handle('focus:legacyTimer', (_e, input) =>
    enqueue(() => {
      store.legacy(input);
      sync();
      return emit();
    }),
  );
  ipcMain.handle('focus:settings', (_e, input) =>
    enqueue(() => {
      store.saveSettings(input);
      shortcuts(store.settings());
      sync();
      return emit();
    }),
  );
  ipcMain.handle('focus:runningApps', () =>
    guard.processes.list().catch(() => {
      throw new Error('Could not read running apps. Try Refresh again.');
    }),
  );
  ipcMain.handle('focus:repair', () =>
    enqueue(() => {
      void nativeEnqueue(() => guard.repair(store.productivity().timer.runId)).catch(
        () => undefined,
      );
      return emit();
    }),
  );
  ipcMain.handle('focus:retryWebsites', () =>
    enqueue(() => {
      guard.retryWebsites();
      sync();
      return emit();
    }),
  );
  ipcMain.handle('focus:emergencyBegin', () => {
    store.emergencyBegin();
    return emit();
  });
  ipcMain.handle('focus:emergencyExit', (_e, input) => {
    // End the timer immediately, even while an elevation dialog is pending.
    // Website cleanup is serialized after that dialog so a late helper can
    // never reapply entries after the emergency repair has completed.
    store.emergencyExit(input);
    void nativeEnqueue(() => guard.repair()).catch(() => undefined);
    return emit();
  });
  const interval = setInterval(() => {
    if (disposed) return;
    void enqueue(async () => {
      if (disposed || context.isQuitting()) return;
      let cleaned = false;
      if (Date.now() - lastCleanup >= 60000) {
        lastCleanup = Date.now();
        const current = store.productivity(),
          next = cleanUpTasks(current, lastCleanup);
        if (next !== current) {
          store.save(next);
          cleaned = true;
        }
      }
      if (JSON.stringify(store.settings().shortcuts) !== shortcutConfiguration)
        shortcuts(store.settings());
      const ended = store.complete();
      try {
        if (ended || Date.now() - lastPoll >= 2500) {
          lastPoll = Date.now();
          sync();
        }
      } finally {
        if (ended || cleaned) emit();
        else updateTray();
      }
    }).catch(() => emit());
  }, 1000);
  return {
    onWindowClose() {
      if (context.isQuitting() || !tray) return false;
      context.getWindow()?.hide();
      return true;
    },
    async beforeQuit() {
      try {
        await nativeEnqueue(() => guard.repair());
      } catch (e) {
        emit();
        context.showWindow();
        throw e;
      }
      disposed = true;
      clearInterval(interval);
      ownedShortcuts.forEach((s) => globalShortcut.unregister(s));
      tray?.destroy();
      widget.dispose();
    },
  };
}
