const { chromium } = require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/** Actual Electron preload/SQLite review runner; no persistence mocks. */
async function withApp(name, test, executable = 'node_modules/electron/dist/electron.exe') {
  const directory = path.resolve('.review', name);
  fs.mkdirSync(directory, { recursive: true });
  const env = { ...process.env, HABIT_TRACKER_DATA_DIR: directory };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.VITE_DEV_SERVER_URL;
  const port = 9400 + Math.floor(Math.random() * 5000);
  const args = [`--remote-debugging-port=${port}`];
  if (executable.startsWith('node_modules')) args.push('.');
  const child = spawn(path.resolve(executable), args, { env, windowsHide: true });
  child.stderr.on('data', b => console.log('ELECTRON', b.toString()));
  let browser;
  try {
    for (let i = 0; i < 60; i++) {
      try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); break; }
      catch { await new Promise(resolve => setTimeout(resolve, 250)); }
    }
    if (!browser) throw new Error('Electron CDP did not start');
    const context = browser.contexts()[0];
    for (let i = 0; !context.pages().length && i < 60; i++) await new Promise(r => setTimeout(r, 250));
    const page = context.pages()[0];
    if (!page) throw new Error('Electron renderer did not open');
    page.setDefaultTimeout(7000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);
    await page.setViewportSize({ width: 1280, height: 860 });
    const nav = async label => {
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: label, exact: true }).click();
      await page.waitForTimeout(150);
    };
    await test({ page, nav, directory, errors });
  } finally {
    if (browser) await browser.close();
    if (child.exitCode === null) {
      const closed = new Promise(resolve => child.once('exit', resolve));
      child.kill();
      await Promise.race([closed, new Promise(resolve => setTimeout(resolve, 2000))]);
    }
  }
}
module.exports = { withApp };
