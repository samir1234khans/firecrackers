import assert from 'node:assert/strict';
export const grandNames = ['Aurora Crown','Ruby Dahlia','Sapphire Saturn','Phoenix Palm','Opal Supernova'];
export async function openPicker(page) { await page.getByRole('button',{name:/^Choose firework:/}).click(); }
export async function chooseFamily(page, name) {
  await openPicker(page);
  await page.getByRole('button',{name:grandNames.includes(name)?'Grand collection':'Classics',exact:false}).click();
  await page.getByRole('button',{name,exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('main').dataset.overlay==='none');
}
export async function inspectStage(page) {
  await page.waitForTimeout(80);
  const data=await page.evaluate(()=>{
    const hero=JSON.parse(document.querySelector('main').dataset.heroRect),launch=document.querySelector('.flow-launch'),r=launch.getBoundingClientRect();
    const groups=[...document.querySelectorAll('[data-edge]')].map(e=>{const b=e.getBoundingClientRect();return {name:e.dataset.edge,x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};});
    const buttons=[...document.querySelectorAll('[data-edge] button')].filter(e=>e.getClientRects().length).map(e=>{const b=e.getBoundingClientRect();return {name:e.getAttribute('aria-label'),x:b.x,y:b.y,width:b.width,height:b.height,hit:e.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))};});
    return {width:innerWidth,height:innerHeight,hero,groups,buttons,overflow:document.documentElement.scrollWidth>innerWidth,launch:{width:r.width,height:r.height,bottom:r.bottom},hit:launch.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};
  });
  assert.equal(data.overflow,false);assert.equal(data.groups.length,6);assert.ok(data.hit);
  assert.ok(data.hero.width/data.width >= (data.width>=1024?.70:data.width<=320?.55:.60),JSON.stringify(data));
  assert.ok(data.launch.width>=56 && data.launch.height>=56 && data.launch.bottom<=data.height);
  for(const b of data.groups) assert.ok(b.right<=data.hero.x || b.x>=data.hero.x+data.hero.width,`Central obstruction: ${JSON.stringify(b)}`);
  for(const b of data.buttons){assert.ok(b.width>=(data.width<1024?48:44) && b.height>=(data.width<1024?48:44),JSON.stringify(b));assert.ok(b.hit,JSON.stringify(b));}
  return data;
}
export async function inspectPicker(page) {
  await openPicker(page);const cards=page.locator('.flow-family');assert.equal(await cards.count(),5);
  for(const card of await cards.all()){await card.scrollIntoViewIfNeeded();const r=await card.boundingBox();assert.ok(r.width>=48&&r.height>=48);assert.ok(await card.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));}
  await page.getByRole('button',{name:'Close panel'}).click();
}
