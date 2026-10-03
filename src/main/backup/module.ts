import { app, ipcMain, safeStorage } from 'electron';
import {
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
} from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import type { ModuleContext } from '../modules/contracts';
import { exportBackup } from '../ipc/backup';
import { localDate } from '../../shared/productivity';
import { backupSummary } from '../../shared/backup';
import { encryptBackup, decryptBackup } from './crypto';
import { GitHubBackup } from './github';
/** Local copies are automatic; network access happens only through the upload command. */
export function registerBackups(context: ModuleContext) {
  let localError = '';
  let uploading = false;
  const folder = path.join(app.getPath('userData'), 'tempo-private-backups');
  const configFile = path.join(app.getPath('userData'), 'github-backup-config.json');
  type Config = { repository: string; token?: string; lastUpload: string | null };
  let config: Config = { repository: 'mazidhee/tempo', lastUpload: null };
  try {
    config = { ...config, ...JSON.parse(readFileSync(configFile, 'utf8')) };
  } catch {}
  const persist = () => {
    writeFileSync(configFile + '.tmp', JSON.stringify(config), { mode: 0o600 });
    renameSync(configFile + '.tmp', configFile);
  };
  const list = () =>
    (existsSync(folder) ? readdirSync(folder) : [])
      .filter((id) => /^tempo-\d{4}-\d{2}-\d{2}\.json$/.test(id))
      .sort()
      .reverse()
      .map((id) => ({ id, date: id.slice(6, 16), bytes: statSync(path.join(folder, id)).size }));
  const snapshot = () => context.db.transaction(() => exportBackup(context.db))();
  const local = () => {
    mkdirSync(folder, { recursive: true });
    const file = path.join(folder, `tempo-${localDate()}.json`);
    if (!existsSync(file)) {
      writeFileSync(file + '.tmp', JSON.stringify(snapshot()), { mode: 0o600 });
      renameSync(file + '.tmp', file);
    }
    // Only this module's automatic snapshots rotate; imports/migration safety copies are retained.
    for (const entry of list().slice(14)) unlinkSync(path.join(folder, entry.id));
  };
  try {
    local();
  } catch {
    localError = 'Could not save an automatic snapshot. Use Save local snapshot to retry.';
  }
  const interval = setInterval(
    () => {
      try {
        local();
        localError = '';
      } catch {
        localError = 'Could not save an automatic snapshot. Use Save local snapshot to retry.';
      }
    },
    15 * 60 * 1000,
  );
  ipcMain.handle('backup:status', () => ({
    repository: config.repository,
    hasToken: !!config.token,
    lastUpload: config.lastUpload,
    local: list(),
    error: localError,
  }));
  ipcMain.handle('backup:local', () => {
    mkdirSync(folder, { recursive: true });
    const file = path.join(folder, `tempo-${localDate()}.json`);
    writeFileSync(file + '.tmp', JSON.stringify(snapshot()), { mode: 0o600 });
    renameSync(file + '.tmp', file);
    localError = '';
    return list();
  });
  ipcMain.handle('backup:readLocal', (_event, id: unknown) => {
    if (typeof id !== 'string' || !list().some((entry) => entry.id === id))
      throw new Error('Choose an available local backup.');
    const data = JSON.parse(readFileSync(path.join(folder, id), 'utf8'));
    return { data, summary: backupSummary(data) };
  });
  ipcMain.handle('backup:configure', (_event, input: unknown) => {
    if (uploading) throw new Error('Wait for the current upload before changing its connection.');
    const value = input as { repository: string; token?: string };
    if (!value || !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_.-]{1,100}$/.test(value.repository))
      throw new Error('Enter a repository as owner/name.');
    if (value.token !== undefined && (typeof value.token !== 'string' || value.token.length > 500))
      throw new Error('Invalid GitHub token.');
    if (value.token && !safeStorage.isEncryptionAvailable())
      throw new Error('Protected credential storage is unavailable. Use your Git sign-in instead.');
    config.repository = value.repository;
    if (value.token !== undefined)
      config.token = value.token
        ? safeStorage.encryptString(value.token.trim()).toString('base64')
        : undefined;
    persist();
    return true;
  });
  const credentials = async () => {
    if (config.token) return safeStorage.decryptString(Buffer.from(config.token, 'base64'));
    // Reuse a local Git Credential Manager sign-in when available, without launching a sign-in prompt.
    return new Promise<string>((resolve, reject) => {
      const child = execFile(
        'git',
        ['credential', 'fill'],
        {
          windowsHide: true,
          timeout: 10000,
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' },
        },
        (error, stdout) => {
          const token = stdout
            ?.split(/\r?\n/)
            .find((line) => line.startsWith('password='))
            ?.slice(9);
          if (error || !token)
            reject(
              new Error(
                'Connect GitHub below with a repository token, or sign in to Git on this computer.',
              ),
            );
          else resolve(token);
        },
      );
      child.stdin?.end(`protocol=https\nhost=github.com\npath=${config.repository}.git\n\n`);
    });
  };
  ipcMain.handle('backup:upload', async (_event, password: unknown) => {
    if (uploading) throw new Error('A backup is already uploading.');
    if (typeof password !== 'string') throw new Error('Enter a backup password.');
    uploading = true;
    try {
      const repository = config.repository;
      mkdirSync(folder, { recursive: true });
      const data = snapshot();
      const file = path.join(folder, `tempo-${localDate()}.json`);
      writeFileSync(file + '.tmp', JSON.stringify(data), { mode: 0o600 });
      renameSync(file + '.tmp', file);
      const encrypted = await encryptBackup(data, password);
      const token = await credentials();
      const result = await new GitHubBackup().upload(repository, token, encrypted);
      config.lastUpload = new Date().toISOString();
      persist();
      return result;
    } finally {
      uploading = false;
    }
  });
  ipcMain.handle('backup:decrypt', async (_event, input: unknown) => {
    const value = input as { content: string; password: string };
    if (!value || typeof value.content !== 'string' || typeof value.password !== 'string')
      throw new Error('Choose an encrypted backup and enter its password.');
    const data = await decryptBackup(value.content, value.password);
    return { data, summary: backupSummary(data) };
  });
  return {
    beforeQuit: () => {
      clearInterval(interval);
    },
  };
}
