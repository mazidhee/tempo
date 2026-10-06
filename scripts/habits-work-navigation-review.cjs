const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { _electron } = require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const evidence=path.resolve('.review',`habits-work-navigation-${Date.now()}`);
fs.mkdirSync(evidence,{recursive:true});
const env={...process.env,HABIT_TRACKER_DATA_DIR:evidence};delete env.ELECTRON_RUN_AS_NODE;delete env.VITE_DEV_SERVER_URL;
(async()=>{
 const app=await _electron.launch({executablePath:path.resolve('node_modules/electron/dist/electron.exe'),args:['.'],env,timeout:25000});
 try{
  const p=await app.firstWindow();p.setDefaultTimeout(7000);await p.waitForLoadState('domcontentloaded');await p.waitForTimeout(500);
  await p.evaluate(()=>{location.hash='#/tasks?view=All'});await p.getByRole('heading',{name:'All tasks',exact:true}).waitFor();
  await p.getByRole('button',{name:'Trash',exact:true}).click();await p.getByRole('heading',{name:'Trash',exact:true}).waitFor();
  await p.goBack();await p.waitForTimeout(300);
  const actual={url:p.url(),heading:await p.locator('main h1').innerText()};
  await p.screenshot({path:path.join(evidence,'task-view-after-back.png')});
  fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify(actual,null,2));console.log(JSON.stringify({evidence,...actual}));
  assert.equal(actual.heading,'All tasks');
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
