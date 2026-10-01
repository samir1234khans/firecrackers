import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { inspectStage, inspectBorderlessControls, openPanel, chooseFamily, settingsTab, selectedLaunch, classicIds, grandIds } from './stage-helpers.mjs';
const base=process.env.STAGE_URL||'http://127.0.0.1:4173/',out=process.argv[2]||'test-results/stage-full';await mkdir(out,{recursive:true});
const report={url:base,checks:[],errors:[],physicalDevice:false,method:process.env.STAGE_HARDWARE?'Installed Chrome, verified native WebGPU and hardware WebGL plus Canvas; DOM mouse/touch input; emulated viewports':'Bundled Chromium, software WebGL and Canvas; DOM mouse/touch input; emulated viewports'};
report.release=await fetch(new URL('release.json',base)).then(r=>r.json());
const browser=await chromium.launch({channel:process.env.STAGE_HARDWARE?'chrome':undefined,headless:true,args:process.env.STAGE_HARDWARE?[]:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:393,height:851},hasTouch:true,isMobile:true});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
const snap=()=>page.evaluate(()=>window.__firecrackersQA.snapshot());
const advance=async t=>{await page.evaluate(t=>{window.__firecrackersQA.advance(t);window.__firecrackersQA.render();},t);};
const pass=(name,data={})=>{report.checks.push({name,...data});console.log('PASS',name);};
const icon=id=>page.locator(`[data-family-icon="${id}"]`);
const enter=async backend=>{await page.goto(`${base}?backend=${backend}&qa=1&seed=20260916`);await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});await page.evaluate(()=>window.__firecrackersQA.freeze(true));
 if(process.env.STAGE_HARDWARE){
  const actual=(await snap()).backend;assert.equal(actual,backend==='webgpu'?'WebGPU':backend==='webgl'?'WebGL 2':'Canvas 2D · compatibility');
  if(backend==='webgpu'){const adapter=await page.evaluate(async()=>{const a=await navigator.gpu.requestAdapter();return {vendor:a.info.vendor,architecture:a.info.architecture,fallback:a.info.isFallbackAdapter};});assert.equal(adapter.fallback,false);pass('Native WebGPU adapter',{adapter});}
  if(backend==='webgl'){const renderer=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e.UNMASKED_RENDERER_WEBGL);});assert.doesNotMatch(renderer,/SwiftShader|software|llvmpipe/i);pass('Hardware forced WebGL',{renderer});}
 }
};
const drag=async(id,x,y,end='up')=>{const r=await icon(id).boundingBox();await page.mouse.move(r.x+24,r.y+24);await page.mouse.down();await page.mouse.move(x,y,{steps:10});if(end==='escape')await page.keyboard.press('Escape');if(end==='cancel')await icon(id).dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();};
try{
 for(const backend of (process.env.STAGE_HARDWARE?['webgpu','webgl','canvas']:['canvas','webgl'])){
  await enter(backend);
  for(const [width,height] of [[320,480],[375,667],[393,851],[679,800],[680,800],[768,1024],[844,390],[1280,800],[1920,1080]]){
   await page.setViewportSize({width,height});const layout=await inspectStage(page);await page.mouse.move(1,1);await inspectBorderlessControls(page);await page.screenshot({path:`${out}/${backend}-${width}x${height}.png`});pass(`${backend} ${width}x${height}: thirteen reachable icons, responsive left collection and separated lower controls`,{layout});
  }
  await page.setViewportSize({width:393,height:851});await inspectStage(page);
  for(const id of [...classicIds,...grandIds]){
   await advance(40);const before=await snap();await icon(id).click();const committed=await snap();assert.equal(committed.phase,'fuse');assert.equal(committed.selected,id);assert.ok(committed.committedId);assert.ok(committed.launchProfile);
   await icon(id).dispatchEvent('click');assert.equal((await snap()).committedId,committed.committedId);
   const fraction=(committed.apexScreen.y-committed.stageLayout.unobstructedScene.y)/committed.stageLayout.unobstructedScene.height;
   assert.ok(fraction>=.30&&fraction<=.38,`Upper canopy ${id}: ${fraction}`);
   await advance(id==='opal-supernova'?7.8:4.9);await page.mouse.move(1,1);await page.screenshot({path:`${out}/${backend}-${id}-upper.png`});await advance(id==='opal-supernova'?2.2:5.1);const after=await snap();assert.equal(after.launched,before.launched+1);assert.ok(after.bursts>before.bursts);pass(`${backend} ${id}: one immediate admission, immutable duplicate guard, upper canopy`,{fraction});
  }
  await advance(40);let before=await snap();const l=before.stageLayout,x=l.heroRect.x+l.heroRect.width*.4,y=l.heroRect.y+l.heroRect.height*.32;
  const geometry=JSON.stringify(l.heroRect),r=await icon('gold-willow').boundingBox();await page.mouse.move(r.x+24,r.y+24);await page.mouse.down();await page.mouse.move(x,y,{steps:10});assert.equal(await page.locator('main').getAttribute('data-drag-active'),'true');assert.equal(JSON.stringify((await snap()).stageLayout.heroRect),geometry);await page.mouse.up();
  assert.equal((await snap()).bursts,before.bursts+1);assert.equal((await snap()).launched,before.launched+1);assert.equal((await snap()).active,1);pass(`${backend}: sky release bursts once, geometry remains reserved`);
  await advance(40);
  const currentLayout=(await snap()).stageLayout;
  for(const [name,end,tx,ty] of [['water','up',196,currentLayout.heroRect.height*.77],['collection','up',currentLayout.tray.x+24,currentLayout.tray.y+24],['rail','up',currentLayout.rail.x+24,currentLayout.rail.y+24],['outside','up',-5,-5],['escape','escape',196,180],['pointercancel','cancel',196,180]]){
   before=await snap();await drag('ruby-dahlia',tx,ty,end);const after=await snap();assert.equal(after.launched,before.launched,name);assert.equal(after.bursts,before.bursts,name);assert.equal(after.committedId,before.committedId,name);pass(`${backend}: ${name} cancels without accidental click`);
  }
  before=await snap();await icon('ruby-dahlia').click();assert.equal((await snap()).phase,'fuse');const busyId=(await snap()).committedId,busyBox=await icon('gold-willow').boundingBox();await page.mouse.move(busyBox.x+24,busyBox.y+24);await page.mouse.down();await page.mouse.move(busyBox.x+40,busyBox.y+24);await advance(40);await page.mouse.move(busyBox.x+24,busyBox.y+24);await page.mouse.up();assert.equal((await snap()).committedId,null,'A completed unavailable drag cannot become a later click');assert.ok(busyId);pass(`${backend}: fresh tap immediately after cancellation launches`);
  const cdp=await context.newCDPSession(page),t=await icon('sapphire-saturn').boundingBox();before=await snap();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:t.x+24,y:t.y+24}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:196,y:180}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal((await snap()).launched,before.launched);pass(`${backend}: native touch cancellation`);
  for(const placement of [0,1]){
   await advance(40);before=await snap();const area=before.stageLayout.launchArea;await drag('sapphire-saturn',placement===0?120:300,area.y+area.height*.5);const after=await snap();assert.equal(after.phase,'fuse');assert.equal(after.bursts,before.bursts);assert.ok(after.placement>=0&&after.placement<=1);assert.ok(placement===0?after.placement<.5:after.placement>.5);await advance(1);assert.equal((await snap()).launched,before.launched+1);pass(`${backend}: terrace drop maps ${placement} into normal rocket`);
  }
  await advance(40);await page.getByRole('slider',{name:'Next rocket position'}).focus();await page.keyboard.press('End');assert.equal((await snap()).placement,1);
  await icon('gold-willow').click();const flight=await snap();await chooseFamily(page,'Sapphire Saturn');assert.equal((await snap()).committedId,flight.committedId);await page.setViewportSize({width:844,height:390});assert.equal((await snap()).committedId,flight.committedId);assert.deepEqual((await snap()).launchProfile,flight.launchProfile);await advance(40);pass(`${backend}: rotation and next-family selection preserve committed flight`);
  await page.setViewportSize({width:393,height:851});await page.getByRole('button',{name:'Pause scene',exact:true}).click();await openPanel(page,'settings');const stopped=await snap();await page.evaluate(()=>window.__firecrackersQA.freeze(false));await page.waitForTimeout(250);assert.equal((await snap()).time,stopped.time);await page.evaluate(()=>window.__firecrackersQA.freeze(true));
  for(let i=0;i<12;i++){await page.keyboard.press(i<6?'Tab':'Shift+Tab');assert.ok(await page.evaluate(()=>!!document.activeElement.closest('dialog:modal')));}
  await page.keyboard.press('Escape');assert.equal((await snap()).paused,true);assert.ok(await page.getByRole('button',{name:'Controls',exact:true}).evaluate(e=>e===document.activeElement));await page.getByRole('button',{name:'Resume scene',exact:true}).click();pass(`${backend}: panel focus, Escape, restoration and manual pause ownership`);
  await openPanel(page,'show');await page.getByRole('button',{name:'Festival',exact:true}).click();assert.equal((await snap()).show,'festival');await page.setViewportSize({width:844,height:390});assert.equal((await snap()).show,'festival');await advance(5);assert.ok((await snap()).launched>0);await openPanel(page,'show');await page.getByRole('button',{name:'Manual',exact:true}).click();await advance(40);pass(`${backend}: show profiles and rotation preserve show state`);
  await page.setViewportSize({width:393,height:851});await page.locator('body').click({position:{x:196,y:24}});for(const [i,key] of ['1','2','3','4','5','6','7','8','9','0'].entries()){await page.keyboard.press(key);assert.equal((await snap()).selected,[...classicIds,...grandIds][i]);}await page.keyboard.press('l');assert.equal((await snap()).phase,'fuse');await advance(40);await selectedLaunch(page).focus();await page.keyboard.press('Enter');assert.equal((await snap()).phase,'fuse');await advance(40);pass(`${backend}: ten shortcuts and accessible keyboard launch`);
 }
 await enter('canvas');await page.setViewportSize({width:393,height:851});await page.evaluate(()=>{document.querySelector('main').style.setProperty('--safe-top','24px');document.querySelector('main').style.setProperty('--safe-bottom','20px');});await page.setViewportSize({width:393,height:750});await inspectStage(page);assert.equal((await snap()).stageLayout.safe.top,24);await page.setViewportSize({width:640,height:400});await inspectStage(page);pass('safe inset and browser-bar resize; 200% CSS reflow geometry');
 await enter('canvas');const audio=[];page.on('request',r=>{if(r.url().includes('/audio/'))audio.push(r.url());});await page.getByRole('button',{name:'Enable sound',exact:true}).click();await page.waitForFunction(()=>window.__firecrackersQA.snapshot().recordedSamples===3);assert.equal(audio.length,3);await page.evaluate(()=>window.__firecrackersQA.freeze(false));await icon('gold-willow').click();await page.waitForFunction(()=>window.__firecrackersQA.snapshot().audioVoices>0);assert.ok((await snap()).audioVoices>0);await page.getByRole('button',{name:'Pause scene',exact:true}).click();assert.equal((await snap()).audioVoices,0);await page.getByRole('button',{name:'Mute sound',exact:true}).click();pass('sound opt-in samples and pause voice cleanup');
 assert.deepEqual(report.errors,[]);
}catch(e){report.failed=e.stack;process.exitCode=1;console.error(e);await page.screenshot({path:`${out}/FAILED.png`}).catch(()=>{});}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close();}
