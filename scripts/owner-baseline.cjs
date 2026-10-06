// Consistent local safety copy before an authorized installed-app update. No content printed.
const {DatabaseSync,backup}=require('node:sqlite');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
  const source=path.join(process.env.APPDATA,'habit-tracker','habits.db');
  const directory=path.resolve('.review',`owner-upgrade-${Date.now()}`);fs.mkdirSync(directory,{recursive:true});
  const db=new DatabaseSync(source,{readOnly:true});
  try{
    const state=JSON.parse(db.prepare('SELECT json FROM productivity_state WHERE id=1').get().json);
    if(state.timer.startedAt!==null)throw Error('An unfinished owner timer exists; preserve it and stop the upgrade.');
    const safety=path.join(directory,'before-upgrade.db');await backup(db,safety);
    const counts={};for(const {name} of db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%fts%'").all())counts[name]=db.prepare(`SELECT COUNT(*) n FROM "${name}"`).get().n;
    const file=path.join(directory,'baseline.json');fs.writeFileSync(file,JSON.stringify({at:new Date().toISOString(),source,backup:safety,counts},null,2));
    console.log(JSON.stringify({baseline:file,counts}));
  }finally{db.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
