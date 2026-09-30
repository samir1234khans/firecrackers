import assert from 'node:assert/strict';
export const grandNames=['Aurora Crown','Ruby Dahlia','Sapphire Saturn','Phoenix Palm','Opal Supernova'];
export const classicIds=['gold-willow','multicolor-peony','chrysanthemum','silver-crossette-crackle','grand-finale'];
export const grandIds=['aurora-crown','ruby-dahlia','sapphire-saturn','phoenix-palm','opal-supernova'];
export const edgeShelf=(page,collection)=>page.locator(`[data-family-tray] [data-family-shelf="${collection}"]`);
export const dockShelf=edgeShelf;
export const selectedLaunch=page=>page.locator('[data-family-tray] [data-family-icon][aria-pressed="true"]');
export async function openPanel(page,variant){
 const overlay=await page.locator('main').getAttribute('data-overlay');
 if(overlay!=='controls')await page.getByRole('button',{name:'Controls',exact:true}).click();
 const labels={settings:'Settings',show:/^Show mode/,position:'Position',help:'Help'};
 await page.getByRole('button',{name:labels[variant],exact:true}).click();
}
export async function openPicker(page){await openPanel(page,'help');await page.getByRole('button',{name:'Browse firework catalog',exact:true}).click();}
export async function settingsTab(page,name){const tab=page.getByRole('tablist',{name:'Settings sections'}).getByRole('tab',{name,exact:true});await tab.click();assert.equal(await tab.getAttribute('aria-selected'),'true');await page.getByRole('tabpanel',{name,exact:true}).waitFor({state:'visible'});}
export async function chooseFamily(page,name){await openPicker(page);await page.getByRole('button',{name:grandNames.includes(name)?'Grand collection':'Classics',exact:false}).click();await page.getByRole('button',{name,exact:true}).click();await page.waitForFunction(()=>document.querySelector('main').dataset.overlay==='none');}
export async function inspectStage(page){
 await page.waitForFunction(()=>{const l=window.__firecrackersQA?.snapshot().stageLayout;return l&&Math.abs(l.viewport.width-innerWidth)<1&&Math.abs(l.viewport.height-innerHeight)<1;},undefined,{timeout:5000});
 const data=await page.evaluate(()=>{
  const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const rail=document.querySelector('[data-control-rail]'),tray=document.querySelector('[data-family-tray]');
  return {width:innerWidth,height:innerHeight,hero:JSON.parse(document.querySelector('main').dataset.heroRect),rail:box(rail),tray:box(tray),
   buttons:[...document.querySelectorAll('[data-control-rail] button,[data-family-tray] button')].map(e=>({...box(e),id:e.dataset.familyIcon,name:e.getAttribute('aria-label'),hit:e.contains(document.elementFromPoint(e.getBoundingClientRect().x+e.getBoundingClientRect().width/2,e.getBoundingClientRect().y+e.getBoundingClientRect().height/2))})),
   obsolete:document.querySelectorAll('[data-edge], [data-family-dock], .flow-launch, .shelf-quick-launch').length,overflow:document.documentElement.scrollWidth>innerWidth};
 });
 assert.equal(data.overflow,false);assert.equal(data.obsolete,0);assert.equal(data.buttons.length,13);
 assert.ok(data.rail.bottom<=data.tray.y+1,'Rail must stay above tray');assert.ok(data.hero.height<=data.tray.y+1,'Composition excludes tray');
 for(const b of data.buttons){assert.ok(b.width>=48&&b.height>=48,JSON.stringify(b));assert.ok(b.x>=0&&b.right<=data.width+1&&b.y>=0&&b.bottom<=data.height+1,JSON.stringify(b));assert.ok(b.hit,JSON.stringify(b));}
 const icons=data.buttons.filter(b=>b.id);assert.equal(icons.length,10);assert.deepEqual(icons.map(b=>b.id),[...classicIds,...grandIds]);
 for(let i=1;i<5;i++)assert.ok(Math.abs(icons[i].y-icons[0].y)<1);for(let i=6;i<10;i++)assert.ok(Math.abs(icons[i].y-icons[5].y)<1);
 if(data.width<680)assert.ok(icons[5].y>icons[0].y+47);else assert.ok(Math.abs(icons[5].y-icons[0].y)<1);return data;
}
export async function inspectEdgeShelves(page){return inspectStage(page);}
export async function inspectEdgeSeparation(page){return inspectStage(page);}
export async function inspectOpenDock(page){return inspectStage(page);}
export async function inspectBorderlessControls(page){
 const items=await page.locator('[data-family-icon],[data-control-rail] button').evaluateAll(nodes=>nodes.map(e=>{const s=getComputedStyle(e);return {name:e.getAttribute('aria-label'),border:s.borderWidth,shadow:s.boxShadow,background:s.backgroundColor,svg:!!e.querySelector('svg')};}));
 assert.equal(items.length,13);for(const i of items){assert.equal(i.border,'0px');assert.equal(i.shadow,'none');assert.ok(i.svg);assert.ok(i.background==='transparent'||i.background==='rgba(0, 0, 0, 0)');}return items;
}
export async function inspectPicker(page){await openPicker(page);const cards=page.locator('.flow-family');assert.equal(await cards.count(),5);for(const card of await cards.all()){await card.scrollIntoViewIfNeeded();const b=await card.boundingBox();assert.ok(b.width>=48&&b.height>=48);assert.ok(await card.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));}await page.getByRole('button',{name:'Close panel'}).click();}
