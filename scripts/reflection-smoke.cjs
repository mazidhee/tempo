const { withApp } = require('./electron-runtime.cjs');
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
(async () => {
  const name = 'reflection-' + Date.now();
  let expected;
  await withApp(name, async ({ page, nav, directory, errors }) => {
    await page.waitForFunction(() => !!window.workspaceAPI);
    expected = await page.evaluate(async () => {
      const day = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();
      const habit = await window.habitAPI.addHabit({
        name: 'Private fixture habit',
        frequency: 'daily',
        time_of_day: 'morning',
      });
      const curriculum = await window.workspaceAPI.invoke('study:saveCurriculum', {
        title: 'Economics',
        description: 'Isolated fixture',
      });
      const topic = await window.workspaceAPI.invoke('study:saveTopic', {
        curriculumId: curriculum.id,
        title: 'Government bonds',
      });
      await window.workspaceAPI.invoke('study:learn', { id: topic.id, learned: true });
      await window.workspaceAPI.invoke('plan:save', {
        date: day,
        priorities: [
          {
            id: 'habit-priority',
            kind: 'habit',
            linkId: String(habit.id),
            title: habit.name,
            done: false,
          },
        ],
        studyTopicIds: [topic.id],
      });
      return { day, habitId: habit.id, topicId: topic.id };
    });
    await nav('Plan');
    await page.getByRole('heading', { name: 'Daily plan', exact: true }).waitFor();
    await page.getByLabel('Priority title').fill('Prepare a market view');
    await page.getByRole('button', { name: 'Add priority', exact: true }).click();
    await page
      .getByLabel('A sentence about your day')
      .fill('Studied government bonds and prepared a market view.');
    await page.getByLabel('Sleep hours (optional)').fill('7.5');
    await page.getByLabel('Energy (optional)').selectOption('4');
    await page.getByRole('checkbox', { name: 'Private fixture habit habit' }).check();
    await page.getByRole('button', { name: 'Save evening reflection' }).click();
    await page.waitForFunction(() => document.body.innerText.includes('Evening review saved'));
    await page.getByRole('button', { name: 'Toggle habit privacy' }).click();
    const privacy = await page.locator('.reflection-page').innerText();
    assert(!privacy.includes('Private fixture habit'));
    const options = await page.locator('.reflection-page option').allTextContents();
    assert(!options.some((t) => t.includes('Private fixture habit')));
    await page.getByRole('button', { name: 'Toggle habit privacy' }).click();
    await page
      .getByRole('navigation', { name: 'Reflection navigation' })
      .getByRole('link', { name: 'Journal', exact: true })
      .click();
    await page.getByLabel('Search journal').fill('bonds');
    await page
      .getByText('Studied government bonds and prepared a market view.', { exact: true })
      .waitFor();
    await nav('Goals');
    await page.getByLabel('Goal title').fill('Complete three tasks');
    await page.getByLabel('Task target').fill('3');
    await page.getByRole('button', { name: 'Save goal' }).click();
    await page.getByRole('heading', { name: 'Complete three tasks', exact: true }).waitFor();
    await nav('Review');
    await page.getByRole('button', { name: /Open week of/ }).click();
    await page.getByLabel('One change for next week').fill('Begin with a short reading session.');
    await page.getByRole('button', { name: 'Save reflections' }).click();
    await page
      .getByLabel('One change for next week')
      .fill('Carry a saved and refreshed market view.');
    await page.getByRole('button', { name: 'Refresh activity snapshot' }).click();
    const snapshot = await page.evaluate(() => window.workspaceAPI.invoke('plan:snapshot'));
    assert.equal(snapshot.plans[0].evening.sleep, 7.5);
    assert.equal(snapshot.goals.length, 1);
    assert(snapshot.reviews.some((r) => r.change === 'Carry a saved and refreshed market view.'));
    if (!process.env.REFLECTION_FUNCTIONAL_ONLY)
      for (const theme of ['Dark', 'Light']) {
        await nav('Settings');
        await page.getByRole('button', { name: theme, exact: true }).click();
        for (const width of [1280, 760]) {
          await page.setViewportSize({ width, height: 860 });
          for (const label of ['Plan', 'Goals', 'Review']) {
            await nav(label);
            await page.screenshot({
              path: path.join(
                directory,
                `${label.toLowerCase()}-${theme.toLowerCase()}-${width}.png`,
              ),
            });
          }
          await page
            .getByRole('navigation', { name: 'Reflection navigation' })
            .getByRole('link', { name: 'Journal', exact: true })
            .click();
          await page.screenshot({
            path: path.join(directory, `journal-${theme.toLowerCase()}-${width}.png`),
          });
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        }
      }
    assert.equal(errors.length, 0);
    fs.writeFileSync(
      path.join(directory, 'result.json'),
      JSON.stringify(
        { plan: true, journalFTS: true, goals: true, weeklyReview: true, privacy: true, errors },
        null,
        2,
      ),
    );
    console.log('REFLECTION UI PASS', directory);
  });
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await withApp(name, async ({ page, errors }) => {
    const snapshot = await page.evaluate(() => window.workspaceAPI.invoke('plan:snapshot'));
    assert.equal(snapshot.plans.find((p) => p.date === expected.day).evening.sleep, 7.5);
    assert.equal(
      snapshot.journal.find((j) => j.date === expected.day).text,
      'Studied government bonds and prepared a market view.',
    );
    assert.equal(snapshot.goals.length, 1);
    assert(snapshot.reviews.some((r) => r.change === 'Carry a saved and refreshed market view.'));
    assert.equal(errors.length, 0);
    console.log('REFLECTION RESTART PASS');
  });
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
