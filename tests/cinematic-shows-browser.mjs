import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { openPanel, settingsTab } from './stage-helpers.mjs';
const base=process.env.SHOW_URL||'http://127.0.0.1:4188/';
const out=process.argv[2]||'test-results/cinematic-browser';await mkdir(out,{recursive:true});
const software=process.env.SHOW_SOFTWARE==='1';
const browser=await chromium.launch(software?{headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{channel:'chrome',headless:true});
const report={base,method:software?'CI software WebGL/Canvas':'Installed Chrome native backends; emulated viewport sizes',browserPlugin:'Browser plugin not available; repository Playwright',release:null,cases:[],audio:[],errors:[],failed:null};
const sizes=[[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]];
const snap=page=>page.evaluate(()=>window.__firecrackersQA.snapshot());
const ready=page=>page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});
async function mode(page,theme,value='finale'){
 await page.getByRole('button',{name:/^Show mode:/}).click();
 await page.getByLabel(value==='finale'?'Finale show':'Endless show',{exact:true}).selectOption(theme);
 await page.getByRole('button',{name:value==='finale'?'Finale':'Festival',exact:true}).click();
}
try{
 for(const backend of (process.env.SHOW_BACKENDS||'webgpu,webgl,canvas').split(',')){
  const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('firecrackers.preferences.v1',JSON.stringify({version:4,onboarded:true,quality:'standard',reducedFlashes:false,showMusic:false,sound:false})));
  let musicRequests=0;page.on('request',r=>{if(r.url().includes('/music/'))musicRequests++;});
  await page.goto(`${base}?backend=${backend}&qa=1&seed=42`);await ready(page);assert.equal(await page.title(),'Firecrackers');
  assert.equal((await snap(page)).show,null);assert.equal(musicRequests,0);
  if(backend==='webgpu')assert.equal((await snap(page)).backend,'WebGPU');
  if(backend==='webgl')assert.equal((await snap(page)).backend,'WebGL 2');
  if(backend==='canvas')assert.match((await snap(page)).backend,/Canvas/);
  await page.evaluate(()=>window.__firecrackersQA.freeze(true));
  report.release ??= await page.evaluate(async()=>await(await fetch('release.json')).json());
  for(const [width,height] of sizes){
   await page.setViewportSize({width,height});
   for(const theme of ['moonlit','golden','prismatic']){
    await mode(page,theme);assert.equal((await snap(page)).cinematic.theme,theme);
    await page.evaluate(()=>window.__firecrackersQA.advance(5.2));
    if(width===1280||width===393)await page.screenshot({path:`${out}/${backend}-${width}-${theme}-opening.png`});
    await page.evaluate(()=>window.__firecrackersQA.advance(51));
    const crest=await snap(page);report.lastSnapshot=crest;assert.ok(crest.cinematic.admitted>=5);assert.ok(crest.cinematic.maxImpactError<=1/30+1e-6);
    assert.equal(crest.backend,backend==='webgpu'?'WebGPU':backend==='webgl'?'WebGL 2':'Canvas 2D · compatibility');
    if(width===1280||width===393)await page.screenshot({path:`${out}/${backend}-${width}-${theme}-crest.png`});
    await page.evaluate(()=>window.__firecrackersQA.advance(22));
    if(width===1280||width===393)await page.screenshot({path:`${out}/${backend}-${width}-${theme}-resolve.png`});
    await page.evaluate(()=>window.__firecrackersQA.advance(12));assert.equal((await snap(page)).show,null);
    assert.equal(await page.locator('html').evaluate(e=>e.scrollWidth>innerWidth),false);
    report.cases.push({backend,width,height,theme,admitted:crest.cinematic.admitted,maxImpactError:crest.cinematic.maxImpactError});
    await page.evaluate(()=>window.__firecrackersQA.advance(30));
   }
   await page.getByRole('button',{name:/^Show mode:/}).click();
   await page.getByLabel('Endless show',{exact:true}).selectOption('cycle');
   if(width===393||width===320)await page.screenshot({path:`${out}/${backend}-${width}-styles.png`});
   await page.keyboard.press('Escape');
  }
  assert.equal(musicRequests,0,'show selection does not imply audio consent');
  await page.setViewportSize({width:1280,height:800});await mode(page,'moonlit','festival');
  await page.evaluate(()=>window.__firecrackersQA.advance(12));await page.getByRole('button',{name:/^Show mode:/}).click();
  await page.getByLabel('Endless show',{exact:true}).selectOption('golden');assert.equal((await snap(page)).cinematic.theme,'moonlit');
  await page.getByRole('button',{name:'Close show mode',exact:true}).click();await page.evaluate(()=>window.__firecrackersQA.advance(3.1));assert.equal((await snap(page)).cinematic.theme,'golden');
  await page.getByRole('button',{name:'Hide controls',exact:true}).click();assert.equal(await page.locator('main').getAttribute('data-immersive'),'true');await page.getByRole('button',{name:'Show controls',exact:true}).click();
  await page.getByRole('button',{name:/^Show mode:/}).click();await page.getByRole('button',{name:'Manual',exact:true}).click();await page.evaluate(()=>window.__firecrackersQA.advance(30));
  await openPanel(page,'settings');await settingsTab(page,'Sound');await page.getByRole('checkbox',{name:'Show music',exact:true}).click();
  await page.getByRole('checkbox',{name:'Sound',exact:true}).click();await page.waitForFunction(()=>window.__firecrackersQA.snapshot().audioEnabled);
  await page.getByRole('button',{name:'Close panel',exact:true}).click();await mode(page,'prismatic','festival');await page.evaluate(()=>window.__firecrackersQA.freeze(false));
  await page.waitForFunction(()=>window.__firecrackersQA.snapshot().musicVoices>0,null,{timeout:20000});
  const playing=await snap(page);assert.ok(playing.musicVoices<=2);assert.ok(playing.musicBytes<=24*1024*1024);assert.equal(playing.musicFailure,'');
  // Actual decoder verifies all delivered recordings, peak headroom and matching overlap handles.
  const audio=await page.evaluate(async()=>{
   const context=new OfflineAudioContext(2,1,24000),results=[];let previous=null;
   for(const theme of ['moonlit','golden','prismatic']){previous=null;for(let i=0;i<6;i++){
    const b=await context.decodeAudioData(await(await fetch(`music/${theme}-${i}.flac`)).arrayBuffer());let peak=0,seam=0;
    for(let channel=0;channel<b.numberOfChannels;channel++){const v=b.getChannelData(channel);for(const sample of v)peak=Math.max(peak,Math.abs(sample));if(previous){const p=previous.getChannelData(channel);for(let k=0;k<3600;k++)seam=Math.max(seam,Math.abs(p[p.length-3600+k]-v[k]));}}
    results.push({theme,chunk:i,duration:b.duration,peak,seam});previous=b;
   }}return results;
  });
  for(const entry of audio){assert.ok(Math.abs(entry.duration-15.15)<1e-5);assert.ok(entry.peak<.501);assert.ok(entry.seam<.0001);}
  report.audio.push({backend,playing:{voices:playing.musicVoices,bytes:playing.musicBytes,sampleRate:playing.musicSampleRate},assets:audio});
  await page.getByRole('button',{name:'Pause scene',exact:true}).click();const paused=await snap(page);await page.waitForTimeout(300);assert.equal((await snap(page)).time,paused.time);assert.equal((await snap(page)).musicVoices,0);
  await page.getByRole('button',{name:'Resume scene',exact:true}).click();await page.waitForFunction(()=>window.__firecrackersQA.snapshot().musicVoices>0);
  await page.getByRole('button',{name:'Mute sound',exact:true}).click();await page.waitForFunction(()=>window.__firecrackersQA.snapshot().musicVoices===0);
  console.log('PASS',backend,report.cases.length,'score/viewport cases');await page.close();
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failed=e.stack;throw e;}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
