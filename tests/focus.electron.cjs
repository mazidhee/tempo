const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { withApp } = require('../scripts/electron-runtime.cjs');
const name = `focus-isolated-${Date.now()}`;
let savedDeadline, hostsFile;
(async () => {
  await withApp(name, async ({ page, nav, directory, errors }) => {
    hostsFile = path.join(directory, 'guard-hosts.fixture');
    await nav('Focus');
    await page.getByRole('heading', { name: 'Focus', exact: true }).waitFor();
    const initial = await page.evaluate(() => window.workspaceAPI.invoke('focus:snapshot'));
    assert.equal(initial.settings.enabled, false);
    await page.evaluate(async () => {
      const p = await window.habitAPI.getProductivity();
      p.presets.push({ id: 'smoke', name: 'Smoke timer', focus: 2, short: 2, long: 2, cycles: 2 });
      await window.habitAPI.saveProductivity(p);
      await window.workspaceAPI.invoke('focus:command', { action: 'configure', presetId: 'smoke' });
    });
    await page.getByRole('button', { name: 'Start focus', exact: true }).click();
    savedDeadline = (await page.evaluate(() => window.workspaceAPI.invoke('focus:snapshot')))
      .productivity.timer.deadline;
    await page.reload();
    await page.waitForTimeout(300);
    assert.equal(
      (await page.evaluate(() => window.workspaceAPI.invoke('focus:snapshot'))).productivity.timer
        .deadline,
      savedDeadline,
    );
    await page.waitForTimeout(2500);
    let state = await page.evaluate(() => window.workspaceAPI.invoke('focus:snapshot'));
    assert.equal(state.productivity.sessions.filter((s) => s.presetId === 'smoke').length, 1);
    assert.equal(state.productivity.timer.deadline, null);
    assert.equal(state.productivity.timer.phase, 'short');
    await page.evaluate(async () => {
      const s = await window.workspaceAPI.invoke('focus:snapshot');
      const settings = { ...s.settings, enabled: true, strict: true, mode: 'close' };
      await window.workspaceAPI.invoke('focus:settings', settings);
      await window.workspaceAPI.invoke('focus:command', {
        action: 'configure',
        presetId: 'classic',
        phase: 'focus',
      });
      await window.workspaceAPI.invoke('focus:command', { action: 'start' });
    });
    assert.match(await fs.readFile(hostsFile, 'utf8'), /127\.0\.0\.1 web\.whatsapp\.com/);
    state = await page.evaluate(() => window.workspaceAPI.invoke('focus:snapshot'));
    assert.equal(state.guard.active, true);
    const strictError = await page.evaluate(() =>
      window.workspaceAPI.invoke('focus:command', { action: 'pause' }).then(
        () => '',
        (e) => e.message,
      ),
    );
    assert.match(strictError, /Strict/);
    await page
      .locator('.focus-page')
      .getByRole('button', { name: 'Emergency exit', exact: true })
      .click();
    await page.getByLabel('Exit phrase').fill('I choose to end this focus');
    await page.getByRole('button', { name: 'Keep focusing', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page
      .locator('.focus-page')
      .getByRole('button', { name: 'Emergency exit', exact: true })
      .click();
    assert.equal(await page.getByLabel('Exit phrase').inputValue(), '');
    assert.equal(
      await page.getByRole('button', { name: 'End focus', exact: true }).isDisabled(),
      true,
    );
    await page.getByLabel('Exit phrase').fill('I choose to end this focus');
    await page.getByRole('button', { name: 'End focus', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.doesNotMatch(await fs.readFile(hostsFile, 'utf8'), /BEGIN TEMPO/);
    state = await page.evaluate(() => window.workspaceAPI.invoke('focus:snapshot'));
    assert.equal(state.events.filter((e) => e.kind === 'emergency').length, 1);
    await page.evaluate(async () => {
      const s = await window.workspaceAPI.invoke('focus:snapshot');
      await window.workspaceAPI.invoke('focus:settings', {
        ...s.settings,
        strict: false,
        enabled: false,
      });
      await window.workspaceAPI.invoke('focus:command', {
        action: 'configure',
        presetId: 'classic',
      });
      await window.workspaceAPI.invoke('focus:command', { action: 'start' });
      const before = await window.workspaceAPI.invoke('focus:snapshot');
      const stale = structuredClone(before.productivity);
      stale.timer.deadline = null;
      stale.sessions = [];
      await window.habitAPI.saveProductivity(stale);
      const after = await window.workspaceAPI.invoke('focus:snapshot');
      if (
        after.productivity.timer.deadline !== before.productivity.timer.deadline ||
        after.productivity.sessions.length !== before.productivity.sessions.length
      )
        throw Error('Renderer overwrote main timer or sessions');
    });
    savedDeadline = (await page.evaluate(() => window.workspaceAPI.invoke('focus:snapshot')))
      .productivity.timer.deadline;
    await page.evaluate(async () => {
      const p = await window.habitAPI.getProductivity();
      await window.habitAPI.saveProductivity({ ...p, settings: { ...p.settings, theme: 'dark' } });
    });
    await page.reload();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(directory, 'focus-dark.png'), fullPage: true });
    await page.evaluate(async () => {
      const p = await window.habitAPI.getProductivity();
      await window.habitAPI.saveProductivity({ ...p, settings: { ...p.settings, theme: 'light' } });
    });
    await page.reload();
    await page.waitForTimeout(300);
    await page.setViewportSize({ width: 760, height: 720 });
    await page.screenshot({ path: path.join(directory, 'focus-light-narrow.png'), fullPage: true });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      false,
    );
    assert.deepEqual(errors, []);
    // Real window close hides to tray; renderer remains alive, with timer active.
    await page.evaluate(() => window.workspaceAPI.invoke('window:control', 'close'));
    await page.waitForTimeout(500);
    assert.equal(
      (await page.evaluate(() => window.workspaceAPI.invoke('focus:snapshot'))).productivity.timer
        .deadline,
      savedDeadline,
    );
  });
  // A hosts fixture deliberately left by a simulated crash must be cleaned at next startup.
  await fs.writeFile(
    hostsFile,
    '# Isolated owner entry\n192.0.2.2 untouched.example\n# BEGIN TEMPO FOCUS GUARD\n127.0.0.1 web.whatsapp.com\n::1 web.whatsapp.com\n# END TEMPO FOCUS GUARD\n',
  );
  await withApp(name, async ({ page, directory }) => {
    const snapshot = await page.evaluate(() => window.workspaceAPI.invoke('focus:snapshot'));
    assert.equal(snapshot.productivity.timer.deadline, savedDeadline);
    assert.doesNotMatch(
      await fs.readFile(path.join(directory, 'guard-hosts.fixture'), 'utf8'),
      /BEGIN TEMPO/,
    );
    assert.match(
      await fs.readFile(path.join(directory, 'guard-hosts.fixture'), 'utf8'),
      /192\.0\.2\.2 untouched\.example/,
    );
    await page.evaluate(() => window.workspaceAPI.invoke('focus:command', { action: 'stop' }));
  });
  console.log(`Focus real Electron smoke passed: ${name}`);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
