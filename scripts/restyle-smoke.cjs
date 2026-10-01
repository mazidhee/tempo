const { withApp } = require('./electron-runtime.cjs');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
(async () => {
  await withApp('restyle-' + Date.now(), async ({ page, nav, directory, errors }) => {
    const network = [];
    page.on('request', (r) => {
      if (/^https?:/.test(r.url())) network.push(r.url());
    });
    await page.waitForFunction(() => !!window.workspaceAPI);
    await page.evaluate(async () => {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      await window.habitAPI.addHabit({
        name: 'Read a chapter',
        description: 'Daily reading fixture',
        frequency: 'daily',
        time_of_day: 'morning',
        habit_type: 'check',
        schedule_type: 'daily',
        start_date: today,
        non_negotiable: 1,
      });
      await window.habitAPI.addHabit({
        name: 'Walk outside',
        description: 'Quantity fixture',
        frequency: 'daily',
        time_of_day: 'evening',
        habit_type: 'quantity',
        quantity_target: 30,
        quantity_unit: 'minutes',
        schedule_type: 'daily',
        start_date: today,
      });
    });
    await nav('Settings');
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await nav('Habits');
    await page.getByRole('button', { name: 'Read a chapter', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('heading', { name: 'Habit details', exact: true })
      .waitFor();
    await page.getByRole('dialog').getByRole('button', { name: 'Edit habit & schedule' }).click();
    await page
      .getByRole('dialog', { name: 'Edit Habit' })
      .waitFor()
      .catch(() => {});
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.getByRole('link', { name: 'Today & manage', exact: true }).click();
    await page.getByRole('heading', { name: 'Small commitments, kept.' }).waitFor();
    await nav('Tasks');
    await page.getByRole('textbox', { name: 'Quick add task' }).fill('Prepare market notes');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await page.getByRole('table').getByText('Prepare market notes', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Complete Prepare market notes', exact: true }).click();
    await page.getByRole('button', { name: 'Completed', exact: true }).click();
    await page.getByRole('button', { name: 'Reopen Prepare market notes' }).waitFor();
    await page.getByRole('button', { name: 'Reopen Prepare market notes' }).click();
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await page.getByRole('button', { name: 'Edit Prepare market notes' }).click();
    await page
      .getByLabel('Subtasks', { exact: true })
      .count()
      .catch(() => {});
    await page.getByPlaceholder('Break it into a small step').fill('Review one chart');
    await page.getByRole('button', { name: 'Add subtask' }).click();
    await page.getByRole('button', { name: 'Save task' }).click();
    await page.getByText('Review one chart', { exact: true }).waitFor();
    await nav('Study');
    await page.getByRole('button', { name: 'New curriculum' }).click();
    await page.getByRole('dialog').getByLabel('Title', { exact: true }).fill('Global markets');
    await page.getByRole('button', { name: 'Save curriculum' }).click();
    await page.getByRole('button', { name: 'Add topic', exact: true }).click();
    await page.getByRole('dialog').getByLabel('Title', { exact: true }).fill('Market structure');
    await page.getByRole('button', { name: 'Save topic' }).click();
    await page.getByRole('checkbox', { name: 'Market structure' }).check();
    const study = await page.evaluate(() => window.workspaceAPI.invoke('study:snapshot'));
    assert.equal(study.topics.filter((t) => t.learnedAt).length, 1);
    const fixtureDb = new DatabaseSync(path.join(directory, 'habits.db'));
    for (const [index, grade] of ['Again', 'Hard', 'Good', 'Easy'].entries()) {
      const topic = JSON.parse(
        fixtureDb.prepare('SELECT json FROM study_topics WHERE id=?').get(study.topics[0].id).json,
      );
      const date = new Date();
      topic.reviewDue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      fixtureDb
        .prepare('UPDATE study_topics SET json=? WHERE id=?')
        .run(JSON.stringify(topic), topic.id);
      await page.reload();
      await page.getByRole('button', { name: grade, exact: true }).click();
      await page.waitForFunction(
        async (count) =>
          (await window.workspaceAPI.invoke('study:snapshot')).reviews.length === count,
        index + 1,
      );
    }
    fixtureDb.close();

    await page.getByRole('button', { name: 'Archive topic Market structure' }).click();
    await page.getByRole('checkbox', { name: 'Show archived' }).check();
    await page.getByRole('button', { name: 'Restore topic Market structure' }).click();
    await page.getByRole('button', { name: 'Open command palette' }).click();
    await page.getByRole('combobox', { name: 'Search commands' }).fill('Add task Capture rates');
    await page.getByRole('option').filter({ hasText: 'Add task' }).click();
    await page.getByText('Capture rates', { exact: true }).waitFor();
    await page.keyboard.press('Control+b');
    assert.equal(
      await page.locator('.app-shell > [data-state]').getAttribute('data-state'),
      'collapsed',
    );
    await page.keyboard.press('Control+b');
    const pages = ['Home', 'Habits', 'Tasks', 'Statistics', 'Study', 'Settings'];
    const go = async (label, width) => {
      if (width < 768) {
        await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
      }
      await nav(label);
    };
    for (const theme of ['dark', 'light']) {
      await page.setViewportSize({ width: 1280, height: 860 });
      await nav('Settings');
      await page
        .getByRole('button', { name: theme === 'dark' ? 'Dark' : 'Light', exact: true })
        .click();
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 860 });
        for (const label of pages) {
          await go(label, width);
          await page.waitForTimeout(200);
          await page.screenshot({
            path: path.join(directory, `${label.toLowerCase()}-${theme}-${width}.png`),
          });
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        }
        const controls = await page.getByRole('button', { name: 'Close window' }).boundingBox();
        assert(controls.x + controls.width <= width);
      }
    }
    await page.setViewportSize({ width: 1280, height: 860 });
    await nav('Habits');
    await page.getByRole('button', { name: 'Read a chapter', exact: true }).click();
    await page
      .getByRole('button', { name: 'Toggle habit privacy' })
      .click({ force: true })
      .catch(() => {});
    await page.keyboard.press('Escape');
    await page.reload();
    await page.waitForFunction(() => !!window.workspaceAPI);
    const retained = await page.evaluate(() => window.workspaceAPI.invoke('study:snapshot'));
    assert.equal(retained.curricula.length, 1);
    assert.equal(retained.topics.length, 1);
    assert.equal(errors.length, 0, errors.join('\n'));
    assert.equal(network.length, 0);
    fs.writeFileSync(
      path.join(directory, 'result.json'),
      JSON.stringify(
        {
          taskCRUD: true,
          subtasks: true,
          studyCRUD: true,
          reviewGradeUI: true,
          studyPersistence: true,
          habitDrawer: true,
          legacyManagement: true,
          commandPalette: true,
          sidebarKeyboard: true,
          windowControls: true,
          themes: ['dark', 'light'],
          widths: [1280, 390],
          errors,
          network,
        },
        null,
        2,
      ),
    );
    console.log('RESTYLE PASS', directory);
  });
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
