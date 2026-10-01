import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { validAppName, type RunningApp } from '../../shared/focus';
const exec = promisify(execFile);
export interface ProcessAdapter {
  list(): Promise<RunningApp[]>;
  close(app: RunningApp): Promise<void>;
}
export class NoProcessAdapter implements ProcessAdapter {
  async list() {
    return [];
  }
  async close() {}
}
/** Only user-session, non-system executable identities are offered or closed. */
export class SystemProcessAdapter implements ProcessAdapter {
  async list(): Promise<RunningApp[]> {
    if (process.platform === 'win32') {
      const { stdout } = await exec(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          'Get-CimInstance Win32_Process | Where-Object { $_.SessionId -gt 0 -and $_.ExecutablePath } | Select-Object ProcessId,Name,ExecutablePath | ConvertTo-Json -Compress',
        ],
        { windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
      );
      const records = JSON.parse(stdout || '[]');
      return (Array.isArray(records) ? records : [records])
        .map((p: { ProcessId: number; Name: string; ExecutablePath: string }) => ({
          pid: p.ProcessId,
          name: p.Name,
          executable: p.ExecutablePath,
        }))
        .filter(safeUserApp);
    }
    const { stdout } = await exec('ps', [
      '-u',
      String(process.getuid?.() ?? 0),
      '-o',
      'pid=,comm=',
    ]);
    return stdout
      .split('\n')
      .flatMap((line) => {
        const m = line.trim().match(/^(\d+)\s+(.+)$/);
        return m ? [{ pid: Number(m[1]), name: path.basename(m[2]), executable: m[2] }] : [];
      })
      .filter(safeUserApp);
  }
  async close(app: RunningApp) {
    if (!safeUserApp(app)) throw new Error('Only chosen user applications can be closed.');
    const exists = () =>
      this.list().then((all) =>
        all.some((p) => p.pid === app.pid && p.executable === app.executable),
      );
    if (!(await exists())) return;
    if (process.platform === 'win32') {
      // The identity is rechecked before each close/kill, avoiding PID reuse.
      const encodedPath = Buffer.from(app.executable, 'utf8').toString('base64');
      const identity = `$p=Get-CimInstance Win32_Process -Filter 'ProcessId=${app.pid}'; $expected=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encodedPath}')); if(!$p -or $p.ExecutablePath -ne $expected){exit 0};`;
      await exec(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          identity +
            `$proc=Get-Process -Id ${app.pid}; if($proc.MainWindowHandle -ne 0){$null=$proc.CloseMainWindow()}`,
        ],
        { windowsHide: true },
      );
      await new Promise((r) => setTimeout(r, 3000));
      await exec(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          identity + `Stop-Process -Id ${app.pid} -Force`,
        ],
        { windowsHide: true },
      );
    } else {
      process.kill(app.pid, 'SIGTERM');
      await new Promise((r) => setTimeout(r, 3000));
      if (await exists()) process.kill(app.pid, 'SIGKILL');
    }
  }
}
export function safeUserApp(a: RunningApp) {
  return (
    Number.isInteger(a.pid) &&
    a.pid > 0 &&
    a.pid !== process.pid &&
    validAppName(a.name) &&
    !!a.executable &&
    !/[/\\](?:Windows|System32|System|sbin|libexec)[/\\]/i.test(a.executable) &&
    !/electron|habit-tracker|tempo/i.test(a.executable)
  );
}
