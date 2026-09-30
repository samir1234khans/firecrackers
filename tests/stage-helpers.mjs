import assert from 'node:assert/strict';
export const grandNames = ['Aurora Crown','Ruby Dahlia','Sapphire Saturn','Phoenix Palm','Opal Supernova'];
export const classicIds = ['gold-willow','multicolor-peony','chrysanthemum','silver-crossette-crackle','grand-finale'];
export const grandIds = ['aurora-crown','ruby-dahlia','sapphire-saturn','phoenix-palm','opal-supernova'];
export const edgeShelf = (page, collection) => page.locator(`[data-edge="${collection === 'classics' ? 'middle-left' : 'middle-right'}"] [data-family-shelf="${collection}"]`);
export const dockShelf = (page, collection) => page.locator(`[data-family-dock] [data-family-shelf="${collection}"]`);
export async function openPicker(page) { await page.getByRole('button',{name:/^Choose firework:/}).click(); }
/** Activate the actual Settings tab before using controls in that section. */
export async function settingsTab(page, name) {
  const tab = page.getByRole('tablist', { name: 'Settings sections' }).getByRole('tab', { name, exact: true });
  await tab.click();
  assert.equal(await tab.getAttribute('aria-selected'), 'true', `${name} Settings tab must be active`);
  await page.getByRole('tabpanel', { name, exact: true }).waitFor({ state: 'visible' });
}
export async function chooseFamily(page, name) {
  await openPicker(page);
  await page.getByRole('button',{name:grandNames.includes(name)?'Grand collection':'Classics',exact:false}).click();
  await page.getByRole('button',{name,exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('main').dataset.overlay==='none');
}
export async function inspectStage(page) {
  // ResizeObserver and renderer work may span multiple frames on software CI.
  // Wait for the new viewport measurement, then assert every bound unchanged.
  await page.waitForFunction(() => {
    const raw = document.querySelector('main')?.dataset.heroRect;
    if (!raw) return false;
    const hero = JSON.parse(raw);
    return Math.abs(hero.x + hero.width / 2 - innerWidth / 2) < 1;
  }, undefined, { timeout: 5000 });
  const data=await page.evaluate(()=>{
    const hero=JSON.parse(document.querySelector('main').dataset.heroRect),launch=document.querySelector('.flow-launch'),r=launch.getBoundingClientRect();
    const groups=[...document.querySelectorAll('[data-edge]')].map(e=>{const b=e.getBoundingClientRect();return {name:e.dataset.edge,x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};});
    const buttons=[...document.querySelectorAll('[data-edge] button')].filter(e=>{const s=getComputedStyle(e);return e.getClientRects().length && s.visibility==='visible' && Number(s.opacity)>.05 && s.pointerEvents!=='none';}).map(e=>{const b=e.getBoundingClientRect();return {name:e.getAttribute('aria-label'),x:b.x,y:b.y,width:b.width,height:b.height,hit:e.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))};});
    const dock=document.querySelector('[data-family-dock]'),d=dock?.getBoundingClientRect(),toggle=dock?.querySelector('.family-dock-toggle'),t=toggle?.getBoundingClientRect();
    const compactDock=d && d.width && getComputedStyle(dock).display!=='none' ? {x:d.x,y:d.y,width:d.width,height:d.height,bottom:d.bottom,open:dock.dataset.open,toggle:t?{x:t.x,y:t.y,width:t.width,height:t.height,hit:toggle.contains(document.elementFromPoint(t.x+t.width/2,t.y+t.height/2))}:null}:null;
    return {width:innerWidth,height:innerHeight,hero,groups,buttons,compactDock,overflow:document.documentElement.scrollWidth>innerWidth,launch:{width:r.width,height:r.height,bottom:r.bottom},hit:launch.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};
  });
  assert.equal(data.overflow,false);assert.equal(data.groups.length,6);assert.ok(data.hit);
  assert.ok(data.hero.width/data.width >= (data.width>=1024?.70:data.width<=320?.55:.60),JSON.stringify(data));
  assert.ok(data.launch.width>=56 && data.launch.height>=56 && data.launch.bottom<=data.height);
  for(const b of data.groups) assert.ok(b.right<=data.hero.x || b.x>=data.hero.x+data.hero.width,`Central obstruction: ${JSON.stringify(b)}`);
  for(const b of data.buttons){
    assert.ok(b.width>=(data.width<1024?48:44) && b.height>=(data.width<1024?48:44),JSON.stringify(b));
    assert.ok(b.hit,JSON.stringify(b));
    assert.ok(b.x+b.width<=data.hero.x+1||b.x>=data.hero.x+data.hero.width-1,`Resting control intrudes into the central stage: ${JSON.stringify(b)}`);
  }
  if(data.compactDock && data.compactDock.open==='false'){
    const d=data.compactDock,t=d.toggle;
    assert.ok(d.y>=data.height*.75 && d.bottom<=data.height+1,`Collapsed dock must stay at the bottom: ${JSON.stringify(d)}`);
    assert.ok(d.width<=Math.min(180,data.width*.55),`Collapsed dock must stay compact: ${JSON.stringify(d)}`);
    assert.ok(Math.abs(d.x+d.width/2-data.width/2)<=3,`Collapsed dock must be centered: ${JSON.stringify(d)}`);
    assert.ok(t && t.width>=48 && t.height>=48 && t.hit,`Dock toggle target: ${JSON.stringify(t)}`);
  }
  return data;
}

