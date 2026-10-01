import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { inspectStage, openPanel, settingsTab } from './stage-helpers.mjs';
const base=process.env.FLAGSHIP_URL||'http://127.0.0.1:4173/';
const out=process.argv[2]||'test-results/flagships';await mkdir(out,{recursive:true});
const hardware=process.env.FLAGSHIP_HARDWARE==='1',quick=process.env.FLAGSHIP_QUICK==='1';
const browser=await chromium.launch(hardware?{channel:'chrome',headless:true}:{headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const ids=['imperial-crown','celestial-aurora','royal-phoenix'];
const views=quick?[[393,851],[1280,800]]:[[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]];
const selectedViews=process.env.FLAGSHIP_PROJECT==='desktop'?views.filter(([w])=>w>=1280):process.env.FLAGSHIP_PROJECT==='mobile'?views.filter(([w])=>w<1280):views;
const report={base,seed:20260916,method:hardware?'Installed Chrome hardware backends; viewport emulation, not physical devices':'Bundled Chromium software WebGL and Canvas CI regression',checks:[],captures:[],errors:[],failed:null};
let page;
const snap=()=>page.evaluate(()=>window.__firecrackersQA.snapshot());
const advance=t=>page.evaluate(t=>window.__firecrackersQA.advance(t),t);
const icon=id=>page.locator(`[data-family-icon="${id}"]`);
const pass=(name,data={})=>{report.checks.push({name,passed:true,...data});console.log('PASS',name);};
const drag=async(id,x,y,cancel=false)=>{const r=await icon(id).boundingBox();await page.mouse.move(r.x+24,r.y+24);await page.mouse.down();await page.mouse.move(x,y,{steps:10});if(cancel)await page.keyboard.press('Escape');await page.mouse.up();};
async function stageBounds(id,label){
 const s=await snap(),r=s.stageLayout.unobstructedScene,b=s.signatureBounds.find(b=>b.family===ids.indexOf(id)+10);
 assert.ok(b&&b.count>0,`${label}: missing visible principal stars`);
 assert.ok(b.left>=r.x-1&&b.right<=r.x+r.width+1&&b.top>=r.y-1&&b.bottom<=r.y+r.height+1,`${label}: ${JSON.stringify(b)} in ${JSON.stringify(r)}`);
 return b;
}
try{
 for(const backend of (hardware?['webgpu','webgl','canvas']:['webgl','canvas'])){
  for(const [width,height]of selectedViews){
   page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'});
   page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
   await page.goto(`${base}?backend=${backend}&qa=1&seed=20260916`);
   await page.waitForFunction(()=>window.__firecrackersQA&&document.querySelector('main')?.dataset.ready==='true',undefined,{timeout:90000});
   if(backend!=='canvas')await page.waitForFunction(()=>Object.values(window.__firecrackersQA.snapshot().authoredAssetStates||{}).length>=8&&Object.values(window.__firecrackersQA.snapshot().authoredAssetStates).every(s=>s==='active'),undefined,{timeout:90000});
   await page.evaluate(()=>window.__firecrackersQA.freeze(true));
   const actual=(await snap()).backend;assert.equal(actual,backend==='webgpu'?'WebGPU':backend==='webgl'?'WebGL 2':'Canvas 2D · compatibility');
   if(hardware&&backend==='webgpu'){const a=await page.evaluate(async()=>{const a=await navigator.gpu.requestAdapter();return {vendor:a.info.vendor,architecture:a.info.architecture,fallback:a.info.isFallbackAdapter};});assert.equal(a.fallback,false);pass('Native WebGPU adapter',a);}
   const layout=await inspectStage(page);assert.ok((await snap()).skyHorizon*height<=layout.tray.y-30);pass(`${backend}/${width}x${height}: thirteen independent 48px targets and clear waterfront`,{layout});
   for(const [j,id]of ids.entries()){
    await advance(40);await icon(id).click();let s=await snap();assert.equal(s.phase,'fuse');assert.equal(s.selected,id);const committed=s.committedId,profile=s.launchProfile;
    await icon(id).dispatchEvent('click');assert.equal((await snap()).committedId,committed);
    await advance(.8);s=await snap();assert.ok(s.flight&&s.flight.stage==='ascent');
    const remaining=s.flight.ascent-s.flight.age+.02;await advance(remaining);
    const stages=(await snap()).signatureStages.slice(j*3,j*3+3);assert.ok(stages[0]>0);
    const samples=[];for(const dt of [.75,1,1.25,1.25,1.25,1.25]){await advance(dt);samples.push(await stageBounds(id,`${backend}/${width}/${id}`));}
    s=await snap();assert.ok(s.signatureStages[j*3+1]>0&&s.signatureStages[j*3+2]>0);pass(`${backend}/${width}x${height}/${id}: unique admission, three stages, safe complete envelope`,{profile,samples,stages:s.signatureStages.slice(j*3,j*3+3)});
    if((width===393||width===1280)&&backend==='webgpu'){
     // A fresh seeded launch permits repeatable, source-labelled representative capture.
     await page.reload();await page.waitForSelector('main[data-ready="true"]',{timeout:90000});await page.waitForFunction(()=>Object.values(window.__firecrackersQA.snapshot().authoredAssetStates).every(s=>s==='active'),undefined,{timeout:90000});await page.evaluate(()=>window.__firecrackersQA.freeze(true));
     await icon(id).click();await advance(.8);s=await snap();const relative=[4.2,3.1,3.1][j];await advance(s.flight.ascent-s.flight.age+.02+relative);await page.mouse.move(1,1);
     const name=`${backend}-${width}x${height}-${id}.png`;await page.screenshot({path:`${out}/${name}`});const release=await page.evaluate(()=>fetch('/release.json').then(r=>r.json()));report.captures.push({file:name,backend:(await snap()).backend,width,height,seed:20260916,relativeBurstSeconds:relative,release:{version:release.version,sha256:release.sha256},snapshot:await snap()});
    }
   }
   // Point-preserving sky drops and terrace launches exercise the real pointer path.
   for(const [j,id]of ids.entries()){
    await advance(40);let before=await snap(),l=before.stageLayout,x=l.heroRect.width*.45,y=l.heroRect.height*.30;
    await drag(id,x,y);let after=await snap();assert.equal(after.launched,before.launched+1);assert.equal(after.bursts,before.bursts+1);assert.equal(after.signatureStages[j*3],before.signatureStages[j*3]+1);await advance(.75);await stageBounds(id,'sky drop');
    await advance(40);before=await snap();await drag(id,l.heroRect.width*.5,l.launchArea.y+l.launchArea.height*.5);after=await snap();assert.equal(after.phase,'fuse');assert.equal(after.selected,id);assert.ok(Math.abs(after.placement-.5)<.025);assert.equal(after.bursts,before.bursts);
    await advance(.8);after=await snap();const original=after.launchProfile;
    if(width===393){await page.setViewportSize({width:844,height:390});assert.deepEqual((await snap()).launchProfile,original);await page.setViewportSize({width,height});}
    await advance(after.flight.ascent-after.flight.age+7);pass(`${backend}/${width}/${id}: sky/terrace pointer launches and committed profile`);
    await advance(40);before=await snap();await drag(id,x,y,true);assert.equal((await snap()).launched,before.launched);await icon(id).focus();await page.keyboard.press('Enter');assert.equal((await snap()).phase,'fuse');await advance(40);
   }
   if(width===393){
    await icon(ids[0]).click();await advance(4);await page.getByRole('button',{name:'Pause scene',exact:true}).click();await openPanel(page,'help');assert.equal((await snap()).paused,true);await page.getByRole('button',{name:'Close panel'}).click();assert.equal((await snap()).paused,true);await page.getByRole('button',{name:'Resume scene',exact:true}).click();assert.equal((await snap()).paused,false);await advance(40);
    await openPanel(page,'settings');await settingsTab(page,'Graphics');await page.getByLabel('Graphics quality').selectOption('low');await page.getByRole('button',{name:'Close panel'}).click();await icon(ids[1]).click();await advance(9);assert.equal((await snap()).quality,'low');assert.ok((await snap()).signatureStages[4]>0);await advance(40);
    await page.emulateMedia({reducedMotion:'reduce'});await icon(ids[2]).click();await advance(9);assert.equal((await snap()).reducedMotion,true);assert.ok((await snap()).signatureStages[7]>0);
    await openPanel(page,'settings');await settingsTab(page,'Device');await page.getByRole('button',{name:'Reset this sky',exact:true}).click();await page.getByRole('button',{name:'Reset sky and preferences',exact:true}).click();assert.deepEqual((await snap()).signatureStages,Array(9).fill(0));pass(`${backend}: panel pause ownership, Low, OS comfort and reset`);
   }
   await page.close();
  }
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failed=e.stack;process.exitCode=1;console.error(e);await page?.screenshot({path:`${out}/FAILED.png`}).catch(()=>{});}
finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close();}
