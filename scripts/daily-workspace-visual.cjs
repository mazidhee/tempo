const { withApp } = require('./electron-runtime.cjs');
const fs = require('node:fs'),
  path = require('node:path');
const run = 'daily-workspace-visual-' + Date.now();
(async () => {
  await withApp(run, async ({ page: p, nav, directory, errors }) => {
    const date = await p.evaluate(() => new Date().toLocaleDateString('en-CA'));
    await p.evaluate(async (date) => {
      const priorities = [
        'Practise Python functions',
        'Work through the fractions exercises',
        'Read the morning market brief',
        'Take a walk',
        'Prepare next week’s study sessions',
        'Make time to read',
      ].map((title, i) => ({
        id: crypto.randomUUID(),
        kind: 'free',
        linkId: null,
        title,
        done: i === 2,
      }));
      await window.workspaceAPI.invoke('plan:save', { date, priorities, studyTopicIds: [] });
      const s = await window.habitAPI.getProductivity();
      await window.habitAPI.saveProductivity({
        ...s,
        settings: { ...s.settings, theme: 'light' },
        tasks: [
          {
            id: crypto.randomUUID(),
            title: 'Practise return values',
            due: date,
            priority: 'high',
            project: 'Software engineering',
            tags: ['python'],
            subtasks: [
              { id: crypto.randomUUID(), title: 'Write a function from memory', done: false },
            ],
            createdAt: new Date().toISOString(),
            completedAt: null,
          },
          {
            id: crypto.randomUUID(),
            title: 'Work through fractions',
            due: date,
            priority: 'medium',
            project: 'Mathematics',
            tags: [],
            subtasks: [],
            createdAt: new Date().toISOString(),
            completedAt: null,
          },
        ],
      });
      await window.workspaceAPI.invoke('journal:save', {
        date,
        text: 'A clear beginning. Today I made time for one focused topic. The next step is to practise a little from memory.',
        document: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'A clear beginning.' }],
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Today I made time for one focused topic. The next step is to practise a little from memory.',
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
                      content: [{ type: 'text', text: 'One small thing worth remembering.' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      });
      for (const [offset, minutes] of [
        [1, 90],
        [2, 60],
        [3, 120],
      ]) {
        const end = new Date(date + 'T12:00:00');
        end.setDate(end.getDate() - offset);
        await window.workspaceAPI.invoke('focus:saveSession', {
          startedAt: new Date(end.getTime() - minutes * 60000).toISOString(),
          endedAt: end.toISOString(),
          link: null,
          note: 'Visual fixture focus',
        });
      }
      await window.workspaceAPI.invoke('review:generate', { date });
      await window.workspaceAPI.invoke('goals:save', {
        title: 'Build a steady learning rhythm',
        kind: 'focus',
        linkType: 'all',
        linkId: '',
        start: date,
        deadline: date,
        target: 5,
        weeks: 4,
        archived: false,
      });
    }, date);
    await p.reload();
    await p.waitForTimeout(450);
    for (const section of ['Plan', 'Tasks', 'Journal', 'Review', 'Goals']) {
      await nav(section);
      await p.screenshot({ path: path.join(directory, section.toLowerCase() + '.png') });
    }
    await nav('Plan');
    await p.getByRole('button', { name: 'Link a priority', exact: true }).click();
    await p.screenshot({ path: path.join(directory, 'search.png') });
    await p.keyboard.press('Escape');
    await p.setViewportSize({ width: 390, height: 844 });
    await p.screenshot({ path: path.join(directory, 'plan-narrow.png') });
    if (errors.length) throw Error(errors.join('; '));
    console.log(directory);
  });
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
