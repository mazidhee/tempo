const {withApp}=require('./electron-runtime.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>await withApp(`independent-narrow-tasks-${Date.now()}`,async({page,nav:baseNav,directory,errors})=>{
 const nav=async(label)=>{const link=page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:label,exact:true});if(!(await link.isVisible()))await page.getByRole('button',{name:'Toggle Sidebar',exact:true}).click();await baseNav(label);};
 await page.setViewportSize({width:390,height:720});await nav('Tasks');
 await page.getByLabel('Quick add task').fill('Narrow reading review');await page.getByLabel('Quick add task').press('Enter');
 const bounds=[];
 for(const name of ['Start focus session for Narrow reading review','Edit Narrow reading review','Delete Narrow reading review']){const button=page.getByRole('button',{name,exact:true});await button.waitFor();const b=await button.boundingBox();assert.ok(b.x>=0&&b.x+b.width<=391,`${name} outside viewport`);bounds.push({name,...b});}
 await page.getByRole('button',{name:'Edit Narrow reading review',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByLabel('Project',{exact:true}).fill('Reading');await dialog.getByRole('combobox',{name:/^Priority/}).selectOption('high');await dialog.getByRole('button',{name:'Save task',exact:true}).click();await dialog.waitFor({state:'hidden'});
 await page.screenshot({path:path.join(directory,'tasks-narrow-actions.png')});
 await page.getByRole('button',{name:'Start focus session for Narrow reading review',exact:true}).click();await page.getByRole('heading',{name:'Focus',exact:true}).waitFor();assert.equal((await page.evaluate(()=>window.workspaceAPI.invoke('focus:snapshot'))).productivity.timer.link.name,'Narrow reading review');await page.evaluate(()=>window.workspaceAPI.invoke('focus:command',{action:'stop'}));
 await nav('Tasks');await page.getByRole('button',{name:'Delete Narrow reading review',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Delete task',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(await page.getByRole('button',{name:'Edit Narrow reading review',exact:true}).count(),0);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(directory,'result.json'),JSON.stringify({bounds,checks:['390px actions initially inside viewport','narrow edit and metadata','narrow task Focus link','narrow deletion'],errors},null,2));console.log(directory);
},'release/desktop/win-unpacked/Habit Tracker.exe'))().catch(e=>{console.error(e);process.exitCode=1;});
