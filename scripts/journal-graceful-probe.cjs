const {
  _electron,
} = require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const dir = path.resolve(
  '.review',
  process.env.REVIEW_RUN || `journal-graceful-quality-${Date.now()}`,
);
const executable = process.env.REVIEW_EXE || 'node_modules/electron/dist/electron.exe';
fs.mkdirSync(dir, { recursive: true });
const env = { ...process.env, HABIT_TRACKER_DATA_DIR: dir };
delete env.ELECTRON_RUN_AS_NODE;
delete env.VITE_DEV_SERVER_URL;
async function launch() {
  const app = await _electron.launch({
    executablePath: path.resolve(executable),
    args: executable.startsWith('node_modules') ? ['.'] : [],
    env,
  });
  const p = await app.firstWindow();
  await p.waitForTimeout(800);
  await p
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Journal', exact: true })
    .click();
  return { app, p };
}
(async () => {
  let { app, p } = await launch();
  const serif = p.getByRole('button', { name: 'Serif', exact: true });
  await serif.click();
  assert.equal(await serif.getAttribute('aria-pressed'), 'true');
  await p.screenshot({ path: dir + '/serif-before.png' });
  console.log('BEFORE', await p.evaluate(() => localStorage.getItem('tempo-journal-serif')));
  await app.evaluate(({ app }) => app.quit());
  await app.close();
  ({ app, p } = await launch());
  console.log('AFTER', await p.evaluate(() => localStorage.getItem('tempo-journal-serif')));
  assert.equal(
    await p.getByRole('button', { name: 'Serif', exact: true }).getAttribute('aria-pressed'),
    'true',
  );
  await p.screenshot({ path: dir + '/serif-after.png' });
  fs.writeFileSync(dir + '/results.json', JSON.stringify({ serifGracefulRestart: true }, null, 2));
  await app.evaluate(({ app }) => app.quit());
  await app.close();
  console.log('GRACEFUL SERIF PASS');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
