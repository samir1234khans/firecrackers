import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.STAGE_URL||'http://127.0.0.1:4173/';
const out=process.argv[2]||'test-results/cinematic-integration';await mkdir(out,{recursive:true});
const report={base,method:'CI Chromium software WebGL/Canvas, emulated sizes, deterministic show checks and live audio/capture lifecycle',physicalDevice:false,hardwareQualified:false,cases:[]};
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
try{
 for(const backend of ['webgl','canvas'])for(const [width,height]of [[1280,800],[393,851]]){
  const name=`${backend}-${width}x${height}`,entry={name,checks:[],errors:[],consoleErrors:[]};report.cases.push(entry);
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,isMobile:width<500,serviceWorkers:'block'});
  await context.addInitScript(()=>localStorage.setItem('firecrackers.preferences.v1',JSON.stringify({version:4,onboarded:true,quality:'low',adaptiveResolution:false,reducedFlashes:true,sound:false,showMusic:false})));
  const page=await context.newPage();page.on('pageerror',e=>entry.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')entry.consoleErrors.push(m.text());});
  let musicRequests=0;page.on('request',r=>{if(r.url().includes('/music/'))musicRequests++;});
  const snap=()=>page.evaluate(()=>window.__firecrackersQA.snapshot());
  const advance=t=>page.evaluate(t=>window.__firecrackersQA.advance(t),t);
  const choose=async(theme,mode='finale')=>{await page.getByRole('button',{name:/^Show mode:/}).click();await page.getByLabel(mode==='finale'?'Finale show':'Endless show',{exact:true}).selectOption(theme);await page.getByRole('button',{name:mode==='finale'?'Finale':'Festival',exact:true}).click();};
  const shot=label=>page.screenshot({path:`${out}/${name}-${label}.png`});
  try{
   await page.goto(`${base}?backend=${backend}&qa=1&seed=731`);await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});await page.evaluate(()=>window.__firecrackersQA.freeze(true));
   const expected=backend==='webgl'?'WebGL 2':'Canvas 2D · compatibility';assert.equal((await snap()).backend,expected);assert.equal(musicRequests,0);
   for(const theme of ['moonlit','golden','prismatic']){
    await choose(theme);assert.equal((await snap()).cinematic.theme,theme);assert.equal((await snap()).showTiming.duration,90);
    await advance(5.2);await shot(`${theme}-opening`);await advance(73);const crest=await snap();assert.equal(crest.show,'finale');assert.ok(crest.cinematic.admitted>=4);assert.ok(crest.cinematic.maxImpactError<=1/30+1e-6);assert.equal(crest.backend,expected);
    await advance(12);assert.equal((await snap()).show,null);await advance(35);await page.getByRole('button',{name:'Replay',exact:true}).waitFor();
    await page.getByRole('button',{name:'Replay',exact:true}).click();assert.equal((await snap()).cinematic.theme,theme);assert.equal((await snap()).personal.kind,'finale');await advance(120);await advance(15);
   }
   assert.equal(musicRequests,0);entry.checks.push('all three finite scores and their themed Encore finish on the shared clock without audio consent');
   await choose('moonlit','festival');await advance(12);await page.getByRole('button',{name:/^Show mode:/}).click();await page.getByLabel('Endless show',{exact:true}).selectOption('golden');assert.equal((await snap()).cinematic.theme,'moonlit');assert.equal((await snap()).cinematic.pendingTheme,'golden');await page.getByRole('button',{name:'Close show mode',exact:true}).click();await advance(3.1);assert.equal((await snap()).cinematic.theme,'golden');entry.checks.push('queued theme joins the next phrase without restarting');
   await page.getByRole('button',{name:'Controls',exact:true}).click();await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('tab',{name:'Sound',exact:true}).click();
   await page.getByRole('checkbox',{name:'Show music',exact:true}).check();assert.equal((await snap()).audioEnabled,false);assert.equal(musicRequests,0);
   await page.getByRole('checkbox',{name:'Sound',exact:true}).check();await page.waitForFunction(()=>window.__firecrackersQA.snapshot().audioEnabled);
   await page.getByRole('button',{name:'Close panel',exact:true}).click();await page.evaluate(()=>window.__firecrackersQA.freeze(false));
   await page.waitForFunction(()=>window.__firecrackersQA.snapshot().musicVoices>0,null,{timeout:30000});let state=await snap();assert.equal(state.musicFailure,'');assert.ok(state.musicVoices<=2&&state.musicBytes<=24*1024*1024);entry.checks.push('separate music/master consent, real FLAC decoder and bounded live score transport');
   await page.getByRole('button',{name:'Pause scene',exact:true}).click();await page.waitForFunction(()=>window.__firecrackersQA.snapshot().musicVoices===0);const time=(await snap()).time;await page.waitForTimeout(150);assert.equal((await snap()).time,time);await page.getByRole('button',{name:'Resume scene',exact:true}).click();await page.waitForFunction(()=>window.__firecrackersQA.snapshot().musicVoices>0,null,{timeout:15000});entry.checks.push('pause/resume stops voices and resumes current phrase rather than opening');
   await page.getByRole('button',{name:'Capture this night',exact:true}).click();await page.getByRole('checkbox',{name:'Include app audio',exact:true}).check();await page.getByRole('button',{name:'Record clip',exact:true}).click();await page.waitForFunction(()=>window.__firecrackersQA.snapshot().capture.recording);await page.waitForTimeout(1100);await page.getByRole('button',{name:'Stop recording clip',exact:true}).click();
   const video=page.getByRole('region',{name:'Capture preview'}).getByLabel('Captured fireworks clip');
   await video.waitFor();const decoded=await video.evaluate(async v=>{await new Promise((ok,bad)=>{if(v.readyState>=2)return ok();v.onloadeddata=ok;v.onerror=()=>bad(Error('Video decode failed'));setTimeout(()=>bad(Error('Video decode timed out')),10000);v.load();});return{w:v.videoWidth,h:v.videoHeight,duration:v.duration};});assert.ok(decoded.w>0&&decoded.h>0&&decoded.duration>0);await page.getByText(/seconds · app audio/).waitFor();entry.capture=decoded;await shot('audio-capture');entry.checks.push('explicit app-audio clip decodes; no microphone or extra capture permission');
   await page.getByRole('button',{name:'Close panel',exact:true}).click();await page.getByRole('button',{name:/^Show mode:/}).click();await page.getByRole('button',{name:'Manual',exact:true}).click();await page.waitForFunction(()=>window.__firecrackersQA.snapshot().musicVoices===0);state=await snap();assert.equal(state.backend,expected);assert.equal(state.capture.recording,false);assert.deepEqual(entry.errors,[]);assert.deepEqual(entry.consoleErrors,[]);entry.final=state;entry.pass=true;console.log('PASS',name,entry.checks.length);
  }catch(error){entry.pass=false;entry.failure=error.stack;entry.final=await snap().catch(()=>null);await shot('FAILED').catch(()=>{});console.error('FAIL',name,error.message);process.exitCode=1;}finally{await context.close();}
 }
}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close();}
