import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { openPanel, settingsTab, inspectStage } from './stage-helpers.mjs';
const base=process.env.MOON_URL||'http://127.0.0.1:4173/';
const out=process.argv[2]||'test-results/moon-water';await mkdir(out,{recursive:true});
const report={url:base,seed:9302026,method:'Headless installed Chrome, emulated viewports; hardware backend identity checked',checks:[],errors:[]};
const browser=await chromium.launch({channel:'chrome',headless:true});
const pass=(name,data)=>report.checks.push({name,...data});
try{
 for(const backend of ['webgpu','webgl','canvas']){
  const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(`${base}?qa=1&seed=9302026&backend=${backend}`);
  await page.waitForFunction(()=>window.__firecrackersQA?.snapshot().backend,{timeout:90000});
  if(backend==='webgpu')assert.equal(await page.evaluate(async()=>{const a=await navigator.gpu.requestAdapter();return a.info.isFallbackAdapter;}),false);
  await page.waitForFunction(()=>window.__firecrackersQA.snapshot().moon?.ready,undefined,{timeout:90000});
  if(backend!=='canvas')await page.waitForFunction(()=>Object.values(window.__firecrackersQA.snapshot().authoredAssetStates).every(s=>s==='active'),undefined,{timeout:90000});
  await page.evaluate(()=>window.__firecrackersQA.freeze(true));
  for(const [width,height] of [[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]]){
   await page.setViewportSize({width,height});await inspectStage(page);
   await page.evaluate(()=>window.__firecrackersQA.advance(.1));
   const s=await page.evaluate(()=>window.__firecrackersQA.snapshot()),m=s.moon;
   assert.ok(m.ready);assert.ok(m.y-m.radius>=24);assert.ok(m.y+m.radius<s.skyHorizon*height);assert.ok(m.x+m.radius<width-48);
   await page.screenshot({path:`${out}/${backend}-${width}x${height}.png`});
   pass(`${backend} ${width}x${height}: textured moon in clear sky, preserved tray/rail`,{backend:s.backend,moon:m,reflectionWidth:s.reflectionWidth});
  }
  await page.setViewportSize({width:1280,height:800});
  await openPanel(page,'settings');await settingsTab(page,'Graphics');
  await page.getByLabel('Graphics quality',{exact:true}).selectOption('low');await page.getByRole('button',{name:'Close panel'}).click();
  await page.evaluate(()=>window.__firecrackersQA.advance(1));
  assert.ok((await page.evaluate(()=>window.__firecrackersQA.snapshot())).moon.ready);
  pass(`${backend}: moon remains visible in Low quality`);
  await page.close();
 }
 for(const backend of ['webgl','canvas']){
  const page=await browser.newPage();await page.route('**/art/moon-lro-v001.png',route=>route.abort());
  await page.goto(`${base}?qa=1&seed=9302026&backend=${backend}`);
  await page.waitForFunction(()=>window.__firecrackersQA?.snapshot().backend,undefined,{timeout:90000});
  if(backend==='webgl')await page.waitForFunction(()=>window.__firecrackersQA.snapshot().authoredAssetStates?.moon==='failed');
  assert.equal((await page.evaluate(()=>window.__firecrackersQA.snapshot())).moon.ready,false);
  await page.locator('[data-family-icon="gold-willow"]').click();
  await page.waitForFunction(()=>window.__firecrackersQA.snapshot().launched===1);
  pass(`${backend}: missing moon preserves playable scenery and immediate launch`);await page.close();
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failed=e.stack;throw e;}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close();}
console.log(`${report.checks.length} moon/water browser checks passed`);
