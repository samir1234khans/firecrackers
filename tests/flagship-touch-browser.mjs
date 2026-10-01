import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.argv[2]||'test-results/flagship-touch',base=process.env.FLAGSHIP_URL||'http://127.0.0.1:4173/';await mkdir(out,{recursive:true});
const hardware=process.env.FLAGSHIP_HARDWARE==='1';
const browser=await chromium.launch(hardware?{channel:'chrome',headless:true}:{headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const report={base,method:'Chromium mobile viewport and native touch events; no physical-device claim',checks:[],errors:[],failed:null};
try{
 for(const backend of hardware?['webgpu','webgl','canvas']:['webgl','canvas']){
  const context=await browser.newContext({viewport:{width:393,height:851},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.goto(`${base}?qa=1&seed=20260916&backend=${backend}`);await page.waitForSelector('main[data-ready="true"]',{timeout:90000});await page.evaluate(()=>window.__firecrackersQA.freeze(true));
  const cdp=await context.newCDPSession(page),snap=()=>page.evaluate(()=>window.__firecrackersQA.snapshot()),advance=t=>page.evaluate(t=>window.__firecrackersQA.advance(t),t);
  assert.equal((await snap()).backend,backend==='webgpu'?'WebGPU':backend==='webgl'?'WebGL 2':'Canvas 2D · compatibility');
  for(const id of['imperial-crown','celestial-aurora','royal-phoenix']){
   const icon=page.locator(`[data-family-icon="${id}"]`);await icon.tap();let s=await snap();assert.equal(s.phase,'fuse');assert.equal(s.selected,id);const n=s.launched;await advance(10);assert.equal((await snap()).launched,n+1);await advance(40);
   const send=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y}]});
   const start=async()=>{const r=await icon.boundingBox();await send('touchStart',r.x+24,r.y+24);};
   s=await snap();await start();await send('touchMove',170,190);await send('touchEnd');assert.equal((await snap()).launched,s.launched+1);assert.equal((await snap()).bursts,s.bursts+1);await advance(40);
   s=await snap();const l=s.stageLayout;await start();await send('touchMove',190,l.launchArea.y+l.launchArea.height*.5);await send('touchEnd');assert.equal((await snap()).phase,'fuse');await advance(10);assert.equal((await snap()).launched,s.launched+1);await advance(40);
   s=await snap();await start();await send('touchMove',170,190);await send('touchCancel');assert.equal((await snap()).launched,s.launched);assert.equal((await snap()).bursts,s.bursts);await icon.tap();assert.equal((await snap()).phase,'fuse');await advance(40);
   report.checks.push(`${backend}/${id}: touch tap, sky/terrace drag, cancel, fresh tap and no duplicate`);
  }
  await context.close();
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failed=e.stack;process.exitCode=1;console.error(e);}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
console.log(JSON.stringify(report));
