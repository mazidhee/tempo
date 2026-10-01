// Uses the owner's real installed application. Run only after a consistent
// backup and an authorized upgrade; no fixture seed or live Guard activation.
const {
  _electron,
} = require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { DatabaseSync } = require('node:sqlite');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const baselinePath = process.argv[2];
if (!baselinePath) throw Error('Supply the fresh baseline.json path.');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const directory = path.dirname(path.resolve(baselinePath));
const executablePath = path.join(
  process.env.LOCALAPPDATA,
  'Programs',
  'Tempo',
  'Habit Tracker.exe',
);
const digest = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const installedAsar = path.join(path.dirname(executablePath), 'resources', 'app.asar');
const candidateAsar = path.resolve('release/desktop/win-unpacked/resources/app.asar');
assert.equal(
  digest(installedAsar),
  digest(candidateAsar),
  'Installed source must match reviewed candidate',
);
const env = { ...process.env };
for (const name of ['HABIT_TRACKER_DATA_DIR', 'ELECTRON_RUN_AS_NODE', 'VITE_DEV_SERVER_URL'])
  delete env[name];
let electronApp;
const checks = [];
const errors = [];
const temporaryTitle = `Installation verification ${Date.now()}`;
async function launch() {
  electronApp = await _electron.launch({ executablePath, args: [], env, timeout: 30000 });
  const page = await electronApp.firstWindow();
  page.setDefaultTimeout(10000);
  page.on('pageerror', (error) => errors.push(error.message));
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForFunction(() => !!window.habitAPI && !!window.workspaceAPI);
  return page;
}
async function nav(page, name) {
  const link = page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name, exact: true });
  if (!(await link.isVisible()))
    await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
  await link.click();
  await page.getByRole('heading', { level: 1 }).waitFor();
}
function subset(expected, actual, at) {
  if (expected && typeof expected === 'object') {
    for (const [key, value] of Object.entries(expected))
      subset(value, actual?.[key], `${at}.${key}`);
  } else assert.deepEqual(actual, expected, at);
}
function verifyPreservation() {
  const before = new DatabaseSync(baseline.backup, { readOnly: true });
  const after = new DatabaseSync(baseline.source, { readOnly: true });
  try {
    for (const table of ['habits', 'habit_logs']) {
      for (const row of before.prepare(`SELECT * FROM ${table}`).all()) {
        const retained = after.prepare(`SELECT * FROM ${table} WHERE id=?`).get(row.id);
        subset(row, retained, `${table}.${row.id}`);
      }
    }
    const a = JSON.parse(
      before.prepare('SELECT json FROM productivity_state WHERE id=1').get().json,
    );
    const b = JSON.parse(
      after.prepare('SELECT json FROM productivity_state WHERE id=1').get().json,
    );
    for (const key of ['tasks', 'sessions', 'presets']) {
      for (const record of a[key])
        subset(
          record,
          b[key].find((r) => r.id === record.id),
          `${key}.${record.id}`,
        );
      assert.equal(b[key].length, a[key].length, `${key} count after temporary task cleanup`);
    }
    subset(a.settings, b.settings, 'Existing preferences');
    const versions = after
      .prepare('SELECT version FROM schema_migrations ORDER BY version')
      .all()
      .map((r) => r.version);
    for (const version of [2, 3, 4, 100, 200])
      assert.ok(versions.includes(version), `Migration ${version}`);
    assert.equal(after.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    checks.push(
      'Original habit/log records, tasks, sessions, presets and preferences retained',
      'Migrations 2/3/4/100/200 recorded; SQLite integrity check OK',
    );
    return { versions, originalCounts: baseline.counts };
  } finally {
    before.close();
    after.close();
  }
}
(async () => {
  let page = await launch();
  const identity = await electronApp.evaluate(({ app }) => ({
    version: app.getVersion(),
    userData: app.getPath('userData'),
    packaged: app.isPackaged,
  }));
  assert.equal(identity.version, '1.2.0');
  assert.equal(identity.packaged, true);
  assert.equal(path.normalize(identity.userData), path.normalize(path.dirname(baseline.source)));
  checks.push('Installed 1.2.0 uses the original userData path and reviewed ASAR');
  await nav(page, 'Tasks');
  await page.getByLabel('Quick add task').fill(temporaryTitle);
  await page.getByLabel('Quick add task').press('Enter');
  await page.getByRole('button', { name: `Edit ${temporaryTitle}`, exact: true }).waitFor();
  await page.waitForFunction(
    async (title) =>
      (await window.habitAPI.getProductivity()).tasks.some((task) => task.title === title),
    temporaryTitle,
  );
  await page.reload();
  await page.getByRole('button', { name: `Edit ${temporaryTitle}`, exact: true }).waitFor();
  checks.push('Real installed task persists after renderer refresh');
  await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close());
  assert.equal(
    await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isVisible()),
    false,
  );
  const second = spawn(executablePath, [], { env, windowsHide: true });
  await new Promise((resolve, reject) => {
    second.once('error', reject);
    second.once('exit', resolve);
  });
  await page.waitForTimeout(400);
  assert.equal(
    await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isVisible()),
    true,
  );
  await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].minimize());
  const third = spawn(executablePath, [], { env, windowsHide: true });
  await new Promise((resolve, reject) => {
    third.once('error', reject);
    third.once('exit', resolve);
  });
  await page.waitForTimeout(400);
  assert.equal(
    await electronApp.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].isMinimized(),
    ),
    false,
  );
  checks.push(
    'Close keeps the app in the tray; second launch shows it and restores a minimized window',
  );
  await electronApp.close();
  electronApp = null;
  page = await launch();
  await nav(page, 'Tasks');
  await page.getByRole('button', { name: `Edit ${temporaryTitle}`, exact: true }).waitFor();
  checks.push('Task persists after a full app quit and relaunch');
  await page.getByRole('button', { name: `Delete ${temporaryTitle}`, exact: true }).click();
  await page.getByRole('button', { name: 'Delete task', exact: true }).click();
  await page.waitForFunction(
    async (title) =>
      !(await window.habitAPI.getProductivity()).tasks.some((task) => task.title === title),
    temporaryTitle,
  );
  await page.context().setOffline(true);
  for (const name of [
    'Home',
    'Plan',
    'Habits',
    'Focus',
    'Study',
    'Statistics',
    'Goals',
    'Review',
    'Settings',
  ])
    await nav(page, name);
  await nav(page, 'Home');
  await page.screenshot({ path: path.join(directory, 'installed-home.png') });
  checks.push('All core pages open offline; temporary verification task removed');
  assert.deepEqual(errors, []);
  await electronApp.close();
  electronApp = null;
  const preservation = verifyPreservation();
  const evidence = {
    identity,
    installedAsarSha256: digest(installedAsar),
    checks,
    preservation,
    errors,
    at: new Date().toISOString(),
    nativeGuardModified: false,
  };
  fs.writeFileSync(path.join(directory, 'acceptance.json'), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ directory, ...evidence }, null, 2));
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (electronApp) await electronApp.close();
  });
