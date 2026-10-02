import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { performanceIsolation } from './performance-isolation.mjs';
const out=process.argv[2]||'test-results/cinematic-qualification',origin=process.env.SHOW_URL||'http://127.0.0.1:4188/';await mkdir(out,{recursive:true});
const started=Date.now(),browsers=new Set(),originalLaunch=chromium.launch.bind(chromium);
const maximumMinutes=Number(process.env.QUALIFICATION_MINUTES||20);
assert.ok(Number.isFinite(maximumMinutes)&&maximumMinutes>0&&maximumMinutes<=20,'Qualification window must stay within the owner-approved 20 minutes');
chromium.launch=async(...args)=>{const b=await originalLaunch(...args);browsers.add(b);return b;};
const report={origin,started:new Date(started).toISOString(),maximumMinutes,completed:false,stable:false,paired:null,stability:[],isolation:null,errors:[],failed:null};
let timedOut=false,isolation;
const deadline=setTimeout(()=>{timedOut=true;for(const b of browsers)void b.close();},maximumMinutes*60*1000);
const check=()=>{if(timedOut)throw Error('Owner-capped 20-minute window exhausted');isolation.check();};
try{
 isolation=await performanceIsolation();report.isolation=isolation.evidence;check();
 // Reuse the established low-overhead paired observer and unchanged acceptance assertions.
 process.env.WATER_BASELINE_URL='https://firecrackers.mainandmany.com/';process.env.WATER_URL=origin;
 process.env.WATER_PERFORMANCE_BACKENDS='webgpu,webgl,canvas';process.env.WATER_PERFORMANCE_WIDTH='1280';process.env.WATER_PERFORMANCE_REPEATS='2';process.env.WATER_PERFORMANCE_WARM_LAUNCH='1';
 process.argv[2]=`${out}/paired`;await import('./moonlit-water-performance.mjs');process.argv[2]=out;
 report.paired=JSON.parse(await readFile(`${out}/paired/report.json`,'utf8'));check();
 if(report.paired.failed)throw Error('Paired qualification did not complete: '+report.paired.failed);
 const pairedPass=report.paired.acceptance.appRenderedCadenceWithinAllowance&&report.paired.acceptance.rafWithinAllowance&&report.paired.acceptance.noRepeatedNewRenderedTransitionOver50&&report.paired.acceptance.noRepeatedNewRenderedTransitionOver100&&report.paired.errors.length===0;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 for(const [backend,mode,seconds,label] of [['webgpu','finale',94,'cold 90s show'],['webgpu','finale',94,'warmed 90s show'],['webgpu','always',45,'Super High peak'],['webgl','festival',30,'forced WebGL'],['canvas','festival',30,'Canvas']]){
  check();let page;
  if(label==='warmed 90s show')page=browser.contexts()[0].pages()[0];
  else{page=await browser.newPage({viewport:{width:1280,height:800},serviceWorkers:'block'});page.on('pageerror',e=>report.errors.push(e.message));await page.addInitScript(()=>{localStorage.setItem('firecrackers.preferences.v1',JSON.stringify({version:4,onboarded:true,quality:'ultra',reducedFlashes:false,sound:false,alwaysPace:4}));if(navigator.gpu){const original=GPUAdapter.prototype.requestDevice;GPUAdapter.prototype.requestDevice=async function(...args){window.__testedAdapter={vendor:this.info.vendor,architecture:this.info.architecture,fallback:this.info.isFallbackAdapter};return original.apply(this,args);};}});await page.goto(`${origin}?qa=1&backend=${backend}&seed=42`);await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});}
  const expected=backend==='webgpu'?'WebGPU':backend==='webgl'?'WebGL 2':'Canvas 2D · compatibility';
  assert.equal(await page.evaluate(()=>window.__firecrackersQA.snapshot().backend),expected);
  await page.getByRole('button',{name:/^Show mode:/}).click();
  if(mode==='always'){await page.getByRole('button',{name:'Always Play',exact:true}).click();await page.getByRole('radio',{name:'4 Super High',exact:true}).check();await page.getByRole('button',{name:'Start Always Play',exact:true}).click();}
  else await page.getByRole('button',{name:mode==='finale'?'Finale':'Festival',exact:true}).click();
  const record={backend,label,seconds,adapter:await page.evaluate(()=>window.__testedAdapter??null),samples:[],release:await page.evaluate(async()=>await(await fetch('release.json')).json())};report.stability.push(record);
  if(backend==='webgpu')assert.equal(record.adapter.fallback,false);
  for(let i=0;i<seconds;i++){await page.waitForTimeout(1000);check();const s=await page.evaluate(()=>window.__firecrackersQA.snapshot());record.samples.push({time:s.time,show:s.show,phase:s.cinematic.phase,backend:s.backend,submitMs:s.submitMs,headCount:s.headCount,quality:s.quality,recoveryHistory:s.recoveryHistory,gpuErrors:s.gpuErrors});assert.equal(s.backend,expected,JSON.stringify(s.recoveryHistory));assert.equal(s.quality,'ultra');assert.equal(s.recoveryHistory.length,0);assert.deepEqual(s.gpuErrors??[],[]);}
  await page.screenshot({path:`${out}/${backend}-${mode}-${label.replaceAll(' ','-')}.png`});
  if(mode==='finale')assert.equal(record.samples.at(-1).show,null,'Finite show completes in normal real time');
  if(label!=='cold 90s show')await page.close();console.log('PASS',label);
 }
 check();await browser.close();report.completed=true;report.stable=pairedPass&&report.errors.length===0;
 if(!report.stable){report.failed='Paired frame-interval/transition allowance was not met';process.exitCode=1;}
}catch(e){report.failed=e.stack;process.exitCode=1;console.error(e.message);}finally{
 for(const b of browsers)await b.close().catch(()=>{});await new Promise(r=>setTimeout(r,2500));
 if(isolation){try{check();}catch(e){report.failed=e.stack;report.completed=report.stable=false;process.exitCode=1;}isolation.close();}
 clearTimeout(deadline);report.wallSeconds=(Date.now()-started)/1000;report.completed=report.completed&&!timedOut;await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({completed:report.completed,stable:report.stable,wallSeconds:report.wallSeconds,failed:report.failed}));
}
