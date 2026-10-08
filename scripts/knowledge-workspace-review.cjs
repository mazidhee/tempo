/** Production Electron/SQLite integration checks. Uses only a new isolated profile. */
const {
  _electron: electron,
} = require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const directory = path.resolve(
  '.review',
  process.env.REVIEW_RUN || `knowledge-workspace-${Date.now()}`,
);
const captures = path.join(directory, 'captures');
fs.mkdirSync(captures, { recursive: true });
const results = [],
  errors = [];
let application, page, widget;
const invoke = (p, channel, input) =>
  p.evaluate(({ channel, input }) => window.workspaceAPI.invoke(channel, input), {
    channel,
    input,
  });
async function until(fn, label) {
  for (let i = 0; i < 100; i++) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error(label);
}
async function launch() {
  const env = { ...process.env, HABIT_TRACKER_DATA_DIR: directory };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.VITE_DEV_SERVER_URL;
  application = await electron.launch({
    executablePath: path.resolve(
      process.env.REVIEW_EXE || 'node_modules/electron/dist/electron.exe',
    ),
    args: process.env.REVIEW_EXE ? [] : ['.'],
    cwd: path.resolve('.'),
    env,
  });
  await application.firstWindow();
  await until(
    async () =>
      application
        .windows()
        .some((p) => p.url().startsWith('file:') && !p.url().endsWith('#/focus-widget')),
    'Main renderer',
  );
  page = application
    .windows()
    .find((p) => p.url().startsWith('file:') && !p.url().endsWith('#/focus-widget'));
  page.setDefaultTimeout(8000);
  page.on('pageerror', (e) => errors.push(e.message));
  await page.waitForLoadState('domcontentloaded');
  await page.locator('.main-shell').waitFor();
}
async function check(label, fn) {
  await fn();
  results.push({ label, passed: true });
  console.log('PASS', label);
}
async function nav(label) {
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: label, exact: true })
    .click();
}
async function shot(label) {
  if (process.env.REVIEW_SKIP_CAPTURE) return;
  if (label.startsWith('notes-')) await page.locator('.knowledge-page').waitFor();
  await page.locator('main').evaluate((e) => (e.scrollTop = 0));
  await page.screenshot({ path: path.join(captures, label + '.png') });
  const dimensions = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert.ok(dimensions.scroll <= dimensions.width, label + ' overflow');
}
async function theme(value) {
  await page.evaluate(async (value) => {
    const p = await window.habitAPI.getProductivity();
    await window.habitAPI.saveProductivity({
      ...p,
      settings: {
        ...p.settings,
        theme: value,
        themePalette: 'graphite',
        notifications: false,
        reminder: false,
      },
    });
  }, value);
  await page.reload();
  await page.locator('.main-shell').waitFor();
}
async function nativeWidget(fn) {
  return application.evaluate(({ BrowserWindow }, fnString) => {
    const win = BrowserWindow.getAllWindows().find((w) =>
      w.webContents.getURL().endsWith('#/focus-widget'),
    );
    if (!win) throw Error('No native widget');
    return (0, eval)(`(${fnString})`)(win);
  }, fn.toString());
}
(async () => {
  try {
    await launch();
    let noteId, backup, runId;
    await check('Markdown library and real-record graph', async () => {
      await theme('light');
      await invoke(page, 'study:importOutlines', [
        {
          title: 'Engineering',
          markdown:
            '# Engineering\n## SQL\n' +
            Array.from({ length: 1800 }, (_, i) => `- [ ] Data boundary ${i + 1}`).join('\n'),
        },
      ]);
      await page.evaluate(async () => {
        const p = await window.habitAPI.getProductivity();
        p.settings.workProjects = [
          {
            id: 'pipeline',
            title: 'Warehouse migration',
            description: 'Fixture project',
            archived: false,
            milestones: [],
          },
        ];
        await window.habitAPI.saveProductivity(p);
      });
      const study = await invoke(page, 'study:snapshot');
      const note = await page.evaluate(async (topic) => {
        const id = crypto.randomUUID(),
          at = new Date().toISOString();
        await window.workspaceAPI.invoke('notes:folder', 'Engineering/SQL');
        await window.workspaceAPI.invoke('notes:folder', 'Personal');
        const n = {
          id,
          title: 'Pipeline boundaries',
          folder: 'Engineering/SQL',
          tags: ['engineering', 'sql'],
          links: [`topic:${topic}`, 'project:pipeline'],
          document: {
            type: 'doc',
            content: [
              {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: 'Validate the ingestion boundary' }],
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Preserve raw inputs, make failures visible, and document the contract.',
                  },
                ],
              },
              {
                type: 'bulletList',
                content: [
                  {
                    type: 'listItem',
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'Check schema and nullability' }],
                      },
                    ],
                  },
                ],
              },
              {
                type: 'codeBlock',
                attrs: { language: 'sql' },
                content: [{ type: 'text', text: 'SELECT COUNT(*) FROM raw_events;' }],
              },
            ],
          },
          createdAt: at,
          updatedAt: at,
          archived: false,
        };
        await window.workspaceAPI.invoke('notes:save', n);
        return n;
      }, study.topics[0].id);
      noteId = note.id;
      const snapshot = await invoke(page, 'notes:snapshot');
      assert.ok(
        fs
          .readFileSync(path.join(snapshot.directory, note.folder, `${noteId}.md`), 'utf8')
          .includes('SELECT COUNT(*)'),
      );
      const graph = await invoke(page, 'notes:graph');
      assert.equal(graph.nodes.length, study.topics.length + study.curricula.length + 2);
      assert.ok(graph.edges.some((e) => e.target === 'project:pipeline'));
      await nav('Notes');
      await page.getByRole('button', { name: /Pipeline boundaries/ }).click();
      await page
        .getByRole('textbox', { name: 'Note title', exact: true })
        .fill('Pipeline boundaries and contracts');
      await page.getByRole('status').filter({ hasText: 'Saved locally' }).waitFor();
      assert.equal(
        (await invoke(page, 'notes:snapshot')).notes[0].title,
        'Pipeline boundaries and contracts',
      );
      const tags = page.getByRole('textbox', { name: 'Note tags', exact: true });
      await tags.fill('');
      await tags.pressSequentially('sql,python', { delay: 30 });
      assert.equal(await tags.inputValue(), 'sql,python');
      await tags.pressSequentially(',data engineering', { delay: 30 });
      assert.equal(await tags.inputValue(), 'sql,python,data engineering');
      assert.deepEqual(
        await page.evaluate(
          (id) => JSON.parse(localStorage.getItem(`tempo-note-draft:${id}`)).tags,
          noteId,
        ),
        ['sql', 'python', 'data engineering'],
      );
      await page.keyboard.press('Control+s');
      await until(
        async () =>
          JSON.stringify((await invoke(page, 'notes:snapshot')).notes[0].tags) ===
          JSON.stringify(['sql', 'python', 'data engineering']),
        'Typed tags autosave',
      );
      await page.getByRole('button', { name: 'Notes', exact: true }).click();
      await page.getByRole('button', { name: /Pipeline boundaries and contracts/ }).click();
      assert.equal(await tags.inputValue(), 'sql, python, data engineering');
      await tags.press('End');
      await tags.pressSequentially(',warehouse', { delay: 30 });
      await page.keyboard.press('Control+s');
      await until(
        async () => (await invoke(page, 'notes:snapshot')).notes[0].tags.length === 4,
        'Edited multi-tag value',
      );
      const tagSnapshot = await invoke(page, 'notes:snapshot');
      assert.ok(
        fs
          .readFileSync(path.join(tagSnapshot.directory, note.folder, `${noteId}.md`), 'utf8')
          .includes('data engineering'),
      );
      assert.deepEqual(
        (await page.evaluate(() => window.habitAPI.exportBackup())).modules.knowledge.notes[0].tags,
        ['sql', 'python', 'data engineering', 'warehouse'],
      );
      await page.getByRole('textbox', { name: 'Note content', exact: true }).click();
      await page.keyboard.press('Control+End');
      await page.keyboard.press('Enter');
      await page.keyboard.type('/');
      await page.getByRole('menuitem', { name: 'Heading', exact: true }).click();
      await page.keyboard.type('Recovery notes');
      await page.keyboard.press('Control+s');
      await until(
        async () =>
          JSON.stringify((await invoke(page, 'notes:snapshot')).notes[0].document).includes(
            'Recovery notes',
          ),
        'Editor autosave',
      );
      await page.getByRole('textbox', { name: 'Note title', exact: true }).waitFor();
      await shot('notes-writing-desktop-light');
      await page.getByRole('button', { name: 'Notes', exact: true }).click();
      await shot('notes-library-desktop-light');
      await page.getByRole('button', { name: 'Show knowledge graph' }).click();
      await page.getByRole('complementary', { name: 'Knowledge graph' }).waitFor();
      await page.waitForTimeout(2200);
      await shot('notes-graph-desktop-light');
      await page.getByRole('textbox', { name: 'Search graph records' }).fill('Pipeline boundaries');
      await page.getByRole('button', { name: /Pipeline boundaries and contracts note/ }).click();
      await page.getByRole('button', { name: 'Open record' }).click();
      assert.ok(page.url().includes(noteId));
      await page.getByRole('button', { name: 'Close graph panel' }).click();
    });
    await check('Sidebar ordering, Notes search and metrics-only Statistics', async () => {
      await page.getByRole('button', { name: 'Arrange sidebar' }).click();
      await page.getByRole('button', { name: 'Move Notes up' }).click();
      await page.keyboard.press('Escape');
      await until(
        async () =>
          (
            (await page.evaluate(() => window.habitAPI.getProductivity())).settings.sidebarOrder ||
            []
          ).length === 12,
        'Sidebar persistence',
      );
      await page.keyboard.press('Control+k');
      await page.getByPlaceholder('Navigate, focus, or add a task…').fill('Pipeline boundaries');
      await page.getByRole('option', { name: /Pipeline boundaries and contracts/ }).click();
      assert.ok(page.url().includes(noteId));
      await nav('Statistics');
      assert.equal(await page.getByText('Take one thing forward', { exact: true }).count(), 0);
      assert.equal(
        await page
          .getByRole('navigation', { name: 'Main navigation' })
          .getByRole('link', { name: 'Review', exact: true })
          .count(),
        0,
      );
    });
    await check('Desktop dark and narrow Notes captures', async () => {
      await nav('Notes');
      await theme('dark');
      await shot('notes-library-desktop-dark');
      await page.getByRole('button', { name: /Pipeline boundaries and contracts/ }).click();
      await shot('notes-writing-desktop-dark');
      await page.setViewportSize({ width: 390, height: 844 });
      await shot('notes-writing-mobile-dark');
      await page.getByRole('button', { name: 'Notes', exact: true }).click();
      await shot('notes-library-mobile-dark');
      await page.getByRole('button', { name: 'Browse notes' }).click();
      await shot('notes-folders-mobile-dark');
      await page.getByRole('button', { name: 'Show knowledge graph' }).click();
      await page.waitForTimeout(2200);
      await shot('notes-graph-mobile-dark');
      await page.getByRole('button', { name: 'Close graph panel' }).click();
      await theme('light');
      await shot('notes-library-mobile-light');
      await page.setViewportSize({ width: 1440, height: 1000 });
      await shot('notes-library-user-1440-light');
    });
    await check(
      'Floating session card shares pause/resume and stays above other apps',
      async () => {
        await invoke(page, 'focus:command', {
          action: 'configure',
          link: {
            type: 'task',
            id: 'pipeline-quality',
            name: 'Check pipeline data quality',
            project: 'Warehouse migration',
            area: 'work',
            workProjectId: 'pipeline',
          },
        });
        await invoke(page, 'focus:command', { action: 'start' });
        await until(
          async () => application.windows().some((p) => p.url().endsWith('#/focus-widget')),
          'Floating renderer',
        );
        widget = application.windows().find((p) => p.url().endsWith('#/focus-widget'));
        widget.on('pageerror', (e) => errors.push(e.message));
        await widget.getByLabel('Remaining time').waitFor();
        await widget.getByText('Check pipeline data quality', { exact: true }).waitFor();
        assert.equal(await nativeWidget((w) => w.isAlwaysOnTop()), true);
        assert.equal(await nativeWidget((w) => w.isResizable()), true);
        assert.equal(await nativeWidget((w) => w.isVisible()), true);
        runId = (await invoke(page, 'focus:snapshot')).productivity.timer.runId;
        await widget.getByRole('button', { name: 'Pause focus' }).click();
        await until(
          async () => (await invoke(page, 'focus:snapshot')).productivity.timer.deadline === null,
          'Shared pause',
        );
        await widget.getByRole('button', { name: 'Resume focus' }).click();
        await until(
          async () => (await invoke(page, 'focus:snapshot')).productivity.timer.deadline !== null,
          'Shared resume',
        );
        assert.equal((await invoke(page, 'focus:snapshot')).productivity.timer.runId, runId);
        await widget.getByRole('button', { name: 'Timer appearance' }).click();
        await widget.getByRole('slider', { name: 'Timer opacity' }).fill('60');
        await until(
          async () => Math.abs((await nativeWidget((w) => w.getOpacity())) - 0.6) < 0.02,
          'Native opacity',
        );
        await nativeWidget((w) => w.setBounds({ width: 320, height: 180 }));
        await new Promise((r) => setTimeout(r, 350));
        assert.ok(Math.abs((await invoke(page, 'window:widgetPreferences')).width - 320) <= 1);
        await widget.screenshot({ path: path.join(captures, 'floating-E-light.png') });
        console.log(
          'NATIVE BEFORE QUIT',
          await nativeWidget((w) => w.getBounds()),
          await invoke(page, 'window:widgetPreferences'),
        );
        await application.evaluate(({ BrowserWindow }) =>
          BrowserWindow.getAllWindows()
            .find((w) => !w.webContents.getURL().endsWith('#/focus-widget'))
            .close(),
        );
        assert.equal(await nativeWidget((w) => w.isVisible()), true);
        await widget.getByRole('button', { name: 'Open Focus' }).click();
        await until(async () => page.url().endsWith('#/focus'), 'Open Focus navigation');
        await widget.getByRole('button', { name: 'Hide floating timer' }).click();
        assert.equal(await nativeWidget((w) => w.isVisible()), false);
        assert.equal(
          (await invoke(page, 'focus:snapshot')).productivity.timer.deadline !== null,
          true,
        );
        await invoke(page, 'window:widgetShow');
        assert.equal(await nativeWidget((w) => w.isVisible()), true);
        await invoke(page, 'focus:command', { action: 'pause' });
        backup = await page.evaluate(() => window.habitAPI.exportBackup());
        assert.ok(backup.modules.knowledge.notes.length);
        await application.close();
      },
    );
    await check(
      'Restart preserves Markdown, sidebar order, timer and native preferences',
      async () => {
        await launch();
        const n = (await invoke(page, 'notes:snapshot')).notes[0];
        assert.equal(n.id, noteId);
        assert.ok(JSON.stringify(n.document).includes('Recovery notes'));
        assert.equal((await invoke(page, 'focus:snapshot')).productivity.timer.runId, runId);
        const p = await invoke(page, 'window:widgetPreferences');
        console.log('NATIVE RESTART', p);
        await until(async () => {
          const v = await invoke(page, 'window:widgetPreferences');
          return Math.abs(v.width - 320) <= 1 && Math.abs(v.height - 180) <= 1;
        }, 'Restored native bounds');
        const restored = await invoke(page, 'window:widgetPreferences');
        assert.ok(Math.abs(restored.width - 320) <= 1);
        assert.ok(Math.abs(restored.height - 180) <= 1);
        assert.equal(p.opacity, 0.6);
        const before = (await invoke(page, 'notes:snapshot')).notes.length;
        await page.evaluate((data) => window.habitAPI.importBackup(data), backup);
        assert.equal((await invoke(page, 'notes:snapshot')).notes.length, before);
        await invoke(page, 'focus:command', { action: 'stop' });
        await nav('Notes');
        await shot('notes-restart-desktop-light');
        assert.deepEqual(errors, []);
      },
    );
    await check('Whole-app scale is adjustable, persists, and accepts older backups', async () => {
      await nav('Settings');
      await page.getByLabel('Interface scale', { exact: true }).selectOption('0.9');
      await until(
        async () =>
          Math.abs(
            (await application.evaluate(({ BrowserWindow }) =>
              BrowserWindow.getAllWindows()
                .find((w) => !w.webContents.getURL().endsWith('#/focus-widget'))
                .webContents.getZoomFactor(),
            )) - 0.9,
          ) < 1e-6,
        'Native interface scale',
      );
      await nav('Notes');
      await shot('notes-scale-90-desktop-light');
      await application.close();
      await launch();
      assert.ok(
        Math.abs(
          (await application.evaluate(({ BrowserWindow }) =>
            BrowserWindow.getAllWindows()
              .find((w) => !w.webContents.getURL().endsWith('#/focus-widget'))
              .webContents.getZoomFactor(),
          )) - 0.9,
        ) < 1e-6,
      );
      assert.equal(
        (await page.evaluate(() => window.habitAPI.getProductivity())).settings.interfaceScale,
        0.9,
      );
      await nav('Settings');
      await shot('settings-scale-90-desktop-light');
      await page.getByLabel('Interface scale', { exact: true }).selectOption('1');
    });
    fs.writeFileSync(
      path.join(directory, 'results.json'),
      JSON.stringify({ passed: true, results, errors, captures }, null, 2),
    );
    console.log('Evidence:', directory);
  } catch (e) {
    console.error(e);
    if (page && !page.isClosed()) {
      console.log('FAIL URL', page.url());
      console.log('BODY', await page.locator('body').innerText());
      await page.screenshot({ path: path.join(captures, 'failure.png') });
    }
    results.push({ passed: false, error: e.stack });
    fs.writeFileSync(
      path.join(directory, 'results.json'),
      JSON.stringify({ passed: false, results, errors }, null, 2),
    );
    process.exitCode = 1;
  } finally {
    if (application) await application.close().catch(() => {});
  }
})();
