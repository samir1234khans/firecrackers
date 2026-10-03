import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.LEGACY_URL||'http://127.0.0.1:4194/';
const out=process.argv[2]||'test-results/legacy-realism';await mkdir(out,{recursive:true});
const ids=['gold-willow','multicolor-peony','chrysanthemum','silver-crossette-crackle','grand-finale','aurora-crown','ruby-dahlia','sapphire-saturn','phoenix-palm','opal-supernova','imperial-crown','celestial-aurora','royal-phoenix'];
const views=[[1280,800],[393,851],[320,480],[844,390]];
const hardware=process.env.LEGACY_HARDWARE==='1',quality=process.env.LEGACY_QUALITY||'ultra';
const report={base,quality,hardware,seed:20261004,method:hardware?'Installed Chrome native GPU, viewport emulation and fixed-clock phase sampling; not physical phone or GPU timing':'Deterministic fixed-clock captures and condensed browser video; software WebGL/Canvas, phone emulation; not GPU timing',cases:[],errors:[],failed:null};
const browser=await chromium.launch(hardware?{channel:'chrome',headless:true}:{headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
let activePage;
try{
 for(const backend of (process.env.LEGACY_BACKENDS||'webgl,canvas').split(','))for(const [width,height]of views.filter(v=>!process.env.LEGACY_VIEW||String(v[0])===process.env.LEGACY_VIEW)){
  const name=`${backend}-${width}x${height}`;
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',...(process.env.LEGACY_VIDEO==='1'&&width===1280?{recordVideo:{dir:`${out}/video`,size:{width,height}}}:{})});
  await context.addInitScript(quality=>localStorage.setItem('firecrackers.preferences.v1',JSON.stringify({version:4,onboarded:true,quality,adaptiveResolution:false,reducedFlashes:true,reducedMotion:false,sound:false,showMusic:false})),quality);
  const page=await context.newPage();activePage=page;page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  for(const id of ids.filter(id=>!process.env.LEGACY_FAMILIES||process.env.LEGACY_FAMILIES.split(',').includes(id))){
   await page.goto(`${base}?backend=${backend}&qa=1&seed=${report.seed}`);
   await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});
   await page.evaluate(()=>window.__firecrackersQA.freeze(true));
   const snap=()=>page.evaluate(()=>window.__firecrackersQA.snapshot());
   const advance=seconds=>page.evaluate(seconds=>window.__firecrackersQA.advance(seconds),seconds);
   const entry={name,id,phases:[],resources:{heads:0,trails:0,reservations:0,smoke:0,embers:0}};report.cases.push(entry);
   assert.equal((await snap()).backend,backend==='canvas'?'Canvas 2D · compatibility':backend==='webgpu'?'WebGPU':'WebGL 2');
   if(hardware&&backend==='webgpu'&&!report.adapter){report.adapter=await page.evaluate(async()=>{const a=await navigator.gpu.requestAdapter();return {vendor:a.info.vendor,architecture:a.info.architecture,fallback:a.info.isFallbackAdapter};});assert.equal(report.adapter.fallback,false);}
   await page.locator(`[data-family-icon="${id}"]`).click();await advance(.8);
   const flight=(await snap()).flight;assert.ok(flight);
   const advanceMotion=async seconds=>{if(process.env.LEGACY_VIDEO==='1'&&width===1280){while(seconds>.12){await advance(.12);await page.screenshot();seconds-=.12;}}if(seconds>0)await advance(seconds);};
   const capture=async phase=>{
    const s=await snap();for(const [key,value]of Object.entries({heads:s.headCount,trails:s.trailCount,reservations:s.futureHeads,smoke:s.smoke,embers:s.embers}))entry.resources[key]=Math.max(entry.resources[key],value);
    if(process.env.LEGACY_VALIDATE==='1')for(const b of s.effectBounds){const r=s.stageLayout.unobstructedScene;assert.ok(b.left>=r.x-1&&b.right<=r.x+r.width+1&&b.top>=r.y-1&&b.bottom<=r.y+r.height+1,JSON.stringify({name,id,phase,b,r}));}
    assert.ok(s.headCount+s.futureHeads<=3072);assert.ok(s.trailCount<=24000);assert.ok(s.smoke<=96);assert.ok(s.embers<=768);
    const file=`${name}-${id}-${phase}.png`;await page.screenshot({path:`${out}/${file}`});
    entry.phases.push({phase,file,time:s.time,flight:s.flight,profile:s.launchProfile,apex:s.apexScreen,bounds:s.effectBounds||s.signatureBounds,bursts:s.bursts,particles:s.particles,layout:s.stageLayout});
   };
   await advanceMotion(Math.max(0,flight.thrust*.65-flight.age));await capture('climb');
   await advanceMotion(Math.max(0,flight.ascent*.87-(await snap()).flight.age));await capture('coast');
   await advanceMotion(Math.max(0,flight.ascent-(await snap()).flight.age+.08));await capture('opening');
   if(process.env.LEGACY_VIDEO==='1'&&width===1280){for(let j=0;j<18;j++){await advance(.15);await page.screenshot();}}else await advance(2.7);
   await capture('developed');await advanceMotion(id==='opal-supernova'?4.6:3.4);await capture('residue');
   await advance(40);const clean=await snap();assert.equal(clean.headCount+clean.futureHeads+clean.trailCount+clean.smoke+clean.embers+clean.carriers,0);
   if(!report.release)report.release=await page.evaluate(()=>fetch('/release.json').then(r=>r.json()));
  }
  console.log('PASS legacy visual matrix',name,report.cases.filter(c=>c.name===name).length,'families');await context.close();
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failed=e.stack;report.failureState=await activePage?.evaluate(()=>window.__firecrackersQA?.snapshot()).catch(()=>null);await activePage?.screenshot({path:`${out}/FAILED.png`}).catch(()=>{});throw e;}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}

