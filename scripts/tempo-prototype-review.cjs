const { withApp } = require('./electron-runtime.cjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const directory = path.resolve('.review', `tempo-options-${Date.now()}`);
fs.mkdirSync(directory, { recursive: true });
const screens = ['Tasks','Plan','Habits','History','Recovery','Work','Focus','Search','Home','Study','Statistics','Goals','Journal','Review','Settings'];
(async () => {
  await withApp(`tempo-prototype-${Date.now()}`, async ({ page }) => {
    const errors = [], checks = [], sizes = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5220/');
    await page.evaluate(() => document.fonts.ready);
    for (const width of [1440, 800, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      if (width === 390) await page.evaluate(() => document.documentElement.classList.add('light'));
      for (const screen of screens) {
        await page.evaluate(s => navigate(s), screen);
        for (let option = 0; option < 5; option++) {
          await page.locator(`[data-option="${option}"]`).click();
          const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, headings: document.querySelectorAll('h1').length }));
          assert.ok(size.document <= size.viewport + 1, `${screen} ${option} overflow at ${width}: ${size.document}`);
          assert.equal(size.headings, 1);
          sizes.push({ screen, option, width, ...size });
          if (width !== 800) await page.screenshot({ path: path.join(directory, `${screen.toLowerCase()}-${option}-${width}.png`), fullPage: false });
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => {navigate('Tasks'); option=0;render()});
    await page.getByRole('button', {name:'Review ingestion schema',exact:true}).click();
    await page.locator('#task-date').fill('2026-10-06');
    await page.locator('#task-time').fill('14:00');
    await page.getByRole('button', {name:'Save task',exact:true}).click();
    await page.evaluate(() => navigate('Plan'));
    assert.ok((await page.locator('.schedule-row').filter({hasText:'Review ingestion schema'}).innerText()).includes('14:00'));
    checks.push('Task inspector scheduling is reflected in Plan');
    await page.evaluate(() => {option=1;render()});
    assert.ok((await page.locator('.timeline').innerText()).includes('08:30'));
    assert.ok((await page.locator('.timeline').innerText()).includes('14:00'));
    checks.push('Time-block Plan includes initial and newly scheduled task times');
    await page.evaluate(() => {navigate('Habits');option=0;render()});
    assert.equal(await page.locator('.habit-row').count(), 6);
    await page.getByRole('button', {name:'Meditate',exact:true}).first().click();
    // This button is the check-in and has aria-label Meditate; the name link is separate.
    await page.evaluate(() => navigate('Habits'));
    assert.equal(await page.locator('.habit-row .check.checked').count(), 2);
    checks.push('Flat habits check directly, without section expansion');
    await page.evaluate(() => {option=3;render()});
    assert.equal(await page.locator('.habit-tracking .check').count(), 6);
    checks.push('Tracking-table Habits retains every direct check-in');
    await page.evaluate(() => navigate('Recovery'));
    await page.locator('[data-action="recover"]').first().click();
    assert.equal(await page.locator('[data-action="recover"][disabled]').count(), 1);
    checks.push('Recovery is a distinct destination with direct actions');
    await page.evaluate(() => {navigate('Search');option=0;render()});
    await page.locator('#page-search').fill('Python');
    assert.equal(await page.locator('.search-result').count(), 1);
    assert.equal(await page.locator('.search-field:visible').count(), 1);
    checks.push('Defined top search field filters results');
    await page.setViewportSize({width:390,height:1000});
    await page.evaluate(() => {navigate('Review');option=0;render()});
    assert.equal(await page.locator('.responsive-chart figcaption').innerText(), 'Focus · minutes');
    assert.equal(await page.locator('.chart-x').evaluate(el => getComputedStyle(el).fontSize), '11px');
    checks.push('Narrow chart retains visible units and unscaled axis labels');
    await page.setViewportSize({width:1440,height:1000});
    await page.evaluate(() => {navigate('Tasks');option=0;render()});
    await page.locator('[data-task-id="2"]').dragTo(page.locator('.column[data-column="doing"]'));
    assert.equal(await page.locator('.column[data-column="doing"] [data-task-id="2"]').count(), 1);
    checks.push('Kanban card drag updates the column');
    await page.evaluate(() => {navigate('Journal');option=0;render()});
    await page.getByRole('textbox', {name:'Journal writing page'}).fill('An open writing canvas.');
    assert.equal(await page.locator('#journal-state').innerText(), 'Edited in preview');
    checks.push('Journal writes directly in the normal page');
    await page.locator('#pick').click();
    await page.reload();
    assert.equal(await page.locator('#choice-count').innerText(), '1');
    checks.push('Screen choice survives preview reload');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(directory, 'results.json'), JSON.stringify({ checks, sizes, errors }, null, 2));
    console.log(JSON.stringify({directory,checks,compositions:sizes.length,errors}));
  });
})().catch(error => {console.error(error);process.exitCode=1});
