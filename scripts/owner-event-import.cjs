// Explicit user-authorized local CSV import. Private input/evidence stay outside source history.
const {_electron}=require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const file=process.argv[2],evidence=process.argv[3];
if(!file||!evidence)throw Error('Supply private CSV and evidence directory.');
const executablePath=path.join(process.env.LOCALAPPDATA,'Programs','Tempo','Habit Tracker.exe');
const env={...process.env};for(const k of ['HABIT_TRACKER_DATA_DIR','ELECTRON_RUN_AS_NODE','VITE_DEV_SERVER_URL'])delete env[k];
let app;
const launch=async()=>{app=await _electron.launch({executablePath,env,timeout:30000});assert.equal(await app.evaluate(({app})=>app.getVersion()),require('../package.json').version);assert.equal(await app.evaluate(({app})=>app.getPath('userData')),path.join(process.env.APPDATA,'habit-tracker'));const p=await app.firstWindow();await p.waitForLoadState('domcontentloaded');return p;};
(async()=>{
  let p=await launch();const before=await p.evaluate(()=>window.habitAPI.getHabitSnapshot());
  const matches=before.habits.filter(h=>h.name.trim().toLowerCase()==='rehab');assert.equal(matches.length,1,'Exactly one Rehab target required');assert.equal(matches[0].habit_type,'avoid');
  const csv=fs.readFileSync(path.resolve(file),'utf8');
  const result=await p.evaluate(({id,csv})=>window.habitAPI.importHabitEvents(id,csv),{id:matches[0].id,csv});
  const after=await p.evaluate(()=>window.habitAPI.getHabitSnapshot());assert.deepEqual(after.habits,before.habits);assert.deepEqual(after.logs,before.logs);
  const events=after.events.filter(e=>e.habit_id===matches[0].id);assert.ok(events.length>=66,'All supplied matching events must exist');
  const retry=await p.evaluate(({id,csv})=>window.habitAPI.importHabitEvents(id,csv),{id:matches[0].id,csv});assert.equal(retry.imported,0);assert.equal(retry.duplicates,66);
  await p.evaluate(()=>window.workspaceAPI.invoke('backup:local'));
  await app.close();app=null;await new Promise(r=>setTimeout(r,700));p=await launch();
  const reopened=await p.evaluate(()=>window.habitAPI.getHabitSnapshot());assert.deepEqual(reopened.events,after.events);assert.deepEqual(reopened.logs,before.logs);assert.deepEqual(reopened.habits,before.habits);
  await p.evaluate(id=>{location.hash='#/habits/'+id},matches[0].id);await p.getByRole('heading',{name:'Recorded events',exact:true}).waitFor();
  const report={at:new Date().toISOString(),version:require('../package.json').version,result,repeatSafe:true,events:events.length,distinctDays:new Set(events.map(e=>e.occurred_at.slice(0,10))).size,existingHabitsAndLogsPreserved:true,restartVerified:true,localSnapshotSaved:true};
  fs.writeFileSync(path.join(evidence,'event-import-acceptance.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1}).finally(async()=>{if(app)await app.close();});
