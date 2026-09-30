import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {classicIds,grandIds,signatureIds} from './stage-helpers.mjs';
const base=process.env.EDGE_URL||'http://127.0.0.1:4173/',out=process.argv[2]||'test-results/open-sky-edges';await mkdir(out,{recursive:true});
const hardware=process.env.EDGE_HARDWARE==='1',quick=process.env.EDGE_QUICK==='1';
const requested=process.env.EDGE_BACKENDS?.split(',');const backends=requested||(hardware?['webgpu','webgl','canvas']:['webgl','canvas']);
assert.ok(backends.every(b=>['webgpu','webgl','canvas'].includes(b)));
const views=process.env.EDGE_VIEWS?process.env.EDGE_VIEWS.split(',').map(v=>v.split('x').map(Number)):quick?[[393,851],[844,390]]:[[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]];
const ids=process.env.EDGE_SIGNATURES==='1'?signatureIds:quick?['gold-willow','sapphire-saturn','opal-supernova',...signatureIds]:[...classicIds,...grandIds,...signatureIds];
const browser=await chromium.launch(hardware?{channel:'chrome',headless:true}:{headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const report={base,seed:20260916,quick,sourceScope:process.env.EDGE_SOURCE_SCOPE||'Served build; release metadata captured separately',method:hardware?'Installed Chrome native GPU plus Canvas; viewport emulation and logical phase sampling':'Bundled Chromium software WebGL/Canvas; viewport emulation and logical phase sampling',
 originalEnvelopeScope:'Original effects preserve size and receive visible expansion captures. Falling tails and outlying sparks have no invented rectangular clipping assertion.',checks:[],errors:[],captures:[]};let page;
try{for(const backend of backends)for(const [width,height]of views){
 page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(`${base}?backend=${backend}&qa=1&seed=${report.seed}`);await page.waitForFunction(()=>window.__firecrackersQA&&document.querySelector('main').dataset.ready==='true',undefined,{timeout:90000});
 await page.waitForFunction(()=>document.querySelector('main').dataset.presented==='true',undefined,{timeout:90000});
 if(backend!=='canvas')await page.waitForFunction(()=>Object.values(window.__firecrackersQA.snapshot().authoredAssetStates).every(s=>s==='active'),undefined,{timeout:90000});await page.evaluate(()=>window.__firecrackersQA.freeze(true));
 const adapter=hardware&&backend==='webgpu'?await page.evaluate(async()=>{const a=await navigator.gpu.requestAdapter();return {vendor:a.info.vendor,architecture:a.info.architecture,fallback:a.info.isFallbackAdapter}}):null;
 if(adapter)assert.equal(adapter.fallback,false);
 const release=await page.evaluate(()=>fetch('/release.json').then(r=>r.json())),snap=()=>page.evaluate(()=>window.__firecrackersQA.snapshot()),advance=t=>page.evaluate(t=>window.__firecrackersQA.advance(t),t);
 assert.equal((await snap()).backend,backend==='webgpu'?'WebGPU':backend==='webgl'?'WebGL 2':'Canvas 2D · compatibility');
 for(const id of ids){let effectScale;
  for(const[key,position]of[['Home',0],['End',1]]){
   await advance(40);await page.getByRole('slider',{name:'Next rocket position',exact:true}).focus();await page.keyboard.press(key);await page.locator(`[data-family-icon="${id}"]`).click();let s=await snap();assert.equal(s.committedPlacement,position);
   const thisScale=s.launchProfile.effectScale??1;if(effectScale===undefined)effectScale=thisScale;else assert.equal(thisScale,effectScale,'edge placement must not shrink the effect');
   const admission=s,requestedX=position===0?s.launchBounds.screenMin:s.launchBounds.screenMax;assert.ok(Math.abs(s.padContact.x-requestedX)<2,'Full usable terrace endpoint');
   await page.mouse.move(width/2,10);
   const representative=hardware&&backend==='webgpu'&&[393,844,1280].includes(width)&&['gold-willow','sapphire-saturn','opal-supernova','imperial-crown'].includes(id);
   if(representative){const file=`${backend}-${width}x${height}-${id}-${position}-standing.png`;await page.screenshot({path:`${out}/${file}`});report.captures.push({file,backend,width,height,id,position,phase:'standing',release});}
   await advance(s.flight.ascent+.8);const samples=[];
   for(const dt of signatureIds.includes(id)?[.75,1,1.25,1.25,1.25,1.25]:[.55,.65,.8]){
    await advance(dt);s=await snap();
    if(signatureIds.includes(id)){const b=s.signatureBounds.find(b=>b.family===signatureIds.indexOf(id)+10),r=s.stageLayout.unobstructedScene;assert.ok(b&&b.count>0);assert.ok(b.left>=r.x-1&&b.right<=r.x+r.width+1&&b.top>=r.y-1&&b.bottom<=r.y+r.height+1,JSON.stringify({width,height,id,position,b,r}));samples.push(b);}
    else assert.ok(s.particles>0||s.carriers>0,'Original burst expansion must remain visible');
   }
   if(representative){const file=`${backend}-${width}x${height}-${id}-${position}-expansion.png`;await page.screenshot({path:`${out}/${file}`});report.captures.push({file,backend,width,height,id,position,phase:'expansion',release});}
   report.checks.push({backend,width,height,id,position,adapter,release,admission,samples});console.log('PASS',backend,width,height,id,position);
  }
 }await page.close();
}assert.deepEqual(report.errors,[])}catch(e){report.failed=e.stack;report.failureState=await page?.evaluate(()=>window.__firecrackersQA?.snapshot()).catch(()=>null);console.error(e);process.exitCode=1;await page?.screenshot({path:`${out}/FAILED.png`}).catch(()=>{});}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close()}
