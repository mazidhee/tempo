const fs=require('node:fs'),path=require('node:path');
const {withApp}=require('./electron-runtime.cjs');
const fixture='ux-update-review-1790938564849';
const dir=path.resolve('.review',fixture);
const {chosen}=JSON.parse(fs.readFileSync(path.join(dir,'selected-topics.json'),'utf8'));
withApp(fixture,async({page})=>{
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Focus',exact:true}).click();
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Choose focus link',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await dialog.getByRole('combobox',{name:/^Search /}).fill(chosen.title);
 await page.screenshot({path:path.join(dir,'picker-long-narrow.png')});
 console.log(await dialog.evaluate(e=>({viewport:innerWidth,dialogWidth:e.getBoundingClientRect().width,scrollWidth:e.scrollWidth})));
 await page.keyboard.press('Escape'); await dialog.waitFor({state:'hidden'});
}).catch(e=>{console.error(e);process.exitCode=1;});
