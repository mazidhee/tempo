import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Database from '../src/main/database/sqlite';
import { migrateProductivity } from '../src/main/database/migrations';
import { runModuleMigrations } from '../src/main/database/migrationRegistry';
import { StudyStore } from '../src/main/study/store';
import { FocusStore } from '../src/main/focus/store';
import { parseStudyOutline } from '../src/shared/studyImport';
import {
  defaultProductivity,
  newStopwatch,
  startTimer,
  pauseTimer,
  stopwatchSeconds,
  saveTrackedTime,
  validProductivity,
  timerIsRunning,
  type Session,
} from '../src/shared/productivity';
import { studyTimeTotals } from '../src/shared/study';
import { studyTimeTree, timeSlices, manualSession } from '../src/shared/time';
import { accents, accentTokens, validAvatar } from '../src/shared/appearance';
import { dayPart, greetingFor } from '../src/shared/greetings';
const outline =
  '# SWE\n## Python\n### Core language\n- [x] Variables\n- [ ] Types\n  - [ ] Lists\n## Resources\nOrdinary prose\n```md\n- [x] Fake instruction\n```';
function fixture() {
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys=ON');
  migrateProductivity(db);
  runModuleMigrations(db);
  return { db, study: new StudyStore(db) };
}
test('outline importer keeps checkmarks and heading/checkbox hierarchy, omits fenced prose/resources', () => {
  const parsed = parseStudyOutline(outline);
  assert.equal(parsed.title, 'SWE');
  assert.equal(parsed.completed, 1);
  assert.deepEqual(
    parsed.topics.map((t) => t.title),
    ['Python', 'Core language', 'Variables', 'Types', 'Lists'],
  );
  assert.equal(parsed.topics[4].parentKey, parsed.topics[3].key);
  assert.throws(() => parseStudyOutline('Only prose'), /No headings/);
  assert.throws(
    () =>
      parseStudyOutline(
        Array.from({ length: 50 }, (_, i) => ' '.repeat(i * 2) + '- [ ] Topic').join('\n'),
      ),
    /48 levels/,
  );
});
test('all three supplied roadmaps retain every checked item and valid parent references', () => {
  for (const file of ['software-engineering', 'mathematics', 'economics-markets']) {
    const markdown = readFileSync(`src/renderer/assets/curricula/${file}.md`, 'utf8'),
      parsed = parseStudyOutline(markdown);
    const checkmarks = markdown
      .split('\n')
      .filter((line) => /^\s*[-*+]\s+\[[xX]\]\s/.test(line)).length;
    assert.equal(parsed.completed, checkmarks, file);
    assert.ok(parsed.topics.length > 100, file);
    const keys = new Set(parsed.topics.map((t) => t.key));
    assert.ok(
      parsed.topics.every((t) => t.parentKey === null || keys.has(t.parentKey)),
      file,
    );
  }
});
test('roadmap import is atomic, idempotent and retains edited progress and source provenance', () => {
  const { db, study } = fixture();
  const saved = study.importOutlines([{ title: 'SWE', markdown: outline }]);
  const topic = study.snapshot().topics.find((t) => t.title === 'Types')!;
  study.learn({ id: topic.id, learned: true });
  assert.equal(study.importOutlines([{ title: 'SWE', markdown: outline }])[0].id, saved[0].id);
  assert.ok(study.snapshot().topics.find((t) => t.id === topic.id)!.learnedAt);
  assert.equal(study.snapshot().imports!.length, 1);
  assert.equal(study.snapshot().imports![0].markdown, outline);
  assert.throws(() =>
    study.importOutlines([
      { title: 'New', markdown: '## Valid' },
      { title: 'Invalid', markdown: 'prose' },
    ]),
  );
  assert.equal(study.snapshot().curricula.length, 1);
  db.close();
});
test('version 201 is repeatable and preserves existing preferences, sessions, timer and task data', () => {
  const { db } = fixture();
  const state = defaultProductivity();
  state.settings.name = 'Divine';
  state.settings.accent = 'cedar';
  state.timer = startTimer(newStopwatch(state.presets[0]), 1000);
  db.prepare('UPDATE productivity_state SET json=? WHERE id=1').run(JSON.stringify(state));
  runModuleMigrations(db);
  assert.deepEqual(
    JSON.parse((db.prepare('SELECT json FROM productivity_state WHERE id=1').get() as any).json),
    state,
  );
  assert.equal(db.prepare('SELECT * FROM schema_migrations WHERE version=201').all().length, 1);
  db.close();
});
test('count-up tracking survives serialization/background time and excludes fractional pauses', () => {
  const state = defaultProductivity();
  let timer = startTimer(newStopwatch(state.presets[0]), 1000);
  timer = pauseTimer(timer, 1123);
  assert.equal(stopwatchSeconds(timer, 999999), 0.123);
  assert.equal(timerIsRunning(timer), false);
  timer = startTimer(JSON.parse(JSON.stringify(timer)), 2000000);
  assert.equal(stopwatchSeconds(timer, 2001123), 1.246);
  assert.equal(timer.startedAt, 1000);
  const saved = saveTrackedTime({ ...state, timer }, 2001123);
  assert.equal(saved.sessions[0].duration, 1.246);
  assert.equal(saved.sessions[0].startedAt, new Date(1000).toISOString());
  assert.equal(
    saveTrackedTime({ ...state, timer, sessions: saved.sessions }, 2001123).sessions.length,
    1,
  );
  assert.equal(saveTrackedTime(saved, 2009999).sessions.length, 1);
  assert.ok(validProductivity(saved));
});
test('main-process tracker commands reject skips and preserve records across settings writes', () => {
  const { db } = fixture();
  let now = 1000;
  const focus = new FocusStore(db, () => now);
  focus.command({ action: 'configure', timerMode: 'stopwatch' });
  focus.command({ action: 'start' });
  now = 2000;
  focus.command({ action: 'pause' });
  now = 100000;
  focus.command({ action: 'start' });
  focus.command({ action: 'start' });
  now = 101000;
  assert.throws(() => focus.command({ action: 'skip' }), /no phase/);
  assert.equal(focus.complete(), null);
  focus.command({ action: 'stop' });
  focus.command({ action: 'stop' });
  assert.equal(focus.productivity().sessions[0].duration, 2);
  assert.equal(focus.productivity().sessions.length, 1);
  focus.command({ action: 'configure', timerMode: 'pomodoro' });
  assert.equal(focus.productivity().timer.stopwatch, undefined);
  db.close();
});
test('launching a different task through legacy focus saves active tracked study time', () => {
  const { db } = fixture();
  let now = 1000;
  const focus = new FocusStore(db, () => now);
  focus.command({
    action: 'configure',
    timerMode: 'stopwatch',
    link: { type: 'study', id: 'topic', name: 'Python' },
  });
  focus.command({ action: 'start' });
  now = 2500;
  const before = focus.productivity().timer;
  const next = defaultProductivity().timer;
  next.link = { type: 'task', id: 'task', name: 'Write' };
  next.deadline = now + next.duration * 1000;
  focus.legacy({ expectedRunId: before.runId, timer: next });
  assert.equal(focus.productivity().sessions[0].duration, 1.5);
  assert.equal(focus.productivity().sessions[0].link?.id, 'topic');
  assert.equal(focus.productivity().timer.link?.id, 'task');
  assert.equal(focus.productivity().timer.stopwatch, undefined);
  db.close();
});
const manual = (id = 'entry', duration = 1800): Session => ({
  id,
  date: '2026-10-01',
  startedAt: '2026-10-01T10:00:00Z',
  endedAt: '2026-10-01T10:30:00Z',
  duration,
  phase: 'focus',
  presetId: 'classic',
  presetName: 'Classic',
  link: null,
});
test('manual entries validate chronology, overlapping time, identity and edits retain preset attribution', () => {
  const existing = manual(),
    now = Date.parse('2026-10-02T12:00:00Z');
  const draft = { startedAt: '2026-10-01T10:15:00Z', endedAt: '2026-10-01T10:45:00Z', link: null };
  assert.throws(() => manualSession(draft, [existing], now), /overlaps/);
  assert.equal(manualSession({ ...draft, allowOverlap: true }, [existing], now).duration, 1800);
  assert.throws(() => manualSession({ ...draft, id: 'missing' }, [existing], now), /not found/);
  assert.throws(
    () => manualSession({ ...draft, endedAt: '2026-10-01T09:00:00Z' }, [], now),
    /End must/,
  );
  assert.throws(
    () => manualSession({ ...draft, endedAt: '2026-10-03T09:00:00Z' }, [], now),
    /future/,
  );
  const edited = manualSession({ ...draft, id: existing.id }, [existing], now);
  assert.equal(edited.presetName, 'Classic');
  assert.equal(edited.source, 'manual');
  const paused = manual('paused', 1000);
  assert.equal(
    manualSession(
      {
        id: paused.id,
        startedAt: paused.startedAt!,
        endedAt: paused.endedAt,
        link: null,
        preserveDuration: true,
      },
      [paused],
      now,
    ).duration,
    1000,
  );
});
test('manual add/edit/delete are persisted once and refresh every consumer from the same records', () => {
  const { db } = fixture();
  const focus = new FocusStore(db, () => Date.parse('2026-10-02T12:00:00Z'));
  focus.saveSession({
    startedAt: '2026-10-01T10:00:00Z',
    endedAt: '2026-10-01T10:30:00Z',
    link: null,
  });
  const first = focus.productivity().sessions[0];
  focus.saveSession({
    id: first.id,
    startedAt: first.startedAt,
    endedAt: '2026-10-01T10:45:00Z',
    link: null,
  });
  assert.equal(focus.productivity().sessions.length, 1);
  assert.equal(focus.productivity().sessions[0].duration, 2700);
  focus.deleteSession(first.id);
  assert.equal(focus.productivity().sessions.length, 0);
  db.close();
});
test('time totals and sunburst include ancestors, direct-parent time and archives without double counting', () => {
  const { db, study } = fixture();
  const c = study.importOutlines([{ title: 'SWE', markdown: outline }])[0];
  const snapshot = study.snapshot(),
    child = snapshot.topics.find((t) => t.title === 'Lists')!,
    parent = snapshot.topics.find((t) => t.title === 'Types')!;
  const childSession = {
    ...manual('child', 600),
    link: { type: 'study' as const, id: child.id, name: child.title, curriculumId: c.id },
  };
  const parentSession = {
    ...manual('parent', 300),
    link: { type: 'study' as const, id: parent.id, name: parent.title, curriculumId: c.id },
  };
  const sessions = [childSession, parentSession, childSession];
  snapshot.topics.find((t) => t.id === child.id)!.archived = true;
  const totals = studyTimeTotals(snapshot, sessions),
    tree = studyTimeTree(snapshot, sessions);
  assert.equal(totals.topicSeconds[parent.id], 900);
  assert.equal(totals.curriculumSeconds[c.id], 900);
  assert.equal(tree.seconds, 900);
  assert.equal(
    timeSlices(tree)
      .filter((s) => s.depth === 1)
      .reduce((sum, s) => sum + s.end - s.start, 0),
    Math.PI * 2,
  );
  const unknown = {
    ...manual('unknown', 60),
    link: { type: 'study' as const, id: 'gone', name: 'Previous topic' },
  };
  assert.equal(studyTimeTree(snapshot, [...sessions, unknown]).seconds, 960);
  db.close();
});
test('solid accent labels meet text contrast and local avatars reject remote/script content', () => {
  const luminance = (hex: string) =>
    [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  for (const accent of accents) {
    assert.ok(1.05 / (luminance(accent.color) + 0.05) >= 4.5, accent.name);
    assert.ok((luminance(accent.hover) + 0.05) / (luminance('#010102') + 0.05) >= 4.5, accent.name);
    assert.equal(accentTokens(accent.id)['--primary'], accent.color);
  }
  assert.equal(validAvatar('https://example.com/photo.jpg'), false);
  assert.equal(validAvatar('data:image/svg+xml;base64,AAAA'), false);
  assert.equal(validAvatar(null), true);
  const state = defaultProductivity();
  state.settings.accent = 'invalid' as any;
  assert.equal(validProductivity(state), false);
});
test('personal greetings are stable per seed and simple greetings respect day/night periods', () => {
  assert.deepEqual(
    [dayPart(4), dayPart(9), dayPart(14), dayPart(19)],
    ['night', 'morning', 'afternoon', 'evening'],
  );
  assert.deepEqual(greetingFor(9, 'Divine', 7), greetingFor(9, 'Divine', 7));
  assert.ok(greetingFor(9, 'Divine', 7, true).title.includes('Divine'));
  assert.ok(
    new Set(Array.from({ length: 50 }, (_, seed) => greetingFor(9, 'Divine', seed / 50).title))
      .size > 20,
  );
});
