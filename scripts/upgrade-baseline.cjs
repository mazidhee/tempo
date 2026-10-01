const { DatabaseSync, backup } = require('node:sqlite');
const fs = require('node:fs'),
  path = require('node:path');
(async () => {
  const source = path.join(process.env.APPDATA, 'habit-tracker', 'habits.db');
  const output = path.resolve('.install-check', 'personal-upgrade-' + Date.now());
  fs.mkdirSync(output, { recursive: true });
  const db = new DatabaseSync(source, { readOnly: true });
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((r) => r.name);
  const counts = {};
  for (const table of [
    'habits',
    'habit_logs',
    'habit_pauses',
    'study_curricula',
    'study_topics',
    'study_reviews',
    'study_imports',
    'reflection_plans',
    'reflection_journal',
    'reflection_goals',
    'reflection_reviews',
    'focus_break_events',
  ])
    if (tables.includes(table))
      counts[table] = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
  if (tables.includes('productivity_state')) {
    const s = JSON.parse(db.prepare('SELECT json FROM productivity_state WHERE id=1').get().json);
    counts.tasks = s.tasks.length;
    counts.sessions = s.sessions.length;
    counts.presets = s.presets.length;
  }
  const destination = path.join(output, 'before.db');
  await backup(db, destination);
  db.close();
  const check = new DatabaseSync(destination, { readOnly: true });
  const guard = tables.includes('focus_settings')
    ? JSON.parse(check.prepare('SELECT json FROM focus_settings WHERE id=1').get().json)
    : null;
  check.close();
  const result = {
    source,
    backup: destination,
    counts,
    guardEnabled: guard?.enabled === true,
    at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(output, 'baseline.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
