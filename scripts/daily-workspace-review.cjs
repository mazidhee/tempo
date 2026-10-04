const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { withApp } = require('./electron-runtime.cjs');
const reviewApp = (name, fn) =>
  withApp(name, fn, process.env.REVIEW_EXE || 'node_modules/electron/dist/electron.exe');
const name = process.env.REVIEW_RUN || `daily-workspace-review-${Date.now()}`;
const evidence = path.resolve('.review', name);
fs.mkdirSync(evidence, { recursive: true });
const results = [];
const invoke = (p, channel, input) =>
  p.evaluate(({ channel, input }) => window.workspaceAPI.invoke(channel, input), {
    channel,
    input,
  });
const reflect = (p) => invoke(p, 'plan:snapshot');
const focus = (p) => invoke(p, 'focus:snapshot');
async function until(fn, message) {
  for (let i = 0; i < 90; i++) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error(message);
}
async function check(label, fn) {
  try {
    await fn();
    results.push({ label, passed: true });
  } catch (e) {
    results.push({ label, passed: false, error: e.stack });
    console.log('FAIL', label, e.message);
    if (activePage) {
      await activePage.keyboard.press('Escape').catch(() => {});
    }
  }
}
async function shot(p, label) {
  await p.locator('main').evaluate((e) => (e.scrollTop = 0));
  await p.screenshot({ path: path.join(evidence, label + '.png') });
  const l = await p.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    main: document.querySelector('main')?.getBoundingClientRect().width,
  }));
  fs.writeFileSync(path.join(evidence, label + '.json'), JSON.stringify(l));
  assert.ok(l.scroll <= l.width, `${label} overflows ${l.scroll}/${l.width}`);
}
let today, tomorrow, backup, study;
let activePage;
async function appearance(p, theme) {
  await p.evaluate(async (theme) => {
    const s = await window.habitAPI.getProductivity();
    await window.habitAPI.saveProductivity({
      ...s,
      settings: { ...s.settings, theme, themePalette: 'graphite' },
    });
  }, theme);
  await p.reload();
  await p.waitForTimeout(400);
}
(async () => {
  await reviewApp(name, async ({ page: p, nav, errors }) => {
    activePage = p;
    today = await p.evaluate(() => new Date().toLocaleDateString('en-CA'));
    tomorrow = await p.evaluate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toLocaleDateString('en-CA');
    });
    await invoke(p, 'study:importOutlines', [
      {
        title: 'Software engineering',
        markdown:
          '# Software engineering\n## Python\n- [ ] Functions\n  - [ ] Return values\n- [ ] Classes\n',
      },
      { title: 'Mathematics', markdown: '# Mathematics\n## Numbers\n- [ ] Fractions\n' },
    ]);
    study = await invoke(p, 'study:snapshot');
    await check(
      'Daily Plan: twelve inline priorities, completion, edit, reorder, autosave, evening',
      async () => {
        await nav('Plan');
        for (let i = 1; i <= 12; i++) {
          await p
            .getByRole('textbox', { name: 'Priority title', exact: true })
            .fill(`Priority ${i}`);
          await p.getByRole('textbox', { name: 'Priority title', exact: true }).press('Enter');
        }
        await until(
          async () =>
            (await reflect(p)).plans.find((x) => x.date === today)?.priorities.length === 12,
          '12 priorities not saved',
        );
        for (let i = 1; i <= 4; i++)
          await p.getByRole('checkbox', { name: `Priority ${i}`, exact: true }).check();
        await p.getByRole('button', { name: 'Edit Priority 5', exact: true }).click();
        await p.getByRole('textbox', { name: 'Edit priority title' }).fill('A refined priority');
        await p.getByRole('textbox', { name: 'Edit priority title' }).press('Enter');
        await p.getByRole('button', { name: 'Move Priority 12 up', exact: true }).click();
        await until(async () => {
          const a = (await reflect(p)).plans.find((x) => x.date === today)?.priorities;
          return a?.[10].title === 'Priority 12' && a.filter((x) => x.done).length === 4;
        }, 'edits/order/completion not saved');
        await p.locator('.daily-plan-evening summary').click();
        await p.getByLabel('Sleep hours (optional)').fill('7.5');
        await p.getByRole('button', { name: 'Save evening reflection', exact: true }).click();
        await until(
          async () => !!(await reflect(p)).plans.find((x) => x.date === today)?.evening.completedAt,
          '4 completed priorities could not save evening',
        );
        await shot(p, 'plan-desktop');
      },
    );
    await check('Immediate date switch flushes last edit and retains separate day', async () => {
      await nav('Plan');
      await p
        .getByRole('textbox', { name: 'Priority title', exact: true })
        .fill('Save on date switch');
      await p.getByRole('textbox', { name: 'Priority title', exact: true }).press('Enter');
      await p.getByRole('button', { name: 'Next plan day', exact: true }).click();
      await p.getByRole('textbox', { name: 'Priority title', exact: true }).fill('Tomorrow focus');
      await p.getByRole('textbox', { name: 'Priority title', exact: true }).press('Enter');
      await p.getByRole('button', { name: 'Today', exact: true }).click();
      await until(async () => {
        const s = await reflect(p);
        return (
          s.plans.find((x) => x.date === today)?.priorities.length === 13 &&
          s.plans.find((x) => x.date === tomorrow)?.priorities[0].title === 'Tomorrow focus'
        );
      }, 'date switching lost priorities');
    });
    await check(
      'Shared picker: query, empty, keyboard select, Esc focus restore; bounded study list',
      async () => {
        await nav('Plan');
        await p.getByRole('button', { name: 'Add study topic', exact: true }).click();
        await p
          .getByRole('combobox', { name: 'Search add study topic' })
          .fill('unfindable-topic-z');
        await p.getByText('No matches. Try another word or collection.').waitFor();
        await p.getByRole('combobox', { name: 'Search add study topic' }).fill('Return values');
        await shot(p, 'search-desktop');
        await p.getByRole('combobox', { name: 'Search add study topic' }).press('ArrowDown');
        await p.getByRole('combobox', { name: 'Search add study topic' }).press('Enter');
        await until(
          async () =>
            (await reflect(p)).plans.find((x) => x.date === today)?.studyTopicIds.length === 1,
          'study selection failed',
        );
        assert.equal(await p.locator('.daily-study-row').count(), 1);
        await p.getByRole('button', { name: 'Link a priority', exact: true }).click();
        await p.keyboard.press('Escape');
        assert.equal(
          await p
            .getByRole('button', { name: 'Link a priority', exact: true })
            .evaluate((e) => e === document.activeElement),
          true,
        );
      },
    );
    await check(
      'Task views, detailed creation, subtask completion, edit, completion/reopen/delete',
      async () => {
        await nav('Tasks');
        await p.getByRole('textbox', { name: 'Quick add task' }).fill('Morning reading');
        await p.getByRole('textbox', { name: 'Quick add task' }).press('Enter');
        await p.getByRole('button', { name: 'New task', exact: true }).click();
        let d = p.getByRole('dialog');
        await d.getByLabel('Title', { exact: true }).fill('Build a small tool');
        await d.getByLabel('Due date', { exact: true }).fill(tomorrow);
        await d.locator('select').first().selectOption('high');
        await d.getByLabel('Project', { exact: true }).fill('Software engineering');
        await d.getByLabel(/Tags/).fill('python, practice');
        await d.getByLabel('Subtasks', { exact: true }).fill('Write tests');
        await d.getByLabel('Subtasks', { exact: true }).press('Enter');
        await d.getByRole('button', { name: 'Save task', exact: true }).click();
        await p.getByRole('button', { name: 'Upcoming', exact: true }).click();
        await p.getByRole('button', { name: 'Build a small tool', exact: true }).waitFor();
        await p.locator('.task-steps summary').click();
        await p.getByLabel('Write tests', { exact: true }).check();
        await p.getByRole('button', { name: 'Edit Build a small tool', exact: true }).click();
        d = p.getByRole('dialog');
        await d.getByLabel('Title', { exact: true }).fill('Build a useful tool');
        await d.getByRole('button', { name: 'Save task', exact: true }).click();
        await p.getByRole('button', { name: 'Complete Build a useful tool', exact: true }).click();
        await p.getByRole('button', { name: 'Completed', exact: true }).click();
        await p.getByRole('button', { name: 'Reopen Build a useful tool', exact: true }).click();
        await p.getByRole('button', { name: 'All', exact: true }).click();
        await shot(p, 'tasks-desktop');
        await p.getByRole('button', { name: 'Delete Build a useful tool', exact: true }).click();
        await p.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
        assert.equal(
          await p.getByRole('button', { name: 'Build a useful tool', exact: true }).count(),
          1,
        );
        await p.getByRole('button', { name: 'Delete Morning reading', exact: true }).click();
        await p
          .getByRole('dialog')
          .getByRole('button', { name: 'Delete task', exact: true })
          .click();
        assert.equal(
          await p.getByRole('button', { name: 'Morning reading', exact: true }).count(),
          0,
        );
      },
    );
    await check('Task focus resumes identical link without resetting an active timer', async () => {
      await nav('Tasks');
      await p.getByRole('button', { name: 'All', exact: true }).click();
      await p
        .getByRole('button', { name: 'Start focus session for Build a useful tool', exact: true })
        .click();
      await until(
        async () => !!(await focus(p)).productivity.timer.deadline,
        'task timer not started',
      );
      const before = (await focus(p)).productivity.timer;
      await nav('Tasks');
      await p.getByRole('button', { name: 'All', exact: true }).click();
      await p
        .getByRole('button', { name: 'Start focus session for Build a useful tool', exact: true })
        .click();
      const after = (await focus(p)).productivity.timer;
      assert.equal(after.runId, before.runId);
      assert.equal(after.deadline, before.deadline);
      await p.getByRole('button', { name: 'Pause', exact: true }).click();
      await until(async () => !(await focus(p)).productivity.timer.deadline, 'pause not persisted');
    });
    await check(
      'Journal formatting, outline, autosave, full-page writing mode and Esc',
      async () => {
        await nav('Journal');
        const editor = p.getByRole('textbox', { name: 'Daily journal', exact: true }).first();
        await editor
          .locator('.outline-content p')
          .first()
          .click({ position: { x: 3, y: 8 } });
        await p.keyboard.type('What I learned today');
        await p.keyboard.press('Enter');
        await p.keyboard.press('Tab');
        await p.keyboard.type('A nested idea');
        await p.getByRole('button', { name: 'Bold', exact: true }).first().click();
        await p.keyboard.type(' bold thought');
        await p.keyboard.press('Control+s');
        await until(
          async () =>
            (await reflect(p)).journal.find((x) => x.date === today)?.text.includes('nested idea'),
          'journal text not saved',
        );
        await shot(p, 'journal-desktop');
        await p.getByRole('button', { name: 'Writing mode', exact: true }).click();
        await until(
          async () => !(await p.getByRole('navigation', { name: 'Main navigation' }).isVisible()),
          'Writing mode left sidebar visible',
        );
        await shot(p, 'journal-writing-mode');
        await p.keyboard.press('Escape');
        await until(
          async () => await p.getByRole('navigation', { name: 'Main navigation' }).isVisible(),
          'Esc did not restore sidebar',
        );
      },
    );
    await check(
      'Review seven-day line trend is truthful and saved; legacy totals and reflections retained',
      async () => {
        const end = Date.now() - 3600000;
        const child = study.topics.find((x) => x.title === 'Return values');
        await invoke(p, 'focus:saveSession', {
          startedAt: new Date(end - 3600000).toISOString(),
          endedAt: new Date(end).toISOString(),
          link: {
            type: 'study',
            id: child.id,
            name: child.title,
            curriculumId: child.curriculumId,
          },
          note: 'Reviewer study hour',
        });
        await nav('Review');
        await p.getByRole('button', { name: 'Browse weeks', exact: true }).click();
        await p.getByRole('button', { name: 'Open week', exact: true }).click();
        await p.getByRole('img', { name: /Daily focus hours/ }).waitFor();
        const chart = await p
          .getByRole('img', { name: /Daily focus hours/ })
          .getAttribute('aria-label');
        assert.ok(chart.includes('1.00 hours'));
        let saved = (await reflect(p)).reviews.find((r) => r.start <= today && r.end >= today);
        assert.equal(saved.summary.focus.daily.length, 7);
        assert.equal(saved.summary.focus.daily[0].date, saved.start);
        assert.equal(saved.summary.focus.daily[6].date, saved.end);
        assert.equal(
          saved.summary.focus.daily
            .filter((r) => r.date <= today)
            .reduce((sum, r) => sum + r.seconds, 0),
          saved.summary.focus.seconds,
        );
        assert.ok(
          saved.summary.focus.daily.filter((r) => r.date > today).every((r) => r.seconds === null),
        );
        assert.ok(saved.summary.focus.daily.some((r) => r.seconds === 0));
        await p.getByText('Daily values', { exact: true }).click();
        await shot(p, 'review-daily-values');
        await p.getByText('Daily values', { exact: true }).click();
        // A manual session crosses midnight. Preserve the engine's recorded-date semantics,
        // rather than inventing active intervals that paused timers do not store.
        const started = new Date(today + 'T00:00:00');
        started.setMinutes(-30);
        const ended = new Date(started.getTime() + 3600000);
        await invoke(p, 'focus:saveSession', {
          startedAt: started.toISOString(),
          endedAt: ended.toISOString(),
          link: null,
          note: 'Reviewer midnight session',
        });
        const unchanged = await invoke(p, 'review:generate', { date: today });
        assert.deepEqual(unchanged.summary.focus.daily, saved.summary.focus.daily);
        const refreshed = await invoke(p, 'review:generate', { date: today, refresh: true });
        const recording = (await reflect(p)).source.productivity.sessions.find(
          (s) => s.note === 'Reviewer midnight session',
        );
        assert.ok(recording, 'midnight session missing');
        assert.equal(
          refreshed.summary.focus.daily.find((r) => r.date === recording.date).seconds -
            saved.summary.focus.daily.find((r) => r.date === recording.date).seconds,
          recording.duration,
        );
        await p.getByLabel('What got in the way?').fill('Too many context switches');
        await p.getByLabel('One change for next week').fill('Begin with one topic');
        await p.getByRole('button', { name: 'Save reflections', exact: true }).click();
        await p.getByRole('button', { name: 'Refresh activity snapshot', exact: true }).click();
        await until(
          async () =>
            (await reflect(p)).reviews.some((x) => x.obstacle === 'Too many context switches'),
          'reflection missing',
        );
        await shot(p, 'review-desktop');
        await p.getByRole('button', { name: 'Previous review week', exact: true }).click();
        await p.getByRole('button', { name: 'Next review week', exact: true }).click();
        await until(
          async () =>
            (await p.getByLabel('What got in the way?').inputValue()) ===
            'Too many context switches',
          'week navigation lost reflection',
        );
        const legacyBackup = await p.evaluate(() => window.habitAPI.exportBackup());
        const legacyReview = structuredClone(
          legacyBackup.modules.reflection.reviews.find((r) => r.start <= today && r.end >= today),
        );
        const shift = (date) => {
          const value = new Date(date + 'T12:00:00');
          value.setDate(value.getDate() - 14);
          return value.toLocaleDateString('en-CA');
        };
        legacyReview.start = shift(legacyReview.start);
        legacyReview.end = shift(legacyReview.end);
        const legacySeconds = legacyReview.summary.focus.seconds;
        legacyReview.summary.focus.daily = null;
        legacyBackup.modules.reflection.reviews.push(legacyReview);
        await p.evaluate((b) => window.habitAPI.importBackup(b), legacyBackup);
        await p.reload();
        await nav('Review');
        await p.getByRole('button', { name: 'Browse weeks', exact: true }).click();
        await p.getByLabel('Saved review week').selectOption(legacyReview.start);
        await p
          .getByText('This saved review has totals only. Update activity to see its daily trend.', {
            exact: true,
          })
          .waitFor();
        assert.equal(await p.getByRole('img', { name: /Daily focus hours/ }).count(), 0);
        assert.equal(
          (await reflect(p)).reviews.find((r) => r.start === legacyReview.start).summary.focus
            .seconds,
          legacySeconds,
        );
        await shot(p, 'review-legacy-totals');
        await p.getByRole('button', { name: 'Update activity', exact: true }).click();
        await p.getByRole('img', { name: /Daily focus hours/ }).waitFor();
        assert.equal(
          await p.getByLabel('What got in the way?').inputValue(),
          'Too many context switches',
        );
        await p.getByRole('button', { name: 'Browse weeks', exact: true }).click();
        await p.getByLabel('Saved review week').selectOption(saved.start);
      },
    );
    await check('Goals creation, linking, edit, archive, restore', async () => {
      await nav('Goals');
      await p.getByRole('button', { name: 'New goal', exact: true }).click();
      let d = p.getByRole('dialog');
      await d.getByLabel('Goal title', { exact: true }).fill('Complete three tools');
      await d.getByLabel('Task target', { exact: true }).fill('3');
      await d.getByRole('button', { name: 'Save goal', exact: true }).click();
      await p.getByRole('heading', { name: 'Complete three tools', exact: true }).waitFor();
      await p.getByRole('button', { name: 'Edit', exact: true }).click();
      d = p.getByRole('dialog');
      await d.getByLabel('Goal title', { exact: true }).fill('Build three tools');
      await d.getByRole('button', { name: 'Save goal', exact: true }).click();
      await p.getByRole('button', { name: 'Archive', exact: true }).click();
      await p.getByRole('button', { name: 'Show archived goals', exact: true }).click();
      await p.getByRole('button', { name: 'Restore', exact: true }).click();
      await p.getByRole('heading', { name: 'Build three tools', exact: true }).waitFor();
      await shot(p, 'goals-desktop');
      await p.getByRole('button', { name: 'New goal', exact: true }).click();
      d = p.getByRole('dialog');
      await d.getByLabel('Goal title', { exact: true }).fill('Python confidence');
      await d.locator('select').first().selectOption('chapter');
      await d.getByRole('button', { name: 'Linked goal record', exact: true }).click();
      await p.getByRole('combobox', { name: 'Search linked goal record' }).fill('Return values');
      await p.getByRole('option', { name: /Return values/ }).click();
      await p.getByRole('dialog').getByRole('button', { name: 'Save goal', exact: true }).click();
    });
    await check(
      'All four goal types retain links; privacy masks picker and reflections',
      async () => {
        const habit = await p.evaluate(() =>
          window.habitAPI.addHabit({
            name: 'Reviewer private habit',
            frequency: 'daily',
            time_of_day: 'anytime',
          }),
        );
        await nav('Goals');
        await p.getByRole('button', { name: 'New goal', exact: true }).click();
        let d = p.getByRole('dialog');
        await d.getByLabel('Goal title', { exact: true }).fill('Keep a rhythm');
        await d.locator('select').first().selectOption('habit');
        await d.getByRole('button', { name: 'Linked goal record', exact: true }).click();
        await p.getByRole('option', { name: /Reviewer private habit/ }).click();
        await p.getByRole('dialog').getByRole('button', { name: 'Save goal', exact: true }).click();
        await p.getByRole('button', { name: 'New goal', exact: true }).click();
        d = p.getByRole('dialog');
        await d.getByLabel('Goal title', { exact: true }).fill('Five focused hours');
        await d.locator('select').first().selectOption('focus');
        assert.equal(
          await d.getByLabel('Target hours', { exact: true }).evaluate((e) => e.validity.valid),
          true,
          'Default focus hours must be valid',
        );
        await d.getByLabel('Target hours', { exact: true }).fill('1.37');
        await d.locator('select').nth(1).selectOption('curriculum');
        await d.getByRole('button', { name: 'Linked goal record', exact: true }).click();
        await p.getByRole('option', { name: /Software engineering/ }).click();
        await p.getByRole('dialog').getByRole('button', { name: 'Save goal', exact: true }).click();
        await until(
          async () => new Set((await reflect(p)).goals.map((g) => g.kind)).size === 4,
          'four goal types not saved',
        );
        await nav('Review');
        await p.keyboard.press('Control+Shift+P');
        assert.equal(await p.getByLabel('What got in the way?').inputValue(), 'Private reflection');
        await nav('Plan');
        await p.getByRole('button', { name: 'Link a priority', exact: true }).click();
        await p
          .getByRole('combobox', { name: 'Search link a priority' })
          .fill('Reviewer private habit');
        await p.getByText('No matches. Try another word or collection.').waitFor();
        await p.getByRole('combobox', { name: 'Search link a priority' }).fill('Private habit');
        await p.getByRole('option', { name: /Private habit/ }).waitFor();
        await shot(p, 'privacy-search');
        await p.keyboard.press('Escape');
        await p.keyboard.press('Control+Shift+P');
      },
    );
    await check(
      'All updated screens in light/dark and 390px with global keyboard search',
      async () => {
        for (const theme of ['light', 'dark']) {
          await appearance(p, theme);
          for (const width of [1280, 390]) {
            await p.setViewportSize({ width, height: 860 });
            for (const label of ['Plan', 'Tasks', 'Journal', 'Review', 'Goals']) {
              if (
                !(await p
                  .getByRole('navigation', { name: 'Main navigation' })
                  .getByRole('link', { name: label, exact: true })
                  .isVisible())
              )
                await p.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
              await nav(label);
              await shot(p, `${label.toLowerCase()}-${theme}-${width}`);
            }
            await p.keyboard.press('Control+k');
            await shot(p, `command-${theme}-${width}`);
            await p.keyboard.press('Escape');
          }
        }
        await p.setViewportSize({ width: 1280, height: 860 });
      },
    );
    await check(
      'Backup validates and retains >3 plans, rich journal, goals and study',
      async () => {
        backup = await p.evaluate(() => window.habitAPI.exportBackup());
        assert.equal(
          backup.modules.reflection.plans.find((x) => x.date === today).priorities.length,
          13,
        );
        await p.evaluate((b) => window.habitAPI.importBackup(b), backup);
        assert.equal((await reflect(p)).plans.find((x) => x.date === today).priorities.length, 13);
      },
    );
    await check('No renderer errors', async () => assert.deepEqual(errors, []));
  });
  await reviewApp(name, async ({ page: p, nav, errors }) => {
    await check(
      'Full process restart persists expanded Plan, journal, goal, tasks and imports',
      async () => {
        const s = await reflect(p);
        assert.equal(s.plans.find((x) => x.date === today).priorities.length, 13);
        assert.ok(s.journal.find((x) => x.date === today).text.includes('nested idea'));
        assert.ok(s.goals.some((x) => x.title === 'Build three tools'));
        assert.ok(s.source.productivity.tasks.some((x) => x.title === 'Build a useful tool'));
        assert.equal(s.source.study.curricula.length, 2);
        await nav('Plan');
        await shot(p, 'plan-restart');
        assert.deepEqual(errors, []);
      },
    );
  });
  fs.writeFileSync(path.join(evidence, 'results.json'), JSON.stringify({ name, results }, null, 2));
  console.log(JSON.stringify({ name, results }, null, 2));
  if (results.some((x) => !x.passed)) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
