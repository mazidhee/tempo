const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { withApp } = require('./electron-runtime.cjs');
const nativeReview = require('./personal-update-review.cjs');
const run = `ux-update-review-${Date.now()}`;
const evidence = path.resolve('.review', run);
fs.mkdirSync(evidence, { recursive: true });
const results = [], pauses = [];
const invoke = (page, channel, input) => page.evaluate(({ channel, input }) => window.workspaceAPI.invoke(channel, input), { channel, input });
const focus = (page) => invoke(page, 'focus:snapshot');
const check = async (name, fn) => { try { await fn(); results.push({ name, passed: true }); console.log('PASS', name); } catch (e) { results.push({ name, passed: false, error: e.stack }); console.log('FAIL', name, e.message); } };
async function until(fn, description, limit = 9000) {
  const deadline = Date.now() + limit;
  while (Date.now() < deadline) { if (await fn()) return; await new Promise((r) => setTimeout(r, 60)); }
  throw new Error(description);
}
async function nav(page, name) {
  const link = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name, exact: true });
  if (!(await link.isVisible())) await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
  await link.click();
  await page.waitForTimeout(160);
}
async function capture(page, name) {
  await page.screenshot({ path: path.join(evidence, `${name}.png`) });
  const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    canvas: getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim(),
    primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() }));
  fs.writeFileSync(path.join(evidence, `${name}-layout.json`), JSON.stringify(layout, null, 2));
  assert.ok(layout.scrollWidth <= layout.width, `${name} document overflows`);
}
async function chooseTopic(page, label, topic, keyboard = false) {
  await page.getByRole('button', { name: label, exact: true }).click();
  const dialog = page.getByRole('dialog');
  const options = dialog.locator('[cmdk-list] [cmdk-item]');
  const search = dialog.getByRole('combobox', { name: /^Search / });
  assert.ok(await options.count() <= 31, 'Picker mounts more than one page');
  await search.fill(topic.title);
  await dialog.getByLabel('Filter collection').selectOption(topic.curriculumId);
  await until(async () => (await options.count()) === 1, 'Unique topic search did not resolve');
  if (keyboard) { await search.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); }
  else await options.click();
  await dialog.waitFor({ state: 'hidden' });
}
let chosen, other, day, backup, savedRun;
async function main() {
  await withApp(run, async ({ page, errors }) => {
    await check('three actual sources import 1823 topics in isolated DB', async () => {
      const sources = [['Software engineering', 'software-engineering.md'], ['Mathematics', 'mathematics.md'], ['Economics & markets', 'economics-markets.md']].map(([title, file]) => ({ title, markdown: fs.readFileSync(path.resolve('src/renderer/assets/curricula', file), 'utf8') }));
      await invoke(page, 'study:importOutlines', sources);
      const study = await invoke(page, 'study:snapshot');
      assert.equal(study.topics.length, 1823);
      const unique = study.topics.filter((t) => study.topics.filter((s) => s.title === t.title).length === 1).sort((a, b) => b.title.length - a.title.length);
      chosen = unique[0]; other = unique.find((t) => t.curriculumId !== chosen.curriculumId);
      fs.writeFileSync(path.join(evidence, 'selected-topics.json'), JSON.stringify({ chosen, other }, null, 2));
      assert.equal((await focus(page)).settings.enabled, false);
    });
    await check('Plan picker pagination, keyboard, curriculum filter and draft retention', async () => {
      await nav(page, 'Plan');
      day = await page.getByLabel('Plan date').inputValue();
      const journal = page.getByPlaceholder('What would you like to remember?');
      await journal.fill('Unfinished reviewer journal line');
      await page.getByLabel('Priority title').fill('Unfinished priority draft');
      await page.getByRole('button', { name: 'Add study topic', exact: true }).click();
      let dialog = page.getByRole('dialog');
      assert.equal(await dialog.locator('[cmdk-list] [cmdk-item]').count(), 30);
      await dialog.getByRole('button', { name: 'Next', exact: true }).click();
      assert.match(await dialog.getByRole('status').textContent(), /Page 2/);
      assert.equal(await dialog.locator('[cmdk-list] [cmdk-item]').count(), 30);
      await dialog.getByRole('combobox', { name: /^Search / }).fill('Definitely no matches review phrase');
      assert.ok((await dialog.textContent()).includes('No matches'));
      await page.keyboard.press('Escape');
      await chooseTopic(page, 'Add study topic', chosen, true);
      await until(async () => (await invoke(page, 'plan:snapshot')).plans.find((p) => p.date === day)?.studyTopicIds.includes(chosen.id), 'Plan topic was not automatically saved');
      assert.equal(await journal.inputValue(), 'Unfinished reviewer journal line');
      assert.equal(await page.getByLabel('Priority title').inputValue(), 'Unfinished priority draft');
      assert.equal(await page.locator('.plan-study-row').count(), 1);
      await capture(page, 'plan-selected-long-desktop');
    });
    await check('Plan day switching, selected-only rows, refresh and Start focus link', async () => {
      await page.getByPlaceholder('What would you like to remember?').fill('');
      await page.getByLabel('Priority title').fill('');
      const next = new Date(`${day}T12:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
      const nextDay = next.toISOString().slice(0, 10);
      await page.getByLabel('Plan date').fill(nextDay);
      await until(async () => (await page.locator('.plan-study-row').count()) === 0, 'Second day inherited first-day selection');
      await chooseTopic(page, 'Add study topic', other);
      await until(async () => (await invoke(page, 'plan:snapshot')).plans.find((p) => p.date === nextDay)?.studyTopicIds.includes(other.id), 'Second-day choice did not save');
      await page.getByLabel('Plan date').fill(day);
      await until(async () => (await page.locator('.plan-study-row').textContent()).includes(chosen.title), 'Original day selection missing');
      await page.reload(); await nav(page, 'Plan');
      assert.equal(await page.locator('.plan-study-row').count(), 1);
      await page.locator('.plan-study-row').getByRole('button', { name: 'Start focus', exact: true }).click();
      await until(async () => (await focus(page)).productivity.timer.deadline !== null, 'Topic focus did not start');
      assert.equal((await focus(page)).productivity.timer.link.id, chosen.id);
      const begin = Date.now(); await page.getByRole('button', { name: 'Pause', exact: true }).click();
      await until(async () => (await focus(page)).productivity.timer.deadline === null, 'Pause did not commit');
      pauses.push(Date.now() - begin);
      await invoke(page, 'focus:command', { action: 'stop' });
    });
    await check('Focus searchable chooser, correct ID, long label and rapid actions', async () => {
      await nav(page, 'Focus');
      await chooseTopic(page, 'Choose focus link', chosen, true);
      assert.equal((await focus(page)).productivity.timer.link.id, chosen.id);
      await page.getByRole('button', { name: 'Time tracking', exact: true }).click();
      await page.getByRole('button', { name: 'Start tracking', exact: true }).evaluate((button) => { button.click(); button.click(); button.click(); });
      await until(async () => (await focus(page)).productivity.timer.stopwatch.runningSince !== null, 'Tracking did not start');
      savedRun = (await focus(page)).productivity.timer.runId;
      for (let i = 0; i < 5; i++) {
        const started = Date.now(); await page.getByRole('button', { name: 'Pause', exact: true }).click();
        await until(async () => (await focus(page)).productivity.timer.stopwatch.runningSince === null, 'Rapid pause did not persist');
        pauses.push(Date.now() - started);
        await page.getByRole('button', { name: 'Resume', exact: true }).click();
        await until(async () => (await focus(page)).productivity.timer.stopwatch.runningSince !== null, 'Resume did not persist');
      }
      await page.waitForTimeout(1100);
      await page.getByRole('button', { name: 'Save and stop tracking', exact: true }).evaluate((button) => { button.click(); button.click(); button.click(); });
      await until(async () => (await focus(page)).productivity.sessions.some((s) => s.id === savedRun), 'Tracked session not saved');
      assert.equal((await focus(page)).productivity.sessions.filter((s) => s.id === savedRun).length, 1);
      await Promise.all([invoke(page, 'focus:command', { action: 'stop' }), invoke(page, 'focus:command', { action: 'stop' })]);
      assert.equal((await focus(page)).productivity.sessions.filter((s) => s.id === savedRun).length, 1);
      assert.ok(Math.max(...pauses) < 900, `UI Pause delay ${Math.max(...pauses)}ms`);
      fs.writeFileSync(path.join(evidence, 'pause-latencies.json'), JSON.stringify(pauses));
      await capture(page, 'focus-long-link-desktop');
    });
    await check('palette settings work through UI and retain accent independently', async () => {
      await nav(page, 'Settings');
      await page.getByRole('group', { name: 'Accent color' }).getByRole('button', { name: 'Cedar', exact: true }).click();
      for (const [id, name] of [['default', 'Tempo'], ['graphite', 'Graphite'], ['slate', 'Slate'], ['dusk', 'Dusk'], ['forest', 'Forest']]) {
        await nav(page, 'Settings');
        await page.getByRole('group', { name: 'Surface palettes' }).getByRole('button', { name: new RegExp(`^${name}`) }).click();
        await until(async () => (await focus(page)).productivity.settings.themePalette === id, `${name} palette did not save`);
        for (const mode of ['dark', 'light']) {
          await nav(page, 'Settings');
          await page.getByRole('button', { name: mode === 'dark' ? 'Dark' : 'Light', exact: true }).click();
          await until(async () => (await focus(page)).productivity.settings.theme === mode, 'Appearance mode did not save');
          for (const width of [1280, 390]) {
            await page.setViewportSize({ width, height: width === 390 ? 844 : 860 });
            await nav(page, 'Focus'); await capture(page, `focus-${id}-${mode}-${width}`);
            await nav(page, 'Plan');
            await page.locator('.plan-study-list').scrollIntoViewIfNeeded();
            await capture(page, `plan-${id}-${mode}-${width}`);
          }
        }
        assert.equal((await focus(page)).productivity.settings.accent, 'cedar');
      }
      await page.setViewportSize({ width: 1280, height: 860 });
      await nav(page, 'Settings');
      await page.getByRole('group', { name: 'Surface palettes' }).scrollIntoViewIfNeeded();
      await capture(page, 'settings-palettes-desktop');
      await page.setViewportSize({ width: 390, height: 844 });
      await capture(page, 'settings-palettes-narrow');
    });
    await check('rapid name typing and appearance updates survive queued saves and reload', async () => {
      await page.keyboard.press('Escape');
      await page.setViewportSize({ width: 1280, height: 860 }); await nav(page, 'Settings');
      const name = page.getByPlaceholder('Your first name');
      await name.fill('');
      await name.pressSequentially('Divine Reviewer', { delay: 15 });
      await page.waitForTimeout(1400);
      const typed = await name.inputValue();
      const persisted = (await focus(page)).productivity.settings.name;
      fs.writeFileSync(path.join(evidence, 'rapid-settings.json'), JSON.stringify({ typed, persisted, expected: 'Divine Reviewer' }, null, 2));
      assert.equal(typed, 'Divine Reviewer'); assert.equal(persisted, 'Divine Reviewer');
      for (const name of ['Slate', 'Dusk', 'Forest']) {
        await page.getByRole('group', { name: 'Surface palettes' }).getByRole('button', { name: new RegExp(`^${name}`) }).click();
      }
      for (const name of ['Terracotta', 'Cedar']) {
        await page.getByRole('group', { name: 'Accent color' }).getByRole('button', { name, exact: true }).click();
      }
      await page.waitForTimeout(1400); await page.reload(); await nav(page, 'Settings');
      const saved = (await focus(page)).productivity.settings;
      assert.equal(saved.name, 'Divine Reviewer'); assert.equal(saved.themePalette, 'forest'); assert.equal(saved.accent, 'cedar');
    });
    await check('search dialog narrow long title and keyboard Escape', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await nav(page, 'Focus');
      await page.getByRole('button', { name: 'Choose focus link', exact: true }).click();
      await page.getByRole('dialog').getByRole('combobox', { name: /^Search / }).fill(chosen.title);
      await capture(page, 'picker-long-narrow');
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
    });
    await check('collapsed brand/search/nav/avatar/collapse centers align', async () => {
      await page.setViewportSize({ width: 1280, height: 860 }); await nav(page, 'Focus');
      await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
      await page.waitForTimeout(250);
      const centers = await page.locator('.tempo-sidebar').evaluate((sidebar) => {
        const bounds = sidebar.getBoundingClientRect(), center = bounds.x + bounds.width / 2;
        return [...sidebar.querySelectorAll('.tempo-brand>svg, [data-sidebar="menu-button"] svg, .avatar')].map((el) => {
          const r = el.getBoundingClientRect(); return { tag: el.tagName, center: r.x + r.width / 2, expected: center, width: r.width, error: Math.abs(r.x + r.width / 2 - center) };
        });
      });
      fs.writeFileSync(path.join(evidence, 'collapsed-centers.json'), JSON.stringify(centers, null, 2));
      await capture(page, 'sidebar-collapsed-desktop');
      assert.ok(centers.length >= 12);
      assert.ok(centers.every((r) => r.width > 0 && r.error <= 2), 'Collapsed elements differ from the sidebar center');
      await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
    });
    await check('renderer error-free, local resources, export provenance/palette/session', async () => {
      assert.deepEqual(errors, []);
      assert.deepEqual(await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((url) => /^https?:\/\//.test(url))), []);
      backup = await page.evaluate(() => window.habitAPI.exportBackup());
      assert.equal(backup.modules.study.imports.length, 3);
      assert.equal(backup.productivity.settings.themePalette, 'forest');
      assert.equal(backup.productivity.sessions.filter((s) => s.id === savedRun).length, 1);
      fs.writeFileSync(path.join(evidence, 'fixture-backup.json'), JSON.stringify(backup, null, 2));
    });
  });
  await withApp(run, async ({ page }) => {
    await check('real restart retains selected Plan topic, palette and one session', async () => {
      const p = (await focus(page)).productivity;
      assert.equal(p.settings.themePalette, 'forest'); assert.equal(p.settings.accent, 'cedar');
      assert.equal(p.sessions.filter((s) => s.id === savedRun).length, 1);
      assert.ok((await invoke(page, 'plan:snapshot')).plans.find((p) => p.date === day).studyTopicIds.includes(chosen.id));
      assert.equal((await invoke(page, 'study:snapshot')).topics.length, 1823);
    });
  });
  if (!process.argv.includes('--ui-only')) await check('independent native app closure despite denial and responsive Pause', async () => {
    const diagnosis = await nativeReview.diagnoseGuard();
    fs.writeFileSync(path.join(evidence, 'native-guard-results.json'), JSON.stringify({ ...diagnosis, evidence: nativeReview.evidence }, null, 2));
    assert.equal(diagnosis.baseline, false);
    assert.ok(diagnosis.pauseLatencyMs < 900 && diagnosis.nativePauseLatencyMs < 900);
    assert.ok(diagnosis.firstStats.appLists > 0 && diagnosis.firstStats.appCloses > 0);
    assert.ok(diagnosis.probeExited);
    assert.equal(diagnosis.finalStats.closeError, '');
    assert.ok(diagnosis.deniedGuard.pending || diagnosis.deniedGuard.appsActive);
    assert.match(diagnosis.deniedGuard.error, /Website blocking needs permission/);
    assert.ok(diagnosis.deniedGuard.error.length < 180);
  });
  fs.writeFileSync(path.join(evidence, 'results.json'), JSON.stringify({ run, results, pauses }, null, 2));
  console.log(JSON.stringify({ evidence, passed: results.filter((r) => r.passed).length, failed: results.filter((r) => !r.passed) }, null, 2));
  if (results.some((r) => !r.passed)) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
