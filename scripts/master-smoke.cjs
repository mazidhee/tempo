const { withApp } = require('./electron-runtime.cjs');
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
(async () => {
  const name = 'master-' + Date.now();
  await withApp(name, async ({ page, nav, directory, errors }) => {
    const checks = {};
    const today = await page.evaluate(async () => {
      const d = new Date();
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      await window.workspaceAPI.invoke('journal:save', {
        date: day,
        text: 'Integration memory of steady progress',
      });
      return day;
    });
    await nav('Home');
    await page.locator(`.heat-cell[data-date="${today}"]`).waitFor();
    await page.waitForFunction(
      (day) =>
        document
          .querySelector(`.heat-cell[data-date="${day}"]`)
          ?.getAttribute('aria-label')
          ?.includes('Integration memory'),
      today,
    );
    checks.heatmapJournal = true;
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder('Navigate, focus, or add a task…').fill('Integration memory');
    await page.getByRole('option').filter({ hasText: today }).click();
    await page.getByRole('heading', { name: 'Journal', exact: true }).waitFor();
    assert.equal(
      await page.locator('textarea').inputValue(),
      'Integration memory of steady progress',
    );
    checks.paletteJournal = true;
    await nav('Tasks');
    await page
      .getByPlaceholder('What needs your attention? Enter to add a task…')
      .fill('Integration task');
    await page.getByPlaceholder('What needs your attention? Enter to add a task…').press('Enter');
    await page.getByRole('button', { name: 'Complete Integration task', exact: true }).click();
    await page.getByRole('button', { name: 'Completed', exact: true }).click();
    await page.getByRole('button', { name: 'Reopen Integration task', exact: true }).click();
    checks.taskCRUD = true;
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await page.getByLabel('Filter task priority').selectOption('high');
    assert.equal(
      await page.getByRole('button', { name: 'Complete Integration task', exact: true }).count(),
      0,
    );
    await page.getByLabel('Filter task priority').selectOption('medium');
    await page.getByRole('button', { name: 'Complete Integration task', exact: true }).waitFor();
    await page.getByLabel('Filter task priority').selectOption('all');
    checks.priorityFilter = true;

    await nav('Focus');
    await page.getByRole('button', { name: 'Start focus', exact: true }).click();
    await nav('Plan');
    await page
      .locator('.focus-safety')
      .getByRole('button', { name: 'Emergency exit', exact: true })
      .click();
    await page.getByLabel('Exit phrase', { exact: true }).fill('I choose to end this focus');
    await page.getByRole('button', { name: 'End focus', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('.focus-safety'));
    checks.globalEmergency = true;
    await nav('Focus');
    await page.getByRole('button', { name: 'Start focus', exact: true }).click();
    await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
    assert.equal(
      await page
        .locator('.focus-safety')
        .getByRole('button', { name: 'Emergency exit' })
        .isVisible(),
      true,
    );
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.workspaceAPI.invoke('focus:command', { action: 'stop' }));
    checks.zenEmergency = true;
    const backup = await page.evaluate(() => window.habitAPI.exportBackup());
    assert.equal(backup.version, 3);
    assert.deepEqual(Object.keys(backup.modules).sort(), ['focus', 'reflection', 'study']);
    await page.evaluate((b) => window.habitAPI.importBackup(b), backup);
    checks.backupIPC = true;
    const captures = [];
    for (const width of [1280, 390])
      for (const theme of ['dark', 'light']) {
        await page.setViewportSize({ width, height: 860 });
        await page.emulateMedia({ colorScheme: theme });
        for (const [label, route] of [
          ['Home', '/'],
          ['Plan', '/plan'],
          ['Habits', '/habits'],
          ['Tasks', '/tasks'],
          ['Focus', '/focus'],
          ['Study', '/study'],
          ['Statistics', '/statistics'],
          ['Goals', '/goals'],
          ['Review', '/review'],
          ['Journal', '/journal'],
          ['Settings', '/settings'],
        ]) {
          await page.evaluate((route) => {
            location.hash = '#' + route;
          }, route);
          await page.waitForTimeout(label === 'Statistics' ? 450 : 200);
          await page.locator('main').waitFor();
          const file = `${label.toLowerCase()}-${theme}-${width}.png`;
          await page.screenshot({ path: path.join(directory, file) });
          const layout = await page.evaluate(() => ({
            documentWidth: document.documentElement.scrollWidth,
            width: innerWidth,
            topbar: [...document.querySelectorAll('.topbar button')].map((el) => ({
              label: el.getAttribute('aria-label'),
              right: el.getBoundingClientRect().right,
              left: el.getBoundingClientRect().left,
            })),
            bodyFont: getComputedStyle(document.body).fontFamily,
          }));
          assert.equal(layout.documentWidth, width, `${label} document overflow`);
          assert.ok(
            layout.topbar.every((b) => b.left >= 0 && b.right <= width + 1),
            `${label} clipped window control`,
          );
          captures.push({ file, ...layout });
          if (label === 'Home' && width === 1280 && theme === 'dark')
            await page
              .getByRole('navigation', { name: 'Main navigation' })
              .screenshot({ path: 'docs/sidebar-icons.png' });
        }
        // Capture module settings controls, which lie below the initial Settings viewport.
        for (const [label, section, selector] of [
          ['guard', 'Focus', '.focus-settings'],
          ['reminders', 'Reflection reminders', '.reflection-stack:has(#reminder-morning)'],
        ]) {
          await page
            .getByRole('navigation', { name: 'Settings sections' })
            .getByRole('button', { name: section, exact: true })
            .click();
          const panel = page.locator(selector);
          await panel.waitFor();
          if (await panel.count()) {
            await panel.scrollIntoViewIfNeeded();
            const file = `settings-${label}-${theme}-${width}.png`;
            await page.screenshot({ path: path.join(directory, file) });
            captures.push({ file });
          }
        }
      }
    const external = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .filter((r) => /^https?:/.test(r.name))
        .map((r) => r.name),
    );
    assert.deepEqual(external, []);
    assert.deepEqual(errors, []);
    checks.offline = true;
    fs.writeFileSync(
      path.join(directory, 'result.json'),
      JSON.stringify({ checks, captures, errors }, null, 2),
    );
    console.log(JSON.stringify({ directory, checks, captures: captures.length, errors }, null, 2));
  });
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
