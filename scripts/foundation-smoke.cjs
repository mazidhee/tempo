const { withApp } = require('./electron-runtime.cjs');
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
(async () => {
  await withApp('foundation-' + Date.now(), async ({ page, nav, directory, errors }) => {
    const network = [];
    page.on('request', (request) => {
      if (/^https?:/.test(request.url())) network.push(request.url());
    });
    await page.waitForFunction(() => !!window.workspaceAPI);
    const created = await page.evaluate(async () => {
      const c = await window.workspaceAPI.invoke('study:saveCurriculum', {
        title: 'Foundation smoke',
        description: 'Offline fixture',
      });
      const t = await window.workspaceAPI.invoke('study:saveTopic', {
        title: 'First topic',
        curriculumId: c.id,
      });
      await window.workspaceAPI.invoke('study:learn', { id: t.id, learned: true });
      return window.workspaceAPI.invoke('study:grade', { id: t.id, grade: 2 });
    });
    assert.equal(created.interval, 2);
    await nav('Settings');
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
    await nav('Home');
    await page.screenshot({ path: path.join(directory, 'home-dark.png') });
    const fonts = await page.evaluate(async () => {
      await document.fonts.load('14px "JetBrains Mono Variable"');
      await document.fonts.ready;
      return {
        sans: document.fonts.check('14px "Inter Variable"'),
        mono: document.fonts.check('14px "JetBrains Mono Variable"'),
        family: getComputedStyle(document.body).fontFamily,
      };
    });
    assert(fonts.sans && fonts.mono);
    assert.match(fonts.family, /Inter Variable/);
    for (const name of ['Habits', 'Tasks', 'Focus', 'Statistics']) await nav(name);
    await page.getByRole('button', { name: 'Open command palette' }).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Toggle habit privacy' }).click();
    assert.equal(
      await page.getByRole('button', { name: 'Toggle habit privacy' }).getAttribute('aria-pressed'),
      'true',
    );
    await nav('Settings');
    await page.getByRole('button', { name: 'Light', exact: true }).click();
    await nav('Home');
    await page.screenshot({ path: path.join(directory, 'home-light.png') });
    await page.setViewportSize({ width: 390, height: 800 });
    await page.screenshot({ path: path.join(directory, 'home-narrow.png') });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.reload();
    await page.waitForFunction(() => !!window.workspaceAPI);
    const snapshot = await page.evaluate(() => window.workspaceAPI.invoke('study:snapshot'));
    assert.equal(snapshot.reviews.length, 1);
    assert.equal(errors.length, 0);
    assert.equal(network.length, 0);
    fs.writeFileSync(
      path.join(directory, 'result.json'),
      JSON.stringify(
        {
          studyPersistence: true,
          fonts,
          network,
          errors,
          legacyRoutes: true,
          privacy: true,
          lightDark: true,
        },
        null,
        2,
      ),
    );
    console.log('FOUNDATION PASS', directory);
  });
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
