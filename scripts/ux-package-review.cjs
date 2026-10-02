const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const {withApp}=require('./electron-runtime.cjs');
const executable=path.resolve('release/desktop/win-unpacked/Habit Tracker.exe');
const run=`ux-package-review-${Date.now()}`,dir=path.resolve('.review',run);
const invoke=(page,channel,input)=>page.evaluate(({channel,input})=>window.workspaceAPI.invoke(channel,input),{channel,input});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<100;i++){if(await fn())return;await sleep(60);}throw Error('Package state did not settle');}
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let chosen,day; const checks=[];
(async()=>{
 await withApp(run,async({page,nav,errors})=>{
  const imports=[['Software engineering','software-engineering.md'],['Mathematics','mathematics.md'],['Economics & markets','economics-markets.md']].map(([title,file])=>({title,markdown:fs.readFileSync(path.resolve('src/renderer/assets/curricula',file),'utf8')}));
  await invoke(page,'study:importOutlines',imports); const study=await invoke(page,'study:snapshot');assert.equal(study.topics.length,1823);
  await invoke(page,'study:importOutlines',imports);assert.equal((await invoke(page,'study:snapshot')).topics.length,1823);checks.push('1823 real bundled topics; repeated source import idempotent');
  chosen=study.topics.filter(t=>study.topics.filter(s=>s.title===t.title).length===1).sort((a,b)=>b.title.length-a.title.length)[0];
  await nav('Plan');day=await page.getByLabel('Plan date').inputValue();await page.getByRole('button',{name:'Add study topic',exact:true}).click();
  const dialog=page.getByRole('dialog');assert.equal(await dialog.locator('[cmdk-list] [cmdk-item]').count(),30);
  await dialog.getByRole('combobox',{name:/^Search /}).fill(chosen.title);await dialog.getByLabel('Filter collection').selectOption(chosen.curriculumId);
  await until(async()=>await dialog.locator('[cmdk-list] [cmdk-item]').count()===1);
  await dialog.getByRole('combobox',{name:/^Search /}).focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await dialog.waitFor({state:'hidden'});
  await until(async()=>(await invoke(page,'plan:snapshot')).plans.find(p=>p.date===day)?.studyTopicIds.includes(chosen.id));
  await page.locator('.plan-study-row').getByRole('button',{name:'Start focus',exact:true}).click();await until(async()=>(await invoke(page,'focus:snapshot')).productivity.timer.deadline!==null);
  assert.equal((await invoke(page,'focus:snapshot')).productivity.timer.link.id,chosen.id);
  const started=Date.now();await page.getByRole('button',{name:'Pause',exact:true}).click();await until(async()=>(await invoke(page,'focus:snapshot')).productivity.timer.deadline===null);assert.ok(Date.now()-started<900);
  await invoke(page,'focus:command',{action:'stop'});checks.push('bounded keyboard/curriculum Plan picker, automatic save, linked Focus start and responsive Pause');
  await nav('Settings');await page.getByPlaceholder('Your first name').fill('Divine');await page.getByRole('group',{name:'Surface palettes'}).getByRole('button',{name:/^Graphite/}).click();await page.getByRole('group',{name:'Accent color'}).getByRole('button',{name:'Cedar',exact:true}).click();
  await until(async()=>{const s=(await invoke(page,'focus:snapshot')).productivity.settings;return s.name==='Divine'&&s.themePalette==='graphite'&&s.accent==='cedar';});
  await page.setViewportSize({width:800,height:860});await page.getByRole('group',{name:'Surface palettes'}).scrollIntoViewIfNeeded();assert.ok(await page.locator('#main-content').evaluate(e=>e.scrollWidth<=e.clientWidth));await page.screenshot({path:path.join(dir,'settings-800.png')});
  await page.getByRole('navigation',{name:'Settings sections'}).getByRole('button',{name:'User guide',exact:true}).click();assert.match(await page.locator('.user-guide').textContent(),/Windows 1\.4/);assert.match(await page.locator('.user-guide').textContent(),/30 results/);checks.push('palette/accent/name stored, 800px Settings fits, offline1.4guide rendered');
  await page.setViewportSize({width:1280,height:860});await nav('Focus');await page.getByRole('button',{name:'Toggle Sidebar',exact:true}).click();await page.waitForTimeout(220);await page.screenshot({path:path.join(dir,'focus-collapsed.png')});
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/^https?:/.test(r.name))),[]);checks.push('collapsed sidebar, no renderer errors, no remote resources');
 },executable);
 await withApp(run,async({page})=>{const s=(await invoke(page,'focus:snapshot')).productivity.settings;assert.equal(s.name,'Divine');assert.equal(s.themePalette,'graphite');assert.equal(s.accent,'cedar');assert.equal((await invoke(page,'study:snapshot')).topics.length,1823);assert.ok((await invoke(page,'plan:snapshot')).plans.find(p=>p.date===day).studyTopicIds.includes(chosen.id));checks.push('actual package restart preserves profile/palette/accent/1823topics/Plan selection');},executable);
 const result={run,executable,exeSha256:hash(executable),asarSha256:hash(path.join(path.dirname(executable),'resources/app.asar')),checks,passed:checks.length};fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({dir,...result},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
