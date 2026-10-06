const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {_electron}=require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const evidence=path.resolve('.review',`habit-final-composition-${Date.now()}`);fs.mkdirSync(evidence,{recursive:true});
const env={...process.env,HABIT_TRACKER_DATA_DIR:evidence};delete env.ELECTRON_RUN_AS_NODE;delete env.VITE_DEV_SERVER_URL;
(async()=>{const app=await _electron.launch({executablePath:process.env.TEMPO_REVIEW_EXE||path.resolve('node_modules/electron/dist/electron.exe'),args:process.env.TEMPO_REVIEW_EXE?[]:['.'],env,timeout:25000});
try{const p=await app.firstWindow();p.setDefaultTimeout(7000);await p.waitForLoadState('domcontentloaded');await p.waitForTimeout(400);
 const ids=await p.evaluate(async()=>{for(const h of [{name:'Protect my evening routine',habit_type:'avoid'},{name:'Read a chapter',habit_type:'check'},{name:'Drink enough water',habit_type:'quantity',quantity_target:2000,quantity_unit:'ml'}])await window.habitAPI.addHabit({...h,frequency:'daily',time_of_day:'anytime'});
  const all=await window.habitAPI.getHabits(),h=['Protect my evening routine','Read a chapter','Drink enough water'].map(name=>all.find(v=>v.name===name)),date=new Date().toLocaleDateString('en-CA');await window.habitAPI.recordHabit({habitId:h[0].id,logDate:date,action:'slip',reason:'A fictional review note about a disrupted routine. '.repeat(8)});await window.habitAPI.recordHabit({habitId:h[1].id,logDate:date,action:'complete'});await window.habitAPI.recordHabit({habitId:h[2].id,logDate:date,action:'quantity',amount:2000});return h.map(v=>v.id);});
 const results=[];
 for(const mode of ['dark','light']){
  await p.evaluate(async mode=>{const s=await window.habitAPI.getProductivity();await window.habitAPI.saveProductivity({...s,settings:{...s.settings,theme:mode,themePalette:'graphite'}})},mode);await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>location.hash='#/habits/today');await p.waitForTimeout(300);
  for(const width of [1440,800,390]){await p.setViewportSize({width,height:1000});await p.locator('main').evaluate(e=>e.scrollTop=0);
   const read=p.locator(`[data-habit-id="${ids[1]}"]`);const rect=await read.boundingBox();const row=p.locator(`[data-habit-id="${ids[0]}"]`);assert.ok((await row.locator('.habit-title').boundingBox()).width>=150);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await p.screenshot({path:path.join(evidence,`habits-${mode}-${width}.png`)});results.push({mode,width,checkRowHeight:rect.height});
   if(width===390){const menu=read.getByRole('button',{name:'Habit options',exact:true});await menu.focus();await p.keyboard.press('Enter');await p.getByRole('menuitem',{name:'Delete habit…',exact:true}).waitFor();await p.keyboard.press('Escape');assert.ok(await menu.evaluate(e=>e===document.activeElement));}
  }
 }
 await p.setViewportSize({width:800,height:1000});await p.getByRole('button',{name:'Toggle Sidebar',exact:true}).first().click();await p.screenshot({path:path.join(evidence,'habits-light-800-sidebar-collapsed.png')});
 fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify({passed:true,results},null,2));console.log(JSON.stringify({evidence,results},null,2));
}finally{await app.close();}})().catch(e=>{console.error(e);process.exitCode=1});
