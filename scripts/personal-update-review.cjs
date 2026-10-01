const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { withApp } = require('./electron-runtime.cjs');

// Independent real-Electron review. Every run owns fresh SQLite directories.
// Do not run until the builder has explicitly submitted a complete candidate.
const run = `personal-update-review-${Date.now()}`;
const findings = [];
const evidence = path.resolve('.review', run);
const fixture = {
  title: 'Reviewer hierarchy',
  markdown: '# Reviewer hierarchy\n## Foundations\n- [x] Completed parent\n  - [x] Completed child\n  - [ ] Pending child\n## Next phase\n- [ ] Next topic\n',
};
const bundled = [
  ['Software engineering', 'software-engineering.md'],
  ['Mathematics', 'mathematics.md'],
  ['Economics & markets', 'economics-markets.md'],
].map(([title, file]) => ({ title, markdown: fs.readFileSync(path.resolve('src/renderer/assets/curricula', file), 'utf8') }));
let backup, saved;
const invoke = (page, channel, input) => page.evaluate(({ channel, input }) => window.workspaceAPI.invoke(channel, input), { channel, input });
const snapshot = (page) => invoke(page, 'focus:snapshot');
async function until(condition, message, timeout = 8000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(message);
}
const navigate = async (page, label) => {
  let link = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: label, exact: true });
  if (!(await link.isVisible())) await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
  await link.click();
  await page.waitForTimeout(180);
};
const check = async (name, fn) => {
  try { await fn(); findings.push({ name, passed: true }); }
  catch (error) { findings.push({ name, passed: false, error: error.stack }); }
};
async function capture(page, name) {
  await page.screenshot({ path: path.join(evidence, `${name}.png`), fullPage: false });
  const layout = await page.evaluate(() => ({
    width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
    overflow: [...document.querySelectorAll('main *')].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width && (r.right > innerWidth + 2 || r.left < -2) && getComputedStyle(e).position !== 'fixed';
    }).slice(0, 12).map((e) => ({ tag: e.tagName, className: e.className, text: e.textContent.slice(0, 80) })),
  }));
  fs.writeFileSync(path.join(evidence, `${name}-layout.json`), JSON.stringify(layout, null, 2));
  assert.ok(layout.scrollWidth <= layout.width, `${name}: document overflows ${layout.scrollWidth}/${layout.width}`);
}
async function appearance(page, theme) {
  await page.evaluate(async (theme) => {
    const p = await window.habitAPI.getProductivity();
    await window.habitAPI.saveProductivity({ ...p, settings: { ...p.settings, theme } });
  }, theme);
  await page.reload();
  await page.waitForTimeout(350);
}
async function reviewMigration() {
  const output = path.join(evidence, 'migration-contracts.cjs');
  require('esbuild').buildSync({ stdin: { contents: `
    export { default as Database } from './src/main/database/sqlite';
    export { migrateProductivity } from './src/main/database/migrations';
    export { runModuleMigrations, migrations } from './src/main/database/migrationRegistry';
    export { StudyStore } from './src/main/study/store';
  `, resolveDir: process.cwd(), loader: 'ts' }, outfile: output, bundle: true, platform: 'node', format: 'cjs', external: ['node:*'] });
  const { Database, migrateProductivity, runModuleMigrations, migrations, StudyStore } = require(output);
  const db = new Database(path.join(evidence, 'migration-fixture.db'));
  try {
    db.exec("CREATE TABLE legacy(id INTEGER PRIMARY KEY, value TEXT); INSERT INTO legacy VALUES(17,'original log and note');");
    migrateProductivity(db);
    const index = migrations.findIndex((m) => m.version === 201);
    const [personal] = migrations.splice(index, 1);
    try { runModuleMigrations(db); } finally { migrations.splice(index, 0, personal); }
    const study = new StudyStore(db);
    const curriculum = study.saveCurriculum({ title: 'Existing owner study', description: 'Keep me' });
    const topic = study.saveTopic({ curriculumId: curriculum.id, title: 'Existing learned topic' });
    study.learn({ id: topic.id, learned: true });
    study.grade({ id: topic.id, grade: 3 });
    const before = JSON.parse(db.prepare('SELECT json FROM productivity_state WHERE id=1').get().json);
    delete before.settings.accent; delete before.settings.avatar; delete before.settings.greetingStyle;
    before.settings.name = 'Existing owner';
    before.tasks.push({ id: 'existing-task', title: 'Keep task', due: '', priority: 'medium', project: '', tags: [], subtasks: [], createdAt: '2026-09-01T12:00:00.000Z', completedAt: null });
    before.sessions.push({ id: 'existing-session', date: '2026-09-01', endedAt: '2026-09-01T12:00:00.000Z', duration: 900, phase: 'focus', presetId: 'classic', presetName: 'Classic', link: null });
    db.prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(before));
    const oldStudy = study.snapshot();
    runModuleMigrations(db);
    runModuleMigrations(db);
    const after = JSON.parse(db.prepare('SELECT json FROM productivity_state WHERE id=1').get().json);
    assert.deepEqual(after.tasks, before.tasks);
    assert.deepEqual(after.sessions, before.sessions);
    assert.deepEqual(after.timer, before.timer);
    assert.equal(after.settings.name, before.settings.name);
    assert.equal(after.settings.accent, 'lavender');
    assert.equal(after.settings.avatar, null);
    assert.equal(after.settings.greetingStyle, 'mixed');
    assert.deepEqual(study.snapshot(), oldStudy);
    assert.equal(db.prepare('SELECT value FROM legacy WHERE id=17').get().value, 'original log and note');
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM schema_migrations WHERE version=201').get().count, 1);
    assert.ok(fs.readdirSync(evidence).some((f) => /^migration-fixture\.db\.before-modules-/.test(f)));
  } finally { db.close(); }
}
async function reviewHome() {
  await withApp(`${run}-home-visual`, async ({ page, errors }) => {
    await check('requested large Home greeting: named short/long variants in both themes and widths', async () => {
      // Typography fixture only: main-process time remains real; no timer starts.
      await page.clock.setFixedTime(new Date('2026-10-01T12:00:00'));
      await page.addInitScript(() => { Math.random = () => .72; });
      for (const variant of ['short', 'long']) {
        await page.evaluate(async (variant) => {
          const p = await window.habitAPI.getProductivity();
          await window.habitAPI.saveProductivity({ ...p, settings: { ...p.settings, name: 'Divine', greetingStyle: variant === 'short' ? 'simple' : 'mixed' } });
        }, variant);
        for (const theme of ['dark', 'light']) {
          await appearance(page, theme);
          for (const width of [1280, 390]) {
            await page.setViewportSize({ width, height: width === 390 ? 844 : 860 });
            await navigate(page, 'Home');
            const title = await page.locator('.home-page h1').textContent();
            assert.ok(title.includes('Divine'));
            if (variant === 'long') assert.ok(title.length > 35, `Expected a long greeting, got ${title}`);
            const size = await page.locator('.home-page h1').evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
            assert.ok(size >= (width === 390 ? 36 : 40));
            await capture(page, `home-${variant}-divine-${theme}-${width}`);
            if (width === 390) {
              const heading = await page.locator('.home-page h1').boundingBox();
              const action = await page.getByRole('button', { name: 'Start focusing', exact: true }).boundingBox();
              assert.ok(heading.width > 330, `Narrow heading squeezed to ${heading.width}px`);
              assert.ok(action.y >= heading.y + heading.height, 'Narrow action must sit below the greeting');
            }
          }
        }
      }
      assert.deepEqual(errors, []);
    });
  });
}
function finish() {
  fs.writeFileSync(path.join(evidence, 'results.json'), JSON.stringify({ run, findings }, null, 2));
  console.log(JSON.stringify({ run, passed: findings.filter((f) => f.passed).length, failed: findings.filter((f) => !f.passed) }, null, 2));
  if (findings.some((f) => !f.passed)) process.exitCode = 1;
}
function diagnoseInstalledReadOnly() {
  // Never open an owner's file with SQLite: read its bytes and sidecars, then
  // query only review-directory copies. Record metadata before/after copying.
  const crypto = require('node:crypto');
  const { DatabaseSync } = require('node:sqlite');
  const sources = [
    ['owner-current', 'C:/Users/USER/AppData/Roaming/habit-tracker/habits.db'],
    ['first-baseline', path.resolve('.install-check/personal-upgrade-1790886236615/before.db')],
    ['second-baseline', path.resolve('.install-check/personal-upgrade-1790886925971/before.db')],
  ];
  const describe = (file) => {
    if (!fs.existsSync(file)) return null;
    const stat = fs.statSync(file);
    const bytes = fs.readFileSync(file);
    return { path: path.resolve(file), realPath: fs.realpathSync(file), size: stat.size,
      modified: stat.mtime.toISOString(), created: stat.birthtime.toISOString(),
      device: stat.dev, inode: stat.ino,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
  };
  const reports = sources.map(([label, source]) => {
    const copyDir = path.join(evidence, label);
    fs.mkdirSync(copyDir, { recursive: true });
    const before = ['', '-wal', '-shm'].map((suffix) => describe(source + suffix));
    for (const suffix of ['', '-wal', '-shm']) {
      if (fs.existsSync(source + suffix)) fs.copyFileSync(source + suffix, path.join(copyDir, 'snapshot.db' + suffix));
    }
    const after = ['', '-wal', '-shm'].map((suffix) => describe(source + suffix));
    const db = new DatabaseSync(path.join(copyDir, 'snapshot.db'), { readOnly: true });
    try {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map((r) => r.name);
      const counts = Object.fromEntries(tables.filter((name) => /^[a-z_]+$/.test(name)).map((name) => [name, db.prepare(`SELECT COUNT(*) AS count FROM ${name}`).get().count]));
      const state = tables.includes('productivity_state') ? JSON.parse(db.prepare('SELECT json FROM productivity_state WHERE id=1').get().json) : null;
      const journal = db.prepare('PRAGMA journal_mode').get();
      const versions = tables.includes('schema_migrations') ? db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map((r) => r.version) : [];
      return { label, before, after, filesStableWithinRead: JSON.stringify(before) === JSON.stringify(after),
        counts, tasks: state?.tasks.length, sessions: state?.sessions.length, journal, versions,
        taskIds: state?.tasks.map((t) => t.id),
        curriculumIds: tables.includes('study_curricula') ? db.prepare('SELECT id FROM study_curricula ORDER BY id').all().map((r) => r.id) : [],
        productivitySha256: state ? crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex') : null,
        integrity: db.prepare('PRAGMA integrity_check').get() };
    } finally { db.close(); }
  });
  const report = { at: new Date().toISOString(), env: { APPDATA: process.env.APPDATA, LOCALAPPDATA: process.env.LOCALAPPDATA, HABIT_TRACKER_DATA_DIR: process.env.HABIT_TRACKER_DATA_DIR || null }, reports };
  fs.writeFileSync(path.join(evidence, 'installed-readonly-diagnosis.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
async function reviewPackage(executable) {
  const crypto = require('node:crypto');
  const absolute = path.resolve(executable);
  const asar = path.join(path.dirname(absolute), 'resources', 'app.asar');
  fs.writeFileSync(path.join(evidence, 'package-identity.json'), JSON.stringify({
    executable: absolute,
    executableSha256: crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex'),
    asarSha256: crypto.createHash('sha256').update(fs.readFileSync(asar)).digest('hex'),
  }, null, 2));
  let runId;
  await withApp(run, async ({ page, errors, directory }) => {
    await check('packaged application uses isolated local database and resources', async () => {
      assert.equal(directory, evidence);
      assert.ok(fs.existsSync(path.join(directory, 'habits.db')));
      assert.equal((await snapshot(page)).settings.enabled, false);
      assert.ok(page.url().startsWith('file:'));
    });
    await check('packaged bundled import and newline identity', async () => {
      await navigate(page, 'Study');
      await page.getByRole('button', { name: 'Import roadmaps', exact: true }).click();
      await capture(page, 'package-roadmap-import');
      await page.getByRole('dialog').getByRole('button', { name: 'Import curricula', exact: true }).click();
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      const first = await invoke(page, 'study:snapshot');
      assert.equal(first.curricula.length, 3);
      await invoke(page, 'study:importOutlines', bundled.map((source) => ({ ...source, markdown: source.markdown.replace(/\n/g, '\r\n') })));
      const repeat = await invoke(page, 'study:snapshot');
      assert.equal(repeat.curricula.length, 3);
      assert.equal(repeat.topics.length, first.topics.length);
      assert.equal(repeat.imports.length, 3);
    });
    await check('packaged guide, accent and count-up action work', async () => {
      await navigate(page, 'Settings');
      await page.getByRole('button', { name: 'Cedar', exact: true }).click();
      await page.getByRole('button', { name: 'User guide', exact: true }).click();
      assert.ok((await page.locator('main').textContent()).includes('Save and stop'));
      await capture(page, 'package-guide');
      const study = await invoke(page, 'study:snapshot');
      const topic = study.topics.find((t) => !t.isGroup);
      await invoke(page, 'focus:command', { action: 'configure', timerMode: 'stopwatch', phase: 'focus', link: { type: 'study', id: topic.id, curriculumId: topic.curriculumId, name: topic.title } });
      await navigate(page, 'Focus');
      await page.getByRole('button', { name: 'Start tracking', exact: true }).click();
      await page.waitForTimeout(1400);
      runId = (await snapshot(page)).productivity.timer.runId;
      await page.getByRole('button', { name: 'Save and stop tracking', exact: true }).click();
      const p = (await snapshot(page)).productivity;
      assert.equal(p.sessions.filter((s) => s.id === runId).length, 1);
      assert.ok(p.sessions.find((s) => s.id === runId).duration > 0);
      await capture(page, 'package-focus');
    });
    await check('packaged renderer is error-free and production resources local', async () => {
      assert.deepEqual(errors, []);
      assert.deepEqual(await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((url) => /^https?:\/\//i.test(url))), []);
    });
  }, absolute);
  await withApp(run, async ({ page }) => {
    await check('exact packaged restart retains imports, accent and one saved session', async () => {
      assert.equal((await invoke(page, 'study:snapshot')).curricula.length, 3);
      const p = (await snapshot(page)).productivity;
      assert.equal(p.settings.accent, 'cedar');
      assert.equal(p.sessions.filter((s) => s.id === runId).length, 1);
      const exported = await page.evaluate(() => window.habitAPI.exportBackup());
      assert.equal(exported.modules.study.imports.length, 3);
    });
  }, absolute);
}
async function main() {
  fs.mkdirSync(evidence, { recursive: true });
  if (process.argv.includes('--diagnose-installed-readonly')) {
    diagnoseInstalledReadOnly();
    // Playwright's imported driver can retain a handle even though this mode
    // never launches Electron. Every copied SQLite connection is already closed.
    process.exit(0);
    return;
  }
  const packageIndex = process.argv.indexOf('--package');
  if (packageIndex >= 0) {
    assert.ok(process.argv[packageIndex + 1], 'Supply the exact packaged executable');
    await reviewPackage(process.argv[packageIndex + 1]);
    finish();
    return;
  }
  if (process.argv.includes('--newline-only')) {
    await withApp(run, async ({ page }) => {
      await check('same Markdown source uses one curriculum across LF and CRLF', async () => {
        const lf = await invoke(page, 'study:importOutlines', [fixture]);
        const crlf = await invoke(page, 'study:importOutlines', [{ ...fixture, markdown: fixture.markdown.replace(/\n/g, '\r\n') }]);
        const state = await invoke(page, 'study:snapshot');
        fs.writeFileSync(path.join(evidence, 'newline-state.json'), JSON.stringify({ lf, crlf, curriculumCount: state.curricula.length, importCount: state.imports.length }, null, 2));
        assert.equal(lf[0].id, crlf[0].id, 'Line endings created a duplicate curriculum');
        assert.equal(state.curricula.length, 1);
        assert.equal(state.imports.length, 1);
        const windowsSource = { title: 'Reviewer CRLF first', markdown: fixture.markdown.replace(/\n/g, '\r\n') };
        const windowsFirst = await invoke(page, 'study:importOutlines', [windowsSource]);
        const unixRepeat = await invoke(page, 'study:importOutlines', [{ ...windowsSource, markdown: fixture.markdown }]);
        assert.equal(windowsFirst[0].id, unixRepeat[0].id);
        const final = await invoke(page, 'study:snapshot');
        assert.equal(final.curricula.length, 2);
        assert.equal(final.imports.length, 2);
        assert.equal(final.imports.find((source) => source.curriculumId === windowsFirst[0].id).markdown, windowsSource.markdown.trim(), 'Original provenance must retain its line endings');
        assert.ok(final.topics.filter((t) => t.curriculumId === windowsFirst[0].id).find((t) => t.title === 'Completed child').learnedAt);
      });
    });
    finish();
    return;
  }
  if (process.argv.includes('--home-only')) {
    await reviewHome();
    finish();
    return;
  }
  await check('migration 201 preserves existing records and makes safety backup', reviewMigration);
  await withApp(run, async ({ page, nav, directory, errors }) => {
    assert.equal(directory, evidence);
    assert.equal((await snapshot(page)).settings.enabled, false, 'Guard must remain disabled in review');
    await check('fresh defaults and owner-safe isolated directory', async () => {
      const p = (await snapshot(page)).productivity;
      assert.equal(p.settings.accent, 'lavender');
      assert.equal(p.settings.avatar, null);
      assert.ok(fs.existsSync(path.join(directory, 'habits.db')));
    });
    await check('Markdown hierarchy, source checkmarks, repeated-import idempotence', async () => {
      const before = await invoke(page, 'study:snapshot');
      const first = await invoke(page, 'study:importOutlines', [fixture]);
      const second = await invoke(page, 'study:importOutlines', [fixture]);
      assert.equal(first[0].id, second[0].id);
      const s = await invoke(page, 'study:snapshot');
      assert.equal(s.curricula.length, before.curricula.length + 1);
      const topics = s.topics.filter((t) => t.curriculumId === first[0].id);
      const parent = topics.find((t) => t.title === 'Completed parent');
      const child = topics.find((t) => t.title === 'Completed child');
      assert.equal(child.parentId, parent.id);
      assert.ok(parent.learnedAt && child.learnedAt);
      assert.equal(topics.find((t) => t.title === 'Pending child').learnedAt, null);
      assert.equal(s.imports.filter((i) => i.curriculumId === first[0].id).length, 1);
      saved = { curriculum: first[0], parent, child };
    });
    await check('all three bundled curricula preserve every checklist', async () => {
      await nav('Study');
      await page.getByRole('button', { name: 'Import roadmaps', exact: true }).click();
      await capture(page, 'roadmap-import-desktop');
      await page.setViewportSize({ width: 390, height: 844 });
      await capture(page, 'roadmap-import-narrow');
      await page.setViewportSize({ width: 1280, height: 860 });
      await page.getByRole('dialog').getByRole('button', { name: 'Import curricula', exact: true }).click();
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      const first = await invoke(page, 'study:importOutlines', bundled);
      const repeated = await invoke(page, 'study:importOutlines', bundled);
      assert.deepEqual(first.map((c) => c.id), repeated.map((c) => c.id));
      const s = await invoke(page, 'study:snapshot');
      for (let i = 0; i < bundled.length; i++) {
        const source = bundled[i].markdown;
        const expected = [...source.matchAll(/^\s*[-*+]\s+\[([ xX])\]\s+/gm)];
        const topics = s.topics.filter((t) => t.curriculumId === first[i].id);
        assert.ok(topics.length >= expected.length);
        assert.equal(topics.filter((t) => t.learnedAt).length, expected.filter((m) => /x/i.test(m[1])).length);
      }
    });
    await check('manual add/edit/delete, validation, linked totals source', async () => {
      assert.ok(saved, 'Hierarchy prerequisite failed');
      const end = Date.now() - 3600000;
      const input = { startedAt: new Date(end - 1800000).toISOString(), endedAt: new Date(end).toISOString(),
        link: { type: 'study', id: saved.child.id, curriculumId: saved.curriculum.id, name: saved.child.title }, note: 'Reviewer manual session' };
      await invoke(page, 'focus:saveSession', input);
      let p = (await snapshot(page)).productivity;
      const added = p.sessions.find((s) => s.note === input.note);
      assert.equal(added.duration, 1800);
      await invoke(page, 'focus:saveSession', { ...input, id: added.id, startedAt: new Date(end - 2400000).toISOString() });
      p = (await snapshot(page)).productivity;
      assert.equal(p.sessions.filter((s) => s.id === added.id).length, 1);
      assert.equal(p.sessions.find((s) => s.id === added.id).duration, 2400);
      await assert.rejects(invoke(page, 'focus:saveSession', input), /overlap/i);
      await assert.rejects(invoke(page, 'focus:saveSession', { ...input, startedAt: input.endedAt }), /End/i);
      await invoke(page, 'focus:deleteSession', added.id);
      assert.ok(!(await snapshot(page)).productivity.sessions.some((s) => s.id === added.id));
      await invoke(page, 'focus:saveSession', input);
      saved.manual = (await snapshot(page)).productivity.sessions.find((s) => s.note === input.note);
    });
    await check('calendar/list UI supports forgotten-time add/edit/delete', async () => {
      await nav('Statistics');
      await page.getByRole('button', { name: 'Time explorer', exact: true }).click();
      await page.getByRole('button', { name: 'Add session', exact: true }).click();
      const stamp = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      const end = Date.now() - 7200000;
      await page.getByLabel('Session start', { exact: true }).fill(stamp(new Date(end - 3600000)));
      await page.getByLabel('Session end', { exact: true }).fill(stamp(new Date(end)));
      await page.getByLabel('Session note', { exact: true }).fill('Reviewer UI forgotten time');
      await capture(page, 'manual-editor-desktop');
      await page.setViewportSize({ width: 390, height: 844 });
      await capture(page, 'manual-editor-narrow');
      await page.setViewportSize({ width: 1280, height: 860 });
      await page.getByRole('button', { name: 'Save session', exact: true }).click();
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      const added = (await snapshot(page)).productivity.sessions.find((s) => s.note === 'Reviewer UI forgotten time');
      assert.equal(added.duration, 3600);
      await page.getByRole('button', { name: 'Session list', exact: true }).click();
      await page.getByRole('button', { name: 'Edit session Reviewer UI forgotten time', exact: true }).click();
      await page.getByLabel('Session start', { exact: true }).fill(stamp(new Date(end - 1200000)));
      await page.getByRole('button', { name: 'Save session', exact: true }).click();
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      assert.equal((await snapshot(page)).productivity.sessions.find((s) => s.id === added.id).duration, 1200);
      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: 'Delete session Reviewer UI forgotten time', exact: true }).click();
      await page.waitForFunction(async (id) => !(await window.habitAPI.getProductivity()).sessions.some((s) => s.id === id), added.id);
      await page.getByRole('button', { name: 'Calendar', exact: true }).click();
      assert.ok(await page.getByLabel('Weekly focus timeline', { exact: true }).count());
      const sunburst = page.getByRole('group', { name: 'Sunburst of recorded study time', exact: true });
      const ring = sunburst.getByRole('button', { name: 'Reviewer hierarchy: 30m 0s', exact: true });
      const ringBox = await ring.boundingBox();
      await ring.click({ position: { x: ringBox.width * .87, y: ringBox.height * .5 } });
      assert.ok(await page.getByRole('navigation', { name: 'Study time hierarchy' }).getByRole('button', { name: 'Reviewer hierarchy', exact: true }).count());
      await capture(page, 'time-desktop-calendar-sunburst');
    });
    await check('topic Focus buttons link the correct topic and display ancestor totals', async () => {
      await nav('Study');
      await page.getByLabel('Curricula', { exact: true }).getByRole('button', { name: 'Reviewer hierarchy', exact: true }).click();
      await page.getByRole('button', { name: 'Expand all', exact: true }).click();
      for (const title of ['Foundations', 'Completed parent', 'Completed child']) {
        const row = page.locator('.study-topic-row').filter({ has: page.getByText(title, { exact: true }) });
        assert.equal(await row.locator('.study-topic-time').textContent(), '30m 0s');
      }
      await page.getByRole('button', { name: 'Track time for Completed child', exact: true }).click();
      await page.getByRole('heading', { name: 'Focus', exact: true }).waitFor();
      const p = (await snapshot(page)).productivity;
      assert.equal(p.timer.link.id, saved.child.id);
      assert.ok(p.timer.stopwatch?.runningSince);
      await page.getByRole('button', { name: 'Save and stop tracking', exact: true }).click();
      await nav('Study');
      await page.getByLabel('Curricula', { exact: true }).getByRole('button', { name: 'Reviewer hierarchy', exact: true }).click();
      await page.getByRole('button', { name: 'Expand all', exact: true }).click();
      await page.getByRole('button', { name: 'Start focus for Completed child', exact: true }).click();
      await page.getByRole('heading', { name: 'Focus', exact: true }).waitFor();
      assert.equal((await snapshot(page)).productivity.timer.link.id, saved.child.id);
      assert.ok(!(await snapshot(page)).productivity.timer.stopwatch);
      await invoke(page, 'focus:command', { action: 'stop' });
    });
    await check('existing Pomodoro completes exactly once in shared sessions', async () => {
      await page.evaluate(async () => {
        const p = await window.habitAPI.getProductivity();
        p.presets.push({ id: 'review-short', name: 'Reviewer short phase', focus: 2, short: 2, long: 2, cycles: 2 });
        await window.habitAPI.saveProductivity(p);
      });
      await invoke(page, 'focus:command', { action: 'configure', timerMode: 'pomodoro', presetId: 'review-short', phase: 'focus' });
      await nav('Focus');
      await page.getByRole('button', { name: 'Start focus', exact: true }).click();
      const id = (await snapshot(page)).productivity.timer.runId;
      await until(async () => (await snapshot(page)).productivity.sessions.some((s) => s.id === id), 'Pomodoro completion did not reach main-owned sessions');
      const p = (await snapshot(page)).productivity;
      assert.equal(p.sessions.filter((s) => s.id === id).length, 1);
      assert.equal(p.sessions.find((s) => s.id === id).duration, 2);
      await page.reload();
      await page.waitForTimeout(300);
      assert.equal((await snapshot(page)).productivity.sessions.filter((s) => s.id === id).length, 1);
    });
    await check('switching tracked Study work to task Focus preserves tracked time', async () => {
      await nav('Tasks');
      await page.getByLabel('Quick add task', { exact: true }).fill('Reviewer existing task');
      await page.getByRole('button', { name: 'Add task', exact: true }).click();
      await page.waitForFunction(async () => (await window.habitAPI.getProductivity()).tasks.some((t) => t.title === 'Reviewer existing task'));
      await invoke(page, 'focus:command', { action: 'configure', timerMode: 'stopwatch', phase: 'focus', link: { type: 'study', id: saved.child.id, curriculumId: saved.curriculum.id, name: saved.child.title } });
      await invoke(page, 'focus:command', { action: 'start' });
      const oldId = (await snapshot(page)).productivity.timer.runId;
      await page.waitForTimeout(1400);
      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: 'Start focus session for Reviewer existing task', exact: true }).click();
      await page.getByRole('heading', { name: 'Focus', exact: true }).waitFor();
      await page.waitForTimeout(300);
      const p = (await snapshot(page)).productivity;
      assert.equal(p.sessions.filter((s) => s.id === oldId).length, 1);
      assert.ok(p.sessions.find((s) => s.id === oldId).duration >= 1);
      assert.equal(p.timer.link.type, 'task');
      await invoke(page, 'focus:command', { action: 'stop' });
    });
    await check('clickable solid accents, greeting option, local avatar upload/remove', async () => {
      await nav('Settings');
      await page.getByRole('group', { name: 'Accent color' }).getByRole('button', { name: 'Cedar', exact: true }).click();
      await page.waitForFunction(async () => (await window.habitAPI.getProductivity()).settings.accent === 'cedar');
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()), '#39745d');
      await page.getByLabel(/^Home greetings/).selectOption('simple');
      await page.waitForFunction(async () => (await window.habitAPI.getProductivity()).settings.greetingStyle === 'simple');
      const photo = path.join(evidence, 'roadmap-import-desktop.png');
      await page.getByLabel('Choose local profile photo', { exact: true }).setInputFiles(photo);
      await until(async () => !!(await snapshot(page)).productivity.settings.avatar, 'Avatar upload did not persist');
      await page.getByRole('button', { name: 'Remove profile photo', exact: true }).click();
      await until(async () => (await snapshot(page)).productivity.settings.avatar === null, 'Avatar removal did not persist');
      await page.getByLabel('Choose local profile photo', { exact: true }).setInputFiles(photo);
      await until(async () => !!(await snapshot(page)).productivity.settings.avatar, 'Repeated avatar upload did not persist');
      saved.avatar = (await snapshot(page)).productivity.settings.avatar;
      await page.reload();
      await page.waitForTimeout(300);
      assert.equal((await snapshot(page)).productivity.settings.avatar, saved.avatar);
      await page.getByLabel('What should we call you?', { exact: true }).fill('Divine');
      await until(async () => (await snapshot(page)).productivity.settings.name === 'Divine', 'Personal name did not save');
    });
    await check('offline Markdown guide and contents stay in Settings', async () => {
      await nav('Settings');
      await page.getByRole('navigation', { name: 'Settings sections' }).getByRole('button', { name: 'User guide', exact: true }).click();
      await page.getByRole('heading', { name: 'Getting started with Tempo', exact: true }).waitFor();
      await page.getByRole('navigation', { name: 'Guide contents' }).getByRole('link').first().click();
      assert.match(await page.evaluate(() => location.hash), /\/settings/);
      assert.ok(await page.getByRole('heading', { name: 'Getting started with Tempo', exact: true }).count());
      assert.ok(await page.getByRole('button', { name: 'Download .md', exact: true }).isVisible());
      await capture(page, 'guide-desktop');
    });
    await check('Privacy mode keyboard toggle and refresh behavior are preserved', async () => {
      await page.keyboard.press('Control+Shift+P');
      await until(() => page.evaluate(() => document.documentElement.classList.contains('privacy')), 'Privacy keyboard shortcut did not activate');
      await page.reload();
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains('privacy')), true);
      assert.match(await page.getByRole('button', { name: 'Toggle habit privacy', exact: true }).getAttribute('title'), /habit names hidden/);
      await page.getByRole('button', { name: 'Toggle habit privacy', exact: true }).click();
      await until(() => page.evaluate(() => !document.documentElement.classList.contains('privacy')), 'Privacy toggle did not deactivate');
    });
    await check('count-up UI, refresh continuity, main-process session ownership', async () => {
      assert.ok(saved, 'Hierarchy prerequisite failed');
      await invoke(page, 'focus:command', { action: 'configure', timerMode: 'stopwatch', link: { type: 'study', id: saved.child.id, curriculumId: saved.curriculum.id, name: saved.child.title } });
      await nav('Focus');
      await page.getByRole('button', { name: 'Start tracking', exact: true }).click();
      assert.match(await page.getByRole('button', { name: 'Save and stop tracking', exact: true }).textContent(), /Save and stop/);
      assert.ok(!(await page.locator('.focus-timer-card').textContent()).includes('Phases save automatically'));
      await page.waitForTimeout(1300);
      const before = (await snapshot(page)).productivity;
      assert.ok(before.timer.stopwatch);
      await page.reload();
      await page.waitForTimeout(400);
      assert.equal((await snapshot(page)).productivity.timer.startedAt, before.timer.startedAt);
      await page.evaluate(async () => {
        const p = await window.habitAPI.getProductivity();
        await window.habitAPI.saveProductivity({ ...p, sessions: [], timer: { ...p.timer, startedAt: null, stopwatch: { elapsed: 0, runningSince: null } } });
      });
      assert.equal((await snapshot(page)).productivity.sessions.length, before.sessions.length);
      await invoke(page, 'focus:command', { action: 'pause' });
      const paused = (await snapshot(page)).productivity.timer;
      await page.waitForTimeout(1100);
      assert.deepEqual((await snapshot(page)).productivity.timer, paused);
      await invoke(page, 'focus:command', { action: 'start' });
      saved.restartRunId = (await snapshot(page)).productivity.timer.runId;
    });
    for (const theme of ['dark', 'light']) {
      await appearance(page, theme);
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 860 });
        for (const route of ['Study', 'Focus', 'Settings', 'Home', 'Statistics']) {
          await check(`visual layout ${route} ${theme} ${width}`, async () => {
            await navigate(page, route);
            if (route === 'Statistics') await page.getByRole('button', { name: 'Time explorer', exact: true }).click();
            if (route === 'Statistics') {
              await until(() => page.locator('.time-calendar-scroll').evaluate((element) => element.scrollTop > 0), 'Calendar initially stayed at midnight');
            }
            await capture(page, `${route.toLowerCase()}-${theme}-${width}`);
            if (route === 'Statistics') {
              if (await page.locator('.time-calendar-entry').count()) {
                await page.locator('.time-calendar-entry').first().scrollIntoViewIfNeeded();
                await capture(page, `time-entries-${theme}-${width}`);
              }
              await page.locator('.study-sunburst').scrollIntoViewIfNeeded();
              await capture(page, `sunburst-${theme}-${width}`);
            }
          });
        }
      }
    }
    await check('export includes source provenance, settings, and sessions', async () => {
      backup = await page.evaluate(() => window.habitAPI.exportBackup());
      assert.ok(backup.modules.study.imports.length === 4);
      assert.ok(backup.productivity.sessions.some((s) => s.id === saved.manual.id));
      fs.writeFileSync(path.join(directory, 'review-backup.json'), JSON.stringify(backup, null, 2));
    });
    await check('renderer errors', async () => assert.deepEqual(errors, []));
    await check('production resources are local and offline', async () => {
      const resources = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((url) => /^https?:\/\//i.test(url)));
      assert.deepEqual(resources, []);
    });
  });
  await withApp(run, async ({ page }) => {
    await check('real process restart preserves running count-up and saves once', async () => {
      const before = (await snapshot(page)).productivity;
      assert.equal(before.timer.runId, saved.restartRunId);
      assert.ok(before.timer.stopwatch);
      assert.equal(before.settings.avatar, saved.avatar);
      assert.equal(before.settings.accent, 'cedar');
      assert.equal(before.settings.greetingStyle, 'simple');
      await invoke(page, 'focus:command', { action: 'stop' });
      const p = (await snapshot(page)).productivity;
      assert.equal(p.sessions.filter((s) => s.id === saved.restartRunId).length, 1);
      assert.ok(p.sessions.find((s) => s.id === saved.restartRunId).duration > 0);
      await invoke(page, 'focus:command', { action: 'stop' });
      assert.equal((await snapshot(page)).productivity.sessions.filter((s) => s.id === saved.restartRunId).length, 1);
    });
  });
  await withApp(`${run}-restore`, async ({ page, directory }) => {
    await check('fresh backup restore, safety copy, source reimport after restore', async () => {
      assert.ok(backup, 'Export prerequisite failed');
      await page.evaluate((backup) => window.habitAPI.importBackup(backup), backup);
      const before = await invoke(page, 'study:snapshot');
      await invoke(page, 'study:importOutlines', [fixture, ...bundled]);
      const after = await invoke(page, 'study:snapshot');
      assert.equal(before.curricula.length, after.curricula.length);
      assert.equal(before.topics.length, after.topics.length);
      assert.equal(before.imports.length, after.imports.length);
      assert.ok(fs.readdirSync(directory).some((f) => /^habits\.db\.before-import-.*\.bak$/.test(f)));
      assert.equal((await snapshot(page)).productivity.sessions.length, backup.productivity.sessions.length);
      assert.equal((await snapshot(page)).productivity.settings.avatar, backup.productivity.settings.avatar);
      assert.equal((await snapshot(page)).productivity.settings.accent, backup.productivity.settings.accent);
    });
  });
  await reviewHome();
  finish();
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