export async function inspectEdgeShelves(page, minHit=44) {
  const hero=await page.locator('main').evaluate(e=>JSON.parse(e.dataset.heroRect));
  for(const [collection,ids] of [['classics',classicIds],['grand',grandIds]]){
    const shelf=edgeShelf(page,collection);
    assert.equal(await shelf.isVisible(),true,`${collection} edge shelf should be visible`);
    assert.deepEqual(await shelf.locator('[data-family-icon]').evaluateAll(buttons=>buttons.map(b=>b.dataset.familyIcon)),ids);
    for(const id of ids){
      const icon=shelf.locator(`[data-family-icon="${id}"]`),box=await icon.boundingBox();
      assert.ok(box && box.width>=minHit && box.height>=minHit,`${id} icon target: ${JSON.stringify(box)}`);
      assert.ok(collection==='classics' ? box.x+box.width<=hero.x : box.x>=hero.x+hero.width,`${id} must stay beside the stage: ${JSON.stringify(box)}`);
      assert.equal(await icon.evaluate(e=>e.contains(document.elementFromPoint(e.getBoundingClientRect().x+e.getBoundingClientRect().width/2,e.getBoundingClientRect().y+e.getBoundingClientRect().height/2))),true,`${id} icon hit target`);
      assert.equal(await shelf.locator(`[data-family-launch="${id}"]`).count(),1,`${id} local Launch action`);
    }
  }
}

export async function inspectBorderlessControls(page, minimum=11) {
  const controls=await page.evaluate(()=>[...document.querySelectorAll('[data-family-icon], [data-family-launch], .edge-launch')]
    .filter(e=>e.getClientRects().length)
    .map(e=>{const s=getComputedStyle(e);return {name:e.getAttribute('aria-label'),icon:e.matches('[data-family-icon]'),
      border:[s.borderTopWidth,s.borderRightWidth,s.borderBottomWidth,s.borderLeftWidth],background:s.backgroundColor,shadow:s.boxShadow,
      svg:Boolean(e.querySelector('svg')),text:e.textContent.trim()};}));
  assert.ok(controls.length>=minimum,`Expected visible icon controls: ${controls.length}`);
  for(const c of controls){
    assert.deepEqual(c.border,['0px','0px','0px','0px'],`${c.name} should be borderless`);
    assert.ok(c.background==='transparent'||/^rgba\(.*?,\s*0(?:\.0+)?\)$/.test(c.background),`${c.name} needs a transparent background: ${c.background}`);
    assert.equal(c.shadow,'none',`${c.name} should not carry a button shadow`);
    assert.ok(c.svg,`${c.name} needs a distinct SVG icon`);
    if(!c.icon)assert.equal(c.text,'',`${c.name} is an icon control with an accessible label`);
  }
  return controls;
}

export async function inspectEdgeSeparation(page) {
  const groups=await page.locator('[data-edge]').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return {name:e.dataset.edge,x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
  const byName=Object.fromEntries(groups.map(group=>[group.name,group]));
  assert.equal(groups.length,6);
  const height=await page.evaluate(()=>innerHeight),width=await page.evaluate(()=>innerWidth);
  for(const side of ['left','right']){
    const top=byName[`top-${side}`],middle=byName[`middle-${side}`],bottom=byName[`bottom-${side}`];
    assert.ok(top.bottom<=middle.y+1,`${side} top and middle groups overlap: ${JSON.stringify({top,middle})}`);
    assert.ok(middle.bottom<=bottom.y+1,`${side} middle and bottom groups overlap: ${JSON.stringify({middle,bottom})}`);
    for(const group of [top,middle,bottom])assert.ok(group.x>=0&&group.right<=width+1&&group.y>=0&&group.bottom<=height+1,`Edge group exceeds viewport: ${JSON.stringify(group)}`);
  }
  return groups;
}

export async function inspectOpenDock(page) {
  const dock=page.locator('[data-family-dock]');
  assert.equal(await dock.getAttribute('data-open'),'true');
  assert.equal(await dock.locator('.family-dock-toggle').getAttribute('aria-expanded'),'true');
  for(const [collection,ids] of [['classics',classicIds],['grand',grandIds]]){
    const shelf=dockShelf(page,collection);
    assert.equal(await shelf.isVisible(),true,`${collection} dock shelf should be visible`);
    assert.deepEqual(await shelf.locator('[data-family-icon]').evaluateAll(buttons=>buttons.map(b=>b.dataset.familyIcon)),ids);
    for(const id of ids){
      const icon=shelf.locator(`[data-family-icon="${id}"]`),box=await icon.boundingBox();
      assert.ok(box && box.width>=48 && box.height>=48,`${id} mobile target: ${JSON.stringify(box)}`);
      assert.equal(await icon.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true,`${id} dock icon must receive input at its center`);
    }
  }
  const d=await dock.boundingBox();
  assert.ok(d && d.x>=0 && d.x+d.width<=await page.evaluate(()=>innerWidth)+1 && d.y>=0,`Expanded dock bounds: ${JSON.stringify(d)}`);
  const overlap=await page.evaluate(()=>{const a=document.querySelector('.family-dock-panel')?.getBoundingClientRect(),b=document.querySelector('.flow-launch')?.getBoundingClientRect();return a&&b?Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)):0;});
  assert.equal(overlap,0,`Expanded dock panel must not overlap Launch (${overlap}px²)`);
  return d;
}
export async function inspectPicker(page) {
  await openPicker(page);const cards=page.locator('.flow-family');assert.equal(await cards.count(),5);
  for(const card of await cards.all()){await card.scrollIntoViewIfNeeded();const r=await card.boundingBox();assert.ok(r.width>=48&&r.height>=48);assert.ok(await card.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));}
  await page.getByRole('button',{name:'Close panel'}).click();
}
