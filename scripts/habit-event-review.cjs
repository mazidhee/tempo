const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {_electron}=require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const name=`habit-event-review-${Date.now()}`,evidence=path.resolve('.review',name);fs.mkdirSync(evidence,{recursive:true});
const results=[];let backup,sourceId,remappedId;
const csv='Category,Event,Occurrence,Note\n"Habits","Relapsed","2026-08-01 18:03:08","Fictional review note, with a comma."\n"Habits","Relapsed","2026-08-01 18:03:10","Fictional ""quoted"" note\nwith another line."\n"Habits","Relapsed","2026-10-01 10:00:00","A third fictional entry."\n"General","Other","2026-08-01 10:00:00","Unrelated fictional row."';
async function launch(suffix,fn){const dir=path.resolve('.review',name+suffix);fs.mkdirSync(dir,{recursive:true});const env={...process.env,HABIT_TRACKER_DATA_DIR:dir};delete env.ELECTRON_RUN_AS_NODE;delete env.VITE_DEV_SERVER_URL;
 const app=await _electron.launch({executablePath:process.env.TEMPO_REVIEW_EXE||path.resolve('node_modules/electron/dist/electron.exe'),args:process.env.TEMPO_REVIEW_EXE?[]:['.'],env,timeout:25000});
 try{const p=await app.firstWindow();p.setDefaultTimeout(7000);await p.waitForLoadState('domcontentloaded');await p.waitForTimeout(500);await p.setViewportSize({width:1440,height:1000});await fn(p);}finally{await app.close();await new Promise(r=>setTimeout(r,500));}}
