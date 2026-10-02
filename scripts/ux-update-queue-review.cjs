const fs = require('node:fs');
const path = require('node:path');
const { _electron } = require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const dir = path.resolve('.review', `ux-update-queue-${Date.now()}`);
fs.mkdirSync(dir, { recursive: true });
fs.cpSync('dist-electron', path.join(dir, 'dist-electron'), { recursive: true });
fs.cpSync('dist', path.join(dir, 'dist'), { recursive: true });
const entry = path.join(dir, 'queue-probe.cjs');
fs.writeFileSync(entry, `const {ipcMain}=require('electron'); const handle=ipcMain.handle.bind(ipcMain);
ipcMain.handle=(channel,handler)=>handle(channel,channel==='productivity:save'?async(...args)=>{await new Promise(r=>setTimeout(r,200));return handler(...args);}:handler);
require('./dist-electron/main/index.js');`);
const env={...process.env,HABIT_TRACKER_DATA_DIR:dir}; delete env.ELECTRON_RUN_AS_NODE; delete env.VITE_DEV_SERVER_URL;
(async()=>{
 let app;
 try {
  app=await _electron.launch({executablePath:path.resolve('node_modules/electron/dist/electron.exe'),args:[entry],env});
  const page=await app.firstWindow(); page.setDefaultTimeout(7000); await page.waitForTimeout(1000);
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Settings',exact:true}).click();
  const layouts=[];
  for(const width of [1280,800,390]) {
   await page.setViewportSize({width,height:860});
   await page.getByRole('group',{name:'Surface palettes'}).scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(dir,`settings-${width}.png`)});
   layouts.push(await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,mainWidth:document.querySelector('.settings-shell').getBoundingClientRect().width,settings:document.querySelector('.settings-layout').getBoundingClientRect().width,mainClient:document.querySelector('#main-content').clientWidth,mainScroll:document.querySelector('#main-content').scrollWidth,controls:[...document.querySelectorAll('.theme-tabs, .accent-grid')].map(e=>({client:e.clientWidth,scroll:e.scrollWidth}))})));
  }
  await page.setViewportSize({width:1280,height:860});
  const input=page.getByPlaceholder('Your first name');
  await input.fill(''); await page.waitForTimeout(500);
  const expected='Divine Reviewer Long Name';
  await page.evaluate(()=>window.workspaceAPI.invoke('focus:command',{action:'configure',timerMode:'stopwatch'}));
  await Promise.all([input.pressSequentially(expected,{delay:25}), (async()=>{await page.waitForTimeout(250);await page.evaluate(()=>window.workspaceAPI.invoke('focus:command',{action:'start'}));})()]);
  for(const name of ['Slate','Dusk','Forest']) await page.getByRole('group',{name:'Surface palettes'}).getByRole('button',{name:new RegExp(`^${name}`)}).click();
  for(const name of ['Terracotta','Cedar']) await page.getByRole('group',{name:'Accent color'}).getByRole('button',{name,exact:true}).click();
  await page.waitForTimeout(6500);
  const typed=await input.inputValue();
  const snapshot=await page.evaluate(()=>window.workspaceAPI.invoke('focus:snapshot'));
  await page.reload(); await page.waitForTimeout(500);
  const reloaded=await input.inputValue();
  const actual=await page.evaluate(()=>window.workspaceAPI.invoke('focus:snapshot'));
  await page.evaluate(()=>window.workspaceAPI.invoke('focus:command',{action:'stop'}));
  const result={fixtureSaveLatencyMs:200,expected,typed,persisted:snapshot.productivity.settings.name,reloaded,palette:actual.productivity.settings.themePalette,accent:actual.productivity.settings.accent,authoritativeTimerRunning:!!actual.productivity.timer.stopwatch.runningSince,layouts};
  fs.writeFileSync(path.join(dir,'queue-results.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({dir,...result},null,2));
 } finally {if(app)await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
