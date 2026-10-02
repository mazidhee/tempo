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
const expectedVersion = require('../package.json').version;
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
const importRoadmaps = process.argv.includes('--import-roadmaps');
const retainCurrentAppearance = process.argv.includes('--retain-current-appearance');
const retainCurrentSettings = process.argv.includes('--retain-current-settings');
let roadmapSummary = [];
async function until(predicate, message) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(message);
}
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
  } else assert.ok(Object.is(actual, expected), `${at} changed`);
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
    const oldTables = before
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((row) => row.name);
    for (const table of [
      'habit_pauses',
      'study_curricula',
      'study_topics',
      'study_reviews',
      'study_imports',
      'reflection_plans',
      'reflection_journal',
      'reflection_goals',
      'reflection_reviews',
      'focus_break_events',
    ]) {
      if (!oldTables.includes(table)) continue;
      const keys = before
        .prepare(`PRAGMA table_info(${table})`)
        .all()
        .filter((column) => column.pk > 0)
        .sort((a, b) => a.pk - b.pk)
        .map((column) => column.name);
      assert.ok(keys.length, `${table} has a primary key`);
      for (const row of before.prepare(`SELECT * FROM ${table}`).all())
        subset(
          row,
          after
            .prepare(`SELECT * FROM ${table} WHERE ${keys.map((key) => `${key}=?`).join(' AND ')}`)
            .get(...keys.map((key) => row[key])),
          `${table}.${keys.map((key) => row[key]).join('/')}`,
        );
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
    const preferences = { ...a.settings };
    const appearanceDifference = ['accent', 'avatar', 'greetingStyle']
      .filter((field) => a.settings[field] !== b.settings[field])
      .map((field) => ({
        field,
        before: field === 'avatar' ? Boolean(a.settings[field]) : a.settings[field],
        current: field === 'avatar' ? Boolean(b.settings[field]) : b.settings[field],
      }));
    if (retainCurrentAppearance)
      for (const field of ['accent', 'avatar', 'greetingStyle']) delete preferences[field];
    const settingsChanged = Object.keys(a.settings).filter(
      (key) => a.settings[key] !== b.settings[key],
    );
    if (!retainCurrentSettings) subset(preferences, b.settings, 'Existing preferences');
    else
      checks.push(
        'Current settings retained during owner use; changed field names recorded without private values',
      );
    if (appearanceDifference.length && retainCurrentAppearance && !retainCurrentSettings)
      checks.push(
        'Current accent/avatar/greeting preferences retained; differences recorded; all legacy preferences checked',
      );
    const versions = after
      .prepare('SELECT version FROM schema_migrations ORDER BY version')
      .all()
      .map((r) => r.version);
    for (const version of [2, 3, 4, 100, 200, 201, 202])
      assert.ok(versions.includes(version), `Migration ${version}`);
    assert.equal(after.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    checks.push(
      retainCurrentSettings
        ? 'Original habit/log records, tasks, sessions, presets and all saved module rows retained; current settings kept'
        : 'Original habit/log records, tasks, sessions, presets and compared preferences retained',
      'Migrations 2/3/4/100/200/201/202 recorded; SQLite integrity check OK',
    );
    return { versions, originalCounts: baseline.counts, appearanceDifference, settingsChanged };
  } finally {
    before.close();
    after.close();
  }
}
(async () => {
  if (process.argv.includes('--verify-only')) {
    const preservation = verifyPreservation();
    const db = new DatabaseSync(baseline.source, { readOnly: true });
    try {
      const rows = (table) =>
        db
          .prepare(`SELECT json FROM ${table}`)
          .all()
          .map((r) => JSON.parse(r.json));
      const topics = rows('study_topics');
      const curricula = rows('study_curricula');
      roadmapSummary = rows('study_imports').map((source) => ({
        title: source.title,
        topics: topics.filter((t) => t.curriculumId === source.curriculumId).length,
        learned: topics.filter((t) => t.curriculumId === source.curriculumId && t.learnedAt).length,
      }));
      for (const [title, count, learned] of [
        ['Software engineering', 984, 0],
        ['Mathematics', 483, 6],
        ['Economics & markets', 356, 1],
      ]) {
        const result = roadmapSummary.find((r) => r.title === title);
        assert.equal(result?.topics, count);
        assert.ok(result.learned >= learned);
      }
      const evidence = {
        at: new Date().toISOString(),
        installedAsarSha256: digest(installedAsar),
        checks,
        preservation,
        roadmapSummary,
        currentCounts: {
          habits: db.prepare('SELECT COUNT(*) AS count FROM habits').get().count,
          curricula: curricula.length,
          topics: topics.length,
        },
        mode: 'read-only preservation; prior runtime flows recorded separately',
      };
      fs.writeFileSync(
        path.join(directory, 'preservation.json'),
        JSON.stringify(evidence, null, 2),
      );
      console.log(JSON.stringify(evidence, null, 2));
    } finally {
      db.close();
    }
    return;
  }
  let page = await launch();
  const identity = await electronApp.evaluate(({ app }) => ({
    version: app.getVersion(),
    userData: app.getPath('userData'),
    packaged: app.isPackaged,
  }));
  assert.equal(identity.version, expectedVersion);
  assert.equal(identity.packaged, true);
  assert.equal(path.normalize(identity.userData), path.normalize(path.dirname(baseline.source)));
  checks.push(`Installed ${expectedVersion} uses the original userData path and reviewed ASAR`);
  if (importRoadmaps) {
    // These are the owner's supplied curricula, not review fixtures or sample data.
    const sources = [
      ['Software engineering', 'software-engineering.md'],
      ['Mathematics', 'mathematics.md'],
      ['Economics & markets', 'economics-markets.md'],
    ].map(([title, file]) => ({
      title,
      markdown: fs.readFileSync(path.resolve('src/renderer/assets/curricula', file), 'utf8'),
    }));
    const beforeStudy = await page.evaluate(() => window.workspaceAPI.invoke('study:snapshot'));
    const imported = await page.evaluate(
      (sources) => window.workspaceAPI.invoke('study:importOutlines', sources),
      sources,
    );
    const study = await page.evaluate(() => window.workspaceAPI.invoke('study:snapshot'));
    roadmapSummary = imported.map((c) => ({
      title: c.title,
      topics: study.topics.filter((t) => t.curriculumId === c.id).length,
      learned: study.topics.filter((t) => t.curriculumId === c.id && t.learnedAt).length,
      alreadyImported: beforeStudy.curricula.some((old) => old.id === c.id),
    }));
    const expected = [
      [984, 0],
      [483, 6],
      [356, 1],
    ];
    roadmapSummary.forEach((r, index) => {
      if (!r.alreadyImported) assert.deepEqual([r.topics, r.learned], expected[index]);
    });
    checks.push(
      'Owner-provided three curricula available with original source checkmarks and existing progress preserved',
    );
  }
  await nav(page, 'Tasks');
  await page.getByLabel('Quick add task').fill(temporaryTitle);
  await page.getByLabel('Quick add task').press('Enter');
  await page.getByRole('button', { name: `Edit ${temporaryTitle}`, exact: true }).waitFor();
  await until(
    () =>
      page.evaluate(
        async (title) =>
          (await window.habitAPI.getProductivity()).tasks.some((task) => task.title === title),
        temporaryTitle,
      ),
    'Verification task was not saved',
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
  await until(
    () =>
      page.evaluate(
        async (title) =>
          !(await window.habitAPI.getProductivity()).tasks.some((task) => task.title === title),
        temporaryTitle,
      ),
    'Verification task was not removed',
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
    roadmapSummary,
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
