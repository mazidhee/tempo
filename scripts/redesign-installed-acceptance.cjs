// Read-only owner acceptance after an authorized install and consistent baseline.
const {
  _electron,
} = require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  assert = require('node:assert/strict');
const baselineFile = process.argv[2];
if (!baselineFile) throw Error('Supply the fresh baseline.json');
const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8')),
  directory = path.dirname(path.resolve(baselineFile));
const executablePath = path.join(
  process.env.LOCALAPPDATA,
  'Programs',
  'Tempo',
  'Habit Tracker.exe',
);
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const expectedHash = hash(path.resolve('release/desktop/win-unpacked/resources/app.asar'));
const env = { ...process.env };
for (const key of ['HABIT_TRACKER_DATA_DIR', 'ELECTRON_RUN_AS_NODE', 'VITE_DEV_SERVER_URL'])
  delete env[key];
const errors = [],
  checks = [],
  screenshots = [];
function subset(before, after, key) {
  if (before && typeof before === 'object') {
    if (Array.isArray(before)) assert.equal(after?.length, before.length, key + ' array size');
    for (const [field, value] of Object.entries(before))
      subset(value, after?.[field], key + '.' + field);
  } else assert.deepEqual(after, before, key);
}
function verify() {
  const before = new DatabaseSync(baseline.backup, { readOnly: true }),
    after = new DatabaseSync(baseline.source, { readOnly: true });
  try {
    const tables = before
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((row) => row.name);
    for (const table of tables.filter(
      (name) => !name.includes('_fts') && name !== 'schema_migrations',
    )) {
      const keys = before
        .prepare(`PRAGMA table_info(${table})`)
        .all()
        .filter((column) => column.pk)
        .sort((a, b) => a.pk - b.pk)
        .map((column) => column.name);
      if (!keys.length) continue;
      const rows = before.prepare(`SELECT * FROM ${table}`).all();
      assert.equal(
        after.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n,
        rows.length,
        table + ' row count',
      );
      for (const row of rows) {
        const retained = after
          .prepare(`SELECT * FROM ${table} WHERE ${keys.map((key) => key + '=?').join(' AND ')}`)
          .get(...keys.map((key) => row[key]));
        assert.ok(retained, table + ' original row exists');
        for (const [field, value] of Object.entries(row)) {
          if (field === 'json' || (field === 'document' && value))
            subset(JSON.parse(value), JSON.parse(retained[field]), table + '.' + field);
          else assert.deepEqual(retained[field], value, table + '.' + field);
        }
      }
    }
    assert.equal(after.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    const versions = after
      .prepare('SELECT version FROM schema_migrations ORDER BY version')
      .all()
      .map((row) => row.version);
    for (const version of [203, 204, 205]) assert.ok(versions.includes(version));
    const curricula = after
        .prepare('SELECT json FROM study_curricula')
        .all()
        .map((row) => JSON.parse(row.json)),
      topics = after
        .prepare('SELECT json FROM study_topics')
        .all()
        .map((row) => JSON.parse(row.json));
    return {
      versions,
      activeCurricula: curricula.filter((c) => !c.archived).length,
      activeTopics: topics.filter(
        (t) => !t.archived && curricula.some((c) => c.id === t.curriculumId && !c.archived),
      ).length,
      originalCounts: baseline.counts,
    };
  } finally {
    before.close();
    after.close();
  }
}
async function launch() {
  const app = await _electron.launch({ executablePath, args: [], env, timeout: 30000 });
  const page = await app.firstWindow();
  page.setDefaultTimeout(12000);
  page.on('pageerror', (e) => errors.push(e.message));
  await page.getByRole('heading', { level: 1 }).waitFor();
  assert.equal(
    await app.evaluate(({ app }) => app.getVersion()),
    require('../package.json').version,
  );
  assert.equal(
    await app.evaluate(({ app }) => app.getPath('userData')),
    path.dirname(baseline.source),
  );
  return { app, page };
}
(async () => {
  assert.equal(hash(path.join(path.dirname(executablePath), 'resources/app.asar')), expectedHash);
  let app, lastPage;
  try {
    let result = await launch();
    app = result.app;
    const page = result.page;
    lastPage = page;
    for (const label of ['Home', 'Habits', 'Study', 'Plan', 'Journal', 'Review', 'Settings']) {
      let link = page
        .getByRole('navigation', { name: 'Main navigation' })
        .getByRole('link', { name: label, exact: true });
      if (!(await link.isVisible()))
        await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
      await link.click();
      await page.waitForTimeout(180);
      if (label === 'Study') {
        const rows = page.locator('.study-library-row');
        await rows.first().waitFor();
        assert.ok((await rows.count()) >= 3);
        await rows.filter({ hasText: 'Software engineering' }).click();
        await page.locator('.study-browser-row').first().waitFor();
        assert.ok((await page.locator('.study-browser-row').count()) > 0);
      }
      if (label === 'Journal') {
        await page.getByRole('textbox', { name: 'Daily journal' }).waitFor();
        assert.equal(await page.getByRole('textbox', { name: 'Daily journal' }).count(), 1);
      }
      if (label === 'Settings') {
        await page.getByRole('button', { name: 'Backups', exact: true }).click();
        assert.ok(
          await page.getByRole('button', { name: 'Save local snapshot now', exact: true }).isVisible(),
        );
      }
      const file = path.join(directory, 'installed-' + label.toLowerCase() + '.png');
      await page.screenshot({ path: file });
      screenshots.push(file);
    }
    assert.deepEqual(
      await page.evaluate(() =>
        performance
          .getEntriesByType('resource')
          .filter((resource) => /^https?:/.test(resource.name)),
      ),
      [],
    );
    checks.push(
      'Installed version and original userData path match; redesigned owner pages render offline',
    );
    const first = verify();
    await app.close();
    app = null;
    result = await launch();
    app = result.app;
    const second = verify();
    assert.deepEqual(second, first);
    assert.deepEqual(errors, []);
    checks.push(
      'Original records, topic IDs/progress, sessions, tasks, presets and exact preferences survive full quit/relaunch; SQLite integrity OK',
    );
    const evidence = {
      at: new Date().toISOString(),
      version: require('../package.json').version,
      asarSha256: expectedHash,
      checks,
      preservation: second,
      errors,
      screenshots,
    };
    fs.writeFileSync(
      path.join(directory, 'redesign-acceptance.json'),
      JSON.stringify(evidence, null, 2),
    );
    console.log(JSON.stringify(evidence, null, 2));
  } catch (error) {
    if (lastPage && !lastPage.isClosed()) {
      await lastPage.screenshot({ path: path.join(directory, 'installed-check-failure.png') });
      fs.writeFileSync(path.join(directory, 'installed-check-failure.txt'), await lastPage.locator('body').innerText());
    }
    throw error;
  } finally {
    if (app) await app.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
