import assert from 'node:assert/strict';
export const grandNames=['Aurora Crown','Ruby Dahlia','Sapphire Saturn','Phoenix Palm','Opal Supernova'];
export const classicIds=['gold-willow','multicolor-peony','chrysanthemum','silver-crossette-crackle','grand-finale'];
export const signatureIds=['imperial-crown','celestial-aurora','royal-phoenix'];
export const grandIds=['aurora-crown','ruby-dahlia','sapphire-saturn','phoenix-palm','opal-supernova'];
export const edgeShelf=(page,collection)=>page.locator(`[data-family-tray] [data-family-shelf="${collection}"]`);
export const dockShelf=edgeShelf;
export const selectedLaunch=page=>page.locator('[data-family-tray] [data-family-icon][aria-pressed="true"]');
export async function openPanel(page,variant){
 if(variant==='show'){await page.getByRole('button',{name:/^Show mode:/}).click();return;}
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
  const rail=document.querySelector('[data-control-rail]'),tray=document.querySelector('[data-family-tray]'),mode=document.querySelector('[data-mode-control]'),position=document.querySelector('[data-position-control]');
  return {width:innerWidth,height:innerHeight,hero:JSON.parse(document.querySelector('main').dataset.heroRect),rail:box(rail),tray:box(tray),mode:box(mode),position:box(position),safe:window.__firecrackersQA.snapshot().stageLayout.safe,
   buttons:[...document.querySelectorAll('[data-control-rail] button,[data-family-tray] button')].map(e=>({...box(e),id:e.dataset.familyIcon,name:e.getAttribute('aria-label'),hit:e.contains(document.elementFromPoint(e.getBoundingClientRect().x+e.getBoundingClientRect().width/2,e.getBoundingClientRect().y+e.getBoundingClientRect().height/2))})),
   obsolete:document.querySelectorAll('[data-edge], [data-family-dock], .flow-launch, .shelf-quick-launch').length,overflow:document.documentElement.scrollWidth>innerWidth};
 });
 assert.equal(data.overflow,false);assert.equal(data.obsolete,0);assert.equal(data.buttons.length,16);
 const separate=(a,b)=>a.right<=b.x+.5||b.right<=a.x+.5||a.bottom<=b.y+.5||b.bottom<=a.y+.5;
 const areas=[data.rail,data.tray,data.mode,data.position];
 for(let i=0;i<areas.length;i++)for(let j=i+1;j<areas.length;j++)assert.ok(separate(areas[i],areas[j]),`Control footprints overlap: ${JSON.stringify([areas[i],areas[j]])}`);
 assert.ok(data.hero.y+data.hero.height<=data.height-76-data.safe.bottom+1,'Composition reserves footer');
 assert.ok(data.hero.width>=data.width-data.safe.left-data.safe.right-1,'Left collection does not consume a full-height sky gutter');
 for(const b of data.buttons){assert.ok(b.width>=48&&b.height>=48,JSON.stringify(b));assert.ok(b.x>=0&&b.right<=data.width+1&&b.y>=0&&b.bottom<=data.height+1,JSON.stringify(b));assert.ok(b.hit,JSON.stringify(b));}
 const icons=data.buttons.filter(b=>b.id);assert.equal(icons.length,13);assert.deepEqual(icons.map(b=>b.id),[...classicIds,...grandIds,...signatureIds]);
 const usableHeight=data.height-Math.max(8,data.safe.top)-84-data.safe.bottom;
 const columns=data.height<=600||usableHeight<336?3:(data.width-data.safe.left-data.safe.right>=680&&usableHeight>=624?1:2);
 for(let i=0;i<icons.length;i++){
  assert.ok(Math.abs(icons[i].x-(icons[0].x+(i%columns)*48))<1,'Stable continuous catalog columns');
  assert.ok(Math.abs(icons[i].y-(icons[0].y+Math.floor(i/columns)*48))<1,'Stable continuous catalog rows');
 }
 assert.equal(await page.locator('.stage-brand,.bottom-collection-caption').count(),0);
 return data;
}
export async function inspectEdgeShelves(page){return inspectStage(page);}
export async function inspectEdgeSeparation(page){return inspectStage(page);}
export async function inspectOpenDock(page){return inspectStage(page);}
export async function inspectBorderlessControls(page){
 const items=await page.locator('[data-family-icon],[data-control-rail] button').evaluateAll(nodes=>nodes.map(e=>{const s=getComputedStyle(e);return {name:e.getAttribute('aria-label'),border:s.borderWidth,shadow:s.boxShadow,background:s.backgroundColor,svg:!!e.querySelector('svg')};}));
 assert.equal(items.length,16);for(const i of items){assert.equal(i.border,'0px');assert.equal(i.shadow,'none');assert.ok(i.svg);assert.ok(i.background==='transparent'||i.background==='rgba(0, 0, 0, 0)');}return items;
}
export async function inspectPicker(page){await openPicker(page);const cards=page.locator('.flow-family');assert.equal(await cards.count(),5);for(const card of await cards.all()){await card.scrollIntoViewIfNeeded();const b=await card.boundingBox();assert.ok(b.width>=48&&b.height>=48);assert.ok(await card.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));}await page.getByRole('button',{name:'Close panel'}).click();}
