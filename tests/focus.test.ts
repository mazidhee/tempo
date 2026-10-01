import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import Database from '../src/main/database/sqlite';
import { migrateProductivity } from '../src/main/database/migrations';
import { focusMigration } from '../src/main/focus/migration';
import { FocusStore, preserveMainFocus } from '../src/main/focus/store';
import {
  FileHostsAdapter,
  hostsWithDomains,
  stripHostsBlock,
  hostsStart,
  windowsHostsWatchdog,
  windowsHostsRewrite,
} from '../src/main/focus/hosts';
import { FocusGuard } from '../src/main/focus/guard';
import { safeUserApp } from '../src/main/focus/processes';
import { focusBackup } from '../src/main/focus/backup';
import {
  defaultFocusSettings,
  emergencyPhrase,
  guardShouldRun,
  matchesApp,
  validateFocusSettings,
  reservedFocusShortcut,
  shortcutIdentity,
} from '../src/shared/focus';
import { defaultProductivity, newTimer, startTimer } from '../src/shared/productivity';
function fixture(clock = () => 1000) {
  const db = new Database(':memory:');
  migrateProductivity(db);
  focusMigration.apply(db);
  return { db, store: new FocusStore(db, clock) };
}
test('Focus migration is additive and idempotent, retaining saved presets, timer, sessions and task data', () => {
  const { db, store } = fixture();
  const s = defaultProductivity();
  s.tasks.push({
    id: 'task',
    title: 'Existing',
    due: '',
    priority: 'low',
    project: 'p',
    tags: [],
    subtasks: [],
    createdAt: '2026-10-01',
    completedAt: null,
  });
  s.timer = startTimer(s.timer, 1000);
  store.save(s);
  focusMigration.apply(db);
  assert.deepEqual(store.productivity(), s);
  assert.equal(store.settings().enabled, false);
  db.close();
});
test('authoritative timestamp timer survives restart, paused recovery and exactly-once overdue completion', () => {
  let now = 1000;
  const { db, store } = fixture(() => now);
  const s = store.productivity();
  s.presets[0].focus = 5;
  s.timer = newTimer(s.presets[0]);
  store.save(s);
  store.command({ action: 'start' });
  now = 2000;
  const restarted = new FocusStore(db, () => now);
  assert.equal(restarted.productivity().timer.deadline, 6000);
  restarted.command({ action: 'pause' });
  assert.equal(restarted.productivity().timer.remaining, 4);
  now = 10_000;
  assert.equal(new FocusStore(db, () => now).complete(), null);
  restarted.command({ action: 'start' });
  now = 20_000;
  assert.ok(restarted.complete());
  assert.equal(restarted.complete(), null);
  assert.equal(restarted.productivity().sessions.length, 1);
  assert.equal(restarted.productivity().sessions[0].endedAt, new Date(14_000).toISOString());
  assert.equal(restarted.productivity().timer.deadline, null);
  db.close();
});
test('renderer writes cannot replace main timer or sessions and cannot edit a running preset', () => {
  const { db, store } = fixture();
  store.command({ action: 'start' });
  const original = store.productivity();
  const incoming = structuredClone(original);
  incoming.timer.deadline = null;
  incoming.sessions = [];
  incoming.tasks.push({
    id: 't',
    title: 'Task',
    due: '',
    priority: 'low',
    project: '',
    tags: [],
    subtasks: [],
    createdAt: '2026-10-01',
    completedAt: null,
  });
  assert.deepEqual(preserveMainFocus(db, incoming).timer, original.timer);
  assert.equal(preserveMainFocus(db, incoming).tasks.length, 1);
  incoming.presets[0].focus = 10;
  assert.throws(() => preserveMainFocus(db, incoming), /Stop/);
  db.close();
});
test('an overdue command reports the phase end exactly once through the native completion callback', () => {
  let now = 1000,
    count = 0;
  const { db } = fixture();
  const store = new FocusStore(
    db,
    () => now,
    () => count++,
  );
  store.command({ action: 'start' });
  now = 2_000_000;
  store.command({ action: 'pause' });
  assert.equal(count, 1);
  store.complete();
  assert.equal(count, 1);
  assert.equal(store.productivity().sessions.length, 1);
  db.close();
});
test('strict phases refuse pause, skip, stop and settings bypass; emergency phrase and 30 seconds stay available and log once', () => {
  let now = 1000;
  const { db, store } = fixture(() => now);
  store.saveSettings({ ...store.settings(), strict: true });
  store.command({ action: 'start' });
  for (const action of ['pause', 'skip', 'stop', 'configure'])
    assert.throws(() => store.command({ action }), /Strict/);
  assert.throws(() => store.saveSettings({ ...store.settings(), strict: false }), /Emergency/);
  assert.throws(() => store.emergencyExit({ phrase: 'wrong' }), /30 seconds/);
  store.emergencyBegin();
  now = 31_000;
  store.emergencyExit({});
  assert.equal(store.events().filter((e) => e.kind === 'emergency').length, 1);
  assert.equal(store.productivity().sessions.length, 0);
  store.command({ action: 'start' });
  store.emergencyExit({ phrase: emergencyPhrase });
  assert.equal(store.events().length, 2);
  db.close();
});
test('legacy Home/Tasks/Study links configure then start using main timestamps, and stale windows cannot overwrite a new run', () => {
  const { db, store } = fixture();
  const before = store.productivity();
  const next = startTimer(
    newTimer(before.presets[0], 'focus', 0, {
      type: 'study',
      id: 'topic',
      name: 'Topic',
      curriculumId: 'curriculum',
    }),
    99_000,
  );
  store.legacy({ expectedRunId: before.timer.runId, timer: next });
  assert.equal(store.productivity().timer.startedAt, 1000);
  assert.equal(store.productivity().timer.link?.curriculumId, 'curriculum');
  assert.throws(
    () => store.legacy({ expectedRunId: before.timer.runId, timer: next }),
    /another window/,
  );
  db.close();
});
test('hosts add/remove is idempotent and simulated crash startup repair preserves unrelated entries in isolated path', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tempo-hosts-test-')),
    filename = path.join(dir, 'hosts');
  const original = '# Owner entries\r\n192.0.2.10 private.example\r\n';
  await writeFile(filename, original);
  try {
    const a = new FileHostsAdapter(filename);
    await a.replace(['web.whatsapp.com']);
    assert.match(await a.read(), /127\.0\.0\.1 web\.whatsapp\.com/);
    assert.match(await a.read(), /::1 web\.whatsapp\.com/);
    const first = await a.read();
    await a.replace(['web.whatsapp.com']);
    assert.equal(await a.read(), first);
    const restarted = new FocusGuard(
      new FileHostsAdapter(filename),
      {
        async list() {
          return [];
        },
        async close() {},
      },
      () => {},
      () => {},
    );
    await restarted.repair();
    assert.equal(await readFile(filename, 'utf8'), original);
    await restarted.repair();
    assert.equal(await a.read(), original);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('hosts reject injection and malformed markers without deleting unrelated data', () => {
  assert.throws(() => hostsWithDomains('original\n', ['example.com\n0.0.0.0 bad.com']), /Invalid/);
  assert.throws(() => stripHostsBlock(`original\n${hostsStart}\nunknown\n`), /Incomplete/);
  assert.throws(() =>
    validateFocusSettings({
      ...defaultFocusSettings(),
      blocklists: [{ id: 'bad', name: 'Bad', apps: ['svchost.exe'], websites: [] }],
    }),
  );
});
test(
  'actual generated Windows watchdog restores isolated hosts after stopped heartbeat and explicit release',
  { skip: process.platform !== 'win32' },
  async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'tempo-watchdog-test-'));
    const filename = path.join(directory, 'hosts'),
      lease = path.join(directory, 'lease.json');
    const original = '# Owner entries\r\n192.0.2.2 untouched.example\r\n';
    try {
      for (const release of [false, true]) {
        const owner = crypto.randomUUID();
        await writeFile(filename, original);
        const add = windowsHostsRewrite(filename, ['web.whatsapp.com'], false);
        const runAdd = () =>
          new Promise<void>((resolve, reject) =>
            execFile(
              'powershell.exe',
              [
                '-NoProfile',
                '-NonInteractive',
                '-EncodedCommand',
                Buffer.from(add, 'utf16le').toString('base64'),
              ],
              { windowsHide: true, timeout: 10_000 },
              (error) => (error ? reject(error) : resolve()),
            ),
          );
        await runAdd();
        const first = await readFile(filename, 'utf8');
        assert.match(first, /127\.0\.0\.1 web\.whatsapp\.com/);
        assert.match(first, /::1 web\.whatsapp\.com/);
        await runAdd();
        assert.equal(await readFile(filename, 'utf8'), first);
        await writeFile(lease, JSON.stringify({ owner, expiresAt: Date.now() + 10_000 }));
        const script = windowsHostsWatchdog(filename, lease, owner, false);
        const child = spawn(
          'powershell.exe',
          [
            '-NoProfile',
            '-NonInteractive',
            '-EncodedCommand',
            Buffer.from(script, 'utf16le').toString('base64'),
          ],
          { windowsHide: true },
        );
        let stderr = '';
        child.stderr.on('data', (b) => {
          stderr += b;
        });
        const done = new Promise<number | null>((resolve, reject) => {
          child.once('error', reject);
          child.once('exit', resolve);
        });
        try {
          let ready = false;
          for (let n = 0; n < 100; n++) {
            if ((await readFile(lease + '.ready', 'utf8').catch(() => '')) === owner) {
              ready = true;
              break;
            }
            await new Promise((r) => setTimeout(r, 50));
          }
          assert.equal(ready, true, 'The same production watchdog must acknowledge startup.');
          await writeFile(lease, JSON.stringify({ owner, expiresAt: Date.now() + 1000 }));
          await new Promise((r) => setTimeout(r, 300));
          await writeFile(lease, JSON.stringify({ owner, expiresAt: Date.now() + 1000 }));
          assert.match(await readFile(filename, 'utf8'), /BEGIN TEMPO/);
          if (release) await writeFile(lease, JSON.stringify({ owner, expiresAt: 0 }));
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(Error('Watchdog did not clean up')), 6000),
          );
          assert.equal(await Promise.race([done, timeout]), 0, stderr);
          assert.equal(await readFile(filename, 'utf8'), original);
          assert.equal(await readFile(lease + '.released', 'utf8'), owner);
        } finally {
          if (child.exitCode === null) child.kill();
        }
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);
test('app matching is exact; app closing never targets unrelated or system applications', async () => {
  assert.equal(matchesApp('WhatsApp.exe', ['whatsapp.exe']), true);
  assert.equal(matchesApp('OtherWhatsApp.exe', ['whatsapp.exe']), false);
  assert.equal(
    safeUserApp({ pid: 7, name: 'svchost.exe', executable: 'C:\\Windows\\System32\\svchost.exe' }),
    false,
  );
  const closed: string[] = [],
    attempts: string[] = [],
    settings = { ...defaultFocusSettings(), enabled: true, mode: 'close' as const };
  const t = startTimer(defaultProductivity().timer, 1000);
  const chosen = { pid: 7, name: 'WhatsApp.exe', executable: 'C:\\Users\\Test\\WhatsApp.exe' },
    unrelated = { pid: 8, name: 'Editor.exe', executable: 'C:\\Apps\\Editor.exe' };
  const guard = new FocusGuard(
    {
      async read() {
        return '';
      },
      async replace() {},
    },
    {
      async list() {
        return [chosen, unrelated];
      },
      async close(app) {
        closed.push(app.name);
      },
    },
    (name) => attempts.push(name),
    () => {},
  );
  await guard.sync(settings, t);
  assert.deepEqual(closed, ['WhatsApp.exe']);
  assert.deepEqual(attempts, ['WhatsApp.exe']);
  await guard.sync(settings, t);
  assert.equal(attempts.length, 1);
  assert.equal(guardShouldRun(settings, { ...t, deadline: null }), true);
  assert.equal(guardShouldRun(settings, { ...t, phase: 'short' }), false);
  await guard.sync(settings, newTimer(defaultProductivity().presets[0]));
  assert.equal(guard.active, false);
});
test('cancelled elevation does not repeatedly prompt; repair retries and clears visible errors', async () => {
  let prompts = 0,
    deny = true;
  const guard = new FocusGuard(
    {
      async read() {
        return '';
      },
      async replace() {
        prompts++;
        if (deny) throw Error('UAC cancelled');
      },
    },
    {
      async list() {
        return [];
      },
      async close() {},
    },
    () => {},
    () => {},
  );
  const s = { ...defaultFocusSettings(), enabled: true };
  const t = startTimer(defaultProductivity().timer, 1000);
  await assert.rejects(() => guard.sync(s, t));
  await guard.sync(s, t);
  assert.equal(prompts, 1);
  assert.match(guard.error, /UAC/);
  deny = false;
  await guard.repair();
  assert.equal(guard.error, '');
});
test('shortcut aliases and ordering cannot override Privacy, command palette or sidebar shortcuts', () => {
  assert.equal(reservedFocusShortcut('Shift+Control+P'), true);
  assert.equal(reservedFocusShortcut('Cmd+K'), true);
  assert.equal(reservedFocusShortcut('CommandOrControl+B'), true);
  assert.equal(reservedFocusShortcut('Ctrl+Shift+F'), false);
  assert.equal(shortcutIdentity('Ctrl+Shift+F'), shortcutIdentity('Shift+CommandOrControl+F'));
});
test('manual repair remains released for the active phase and cleanup failures stay visible until a successful repair', async () => {
  let fail = false;
  const guard = new FocusGuard(
    {
      async read() {
        return '';
      },
      async replace() {
        if (fail) throw Error('Denied cleanup');
      },
    },
    {
      async list() {
        return [];
      },
      async close() {},
    },
    () => {},
    () => {},
  );
  const settings = { ...defaultFocusSettings(), enabled: true },
    timer = startTimer(defaultProductivity().timer, 1000);
  await guard.sync(settings, timer);
  fail = true;
  await assert.rejects(() => guard.repair());
  await guard.sync(settings, timer);
  assert.match(guard.error, /cleanup/);
  fail = false;
  await guard.repair(timer.runId);
  await guard.sync(settings, timer);
  assert.equal(guard.active, false);
  await guard.sync(settings, { ...timer, runId: 'new-phase' });
  assert.equal(guard.active, true);
});
test('Focus backup validation is strict and merges history without enabling Guard or overwriting the active timer', () => {
  const { db, store } = fixture();
  store.command({ action: 'start' });
  const timer = store.productivity().timer;
  const backup = {
    settings: { ...defaultFocusSettings(), enabled: true },
    events: [
      {
        id: 'event',
        runId: 'old',
        at: '2026-10-01T10:00:00Z',
        kind: 'emergency' as const,
        target: 'Emergency exit',
      },
    ],
  };
  focusBackup.validate(backup);
  focusBackup.merge(db, backup);
  focusBackup.merge(db, backup);
  assert.equal(store.settings().enabled, false);
  assert.deepEqual(store.productivity().timer, timer);
  assert.equal(store.events().length, 1);
  assert.throws(() => focusBackup.validate({ ...backup, events: [{}] }));
  db.close();
});
test('fresh Focus restore recovers custom lists and shortcuts with Guard disabled, and configured devices keep their settings', () => {
  const { db, store } = fixture();
  const saved = {
    ...defaultFocusSettings(),
    enabled: true,
    blocklists: [
      { id: 'custom', name: 'Custom work', apps: ['Editor.exe'], websites: ['example.com'] },
    ],
    selected: ['custom'],
    shortcuts: { toggle: 'Control+Shift+G', skip: '', stop: '' },
  };
  const backup = { settings: saved, events: [] };
  focusBackup.validate(backup);
  focusBackup.merge(db, backup);
  assert.deepEqual(store.settings().blocklists, saved.blocklists);
  assert.deepEqual(store.settings().shortcuts, saved.shortcuts);
  assert.equal(store.settings().enabled, false);
  focusBackup.merge(db, { settings: { ...defaultFocusSettings(), enabled: true }, events: [] });
  assert.deepEqual(store.settings().blocklists, saved.blocklists);
  db.close();
});
