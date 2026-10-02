import { readFile, writeFile, mkdir, unlink, rename } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';
import { validDomain } from '../../shared/focus';
const exec = promisify(execFile);
const psQuote = (s: string) => `'${s.replace(/'/g, "''")}'`;
export const hostsStart = '# BEGIN TEMPO FOCUS GUARD';
export const hostsEnd = '# END TEMPO FOCUS GUARD';
export function stripHostsBlock(text: string) {
  const lines = text.split(/\r?\n/),
    result: string[] = [];
  let inside = false;
  for (const line of lines) {
    if (line === hostsStart) {
      if (inside)
        throw new Error('Malformed Tempo hosts marker; repair requires checking the hosts file.');
      inside = true;
    } else if (line === hostsEnd) {
      if (!inside) throw new Error('Malformed Tempo hosts marker.');
      inside = false;
    } else if (!inside) result.push(line);
  }
  if (inside) throw new Error('Incomplete Tempo hosts marker; no unrelated entries were removed.');
  return result.join(text.includes('\r\n') ? '\r\n' : '\n');
}
export function hostsWithDomains(text: string, domains: string[]) {
  if (!domains.every(validDomain)) throw new Error('Invalid website domain.');
  const clean = stripHostsBlock(text);
  if (!domains.length) return clean;
  const newline = text.includes('\r\n') ? '\r\n' : '\n';
  return (
    clean +
    (clean.endsWith(newline) ? '' : newline) +
    [
      hostsStart,
      ...[...new Set(domains.map((d) => d.toLowerCase()))].flatMap((d) => [
        `127.0.0.1 ${d}`,
        `::1 ${d}`,
      ]),
      hostsEnd,
      '',
    ].join(newline)
  );
}
export interface HostsAdapter {
  read(): Promise<string>;
  replace(domains: string[]): Promise<void>;
}
/** One generator is used by the elevated helper and unprivileged fixture tests. */
export function windowsHostsRewrite(filename: string, domains: string[], flushDns = true) {
  if (!domains.every(validDomain)) throw new Error('Invalid website domain.');
  const block = [
    hostsStart,
    ...domains.flatMap((d) => [`127.0.0.1 ${d}`, `::1 ${d}`]),
    hostsEnd,
    '',
  ].join('\n');
  return `$ErrorActionPreference='Stop'\n$p=${psQuote(filename)}\n$t=[IO.File]::ReadAllText($p)\n$nl=[string][char]10;if($t.Contains(([string][char]13+[char]10))){$nl=[string][char]13+[char]10}\n$start=${psQuote(hostsStart)}\n$end=${psQuote(hostsEnd)}\n$inside=$false\n$result=[Collections.Generic.List[string]]::new()\nforeach($line in ($t -split '\\r?\\n')) { if($line -eq $start) { if($inside){throw 'Malformed marker'}; $inside=$true } elseif($line -eq $end) { if(!$inside){throw 'Malformed marker'}; $inside=$false } elseif(!$inside){$result.Add($line)} }\nif($inside){throw 'Incomplete marker'}\n$n=($result -join $nl)\n${domains.length ? `if(!$n.EndsWith($nl)){$n+=$nl};$n+=${psQuote(block)}.Replace([string][char]10,$nl)` : ''}\n[IO.File]::WriteAllText($p,$n,[Text.UTF8Encoding]::new($false))\n${flushDns ? '& ipconfig.exe /flushdns | Out-Null' : ''}\n`;
}
export function windowsHostsWatchdog(
  filename: string,
  leaseFile: string,
  owner: string,
  flushDns = true,
) {
  return `$ErrorActionPreference='Stop'\n$lease=${psQuote(leaseFile)}\n$owner=${psQuote(owner)}\n[IO.File]::WriteAllText($lease+'.ready',$owner)\nwhile($true){\n  Start-Sleep -Milliseconds 500\n  $data=$null;try{$data=[IO.File]::ReadAllText($lease)|ConvertFrom-Json}catch{}\n  if($data -and $data.owner -ne $owner){exit 0}\n  $now=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()\n  if(!$data -or [double]$data.expiresAt -le $now){\n    try{\n${windowsHostsRewrite(filename, [], flushDns)}\n      [IO.File]::WriteAllText($lease+'.released',$owner)\n      exit 0\n    }catch{Start-Sleep -Milliseconds 500}\n  }\n}\n`;
}
/** Tests inject a fixture path. Elevation never runs for an isolated adapter. */
export class FileHostsAdapter implements HostsAdapter {
  constructor(readonly filename: string) {}
  read() {
    return readFile(this.filename, 'utf8');
  }
  async replace(domains: string[]) {
    const before = await this.read();
    const next = hostsWithDomains(before, domains);
    if (next !== before) await writeFile(this.filename, next, 'utf8');
  }
}
/** Elevated helpers recompute from the CURRENT hosts file, preserving concurrent edits. */
export class SystemHostsAdapter implements HostsAdapter {
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private owner: string | null = null;
  private leaseWrites: Promise<void> = Promise.resolve();
  constructor(readonly leaseFile = path.join(os.tmpdir(), 'tempo-focus-hosts.lease')) {}
  readonly filename =
    process.platform === 'win32'
      ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'drivers', 'etc', 'hosts')
      : '/etc/hosts';
  read() {
    return readFile(this.filename, 'utf8');
  }
  private writeLease(owner: string, expiresAt: number) {
    const write = this.leaseWrites.then(async () => {
      await mkdir(path.dirname(this.leaseFile), { recursive: true });
      const next = `${this.leaseFile}.next`;
      await writeFile(next, JSON.stringify({ owner, expiresAt }), 'utf8');
      await rename(next, this.leaseFile);
    });
    this.leaseWrites = write.catch(() => undefined);
    return write;
  }
  private async releaseLease() {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
    const stored = await readFile(this.leaseFile, 'utf8')
      .then((t) => JSON.parse(t) as { owner?: unknown })
      .catch(() => null);
    const owner = this.owner ?? (typeof stored?.owner === 'string' ? stored.owner : null);
    this.owner = null;
    if (!owner) return;
    await this.writeLease(owner, 0);
    // A denied permission prompt never started a watchdog or installed a block.
    // Waiting for its acknowledgement would needlessly stall every later action.
    if (!(await this.read()).includes(hostsStart)) return;
    for (let n = 0; n < 40; n++) {
      const clean = !(await this.read()).includes(hostsStart);
      if (clean && (await readFile(this.leaseFile + '.released', 'utf8').catch(() => '')) === owner)
        return;
      await new Promise((r) => setTimeout(r, 200));
    }
    // A missing/failed watchdog falls back to the verified elevated repair path.
  }
  async replace(domains: string[]) {
    if (!domains.every(validDomain)) throw new Error('Invalid website domain.');
    let before = await this.read();
    if (process.platform === 'win32') {
      if (domains.length && this.owner && hostsWithDomains(before, domains) === before) return;
      // Stop an existing lease before replacing its block. Startup repair also
      // expires a previous process's lease without requiring a second UAC prompt.
      if (!domains.length || this.owner) await this.releaseLease();
      before = await this.read();
    }
    if (hostsWithDomains(before, domains) === before) return;
    const dir = path.join(os.tmpdir(), `tempo-guard-${crypto.randomUUID()}`);
    await mkdir(dir);
    const helper = path.join(dir, process.platform === 'win32' ? 'guard.ps1' : 'guard.js');
    try {
      if (process.platform === 'win32') {
        let script = windowsHostsRewrite(this.filename, domains);
        if (domains.length) {
          const owner = crypto.randomUUID();
          this.owner = owner;
          await this.writeLease(owner, Date.now() + 10_000);
          this.heartbeat = setInterval(() => {
            if (this.owner === owner)
              void this.writeLease(owner, Date.now() + 10_000).catch(() => undefined);
          }, 2000);
          const encoded = Buffer.from(
            windowsHostsWatchdog(this.filename, this.leaseFile, owner),
            'utf16le',
          ).toString('base64');
          script += `try{$child=Start-Process -FilePath powershell.exe -WindowStyle Hidden -PassThru -ArgumentList @('-NoProfile','-NonInteractive','-EncodedCommand',${psQuote(encoded)});if(!$child){throw 'No watchdog'}}catch{\n${windowsHostsRewrite(this.filename, [])}\nthrow}\n`;
        }
        await writeFile(helper, script, 'utf8');
        const command = `$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; $p=Start-Process -FilePath powershell.exe -WindowStyle Hidden -Verb RunAs -Wait -PassThru -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File','"${helper}"'); if($p.ExitCode -ne 0){throw 'Guard elevation was cancelled or failed'}`;
        await exec(
          'powershell.exe',
          [
            '-NoProfile',
            '-NonInteractive',
            '-EncodedCommand',
            Buffer.from(command, 'utf16le').toString('base64'),
          ],
          { windowsHide: true, timeout: 120_000 },
        );
        if (domains.length) {
          let ready = false;
          for (let n = 0; n < 50; n++) {
            if (
              (await readFile(this.leaseFile + '.ready', 'utf8').catch(() => '')) === this.owner
            ) {
              ready = true;
              break;
            }
            await new Promise((r) => setTimeout(r, 100));
          }
          if (!ready) {
            await this.releaseLease();
            throw new Error(
              'Guard watchdog did not acknowledge startup; hosts blocking was released.',
            );
          }
        }
      } else {
        // No shell interpolation of domains: helper receives a validated literal array.
        const body = `const fs=require('fs');const p=${JSON.stringify(this.filename)};const start=${JSON.stringify(hostsStart)},end=${JSON.stringify(hostsEnd)};let inside=false;const out=[];for(const l of fs.readFileSync(p,'utf8').split(/\\r?\\n/)){if(l===start){if(inside)throw Error('Marker');inside=true}else if(l===end){if(!inside)throw Error('Marker');inside=false}else if(!inside)out.push(l)}if(inside)throw Error('Marker');let n=out.join('\\n');const domains=${JSON.stringify(domains)};if(domains.length)n=n.replace(/\\n*$/,'\\n')+[start,...domains.flatMap(d=>['127.0.0.1 '+d,'::1 '+d]),end,''].join('\\n');fs.writeFileSync(p,n);`;
        await writeFile(helper, body, 'utf8');
        // Electron cannot be launched as root in GUI mode; run its Node helper explicitly.
        const cmd = `ELECTRON_RUN_AS_NODE=1 ${shellQuote(process.execPath)} ${shellQuote(helper)}`;
        if (process.platform === 'darwin')
          await exec(
            'osascript',
            [
              '-e',
              `do shell script ${JSON.stringify(cmd + '; dscacheutil -flushcache; killall -HUP mDNSResponder')} with administrator privileges`,
            ],
            { timeout: 120_000 },
          );
        else
          await exec('pkexec', ['env', 'ELECTRON_RUN_AS_NODE=1', process.execPath, helper], {
            timeout: 120_000,
          });
        if (process.platform === 'linux')
          await exec('resolvectl', ['flush-caches']).catch(() => undefined);
      }
      const actual = await this.read();
      if (
        domains.length
          ? !domains.every((d) => actual.includes(`127.0.0.1 ${d}`) && actual.includes(`::1 ${d}`))
          : actual.includes(hostsStart)
      )
        throw new Error('Hosts repair could not be verified. Use Repair and approve elevation.');
    } catch (e) {
      if (process.platform === 'win32' && this.owner) await this.releaseLease();
      throw e;
    } finally {
      await unlink(helper).catch(() => undefined);
    }
  }
}
const shellQuote = (s: string) => `'${s.replace(/'/g, "'\\''")}'`;
