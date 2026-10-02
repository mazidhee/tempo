import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from '../src/main/database/sqlite';
import { migrateProductivity } from '../src/main/database/migrations';
import { runModuleMigrations } from '../src/main/database/migrationRegistry';
import { appearanceMigration } from '../src/main/database/appearanceMigration';
import { FocusGuard } from '../src/main/focus/guard';
import { defaultFocusSettings } from '../src/shared/focus';
import { defaultProductivity, startTimer, validProductivity } from '../src/shared/productivity';
import { searchOptions, studyOptions, pickerPageSize } from '../src/shared/picker';
import { themePalettes, themeTokens, accentTokens } from '../src/shared/appearance';
import { reconcileProductivity } from '../src/shared/productivitySync';

test('older acknowledgements and native events retain newer queued edits without replacing native focus state', () => {
  const authoritative = defaultProductivity();
  authoritative.settings.name = 'D';
  authoritative.timer.completed = 2;
  const optimistic = structuredClone(authoritative);
  optimistic.settings.name = 'Divine Reviewer Long Name';
  optimistic.settings.themePalette = 'forest';
  optimistic.tasks.push({
    id: 'queued',
    title: 'New task',
    due: '',
    priority: 'normal',
    tags: [],
    project: '',
    subtasks: [],
    createdAt: new Date().toISOString(),
    completedAt: null,
  });
  optimistic.timer.completed = 0;
  for (const pending of [24, 2, 1]) {
    const merged = reconcileProductivity(authoritative, optimistic, pending);
    assert.equal(merged.settings.name, optimistic.settings.name);
    assert.equal(merged.settings.themePalette, 'forest');
    assert.deepEqual(merged.tasks, optimistic.tasks);
    assert.equal(merged.timer.completed, 2);
    assert.deepEqual(merged.sessions, authoritative.sessions);
  }
  assert.deepEqual(reconcileProductivity(authoritative, optimistic, 0), authoritative);
});

test('large library search keeps all records findable across curriculum and ancestor names', () => {
  const study = {
    curricula: [
      { id: 'c', title: 'Mathematics', description: '', createdAt: '', archived: false },
      { id: 'hidden', title: 'Archived', description: '', createdAt: '', archived: true },
    ],
    reviews: [],
    topics: Array.from({ length: 1823 }, (_, n) => ({
      id: String(n),
      title: n === 1822 ? 'Équations' : `Topic ${n}`,
      curriculumId: 'c',
      parentId: n ? '0' : null,
      archived: false,
      order: n,
      learnedAt: null,
      reviewDue: null,
      interval: 1,
    })),
  };
  const options = studyOptions(study);
  assert.equal(options.length, 1823);
  assert.equal(searchOptions(options, 'mathematics equations topic 0', 'c')[0].value, 'study:1822');
  assert.equal(searchOptions(options, '', 'hidden').length, 0);
  assert.equal(searchOptions(options, '').slice(0, pickerPageSize).length, 30);
  study.topics[1822].archived = true;
  assert.equal(searchOptions(studyOptions(study), 'equations').length, 0);
});
test('version 202 adds only the palette and is repeatable without changing existing records or preferences', () => {
  const db = new Database(':memory:');
  migrateProductivity(db);
  runModuleMigrations(db);
  const before = defaultProductivity();
  before.settings.name = 'Owner';
  before.settings.accent = 'petrol';
  before.settings.theme = 'light';
  delete before.settings.themePalette;
  db.prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(before));
  db.prepare('DELETE FROM schema_migrations WHERE version=202').run();
  runModuleMigrations(db);
  const actual = JSON.parse(
    (db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as any).json,
  );
  assert.deepEqual(actual, {
    ...before,
    settings: { themePalette: 'default', ...before.settings },
  });
  actual.settings.themePalette = 'dusk';
  db.prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(actual));
  appearanceMigration.apply(db);
  runModuleMigrations(db);
  assert.deepEqual(
    JSON.parse((db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as any).json),
    actual,
  );
  assert.equal(db.prepare('SELECT * FROM schema_migrations WHERE version=202').all().length, 1);
  db.close();
});
test('app enforcement continues during and after a denied website prompt without automatic reprompt', async () => {
  let release!: () => void,
    prompts = 0,
    closes = 0;
  const pending = new Promise<void>((r) => {
    release = r;
  });
  const guard = new FocusGuard(
    {
      read: async () => '',
      replace: async () => {
        prompts++;
        await pending;
        throw Error('UAC cancelled -EncodedCommand LONG CLIXML');
      },
    },
    {
      list: async () => [
        { pid: 789, name: 'StudyProbe.exe', executable: 'C:\\Users\\Owner\\StudyProbe.exe' },
      ],
      close: async () => {
        closes++;
      },
    },
    () => {},
    () => {},
  );
  const settings = {
    ...defaultFocusSettings(),
    enabled: true,
    mode: 'close' as const,
    blocklists: [{ id: 'test', name: 'Test', apps: ['StudyProbe.exe'], websites: ['example.com'] }],
    selected: ['test'],
  };
  const timer = startTimer(defaultProductivity().timer, 1000);
  const operation = guard.sync(settings, timer);
  await new Promise<void>((r) => setImmediate(r));
  assert.equal(closes, 1, 'native app work must start before permission resolves');
  release();
  await operation;
  await guard.sync(settings, timer);
  assert.equal(closes, 2);
  assert.equal(prompts, 1);
  assert.equal(guard.appsActive, true);
  assert.ok(guard.error.length < 250);
  assert.doesNotMatch(guard.error, /EncodedCommand|CLIXML/);
  guard.retryWebsites();
  await guard.sync(settings, timer);
  assert.equal(prompts, 2);
});
test('stopped or reconfigured sessions never close apps from an obsolete enumeration', async () => {
  let release!: () => void,
    closes = 0,
    current = true;
  const pending = new Promise<void>((r) => {
    release = r;
  });
  const guard = new FocusGuard(
    { read: async () => '', replace: async () => {} },
    {
      list: async () => {
        await pending;
        return [{ pid: 789, name: 'WhatsApp.exe', executable: 'C:\\Users\\Owner\\WhatsApp.exe' }];
      },
      close: async () => {
        closes++;
      },
    },
    () => {},
    () => {},
  );
  const operation = guard.sync(
    { ...defaultFocusSettings(), enabled: true, mode: 'close' },
    startTimer(defaultProductivity().timer, 1000),
    () => current,
  );
  current = false;
  release();
  await operation;
  assert.equal(closes, 0);
});
function luminance(hex: string) {
  return [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
}
test('all surface palettes persist and keep readable primary and secondary text in both modes', () => {
  for (const palette of themePalettes)
    for (const light of [false, true]) {
      const state = defaultProductivity();
      state.settings.themePalette = palette.id;
      assert.equal(validProductivity(state), true);
      const tokens = themeTokens(palette.id, light);
      for (const surface of ['--canvas', '--surface-1', '--surface-2', '--surface-3'] as const)
        for (const text of ['--ink', '--ink-muted', '--ink-subtle'] as const) {
          const values = [luminance(tokens[surface]), luminance(tokens[text])].sort(
            (a, b) => b - a,
          );
          assert.ok(
            (values[0] + 0.05) / (values[1] + 0.05) >= 4.5,
            `${palette.id} ${light ? 'light' : 'dark'} ${surface} ${text}`,
          );
        }
      assert.equal(accentTokens('petrol', light, tokens['--surface-2'])['--primary'], '#326f7b');
    }
  const state = defaultProductivity();
  (state.settings as any).themePalette = 'missing';
  assert.equal(validProductivity(state), false);
});
