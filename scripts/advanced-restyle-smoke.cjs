const { withApp } = require('./electron-runtime.cjs');
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
(async () => {
  await withApp('advanced-restyle-' + Date.now(), async ({ page, nav, directory, errors }) => {
    await page.waitForFunction(() => !!window.habitAPI);
    await page.evaluate(async () => {
      const date = (n) => {
        const d = new Date();
        d.setDate(d.getDate() + n);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };
      await window.habitAPI.addHabit({
        name: 'Read market news',
        description: 'Synthetic review fixture',
        frequency: 'daily',
        time_of_day: 'morning',
        habit_type: 'check',
        schedule_type: 'daily',
        start_date: date(-30),
      });
      await window.habitAPI.addHabit({
        name: 'Practice Python',
        description: 'Synthetic review fixture',
        frequency: 'daily',
        time_of_day: 'evening',
        habit_type: 'check',
        schedule_type: 'daily',
        start_date: date(-30),
      });
      const habits = await window.habitAPI.getHabits();
      await window.habitAPI.recordHabit({
        habitId: habits[0].id,
        logDate: date(0),
        action: 'complete',
      });
    });
    const captures = [];
    for (const theme of ['Dark', 'Light']) {
      await nav('Settings');
      await page.getByRole('button', { name: theme, exact: true }).click();
      await nav('Statistics');
      await page
        .getByText('More habit insights · weekly breakdown, best days & individual trends', {
          exact: true,
        })
        .click();
      const advanced = page.getByRole('region', { name: 'Advanced habit analytics' });
      await advanced.getByRole('heading', { name: 'Streaks', exact: true }).waitFor();
      await advanced.getByRole('button', { name: '30 days', exact: true }).click();
      await advanced.getByRole('button', { name: '90 days', exact: true }).click();
      await advanced.getByRole('button', { name: '7 days', exact: true }).click();
      await advanced
        .getByRole('combobox', { name: 'Habit for trend' })
        .selectOption({ label: 'Practice Python' });
      await advanced
        .getByRole('combobox', { name: 'Habit for trend' })
        .selectOption({ label: 'Read market news' });
      await advanced.getByRole('button', { name: 'Refresh', exact: true }).click();
      await page.waitForTimeout(350);
      const file = path.join(directory, `advanced-${theme.toLowerCase()}-1280.png`);
      await advanced
        .getByRole('heading', { name: 'Advanced habit analytics', exact: true })
        .evaluate((node) => node.scrollIntoView({ block: 'start' }));
      await page.screenshot({ path: file });
      captures.push(file);
      const rows = advanced.locator('.advanced-sections > .chart-grid');
      for (let index = 0; index < (await rows.count()); index++) {
        const rowFile = path.join(
          directory,
          `advanced-row${index + 1}-${theme.toLowerCase()}-1280.png`,
        );
        await rows.nth(index).screenshot({ path: rowFile });
        captures.push(rowFile);
      }
      const panels = advanced.locator('.advanced-sections > .panel');
      for (let index = 0; index < (await panels.count()); index++) {
        const panelFile = path.join(
          directory,
          `advanced-panel${index + 1}-${theme.toLowerCase()}-1280.png`,
        );
        await panels.nth(index).screenshot({ path: panelFile });
        captures.push(panelFile);
      }

      const bars = advanced.locator('.recharts-bar-rectangle path');
      if (await bars.count()) {
        await bars.first().hover();
        await advanced
          .locator('.recharts-tooltip-wrapper')
          .filter({ visible: true })
          .first()
          .waitFor({ state: 'visible' });
        const tooltipFile = path.join(
          directory,
          `advanced-tooltip-${theme.toLowerCase()}-1280.png`,
        );
        await advanced.locator('.advanced-chart-frame').first().screenshot({ path: tooltipFile });
        captures.push(tooltipFile);
      }
      const palette = await advanced.evaluate((element) => {
        const selected = ['h2', 'h3', 'strong', '.advanced-day-summary', 'svg .recharts-curve'];
        return selected.flatMap((selector) =>
          Array.from(element.querySelectorAll(selector)).map((node) => ({
            tag: node.tagName,
            color: getComputedStyle(node).color,
            background: getComputedStyle(node).backgroundColor,
            stroke: getComputedStyle(node).stroke,
          })),
        );
      });
      fs.writeFileSync(
        path.join(directory, `palette-${theme.toLowerCase()}.json`),
        JSON.stringify(palette, null, 2),
      );
    }
    assert.equal(errors.length, 0, errors.join('\n'));
    fs.writeFileSync(
      path.join(directory, 'result.json'),
      JSON.stringify(
        {
          advancedMounted: true,
          periodTabs: true,
          habitTrendSelect: true,
          refresh: true,
          darkLight: true,
          captures,
          errors,
        },
        null,
        2,
      ),
    );
    console.log('ADVANCED RESTYLE PASS', directory);
  });
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
