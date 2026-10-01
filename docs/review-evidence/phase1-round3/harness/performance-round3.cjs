const {withApp}=require('./runtime.cjs'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
withApp('performance-round3',async({page,nav,directory,errors})=>{
 const s=await page.evaluate(()=>window.habitAPI.getHabitSnapshot());assert.equal(s.habits.length,20);assert.equal(s.logs.length,7320);
 const timings=[];
 for(const route of ['Home','Statistics']){
  await nav(route);await page.waitForTimeout(700);
  let frames=await page.evaluate(()=>new Promise(resolve=>{const frame=[],ticks=[];let previous=performance.now(),tickPrevious=previous;const raf=()=>{let now=performance.now();frame.push(now-previous);previous=now;id=requestAnimationFrame(raf)};let id=requestAnimationFrame(raf);const timer=setInterval(()=>{let now=performance.now();ticks.push(now-tickPrevious);tickPrevious=now},20);setTimeout(()=>{cancelAnimationFrame(id);clearInterval(timer);let vals=frame.slice(2).sort((a,b)=>a-b),t=ticks.slice(2).sort((a,b)=>a-b);resolve({frames:vals.length,frameP95:vals[Math.floor(vals.length*.95)]||null,frameMax:vals.at(-1)||null,tickP95:t[Math.floor(t.length*.95)]||null,tickMax:t.at(-1)||null})},3000)}));timings.push({route,...frames});console.log(route,frames);await page.screenshot({path:path.join(directory,`${route.toLowerCase()}.png`),fullPage:true});
 }
 await nav('Habits');await page.getByRole('link',{name:'Year habit 1',exact:true}).click();await page.locator('.heat-cell[aria-label]').first().waitFor();assert.equal(await page.locator('.heat-cell[aria-label]').count(),365);await page.screenshot({path:path.join(directory,'detail.png'),fullPage:true});
 assert.equal(errors.length,0);fs.writeFileSync(path.join(directory,'results.json'),JSON.stringify({habits:20,logs:7320,timings,errors},null,2));
}).catch(err=>{console.error(err);process.exitCode=1});
