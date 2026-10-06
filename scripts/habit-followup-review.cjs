const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { withApp } = require('./electron-runtime.cjs');
const run = `habit-followup-${Date.now()}`;
const results = [];
let evidence;
async function metrics(page, id) {
  return page.locator(`[data-habit-id="${id}"]`).evaluate((row) => {
    const name = row.querySelector('.habit-title');
    const note = row.querySelector('.habit-slip-note');
    return {
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      row: row.getBoundingClientRect().toJSON(),
      title: name.getBoundingClientRect().toJSON(),
      note: note.getBoundingClientRect().toJSON(),
      open: note.open,
    };
  });
}
(async () => {
  await withApp(run, async ({ page: p, nav, directory, errors }) => {
    evidence = directory;
    const reason = 'A fictional review note about a disrupted routine. '.repeat(9);
    const id = await p.evaluate(async (reason) => {
      await window.habitAPI.addHabit({ name: 'Protect my evening routine', habit_type: 'avoid', frequency: 'daily', time_of_day: 'anytime' });
      const habit = (await window.habitAPI.getHabits()).find(h => h.name === 'Protect my evening routine');
      await window.habitAPI.recordHabit({ habitId: habit.id, logDate: new Date().toLocaleDateString('en-CA'), action: 'slip', reason });
      return habit.id;
    }, reason);
    await nav('Habits');
    await p.evaluate(() => { location.hash = '#/habits/today'; });
    const row = p.locator(`[data-habit-id="${id}"]`);
    await row.waitFor();
    for (const width of [1280, 800, 390]) {
      await p.setViewportSize({ width, height: 860 });
      await row.scrollIntoViewIfNeeded();
      await p.waitForTimeout(100);
      let m = await metrics(p, id);
      assert.ok(!m.open, 'Reason must start collapsed');
      const collapsed = m;
      await row.locator('.habit-slip-note summary').click();
      assert.equal(await row.locator('.habit-slip-note p').innerText(), reason.trim());
      m = await metrics(p, id);
      await p.screenshot({ path: path.join(directory, `habit-${width}-expanded.png`) });
      await row.locator('.habit-slip-note summary').click();
      await p.screenshot({ path: path.join(directory, `habit-${width}-collapsed.png`) });
      results.push({ flow: `Long slip reason at ${width}px`, passed: collapsed.title.width >= 150 && collapsed.title.height < 80 && collapsed.scroll <= width && m.title.width >= 150 && m.scroll <= width, collapsed, expanded: m });
    }
    await p.setViewportSize({ width: 1280, height: 860 });
    await row.getByRole('button', { name: 'Edit slip reason', exact: true }).click();
    const textbox = p.getByRole('textbox', { name: 'Slip reason', exact: true });
    assert.equal(await textbox.inputValue(), reason.trim());
    await p.getByRole('button', { name: 'Save', exact: true }).click();
    await p.getByRole('dialog').waitFor({ state: 'hidden' });
    const persisted = await p.evaluate(async (id) => (await window.habitAPI.getLogsByHabit(id))[0].slip_reason, id);
    assert.equal(persisted, reason.trim());
    results.push({ flow: 'Edit opens existing reason and saves it unchanged', passed: true });
    await nav('Home');
    const title = await p.locator('.home-page h1').innerText();
    for (const page of ['Tasks', 'Habits', 'Journal']) {
      await nav(page);
      await nav('Home');
      assert.equal(await p.locator('.home-page h1').innerText(), title);
    }
    await p.reload();
    await p.waitForTimeout(500);
    assert.equal(await p.locator('.home-page h1').innerText(), title);
    results.push({ flow: 'Home greeting remains stable after navigation and reload', passed: true });
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(directory, 'results.json'), JSON.stringify({ results, errors }, null, 2));
  });
  console.log(JSON.stringify({ evidence, results: results.map(({ flow, passed }) => ({ flow, passed })) }, null, 2));
  assert.ok(results.every(result => result.passed), 'One or more reviewer layout checks failed; see results.json');
})().catch(error => { console.error(error); process.exitCode = 1; });
