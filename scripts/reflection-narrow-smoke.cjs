const { withApp } = require('./electron-runtime.cjs');
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
// Defaults to the integrated Settings shell. A builder can temporarily mount the exact
// component at /reflection-fixture-reminders and set REFLECTION_REMINDERS_FIXTURE_ROUTE=1.
(async () => {
  await withApp('reflection-390-' + Date.now(), async ({ page, nav, directory, errors }) => {
    await page.waitForFunction(() => !!window.workspaceAPI);
    await page.evaluate(async () => {
      const now = new Date(),
        date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        deadline = new Date(now);
      deadline.setDate(deadline.getDate() + 27);
      const end = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}-${String(deadline.getDate()).padStart(2, '0')}`;
      const habit = await window.habitAPI.addHabit({
        name: 'A longer habit name to check narrow-window wrapping',
        frequency: 'daily',
        time_of_day: 'morning',
      });
      await window.workspaceAPI.invoke('plan:save', {
        date,
        priorities: [
          {
            id: 'narrow-habit',
            kind: 'habit',
            linkId: String(habit.id),
            title: habit.name,
            done: false,
          },
          {
            id: 'free',
            kind: 'free',
            linkId: null,
            title: 'Prepare a clear market view and write down the reasoning',
            done: false,
          },
        ],
        studyTopicIds: [],
      });
      await window.workspaceAPI.invoke('plan:evening', {
        date,
        doneIds: [],
        journal:
          'A useful day of learning about government bonds and the reasons interest rates change.',
        sleep: 7.5,
        energy: 4,
      });
      await window.workspaceAPI.invoke('goals:save', {
        title: 'Finish a useful block of work before the end of the month',
        kind: 'tasks',
        linkType: 'all',
        linkId: '',
        start: date,
        deadline: end,
        target: 10,
        weeks: 4,
        archived: false,
      });
      await window.workspaceAPI.invoke('review:generate', { date });
    });
    const results = [];
    for (const theme of ['Dark', 'Light']) {
      await page.setViewportSize({ width: 1280, height: 860 });
      await nav('Settings');
      if (await page.getByRole('button', { name: 'General', exact: true }).count())
        await page.getByRole('button', { name: 'General', exact: true }).click();
      await page.getByRole('button', { name: theme, exact: true }).click();
      await page.setViewportSize({ width: 390, height: 860 });
      for (const [name, route] of [
        ['plan', '/plan'],
        ['journal', '/journal'],
        ['goals', '/goals'],
        ['review', '/review'],
        ['reminders', '/reflection-fixture-reminders'],
      ]) {
        let rootLocator;
        if (name === 'reminders' && !process.env.REFLECTION_REMINDERS_FIXTURE_ROUTE) {
          await nav('Settings');
          await page.getByRole('button', { name: 'Reflection reminders', exact: true }).click();
          rootLocator = page
            .getByRole('heading', { name: 'Reflection reminders', exact: true })
            .locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
        } else {
          await page.evaluate((route) => {
            location.hash = route;
          }, route);
          rootLocator = page.locator('.reflection-page');
        }
        await rootLocator.waitFor();
        await page.waitForTimeout(200);
        const layout = await rootLocator.evaluate((root) => {
          const bound = root.getBoundingClientRect(),
            outside = [];
          for (const element of root.querySelectorAll(
            'button,input,select,textarea,h1,h2,p,label,a',
          )) {
            if (element.closest('.reflection-table-wrap')) continue;
            const rect = element.getBoundingClientRect();
            if (rect.width && rect.right > bound.right + 1)
              outside.push({
                tag: element.tagName,
                text: (element.textContent || element.getAttribute('aria-label') || '').slice(
                  0,
                  100,
                ),
                right: rect.right,
              });
          }
          return {
            viewport: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            moduleWidth: bound.width,
            moduleScrollWidth: root.scrollWidth,
            outside,
          };
        });
        results.push({ theme, page: name, ...layout });
        await page.screenshot({
          path: path.join(directory, `${name}-${theme.toLowerCase()}-390.png`),
        });
      }
    }
    fs.writeFileSync(
      path.join(directory, 'result.json'),
      JSON.stringify({ results, errors }, null, 2),
    );
    console.log('REFLECTION 390 EVIDENCE', directory, JSON.stringify(results));
    assert.equal(errors.length, 0);
    assert(
      results.every((r) => r.documentWidth <= 391 && r.outside.length === 0),
      'A Reflection control extends outside the module',
    );
  });
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
