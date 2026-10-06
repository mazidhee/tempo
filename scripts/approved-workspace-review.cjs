const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  _electron,
} = require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const name = process.env.REVIEW_RUN || `approved-workspace-${Date.now()}`;
const evidence = path.resolve('.review', name);
fs.mkdirSync(evidence, { recursive: true });
const results = [],
  captures = [],
  errors = [];
const invoke = (p, channel, payload) =>
  p.evaluate(({ channel, payload }) => window.workspaceAPI.invoke(channel, payload), {
    channel,
    payload,
  });
const prod = (p) => p.evaluate(() => window.habitAPI.getProductivity());
async function until(fn, message) {
  for (let i = 0; i < 80; i++) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error(message);
}
async function route(p, value) {
  await p.evaluate((value) => {
    location.hash = '#' + value;
  }, value);
  await p.waitForTimeout(250);
}
async function check(label, fn) {
  try {
    await fn();
    results.push({ label, passed: true });
  } catch (e) {
    results.push({ label, passed: false, error: e.stack });
    console.log('FAIL', label, e.message);
  }
}
async function withApp(fn) {
  const env = { ...process.env, HABIT_TRACKER_DATA_DIR: evidence };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.VITE_DEV_SERVER_URL;
  const executablePath =
    process.env.REVIEW_EXE || path.resolve('node_modules/electron/dist/electron.exe');
  const app = await _electron.launch({
    executablePath,
    args: process.env.REVIEW_EXE ? [] : ['.'],
    env,
    timeout: 30000,
  });
  try {
    const p = await app.firstWindow();
    p.setDefaultTimeout(7000);
    await p.waitForLoadState('domcontentloaded');
    await p.waitForTimeout(600);
    p.on('pageerror', (e) => errors.push(e.message));
    await fn(p);
  } finally {
    await app.close();
  }
}
(async () => {
  let today, habitIds, before, after;
  await withApp(async (p) => {
    if (!process.env.REVIEW_RECAPTURE) {
      const fixture = await p.evaluate(async () => {
        const today = new Date().toLocaleDateString('en-CA');
        const inputs = [
          { name: 'Read a chapter', habit_type: 'check', time_of_day: 'evening' },
          { name: 'Protect my routine', habit_type: 'avoid', time_of_day: 'anytime' },
          {
            name: 'Water',
            habit_type: 'quantity',
            quantity_target: 2000,
            quantity_unit: 'ml',
            time_of_day: 'morning',
          },
          { name: 'Practise a problem', habit_type: 'check', time_of_day: 'afternoon' },
        ];
        for (const h of inputs)
          await window.habitAPI.addHabit({
            ...h,
            frequency: 'daily',
            start_date: '2026-09-01',
            schedule_type: 'daily',
          });
        const all = await window.habitAPI.getHabits();
        const ids = inputs.map((h) => all.find((a) => a.name === h.name).id);
        await window.habitAPI.recordHabit({
          habitId: ids[1],
          logDate: today,
          action: 'slip',
          reason:
            'Fictional review note: an interrupted routine and a long explanation to check layout. '.repeat(
              8,
            ),
        });
        await window.habitAPI.importHabitEvents(
          ids[1],
          'Category,Event,Occurrence,Note\n"Habits","Relapsed","2026-09-25 10:00:00","Fictional entry"\n"Habits","Relapsed","2026-09-25 14:00:00",""',
        );
        const state = await window.habitAPI.getProductivity();
        const task = (id, title, boardStatus, due = '', extra = {}) => ({
          id,
          title,
          boardStatus,
          due,
          priority: 'medium',
          area: 'personal',
          project: '',
          tags: [],
          subtasks: [],
          createdAt: new Date().toISOString(),
          completedAt: null,
          ...extra,
        });
        await window.habitAPI.saveProductivity({
          ...state,
          tasks: [
            task('a', 'Check pipeline data quality', 'doing', today, {
              scheduledTime: '09:00',
              priority: 'high',
              project: 'Warehouse migration',
              area: 'work',
              workProjectId: 'warehouse',
            }),
            task('b', 'Prepare source documentation', 'next', today, {
              scheduledTime: '14:00',
              project: 'Reporting',
              area: 'work',
              workProjectId: 'reporting',
            }),
            task('c', 'Plan next week’s reading', 'inbox'),
            task(
              'd',
              'Investigate late-arriving records and review the production alert threshold',
              'next',
            ),
            task('e', 'Publish updated schema notes', 'doing'),
            task('f', 'Review staging tables', 'next', '', {
              completedAt: new Date().toISOString(),
            }),
          ],
          settings: {
            ...state.settings,
            taskCleanup: false,
            workProjects: [
              {
                id: 'warehouse',
                title: 'Warehouse migration',
                description: 'Reliable ingestion into the new warehouse.',
                archived: false,
                milestones: [
                  { id: 'm1', title: 'Validate source contracts', due: today, completedAt: null },
                  {
                    id: 'm2',
                    title: 'Prepare staging models',
                    due: '',
                    completedAt: new Date().toISOString(),
                  },
                ],
              },
              {
                id: 'reporting',
                title: 'Reporting',
                description: '',
                archived: false,
                milestones: [],
              },
            ],
          },
        });
        return { today, ids };
      });
      today = fixture.today;
      habitIds = fixture.ids;
      await invoke(p, 'study:importOutlines', [
        {
          title: 'Software engineering',
          markdown:
            '# Software engineering\n## Python\n- [ ] Functions\n  - [ ] Return values\n- [ ] Classes\n',
        },
        { title: 'Mathematics', markdown: '# Mathematics\n## Numbers\n- [ ] Fractions\n' },
      ]);
      const study = await invoke(p, 'study:snapshot');
      await invoke(p, 'study:saveCurriculum', {
        ...study.curricula[0],
        studyFocus: true,
        currentTopicId: study.topics.find((t) => t.title === 'Return values').id,
      });
      await invoke(p, 'study:learn', {
        id: study.topics.find((t) => t.title === 'Fractions').id,
        learned: true,
      });
      await invoke(p, 'goals:save', {
        title: 'Build a reliable pipeline',
        kind: 'tasks',
        linkType: 'all',
        linkId: '',
        start: today,
        deadline: '2026-12-31',
        target: 8,
        weeks: 1,
        archived: false,
      });
      await invoke(p, 'goals:save', {
        title: 'Keep learning',
        kind: 'focus',
        linkType: 'all',
        linkId: '',
        start: today,
        deadline: '2026-12-31',
        target: 12,
        weeks: 1,
        archived: false,
      });
      await invoke(p, 'journal:save', {
        date: today,
        text: 'A quieter working day.\n\nKeep attention on the next useful step.',
      });
      await invoke(p, 'review:generate', { date: today });
      await invoke(p, 'plan:save', {
        date: today,
        priorities: [
          {
            id: 'free-1',
            kind: 'free',
            linkId: null,
            title: 'Read outside for a little while',
            done: false,
          },
        ],
        studyTopicIds: [],
      });
      await p.reload();
      await p.waitForTimeout(500);
      before = await p.evaluate(() => window.habitAPI.exportBackup());
      await check(
        'Tasks: keyboard move persists and canonical completion agrees with Plan',
        async () => {
          await route(p, '/tasks');
          await p
            .getByRole('combobox', { name: 'Move Check pipeline data quality', exact: true })
            .selectOption('next');
          await until(
            async () => (await prod(p)).tasks.find((t) => t.id === 'a').boardStatus === 'next',
            'Board move not persisted',
          );
          await route(p, '/plan');
          await p
            .getByRole('button', { name: 'Complete task Check pipeline data quality', exact: true })
            .click();
          await until(
            async () => !!(await prod(p)).tasks.find((t) => t.id === 'a').completedAt,
            'Plan completion not persisted',
          );
          await route(p, '/tasks');
          await p
            .locator('.board-lane')
            .filter({ has: p.getByRole('heading', { name: 'Done', exact: true }) })
            .getByRole('button', { name: 'Check pipeline data quality', exact: true })
            .waitFor();
          await p
            .getByRole('button', { name: 'Reopen task Check pipeline data quality', exact: true })
            .click();
        },
      );
      await check('Tasks: scheduled time saved in form and visible in daily queue', async () => {
        await route(p, '/tasks');
        await p.getByRole('button', { name: 'Check pipeline data quality', exact: true }).click();
        await p.getByLabel('Scheduled time', { exact: true }).fill('10:30');
        await p.getByRole('button', { name: 'Save task', exact: true }).click();
        await until(
          async () => (await prod(p)).tasks.find((t) => t.id === 'a').scheduledTime === '10:30',
          'Time not persisted',
        );
        await route(p, '/plan');
        assert.equal(
          await p.getByLabel('Time for Check pipeline data quality', { exact: true }).inputValue(),
          '10:30',
        );
      });
      await check('Plan: more than three priorities autosave; no evening form', async () => {
        await route(p, '/plan');
        for (let i = 1; i <= 4; i++) {
          await p
            .getByRole('textbox', { name: 'Priority title', exact: true })
            .fill('Additional priority ' + i);
          await p.getByRole('textbox', { name: 'Priority title', exact: true }).press('Enter');
        }
        await until(
          async () =>
            (await invoke(p, 'plan:snapshot')).plans.find((v) => v.date === today)?.priorities
              .length === 5,
          'Five priorities not saved',
        );
        assert.equal(await p.getByText('When the day winds down', { exact: true }).count(), 0);
      });
      await check(
        'Habits: all periods visible; check-in, slip reason, quantity and deletion available',
        async () => {
          await route(p, '/habits');
          for (const id of habitIds)
            assert.equal(await p.locator(`[data-habit-id="${id}"]`).isVisible(), true);
          await p
            .getByRole('button', { name: 'Complete habit Read a chapter', exact: true })
            .click();
          await p.getByRole('link', { name: /Read a chapter: current streak 1/ }).waitFor();
          const row = p.locator(`[data-habit-id="${habitIds[1]}"]`);
          await row.getByRole('button', { name: 'Slip logged · View reason', exact: true }).click();
          assert.ok(await row.locator('.habit-expanded-slip').isVisible());
          await row.getByRole('button', { name: 'Edit slip reason', exact: true }).click();
          assert.ok(
            (
              await p.getByRole('textbox', { name: 'Slip reason', exact: true }).inputValue()
            ).startsWith('Fictional review'),
          );
          await p.keyboard.press('Escape');
          const water = p.locator(`[data-habit-id="${habitIds[2]}"]`);
          await water.getByRole('button', { name: 'Add 500 ml', exact: true }).click();
          await until(
            async () =>
              (await p.evaluate((id) => window.habitAPI.getLogsByHabit(id), habitIds[2]))[0]
                ?.quantity === 500,
            'Quantity not saved',
          );
          await water.getByRole('button', { name: 'Habit options', exact: true }).click();
          await p.getByRole('menuitem', { name: 'Delete habit…', exact: true }).waitFor();
          await p.keyboard.press('Escape');
        },
      );
      await check(
        'Focus: saved preset buttons configure actual main timer and lock during a phase',
        async () => {
          await route(p, '/focus');
          await p.getByRole('button', { name: 'Deep work: 50 min focus', exact: true }).click();
          await until(
            async () => (await prod(p)).timer.duration === 3000,
            '50-minute timer not applied',
          );
          await p.getByRole('button', { name: 'Quick reset: 15 min focus', exact: true }).click();
          await until(
            async () => (await prod(p)).timer.duration === 900,
            '15-minute timer not applied',
          );
          await p.getByLabel('Timer phase', { exact: true }).selectOption('short');
          await until(
            async () => (await prod(p)).timer.phase === 'short',
            'Short break not applied',
          );
          await p.getByLabel('Timer phase', { exact: true }).selectOption('long');
          await until(async () => (await prod(p)).timer.phase === 'long', 'Long break not applied');
          await p.getByLabel('Timer phase', { exact: true }).selectOption('focus');
          await p.getByRole('button', { name: 'Time tracking', exact: true }).click();
          await until(async () => !!(await prod(p)).timer.stopwatch, 'Tracking not applied');
          await p.getByRole('button', { name: 'Pomodoro', exact: true }).click();
          await until(async () => !(await prod(p)).timer.stopwatch, 'Pomodoro not restored');
          await p.getByRole('button', { name: 'Start focus', exact: true }).click();
          await p.getByRole('button', { name: 'Pause', exact: true }).waitFor();
          assert.equal(
            await p
              .getByRole('button', { name: 'Deep work: 50 min focus', exact: true })
              .isDisabled(),
            true,
          );
          assert.equal(await p.getByLabel('Timer phase', { exact: true }).isDisabled(), true);
          await invoke(p, 'focus:command', { action: 'stop' });
        },
      );
      await check('Journal: open canvas edits autosave without writing mode', async () => {
        await route(p, '/journal');
        const writer = p.getByRole('textbox', { name: 'Daily journal', exact: true }).first();
        await writer.click();
        await p.keyboard.press('Control+End');
        await p.keyboard.press('Enter');
        await p.keyboard.type('A saved thought from the open canvas.');
        await until(
          async () =>
            (await invoke(p, 'plan:snapshot')).journal
              .find((j) => j.date === today)
              ?.text.includes('A saved thought from the open canvas.'),
          'Journal not saved',
        );
      });
      await check(
        'Study: topic counts, current topic and progress retained; dedicated curriculum opens',
        async () => {
          await route(p, '/study');
          assert.ok(
            (await p.locator('.study-library-row').first().innerText()).includes('Return values'),
          );
          assert.equal(await p.locator('.study-library-progress').count(), 2);
          await p.locator('.study-library-row').first().click();
          await p.getByRole('button', { name: 'Continue studying', exact: true }).waitFor();
        },
      );
      await check(
        'History: comparison uses original timestamped events and separates them from daily logs',
        async () => {
          await route(p, '/history');
          await p
            .getByRole('combobox', { name: 'History metric', exact: true })
            .selectOption('events');
          assert.ok(
            (await p.locator('.history-period-totals').innerText()).includes('2 this period'),
          );
          assert.equal(await p.locator('.history-event-row').count(), 2);
        },
      );
      await check('Search: top sidebar trigger, keyboard selection and dismissal', async () => {
        await p.keyboard.press('Control+k');
        await p.getByRole('dialog', { name: 'Search workspace', exact: true }).waitFor();
        await p.getByRole('combobox').fill('Goals');
        await p.keyboard.press('Enter');
        await p.getByRole('heading', { name: 'Goals', exact: true }).waitFor();
      });
      await check(
        'Work: project table opens project with original milestones and scoped task board',
        async () => {
          await route(p, '/work');
          const type = await p.locator('.work-header h1').evaluate((el) => ({
            family: getComputedStyle(el).fontFamily,
            bodyFamily: getComputedStyle(document.documentElement).fontFamily,
            weight: getComputedStyle(el).fontWeight,
          }));
          assert.equal(type.family, type.bodyFamily);
          assert.equal(type.weight, '600');
          await p.getByRole('button', { name: 'Warehouse migration', exact: true }).click();
          await p
            .getByRole('button', {
              name: 'Complete milestone Validate source contracts',
              exact: true,
            })
            .waitFor();
          await p.getByRole('link', { name: 'Add or manage tasks', exact: false }).click();
          await p.locator('.board-card').first().waitFor();
          assert.equal(await p.locator('.board-card').count(), 1);
        },
      );
      after = await p.evaluate(() => window.habitAPI.exportBackup());
      fs.writeFileSync(path.join(evidence, 'fixture-before.json'), JSON.stringify(before));
      fs.writeFileSync(path.join(evidence, 'fixture-after.json'), JSON.stringify(after));
    }
    const screens = [
      ['tasks', '/tasks'],
      ['plan', '/plan'],
      ['habits', '/habits'],
      ['history', '/history'],
      ['recovery', '/habits?recovery=1'],
      ['work', '/work'],
      ['focus', '/focus'],
      ['study', '/study'],
      ['goals', '/goals'],
      ['journal', '/journal'],
      ['review', '/review'],
      ['settings', '/settings'],
    ];
    for (const theme of ['dark', 'light']) {
      await p.evaluate(async (theme) => {
        const s = await window.habitAPI.getProductivity();
        await window.habitAPI.saveProductivity({
          ...s,
          settings: { ...s.settings, theme, themePalette: 'graphite' },
        });
        localStorage.setItem('tempo-sidebar', 'expanded');
      }, theme);
      await p.reload();
      await p.waitForTimeout(400);
      for (const width of [1440, 900, 600]) {
        await p.setViewportSize({ width, height: 960 });
        if (width === 600) {
          await p.evaluate(() => localStorage.setItem('tempo-sidebar', 'collapsed'));
          await p.reload();
          await p.waitForTimeout(400);
        }
        for (const [screen, url] of screens) {
          await route(p, url);
          await p.locator('main').evaluate((el) => (el.scrollTop = 0));
          await p.waitForTimeout(100);
          const filename = `${screen}-${theme}-${width}.png`;
          await p.screenshot({ path: path.join(evidence, filename) });
          const bounds = await p.evaluate(() => ({
            width: innerWidth,
            document: document.documentElement.scrollWidth,
            main: document.querySelector('main').clientWidth,
            mainScroll: document.querySelector('main').scrollWidth,
          }));
          captures.push({ filename, ...bounds });
        }
        await route(p, '/focus');
        await p.keyboard.press('Control+k');
        await p.waitForTimeout(100);
        await p.screenshot({ path: path.join(evidence, `search-${theme}-${width}.png`) });
        await p.keyboard.press('Escape');
      }
    }
  });
  await withApp(async (p) => {
    if (process.env.REVIEW_RECAPTURE) return;
    await check(
      'Second launch retains Task schedule, habits, imported timestamps and journal',
      async () => {
        const state = await prod(p);
        assert.equal(state.tasks.find((t) => t.id === 'a').scheduledTime, '10:30');
        const habits = await p.evaluate(() => window.habitAPI.getHabitSnapshot());
        assert.equal(habits.events.length, 2);
        assert.ok(
          (await invoke(p, 'plan:snapshot')).journal
            .find((j) => j.date === today)
            .text.includes('A saved thought from the open canvas.'),
        );
      },
    );
  });
  fs.writeFileSync(
    path.join(evidence, process.env.REVIEW_RECAPTURE ? 'recapture-results.json' : 'results.json'),
    JSON.stringify({ results, captures, errors }, null, 2),
  );
  console.log(
    JSON.stringify({
      evidence,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed),
      overflow: captures.filter((c) => c.document > c.width || c.mainScroll > c.main + 1),
      errors,
    }),
  );
  if (results.some((r) => !r.passed) || errors.length) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