async function route(p,url){await p.evaluate(url=>location.hash='#'+url,url);await p.waitForTimeout(300);}
async function check(label,p,fn){try{await fn();results.push({flow:label,passed:true});}catch(e){results.push({flow:label,passed:false,error:e.stack});await p.screenshot({path:path.join(evidence,`failure-${results.length}.png`)});console.log('FAIL',label,e.message);}fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify(results,null,2));}
async function shot(p,label){await p.screenshot({path:path.join(evidence,label+'.png')});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
(async()=>{
 await launch('',async p=>{
  await p.evaluate(async()=>{await window.habitAPI.addHabit({name:'Protect my evening routine',habit_type:'avoid',frequency:'daily',time_of_day:'anytime'});await window.habitAPI.addHabit({name:'Temporary review habit',habit_type:'check',frequency:'daily',time_of_day:'anytime'});});
  sourceId=(await p.evaluate(()=>window.habitAPI.getHabits())).find(h=>h.name==='Protect my evening routine').id;
  await p.evaluate(async id=>window.habitAPI.recordHabit({habitId:id,logDate:new Date().toLocaleDateString('en-CA'),action:'slip',reason:'A fictional existing check-in.'}),sourceId);
  const original=await p.evaluate(id=>window.habitAPI.getLogsByHabit(id),sourceId);
  await route(p,`/habits/${sourceId}`);
  await check('CSV preview, imported timestamps and concealed multiline notes',p,async()=>{
   const panel=p.locator('.habit-event-history');await panel.getByText('Import slip history',{exact:true}).click();await panel.getByLabel('CSV contents').fill(csv);
   await panel.getByText('3 selected entries across 2 days · 1 unrelated rows skipped',{exact:true}).waitFor();await panel.getByRole('button',{name:'Import into this habit',exact:true}).click();
   await panel.getByRole('status').filter({hasText:'3 entries imported · 0 already present · 1 unrelated rows skipped'}).waitFor();
   const events=(await p.evaluate(()=>window.habitAPI.getHabitSnapshot())).events;assert.equal(events.length,3);assert.equal(events.filter(e=>e.occurred_at.startsWith('2026-08-01')).length,2);assert.ok(events.some(e=>e.note.includes('"quoted" note\n')));
   assert.deepEqual(await p.evaluate(id=>window.habitAPI.getLogsByHabit(id),sourceId),original);
   assert.equal(await panel.getByRole('img').getAttribute('aria-label'),'Recorded events by month: 2026-08: 2; 2026-09: 0; 2026-10: 1');
   await panel.getByText('View timestamped history',{exact:true}).click();assert.equal(await panel.locator('.habit-event-list li p').first().isVisible(),false);
   await panel.locator('.habit-event-list li').nth(1).getByText('View note',{exact:true}).click();assert.equal(await panel.locator('.habit-event-list li').nth(1).locator('p').innerText(),'Fictional "quoted" note\nwith another line.');
   await panel.scrollIntoViewIfNeeded();await shot(p,'events-desktop');
   await p.setViewportSize({width:390,height:1000});await panel.scrollIntoViewIfNeeded();await shot(p,'events-narrow');await p.setViewportSize({width:1440,height:1000});
  });
  await check('Duplicate and invalid CSV import preserve prior records',p,async()=>{
   const panel=p.locator('.habit-event-history');await panel.getByLabel('CSV contents').fill(csv);await panel.getByRole('button',{name:'Import into this habit',exact:true}).click();await panel.getByRole('status').filter({hasText:'0 entries imported · 3 already present'}).waitFor();
   await panel.getByLabel('CSV contents').fill(csv.replace('18:03:08','99:03:08'));await panel.getByRole('alert').waitFor();assert.ok(await panel.getByRole('button',{name:'Import into this habit',exact:true}).isDisabled());assert.equal((await p.evaluate(()=>window.habitAPI.getHabitSnapshot())).events.length,3);
   backup=await p.evaluate(()=>window.habitAPI.exportBackup());assert.equal(backup.habitEvents.length,3);
  });
  await check('Recorded event chart and history remain readable in dark/narrow view',p,async()=>{
   await p.evaluate(async()=>{const s=await window.habitAPI.getProductivity();await window.habitAPI.saveProductivity({...s,settings:{...s.settings,theme:'dark',themePalette:'graphite'}});});await p.reload();await p.waitForTimeout(500);
   const panel=p.locator('.habit-event-history');await panel.getByText('View timestamped history',{exact:true}).click();
   for(const width of [1440,800,390]){await p.setViewportSize({width,height:1000});await panel.scrollIntoViewIfNeeded();await shot(p,`events-dark-${width}`);}
   await p.setViewportSize({width:1440,height:1000});
  });
  await check('Habit More supports keyboard discovery, cancellation and confirmed delete',p,async()=>{
   await route(p,'/habits/today');const id=(await p.evaluate(()=>window.habitAPI.getHabits())).find(h=>h.name==='Temporary review habit').id;const row=p.locator(`[data-habit-id="${id}"]`);const trigger=row.getByRole('button',{name:'Habit options',exact:true});await trigger.focus();await p.keyboard.press('Enter');
   await p.getByRole('menuitem',{name:'Delete habit…',exact:true}).waitFor();await p.getByRole('menuitem',{name:'Delete habit…',exact:true}).click();await p.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();assert.ok((await p.evaluate(()=>window.habitAPI.getHabits())).some(h=>h.id===id));
   await trigger.click();await p.getByRole('menuitem',{name:'Delete habit…',exact:true}).click();await p.getByRole('dialog').getByRole('button',{name:'Delete permanently',exact:true}).click();await p.getByRole('dialog').waitFor({state:'hidden'});assert.ok(!(await p.evaluate(()=>window.habitAPI.getHabits())).some(h=>h.id===id));
  });
 });
 await launch('-remap',async p=>{await check('Backup collision remaps event habit IDs and repeat import is idempotent',p,async()=>{
  await p.evaluate(()=>window.habitAPI.addHabit({name:'Unrelated existing habit',frequency:'daily',time_of_day:'anytime'}));await p.evaluate(b=>window.habitAPI.importBackup(b),backup);await p.evaluate(b=>window.habitAPI.importBackup(b),backup);
  const snap=await p.evaluate(()=>window.habitAPI.getHabitSnapshot());remappedId=snap.habits.find(h=>h.name==='Protect my evening routine').id;assert.notEqual(remappedId,sourceId);assert.equal(snap.events.length,3);assert.ok(snap.events.every(e=>e.habit_id===remappedId));assert.ok(!snap.events.some(e=>e.habit_id===1));assert.equal(snap.logs.filter(l=>l.habit_id===remappedId).length,1);
 });});
 await launch('-remap',async p=>{await check('Full-process restart preserves event times, notes and remapped link',p,async()=>{const s=await p.evaluate(()=>window.habitAPI.getHabitSnapshot());assert.equal(s.events.length,3);assert.ok(s.events.every(e=>e.habit_id===remappedId));assert.ok(s.events.some(e=>e.note==='Fictional "quoted" note\nwith another line.'));await route(p,`/habits/${remappedId}`);await p.getByRole('heading',{name:'Recorded events',exact:true}).waitFor();});});
 console.log(JSON.stringify({evidence,results},null,2));if(results.some(r=>!r.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
