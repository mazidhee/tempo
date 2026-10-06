const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { _electron } = require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const name = `habits-work-review-${Date.now()}`;
const evidence = path.resolve('.review', name);
const results = [];
let activePage, today, expectedThought, workId, taskId, backup;
async function withApp(name, callback) {
  const directory = path.resolve('.review', name);
  fs.mkdirSync(directory, {recursive:true});
  const env = {...process.env, HABIT_TRACKER_DATA_DIR:directory};
  delete env.ELECTRON_RUN_AS_NODE;delete env.VITE_DEV_SERVER_URL;
  const app=await _electron.launch({executablePath:process.env.TEMPO_REVIEW_EXE||path.resolve('node_modules/electron/dist/electron.exe'),args:process.env.TEMPO_REVIEW_EXE?[]:['.'],env,timeout:25000});
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(7000);await page.waitForLoadState('domcontentloaded');await page.waitForTimeout(500);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.setViewportSize({width:1280,height:860});
    await callback({page,errors,directory});
  }finally{await app.close();await new Promise(r=>setTimeout(r,700));}
}
const prod = p => p.evaluate(() => window.habitAPI.getProductivity());
const invoke = (p, channel, payload) => p.evaluate(({channel,payload}) => window.workspaceAPI.invoke(channel,payload), {channel,payload});
async function until(fn, message) { for (let i=0;i<70;i++) { if(await fn())return; await new Promise(r=>setTimeout(r,100)); } throw Error(message); }
async function route(p, hash) { await p.evaluate(hash=>{location.hash='#'+hash},hash); await p.waitForTimeout(250); }
async function check(flow, fn) { try { await fn(); results.push({flow,passed:true}); } catch(error) { results.push({flow,passed:false,error:error.stack}); console.log('FAIL',flow,error.message); await activePage.screenshot({path:path.join(evidence,`failure-${results.length}.png`)}).catch(()=>{}); await activePage.keyboard.press('Escape').catch(()=>{}); } fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify({results},null,2)); }
async function shot(p, label) {
  await p.locator('main').evaluate(el=>el.scrollTop=0);
  await p.screenshot({path:path.join(evidence,label+'.png')});
  const m=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,main:document.querySelector('main').scrollWidth,mainWidth:document.querySelector('main').clientWidth}));
  fs.writeFileSync(path.join(evidence,label+'.json'),JSON.stringify(m));
  assert.ok(m.scroll<=m.width, `${label} document overflow ${m.scroll}/${m.width}`);
}
async function theme(p,value) { await p.evaluate(async value=>{const s=await window.habitAPI.getProductivity(); await window.habitAPI.saveProductivity({...s,settings:{...s.settings,theme:value,themePalette:'graphite'}});},value); await p.reload(); await p.waitForTimeout(500); }
(async()=>{
 await withApp(name,async({page:p,nav,errors})=>{
  activePage=p;
  today=await p.evaluate(()=>new Date().toLocaleDateString('en-CA'));
  const habitIds=await p.evaluate(async()=>{
    const inputs=[{name:'Protect my evening routine',habit_type:'avoid'}, {name:'Read a chapter',habit_type:'check'}, {name:'Drink enough water',habit_type:'quantity',quantity_target:2000,quantity_unit:'ml'}];
    for(const h of inputs)await window.habitAPI.addHabit({...h,frequency:'daily',time_of_day:'anytime'});
    const all=await window.habitAPI.getHabits();
    const ids=inputs.map(h=>all.find(a=>a.name===h.name).id);
    await window.habitAPI.recordHabit({habitId:ids[0],logDate:new Date().toLocaleDateString('en-CA'),action:'slip',reason:'A fictional review note about a disrupted routine. '.repeat(9)});
    const s=await window.habitAPI.getProductivity(),old=new Date(Date.now()-40*86400000).toISOString();
    const make=(id,title,keep)=>({id,title,due:'',priority:'medium',project:'',tags:[],subtasks:[],createdAt:old,completedAt:old,keep,area:'personal'});
    await window.habitAPI.saveProductivity({...s,tasks:[...s.tasks,make('expired-review-task','Past task eligible for cleanup',false),make('keep-review-task','Keep my reference task',true)]});
    return ids;
  });
  await p.reload();await p.waitForTimeout(500);
  await check('30-day cleanup moves completed task into recoverable Trash; Keep remains',async()=>{
    const s=await prod(p);assert.ok(s.tasks.find(t=>t.id==='expired-review-task').trashedAt);assert.ok(!s.tasks.find(t=>t.id==='keep-review-task').trashedAt);
    await route(p,'/tasks?view=Trash');await p.getByRole('button',{name:'Restore Past task eligible for cleanup',exact:true}).click();
    await until(async()=>{const t=(await prod(p)).tasks.find(t=>t.id==='expired-review-task');return !t.trashedAt&&t.keep},'Restore/Keep not saved');
  });
  await check('Habit check-in: quantity threshold and actual streak detail match',async()=>{
    await route(p,'/habits/today');
    const row=p.locator(`[data-habit-id="${habitIds[1]}"]`);
    await row.getByRole('button',{name:'Complete habit Read a chapter',exact:true}).click();
    await row.getByRole('link',{name:/Read a chapter: current streak 1/}).waitFor();
    await row.getByRole('link',{name:/Read a chapter: current streak 1/}).click();
    await p.getByText('Current streak',{exact:true}).waitFor();
    await route(p,'/habits/today');
    const water=p.locator(`[data-habit-id="${habitIds[2]}"]`);
    for(let i=0;i<4;i++)await water.getByRole('button',{name:'Add 500 ml',exact:true}).click();
    await until(async()=>{const logs=await p.evaluate(id=>window.habitAPI.getLogsByHabit(id),habitIds[2]);return logs[0]?.quantity===2000&&logs[0]?.is_completed===1},'Quantity completion not saved');
  });
  await check('Slip reason preserved on edit; no medium title squeeze',async()=>{
    await route(p,'/habits/today');const row=p.locator(`[data-habit-id="${habitIds[0]}"]`);
    await row.getByRole('button',{name:'Edit slip reason',exact:true}).click();
    const text=p.getByRole('textbox',{name:'Slip reason',exact:true});const old=await text.inputValue();assert.ok(old.startsWith('A fictional review note'));
    await p.getByRole('button',{name:'Save',exact:true}).click();await p.getByRole('dialog').waitFor({state:'hidden'});
    assert.equal((await p.evaluate(id=>window.habitAPI.getLogsByHabit(id),habitIds[0]))[0].slip_reason,old);
    for(const width of [1440,800,390]){await p.setViewportSize({width,height:1000});await row.scrollIntoViewIfNeeded();
      const rect=await row.locator('.habit-title').boundingBox();assert.ok(rect.width>=150,`Title squeezed at ${width}: ${rect.width}`);
      await row.getByRole('button',{name:'Slip logged · View reason',exact:true}).click();assert.equal(await row.locator('.habit-expanded-slip').innerText(),old);
      await shot(p,`habits-expanded-light-${width}`);await row.getByRole('button',{name:'Slip logged · Hide reason',exact:true}).click();await shot(p,`habits-collapsed-light-${width}`);
    }
  });
  await p.setViewportSize({width:1440,height:1000});
  await check('Daily thoughts: add/edit/pause/reorder and fixed selected day',async()=>{
    await route(p,'/settings?section=thoughts');
    await p.getByRole('button',{name:'Add a thought',exact:true}).click();
    await p.locator('.thought-edit textarea').fill('I can make the next step small and deliberate.');
    await p.getByLabel('Attribution',{exact:true}).fill('My own words');
    await p.getByLabel('Evening reflection question').fill('Which deliberate step did I take?');
    await p.getByRole('button',{name:'Save thought',exact:true}).click();
    await until(async()=> (await prod(p)).settings.thoughtLibrary.entries.some(e=>e.text==='I can make the next step small and deliberate.'),'Custom thought not saved');
    let s=await prod(p),index=s.settings.thoughtLibrary.entries.findIndex(e=>e.text==='I can make the next step small and deliberate.')+1;
    await p.getByRole('button',{name:`Edit thought ${index}`,exact:true}).click();
    await p.locator('.thought-edit textarea').fill('I can make the next step small, calm and deliberate.');await p.getByRole('button',{name:'Save thought',exact:true}).click();
    await p.getByRole('button',{name:`Pause thought ${index}`,exact:true}).click();await p.getByRole('button',{name:`Resume thought ${index}`,exact:true}).click();
    await p.getByRole('button',{name:`Move thought ${index} up`,exact:true}).click();
    await p.getByRole('combobox',{name:'Thought Home display',exact:true}).selectOption('stoic');
    await route(p,'/');await p.locator('.home-reading h1').waitFor();expectedThought=await p.locator('.home-reading h1').innerText();
    s=await prod(p);const chosen=s.settings.thoughtLibrary.days.find(d=>d.date===today);assert.equal(chosen.text,expectedThought);
    await route(p,'/settings?section=thoughts');index=(await prod(p)).settings.thoughtLibrary.entries.findIndex(e=>e.id===chosen.id)+1;
    await p.getByRole('button',{name:`Edit thought ${index}`,exact:true}).click();await p.locator('.thought-edit textarea').fill('Changed for future days only.');await p.getByRole('button',{name:'Save thought',exact:true}).click();
    await route(p,'/');assert.equal(await p.locator('.home-reading h1').innerText(),expectedThought);
    await shot(p,'home-reading-light-1440');
  });
  await check('Reflect link opens dated Journal without overwriting existing writing',async()=>{
    await invoke(p,'journal:save',{date:today,text:'A fictional reflection that must survive.'});
    await route(p,'/');await p.getByRole('link',{name:'Reflect on this tonight',exact:true}).click();
    assert.ok(p.url().includes(`date=${today}`));assert.equal(await p.locator('.journal-thought > p').first().innerText(),expectedThought);
    await p.locator('.tiptap').filter({hasText:'A fictional reflection that must survive.'}).waitFor();
    const snap=await invoke(p,'plan:snapshot');assert.equal(snap.journal.find(e=>e.date===today).text,'A fictional reflection that must survive.');await shot(p,'journal-thought-light-1440');
  });
  await check('Work project, milestone edit/completion, linked task and focus',async()=>{
    await route(p,'/work');await p.getByRole('button',{name:'New project',exact:true}).click();await p.getByLabel('Project name',{exact:true}).fill('Reporting pipeline');
    await p.getByLabel('What are you working towards?',{exact:true}).fill('A reliable daily dataset for the team.');await p.getByRole('button',{name:'Create project',exact:true}).click();
    await p.getByRole('heading',{name:'Reporting pipeline',exact:true}).waitFor();workId=(await prod(p)).settings.workProjects.find(v=>v.title==='Reporting pipeline').id;
    await p.getByRole('textbox',{name:'New work milestone',exact:true}).fill('Deliver first validated dataset');await p.getByRole('button',{name:'Add',exact:true}).click();
    await p.getByRole('button',{name:'Edit milestone Deliver first validated dataset',exact:true}).click();await p.getByRole('textbox',{name:'New work milestone',exact:true}).fill('Deliver tested dataset');await p.getByRole('button',{name:'Save',exact:true}).click();
    await p.getByRole('button',{name:'Complete milestone Deliver tested dataset',exact:true}).click();
    await p.getByRole('button',{name:'Reopen milestone Deliver tested dataset',exact:true}).waitFor();
    await p.getByRole('link',{name:'Add or manage tasks',exact:true}).click();await p.getByRole('textbox',{name:'Quick add task',exact:true}).fill('Validate ingest schema');await p.getByRole('textbox',{name:'Quick add task',exact:true}).press('Enter');
    await until(async()=> (await prod(p)).tasks.some(t=>t.title==='Validate ingest schema'&&t.area==='work'&&t.workProjectId===workId),'Work link not saved');taskId=(await prod(p)).tasks.find(t=>t.title==='Validate ingest schema').id;
    await p.getByRole('button',{name:'Start focus session for Validate ingest schema',exact:true}).click();await p.getByRole('heading',{name:'Focus',exact:true}).waitFor();
    const snap=await invoke(p,'focus:snapshot');assert.equal(snap.productivity.timer.link.workProjectId,workId);assert.equal(snap.productivity.timer.link.area,'work');await invoke(p,'focus:command',{action:'stop'});
    await route(p,`/work?project=${workId}`);await shot(p,'work-light-1440');
  });
  await check('Tasks archive/restore/Trash and Keep preserve linked task',async()=>{
    await route(p,`/tasks?area=work&view=All&project=${workId}`);
    await p.getByRole('button',{name:'Edit Validate ingest schema',exact:true}).click();await p.getByRole('checkbox',{name:'Keep this task · exempt from automatic cleanup',exact:true}).check();await p.getByRole('button',{name:'Save task',exact:true}).click();
    await p.getByRole('button',{name:'Archive Validate ingest schema',exact:true}).click();await p.getByRole('button',{name:'Archived',exact:true}).click();await p.getByRole('button',{name:'Restore Validate ingest schema',exact:true}).click();
    await p.getByRole('button',{name:'All',exact:true}).click();await p.getByRole('button',{name:'Move to Trash Validate ingest schema',exact:true}).click();await p.getByRole('dialog').getByRole('button',{name:'Move to Trash',exact:true}).click();
    await p.getByRole('button',{name:'Trash',exact:true}).click();await p.getByRole('button',{name:'Restore Validate ingest schema',exact:true}).click();await p.getByRole('button',{name:'All',exact:true}).click();
    const task=(await prod(p)).tasks.find(t=>t.id===taskId);assert.ok(task.keep);assert.ok(!task.trashedAt&&!task.archivedAt);assert.equal(task.workProjectId,workId);await shot(p,'tasks-work-light-1440');
  });
  await check('Light/dark desktop, medium/narrow and collapsed/expanded sidebar',async()=>{
    for(const mode of ['light','dark']){
      await p.setViewportSize({width:1440,height:1000});await theme(p,mode);
      for(const width of [1440,800,390]){
        await p.setViewportSize({width,height:1000});
        for(const hash of ['/', '/habits/today', `/work?project=${workId}`, `/tasks?area=work&view=All&project=${workId}`, '/settings?section=thoughts']){
          await route(p,hash);await shot(p,`${hash==='/'?'home':hash.split('?')[0].replaceAll('/','-').slice(1)}-${mode}-${width}`);
        }
        if(width>=800){await p.getByRole('button',{name:'Toggle Sidebar',exact:true}).first().click();await route(p,'/habits/today');await shot(p,`habits-${mode}-${width}-sidebar-collapsed`);await p.getByRole('button',{name:'Toggle Sidebar',exact:true}).first().click();}
      }
    }
    await p.emulateMedia({reducedMotion:'reduce'});await route(p,'/habits/today');assert.equal(await p.locator('.streak-count').first().evaluate(e=>getComputedStyle(e).animationName),'none');
  });
  await check('Backup round trip preserves thoughts, Work projects, task lifecycle and Journal',async()=>{
    backup=await p.evaluate(()=>window.habitAPI.exportBackup());await p.evaluate(b=>window.habitAPI.importBackup(b),backup);
    const s=await prod(p);assert.equal(s.settings.thoughtLibrary.days.find(d=>d.date===today).text,expectedThought);assert.equal(s.settings.workProjects.find(w=>w.id===workId).milestones[0].title,'Deliver tested dataset');assert.ok(s.tasks.find(t=>t.id===taskId).keep);
    assert.deepEqual(errors,[]);
  });
 });
 await withApp(name,async({page:p,errors})=>{activePage=p;await check('Full-process restart retains selected thought, Work milestone, task Keep and Journal',async()=>{
   const s=await prod(p);assert.equal(s.settings.thoughtLibrary.days.find(d=>d.date===today).text,expectedThought);assert.equal(s.settings.workProjects.find(w=>w.id===workId).milestones[0].title,'Deliver tested dataset');assert.ok(s.tasks.find(t=>t.id===taskId).keep);assert.equal((await invoke(p,'plan:snapshot')).journal.find(j=>j.date===today).text,'A fictional reflection that must survive.');assert.deepEqual(errors,[]);
 });});
 console.log(JSON.stringify({evidence,results},null,2));if(results.some(r=>!r.passed))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
