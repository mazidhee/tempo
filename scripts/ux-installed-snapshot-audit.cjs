// Read only the two explicitly retained, consistent backup files. Never opens owner DB.
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const files=['.install-check/personal-upgrade-1790939476565/before.db','.install-check/personal-upgrade-1790939824685/before.db'].map(f=>path.resolve(f));
function read(file){const db=new DatabaseSync(file,{readOnly:true});try{
 const p=JSON.parse(db.prepare('SELECT json FROM productivity_state WHERE id=1').get().json);
 const tables=['habits','habit_logs','study_curricula','study_topics','study_imports','reflection_reviews','focus_break_events'];
 const rows=Object.fromEntries(tables.map(t=>[t,db.prepare(`SELECT * FROM ${t}`).all()]));
 return {file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),integrity:db.prepare('PRAGMA integrity_check').get(),settings:{name:p.settings.name,accent:p.settings.accent,theme:p.settings.theme},guard:JSON.parse(db.prepare('SELECT json FROM focus_settings WHERE id=1').get().json),tasks:p.tasks.map(t=>({id:t.id,title:t.title})),sessionIds:p.sessions.map(t=>t.id),rows};
}finally{db.close();}}
const snapshots=files.map(read);
const differences=Object.fromEntries(Object.keys(snapshots[0].rows).map(table=>{
 const key=table==='reflection_reviews'?'start':'id';const a=snapshots[0].rows[table],b=snapshots[1].rows[table];
 const keys=new Set(b.map(r=>r[key]));const shared=a.filter(r=>keys.has(r[key]));return[table,{before:a.length,after:b.length,shared:shared.length,missingKeys:a.filter(r=>!keys.has(r[key])).map(r=>r[key]),changedShared:shared.filter(r=>JSON.stringify(r)!==JSON.stringify(b.find(s=>s[key]===r[key]))).length}];
}));
const result={at:new Date().toISOString(),snapshots,differences};
fs.writeFileSync(path.resolve('.review/ux-installed-snapshot-audit.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({snapshots:snapshots.map(({rows,guard,...s})=>({...s,guardEnabled:guard?.settings?.enabled??guard?.enabled})),differences:Object.fromEntries(Object.entries(differences).map(([table,{missingKeys,...counts}])=>[table,{...counts,missingCount:missingKeys.length,missingSample:missingKeys.slice(0,4)}]))},null,2));
