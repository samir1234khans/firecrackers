import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.ALWAYS_URL||'http://127.0.0.1:4173/';
const out=process.argv[2]||'test-results/always-play-browser';await mkdir(out,{recursive:true});
const captures=process.env.ALWAYS_CAPTURES||'C:/Users/samir/AppData/Local/Temp/firecrackers-always-play/captures';await mkdir(captures,{recursive:true});
const browser=await chromium.launch(process.env.ALWAYS_SOFTWARE==='1'?{headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{channel:'chrome',headless:true});
const sizes=[[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]];
const labels=['Low','Medium','High','Super High'];const results=[];const errors=[];let failed=null;
const snap=page=>page.evaluate(()=>window.__firecrackersQA.snapshot());
async function panel(page){await page.getByRole('button',{name:/^Show mode:/}).click();}
try{
 for(const backend of (process.env.ALWAYS_BACKENDS||'webgpu,webgl,canvas').split(',')){
  const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('firecrackers.preferences.v1',JSON.stringify({version:3,onboarded:true,reducedFlashes:false,sound:false,quality:'standard',alwaysPace:2})));
  await page.goto(`${base}?backend=${backend}&qa=1&seed=42`);await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});
  assert.equal(await page.title(),'Firecrackers');assert.equal(await page.locator('vite-error-overlay').count(),0);assert.ok(await page.locator('canvas').count()>0);
  await page.evaluate(()=>window.__firecrackersQA.freeze(true));
  assert.equal((await snap(page)).backend,{webgpu:'WebGPU',webgl:'WebGL 2',canvas:'Canvas 2D · compatibility'}[backend]);
  for(const [width,height]of sizes){
   await page.setViewportSize({width,height});
   await panel(page);await page.getByRole('button',{name:'Always Play',exact:true}).click();
   assert.equal((await snap(page)).show,null,'discovery does not start playback');
   for(let pace=1;pace<=4;pace++){
    await page.getByRole('radio',{name:`${pace} ${labels[pace-1]}`,exact:true}).check();
    const box=await page.getByRole('radio',{name:`${pace} ${labels[pace-1]}`,exact:true}).boundingBox();assert.ok(box.width>=48&&box.height>=48);
    assert.equal((await snap(page)).show,null);
   }
   await page.getByRole('button',{name:'Start Always Play',exact:true}).click();
   let state=await snap(page);assert.equal(state.show,'always');assert.equal(state.always.pace,4);
   await page.evaluate(()=>window.__firecrackersQA.advance(30));assert.ok((await snap(page)).always.admitted>4);
   await panel(page);const time=(await snap(page)).time;
   await page.getByRole('radio',{name:'1 Low',exact:true}).check();
   state=await snap(page);assert.equal(state.time,time);assert.equal(state.always.pace,1);assert.equal(state.show,'always');
   await page.getByRole('button',{name:'Close show mode',exact:true}).click();
   const rect=await page.locator('main').getAttribute('data-hero-rect');
   await page.getByRole('button',{name:'Hide controls',exact:true}).click();
   assert.equal(await page.locator('main').getAttribute('data-immersive'),'true');
   await page.evaluate(()=>window.__firecrackersQA.advance(15));assert.equal((await snap(page)).show,'always');
   await page.getByRole('button',{name:'Show controls',exact:true}).click();
   assert.equal(await page.locator('main').getAttribute('data-hero-rect'),rect);
   await panel(page);await page.getByRole('button',{name:'Stop Always Play',exact:true}).click();
   assert.equal((await snap(page)).show,null);assert.equal(await page.locator('.immersive-toggle').count(),0);
   await page.evaluate(()=>window.__firecrackersQA.advance(20));
   results.push({backend,width,height,checks:'discover/start/quantity/change/overlay/immersion/stop/contact framing'});console.log('PASS',backend,width,height);
  }
  await page.setViewportSize({width:393,height:851});await panel(page);await page.getByRole('button',{name:'Always Play',exact:true}).click();
  await page.getByRole('radio',{name:'4 Super High',exact:true}).check();await page.screenshot({path:`${captures}/${backend}-phone-panel.png`});
  await page.getByRole('button',{name:'Start Always Play',exact:true}).click();await page.evaluate(()=>window.__firecrackersQA.advance(1));
  const committed=(await snap(page)).committedId;assert.ok(committed);
  await page.getByRole('button',{name:'Launch Royal Phoenix',exact:true}).click();
  assert.equal((await snap(page)).show,null);assert.equal((await snap(page)).committedId,committed);assert.equal((await snap(page)).selected,'royal-phoenix');
  await page.evaluate(()=>window.__firecrackersQA.advance(30));
  // Real-time playback, not QA-driven advancement.
  await panel(page);await page.getByRole('button',{name:'Always Play',exact:true}).click();await page.getByRole('button',{name:'Start Always Play',exact:true}).click();
  await page.evaluate(()=>window.__firecrackersQA.freeze(false));await page.waitForTimeout(8000);
  assert.ok((await snap(page)).always.admitted>=3);assert.equal((await snap(page)).show,'always');
  await page.screenshot({path:`${captures}/${backend}-phone-running.png`});
  await page.getByRole('button',{name:'Hide controls',exact:true}).click();await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('Space');
  assert.equal((await snap(page)).paused,true);assert.equal(await page.locator('main').getAttribute('data-immersive'),'false');
  const paused=(await snap(page)).time;await page.waitForTimeout(800);assert.equal((await snap(page)).time,paused);
  await page.keyboard.press('Space');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  const hidden=await snap(page);await page.waitForTimeout(500);assert.equal((await snap(page)).time,hidden.time);assert.equal((await snap(page)).always.admitted,hidden.always.admitted);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});assert.equal((await snap(page)).paused,true);
  await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('Space');
  await page.emulateMedia({reducedMotion:'reduce'});await panel(page);
  assert.equal(await page.locator('.pace-options span').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  await page.keyboard.press('Escape');await page.close();
  // Saved pace and explicit links do not start ordinary interactive visits.
  const fresh=await browser.newPage();fresh.on('pageerror',e=>errors.push(e.message));
  await fresh.addInitScript(()=>localStorage.setItem('firecrackers.preferences.v1',JSON.stringify({version:3,onboarded:true,preset:'always',alwaysPace:4})));
  await fresh.goto(`${base}?backend=${backend}&qa=1&show=always&pace=4`);await fresh.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});assert.equal((await snap(fresh)).show,null);
  await fresh.goto(`${base}?backend=${backend}&qa=1&display=transparent&show=always&pace=3`);await fresh.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});
  assert.equal((await snap(fresh)).show,'always');assert.equal((await snap(fresh)).always.pace,3);assert.equal((await snap(fresh)).waterVisible,false);
  await fresh.goto(`${base}?backend=${backend}&qa=1`);await fresh.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});
  await fresh.evaluate(async()=>navigator.serviceWorker.ready);await fresh.reload();await fresh.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});await fresh.waitForFunction(()=>navigator.serviceWorker.controller);
  await fresh.context().setOffline(true);await fresh.reload({waitUntil:'domcontentloaded'});await fresh.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});
  await fresh.evaluate(()=>window.__firecrackersQA.freeze(true));await panel(fresh);await fresh.getByRole('button',{name:'Always Play',exact:true}).click();await fresh.getByRole('button',{name:'Start Always Play',exact:true}).click();
  await fresh.evaluate(()=>window.__firecrackersQA.advance(30));assert.equal((await snap(fresh)).show,'always');assert.ok((await snap(fresh)).always.admitted>=3);
  await fresh.context().setOffline(false);await fresh.close();
 }
 assert.deepEqual(errors,[]);
}catch(e){failed=e.stack;throw e;}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify({base,method:'Installed Chrome native backends; phone sizes emulated. Browser plugin unavailable; repository Playwright.',results,errors,failed,captures},null,2));}
