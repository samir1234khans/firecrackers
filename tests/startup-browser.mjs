import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
// Controlled held images keep document.fonts.ready pending; this UI uses system
// fonts. Capture the real unfinished-loading frame rather than wait for release.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.STARTUP_URL||'http://127.0.0.1:4173/';
const out=process.argv[2]||'test-results/startup';await mkdir(out,{recursive:true});
const report={url:base,method:'Production bundle; headless Chromium / software WebGL and Canvas, controlled real request delays; emulation only',checks:[],errors:[],failed:null};
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
let current;
const releases=new WeakMap();
const snap=page=>page.evaluate(()=>window.__firecrackersQA.snapshot());
const record=(name,detail={})=>{report.checks.push({name,...detail});console.log('PASS',name,JSON.stringify(detail));};
const presented=page=>page.waitForSelector('main[data-presented="true"]',{timeout:90000});
const ready=page=>page.waitForFunction(()=>window.__firecrackersQA&&document.querySelector('main')?.dataset.ready==='true',undefined,{timeout:90000});
const heldRoute=async(context,pattern)=>{
 let release;const held=new Promise(resolve=>{release=resolve;});let requests=0;
 if(!releases.has(context))releases.set(context,[]);releases.get(context).push(release);
 await context.route(pattern,async route=>{requests++;await held;await route.continue().catch(()=>{});});
 return {release,requests:()=>requests};
};
async function scenario(name,fn,options={}){
 const context=await browser.newContext({viewport:{width:393,height:851},serviceWorkers:'block',...options});const page=current=await context.newPage();
 page.on('pageerror',error=>report.errors.push(`${name}: ${error.message}`));
 try{await fn(page,context);await page.screenshot({path:`${out}/${name}.png`});}
 catch(error){await page.screenshot({path:`${out}/FAILED-${name}.png`}).catch(()=>{});throw error;}
 finally{for(const release of releases.get(context)||[])release();await context.close();current=null;}
}
try{
 await scenario('slow-entry',async(page,context)=>{
  const entry=await heldRoute(context,/\/assets\/main-[^/]+\.js(?:\?.*)?$/);
  await page.goto(`${base}?qa=1&backend=canvas`,{waitUntil:'domcontentloaded'});
  await page.locator('#boot-shell').waitFor({state:'visible'});assert.equal(await page.locator('main').count(),0);
  assert.ok(await page.locator('#boot-message').textContent());assert.equal(await page.getByRole('progressbar',{name:'Application initialization'}).getAttribute('aria-valuenow'),null,'entry has no fake percentage');
  await page.keyboard.press('l');assert.equal(await page.locator('[data-family-icon]').count(),0);await page.screenshot({path:`${out}/held-production-entry.png`});entry.release();await presented(page);assert.ok(entry.requests()>0,'actual production main bundle was held');
  record('Real held production entry retains readable loading and recovery before React');
 });
 await scenario('visible-moon-loading',async(page,context)=>{
  const held=await heldRoute(context,/\/art\/rocket\.glb(?:\?.*)?$/);
  await page.goto(`${base}?qa=1&backend=webgl`,{waitUntil:'domcontentloaded'});await ready(page);
  await page.waitForFunction(()=>window.__firecrackersQA.snapshot().startup.completed===8,undefined,{timeout:90000});
  assert.equal((await snap(page)).moon.ready,true);assert.equal(await page.locator('.startup-moon-orbit img').evaluate(e=>getComputedStyle(e).animationName),'startup-moon-turn');
  await page.screenshot({path:`${out}/visible-moon-preparing.png`});held.release();await presented(page);record('Loaded authored moon rotates while actual rocket asset remains pending');
 });
 await scenario('cold-assets-and-moon-travel',async(page,context)=>{
  const held=await heldRoute(context,/\/art\/(rocket\.glb|moon-lro-v001\.png)(?:\?.*)?$/);
  await page.goto(`${base}?qa=1&backend=webgl`,{waitUntil:'domcontentloaded'});await ready(page);
  await page.waitForFunction(()=>window.__firecrackersQA.snapshot().startup.completed===7,undefined,{timeout:90000});
  let state=await snap(page);assert.equal(state.startup.total,9);assert.equal(state.startup.phase,'scene');assert.equal(state.startup.pending,true);
  assert.equal(state.authoredAssetStates.rocket,'loading');assert.equal(state.authoredAssetStates.moon,'loading');assert.equal(state.paused,true);
  assert.equal(await page.locator('main').getAttribute('data-presented'),'false');assert.equal(await page.locator('[data-family-icon]').count(),13,'all geometry stays mounted');
  assert.ok(await page.locator('[data-family-icon]').first().evaluate(e=>e.disabled&&!!e.closest('[inert]')));
  assert.ok(await page.locator('[data-control-rail]').evaluate(e=>e.inert));
  await page.keyboard.press('1');await page.keyboard.press('l');await page.keyboard.press('Space');state=await snap(page);assert.equal(state.launched,0);assert.equal(state.committedId,null);assert.equal(state.time,0,'startup does not run hidden simulation');
  const progress=page.getByRole('progressbar',{name:'Scene asset preparation'});assert.equal(await progress.getAttribute('aria-valuenow'),'7');assert.equal(await progress.getAttribute('aria-valuemax'),'9');
  await page.screenshot({path:`${out}/cold-held-assets.png`});
  held.release();await page.waitForSelector('[data-startup-transition="travel"]',{timeout:90000});
  const travel=await page.locator('.startup-moon-orbit').evaluate(e=>({x:parseFloat(e.style.left),y:parseFloat(e.style.top),diameter:parseFloat(e.style.width)}));
  state=await snap(page);assert.equal(state.startup.completed,9);assert.equal(state.startup.pending,false);
  assert.ok(Math.abs(travel.x-state.moon.x)<.1&&Math.abs(travel.y-state.moon.y)<.1&&Math.abs(travel.diameter-2*state.moon.radius/.95)<.1,'travel target matches actual renderer moon including authored transparent rim');
  assert.equal(state.paused,true,'transition still owns pause');await presented(page);assert.equal((await snap(page)).paused,false);assert.ok(held.requests()>=2);
  await page.locator('[data-family-icon="gold-willow"]').click();assert.ok((await snap(page)).committedId);record('Actual cold asset counts, inert mounted controls, no keyboard launches and renderer-aligned moon travel');
 });
 await scenario('immediate-continue',async(page,context)=>{
  const held=await heldRoute(context,/\/art\/moon-lro-v001\.png(?:\?.*)?$/);
  await page.goto(`${base}?qa=1&backend=canvas`,{waitUntil:'domcontentloaded'});await ready(page);
  assert.equal((await snap(page)).startup.completed,0);await page.getByRole('button',{name:'Enter with available detail',exact:true}).click();await presented(page);
  let state=await snap(page);assert.equal(state.startup.phase,'ready');assert.equal(state.startup.completed,0);assert.equal(state.startup.total,1);assert.equal(state.startup.degraded,true);
  await page.locator('[data-family-icon="multicolor-peony"]').click();assert.ok((await snap(page)).committedId);held.release();await page.waitForFunction(()=>window.__firecrackersQA.snapshot().startup.completed===1);
  state=await snap(page);assert.equal(state.startup.degraded,false);record('Explicit immediate continuation keeps unfinished count truthful and later detail activates');
 });
 await scenario('asset-failure',async(page,context)=>{
  await context.route('**/art/terrace-v008.glb',route=>route.abort());await context.route('**/art/river-life-v008.glb',route=>route.abort());
  await page.goto(`${base}?qa=1&backend=webgl`,{waitUntil:'domcontentloaded'});await presented(page);const state=await snap(page);
  assert.equal(state.startup.completed,9);assert.equal(state.startup.pending,false);assert.equal(state.startup.degraded,true);assert.equal(state.authoredAssetStates.terrace,'failed');assert.equal(state.authoredAssetStates.river,'failed');
  await page.locator('[data-family-icon="gold-willow"]').click();assert.ok((await snap(page)).committedId);record('Real failed authored assets settle automatically with playable reduced detail');
 });
 await scenario('warm-reload',async(page)=>{
  await page.goto(`${base}?qa=1&backend=canvas`,{waitUntil:'domcontentloaded'});await presented(page);assert.equal((await snap(page)).startup.completed,1);
  await page.reload({waitUntil:'domcontentloaded'});await presented(page);const state=await snap(page);assert.equal(state.startup.completed,1);assert.equal(state.startup.degraded,false);assert.equal(state.launched,0);record('Cached reload settles real assets without premature scene or surprise launch');
 });
 await scenario('show-pause-ownership',async(page,context)=>{
  const held=await heldRoute(context,/\/art\/moon-lro-v001\.png(?:\?.*)?$/);
  await page.goto(`${base}?qa=1&backend=canvas&display=scene&show=calm`,{waitUntil:'domcontentloaded'});await ready(page);
  let state=await snap(page);assert.equal(state.show,'calm');assert.equal(state.paused,true);assert.equal(state.time,0);assert.equal(state.launched,0);
  held.release();await presented(page);await page.waitForFunction(()=>window.__firecrackersQA.snapshot().launched>0,undefined,{timeout:30000});state=await snap(page);assert.equal(state.show,'calm');record('Linked automatic show waits through preparation and transition, then resumes its mode');
 });
 await scenario('reduced-motion',async(page,context)=>{
  const held=await heldRoute(context,/\/art\/moon-lro-v001\.png(?:\?.*)?$/);
  await page.goto(`${base}?qa=1&backend=canvas`,{waitUntil:'domcontentloaded'});await ready(page);
  assert.equal(await page.locator('.startup-moon-orbit img').evaluate(e=>getComputedStyle(e).animationName),'none');
  await page.evaluate(()=>{window.__startupTransitions=[];const observer=new MutationObserver(records=>{for(const r of records)if(r.attributeName==='data-startup-transition')window.__startupTransitions.push(r.target.dataset.startupTransition);});observer.observe(document.querySelector('.startup-screen'),{attributes:true});});
  held.release();await presented(page);assert.deepEqual(await page.evaluate(()=>window.__startupTransitions),[],'reduced motion skips travel states');record('OS reduced motion skips rotation and travel while completing actual preparation');
 },{reducedMotion:'reduce'});
 assert.deepEqual(report.errors,[]);
}catch(error){report.failed=error.stack||String(error);process.exitCode=1;console.error(report.failed);await current?.screenshot({path:`${out}/FAILED.png`}).catch(()=>{});
}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
