const { withApp } = require('./electron-runtime.cjs');
const fs = require('node:fs');
const path = require('node:path');
const directory = path.resolve('.review', `habit-prototype-${Date.now()}`);
fs.mkdirSync(directory, { recursive: true });
(async () => {
  await withApp(`habit-prototype-browser-${Date.now()}`, async ({ page }) => {
    const results = [];
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5218/docs/prototypes/habits-next/');
    for (const width of [1440, 800, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const layout of ['a', 'b', 'c']) {
        await page.locator(`[data-layout="${layout}"]`).click();
        const sizes = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, titleWidths: [...document.querySelectorAll('.habit-row .name')].map(e => e.getBoundingClientRect().width) }));
        results.push({ width, layout, sizes });
        await page.screenshot({ path: path.join(directory, `habits-${layout}-${width}.png`), fullPage: true });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('[data-page="logos"]').click();
    await page.screenshot({ path: path.join(directory, 'logos.png'), fullPage: true });
    await page.locator('[data-page="thoughts"]').click();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const design of ['a', 'b', 'c', 'd', 'e']) {
        await page.locator(`[data-thought-design="${design}"]`).click();
        await page.screenshot({ path: path.join(directory, `thought-${design}-${width}.png`), fullPage: true });
      }
    }
    fs.writeFileSync(path.join(directory, 'results.json'), JSON.stringify({ results, errors }, null, 2));
    console.log(JSON.stringify({ directory, results, errors }));
  });
})().catch(error => { console.error(error); process.exitCode = 1; });
