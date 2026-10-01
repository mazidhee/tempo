const {withApp}=require('./electron-runtime.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
withApp('review-fixes-'+Date.now(),async({page,nav:baseNav,directory,errors})=>{
 const nav=async(label)=>{const link=page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:label,exact:true});if(!(await link.isVisible()))await page.getByRole('button',{name:'Toggle Sidebar',exact:true}).click();await baseNav(label);};
 const captures=[];
 for(const width of [1280,390])for(const theme of ['Dark','Light']){
  await page.setViewportSize({width,height:860});await nav('Settings');await page.getByRole('navigation',{name:'Settings sections'}).getByRole('button',{name:'General',exact:true}).click();await page.getByRole('button',{name:theme,exact:true}).click();await page.getByRole('navigation',{name:'Settings sections'}).getByRole('button',{name:'Reflection reminders',exact:true}).click();
  await page.getByLabel('morning reminder time',{exact:true}).fill('08:45');await page.getByRole('button',{name:'Save reminder settings',exact:true}).click();
  const geometry=await page.locator('.reflection-reminder-row').evaluateAll(rows=>rows.map(row=>{const label=row.querySelector('label'),input=row.querySelector('input');return {label:label.textContent,width:label.getBoundingClientRect().width,height:label.getBoundingClientRect().height,input:input.getBoundingClientRect().width,row:row.getBoundingClientRect().width};}));
  assert.ok(geometry.every(g=>g.width>=80&&g.height<=48&&g.input>=100&&g.input<180),JSON.stringify(geometry));
  const file=`reminders-${theme.toLowerCase()}-${width}.png`;await page.screenshot({path:path.join(directory,file)});captures.push({file,geometry});
  await page.getByRole('navigation',{name:'Settings sections'}).getByRole('button',{name:'Focus',exact:true}).click();
  const switches=await page.locator('.focus-setting-row').evaluateAll(rows=>rows.map(row=>{const r=row.getBoundingClientRect(),b=row.querySelector('button').getBoundingClientRect();return {rowRight:r.right,buttonRight:b.right};}));assert.ok(switches.every(s=>Math.abs(s.rowRight-s.buttonRight)<3),JSON.stringify(switches));
  await page.screenshot({path:path.join(directory,`focus-settings-${theme.toLowerCase()}-${width}.png`)});
  await nav('Tasks');await page.getByLabel('Quick add task').fill('Accessible actions');await page.getByLabel('Quick add task').press('Enter');
  const action=page.getByRole('button',{name:'Edit Accessible actions',exact:true}).first();const box=await action.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width,JSON.stringify(box));await action.click();await page.getByRole('heading',{name:'Edit task',exact:true}).waitFor();await page.getByRole('button',{name:'Save task',exact:true}).click();
  await page.screenshot({path:path.join(directory,`tasks-${theme.toLowerCase()}-${width}.png`)});
  await page.getByRole('button',{name:'Start focus session for Accessible actions',exact:true}).first().click();await page.getByRole('heading',{name:'Focus',exact:true}).waitFor();await nav('Tasks');await page.getByRole('button',{name:'Delete Accessible actions',exact:true}).first().click();await page.getByRole('button',{name:'Delete task',exact:true}).click();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(directory,'result.json'),JSON.stringify({captures,errors},null,2));console.log(JSON.stringify({directory,captures,errors},null,2));
}).catch(e=>{console.error(e);process.exitCode=1;});
