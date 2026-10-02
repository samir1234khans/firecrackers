import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { installWaterTimingProbe, validateWaterTimingProbe, sampleWaterTiming } from './moonlit-water-probe.mjs';
const candidate=process.env.ALWAYS_URL||'http://127.0.0.1:4173/';
const baseline=process.env.ALWAYS_BASELINE||'https://firecrackers.mainandmany.com/';
const out=process.argv[2]||'test-results/always-performance';await mkdir(out,{recursive:true});
const backends=(process.env.ALWAYS_PERF_BACKENDS||'webgpu,webgl,canvas').split(',');
const repeats=Number(process.env.ALWAYS_PERF_REPEATS||4);
const seconds=Number(process.env.ALWAYS_PERF_SECONDS||15);
const quality=process.env.ALWAYS_PERF_QUALITY||'standard';
assert.ok(['low','standard','ultra'].includes(quality));
const report={candidate,baseline,method:'Sequential installed Chrome, counterbalanced baseline/candidate legacy workloads, then four paces with alternating order. Fixed scalar observer; normal real-time clock. No completed GPU timing or physical-phone qualification.',runs:[],comparisons:[],errors:[],failed:null};
const browser=await chromium.launch({channel:'chrome',headless:true});
const quantile=(v,q)=>{if(!v.length)return null;const a=[...v].sort((a,b)=>a-b);return a[Math.min(a.length-1,Math.floor(a.length*q))];};
function summary(frames){const rendered=frames.filter(f=>f.newRender&&f.renderedIntervalMs!==null);return{samples:frames.length,frames:rendered.length,renderP50:quantile(rendered.map(f=>f.renderedIntervalMs),.5),renderP95:quantile(rendered.map(f=>f.renderedIntervalMs),.95),renderP99:quantile(rendered.map(f=>f.renderedIntervalMs),.99),rafP95:quantile(frames.map(f=>f.rafMs),.95),cpuP95:quantile(rendered.map(f=>f.submitMs),.95),over50:rendered.filter(f=>f.renderedIntervalMs>50).length,over100:rendered.filter(f=>f.renderedIntervalMs>100).length};}
const labels=['Low','Medium','High','Super High'];
async function condition(origin,source,backend,workload,repeat,duration){
 const errors=[];const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block',reducedMotion:'no-preference',...(source==='candidate'&&repeat===0&&typeof workload==='number'?{recordVideo:{dir:`${out}/videos`,size:{width:1280,height:800}}}:{})});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(quality=>localStorage.setItem('firecrackers.preferences.v1',JSON.stringify({version:3,onboarded:true,quality,reducedFlashes:false,sound:false,placementMode:'random'})),quality);
 const url=new URL(origin);url.searchParams.set('backend',backend);url.searchParams.set('qa','1');url.searchParams.set('seed','42');
 await page.goto(url.href);await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});
 await page.waitForFunction(()=>window.__firecrackersQA.snapshot().moon?.ready,{},{timeout:90000});
 if(backend!=='canvas')await page.waitForFunction(()=>Object.values(window.__firecrackersQA.snapshot().authoredAssetStates||{}).every(v=>v==='active'),{},{timeout:90000});
 const release=await page.evaluate(()=>fetch('/release.json').then(r=>r.json()));
 const identity=await page.evaluate(async backend=>{
  if(backend==='webgpu'){const a=await navigator.gpu.requestAdapter();return a?{vendor:a.info.vendor,architecture:a.info.architecture,fallback:a.info.isFallbackAdapter}:null;}
  if(backend==='webgl'){const c=[...document.querySelectorAll('canvas')].find(c=>c.getContext('webgl2'));const g=c?.getContext('webgl2');const e=g?.getExtension('WEBGL_debug_renderer_info');return{driver:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):''};}
  return {implementation:'Canvas 2D'};
 },backend);
 if(backend==='webgpu'){assert.ok(identity);assert.equal(identity.fallback,false);}if(backend==='webgl')assert.ok(identity.driver&&!/swiftshader|llvmpipe|software/i.test(identity.driver));
 await installWaterTimingProbe(page);await validateWaterTimingProbe(page);
 await page.getByRole('button',{name:/^Show mode:/}).click();
 if(typeof workload==='number'){
  await page.getByRole('button',{name:'Always Play',exact:true}).click();await page.getByRole('radio',{name:`${workload} ${labels[workload-1]}`,exact:true}).check();
  await page.screenshot({path:`${out}/${backend}-${workload}-${repeat}-panel.png`});await page.getByRole('button',{name:'Start Always Play',exact:true}).click();
 }else await page.getByRole('button',{name:'Festival',exact:true}).click();
 await page.waitForTimeout(10000); // natural warm-up; no QA advancing/freezing
 const before=await page.evaluate(()=>window.__firecrackersQA.snapshot());const frames=[];
 for(let remaining=duration;remaining>0;remaining-=15){const data=await sampleWaterTiming(page,'always',Math.min(15,remaining)*1000,null);frames.push(...data.frames);}
 const after=await page.evaluate(()=>window.__firecrackersQA.snapshot());await validateWaterTimingProbe(page);
 assert.equal(after.backend,{webgpu:'WebGPU',webgl:'WebGL 2',canvas:'Canvas 2D · compatibility'}[backend]);assert.equal(after.show,typeof workload==='number'?'always':'festival');
 const stem=`${source}-${backend}-${workload}-${repeat}`;const timing=summary(frames);
 await writeFile(`${out}/${stem}-frames.json`,JSON.stringify(frames));await page.screenshot({path:`${out}/${stem}-running.png`});
 const video=page.video();const row={source,backend,workload,repeat,duration,release,identity,before,after,timing,raw:`${stem}-frames.json`,errors};
 if(typeof workload==='number'){
  row.admitted=after.always.admitted-before.always.admitted;row.rate=row.admitted/((after.time-before.time)/60);
  const start=performance.now();await page.getByRole('button',{name:'Hide controls',exact:true}).click();await page.getByRole('button',{name:'Show controls',exact:true}).click();row.revealRoundTripMs=performance.now()-start;
 }
 await context.close();if(video)row.video=await video.path();report.runs.push(row);report.errors.push(...errors);await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));
 console.log('MEASURED',source,backend,workload,repeat,JSON.stringify({p95:timing.renderP95,rate:row.rate,over50:timing.over50,over100:timing.over100}));return row;
}
try{
 for(const backend of backends){
  for(let repeat=0;repeat<repeats;repeat++){
   for(const source of repeat%2?['candidate','baseline']:['baseline','candidate'])await condition(source==='baseline'?baseline:candidate,source,backend,'festival',repeat,seconds);
  }
  const frames=async source=>{const rows=report.runs.filter(r=>r.backend===backend&&r.source===source&&r.workload==='festival');const all=[];for(const row of rows){const {readFile}=await import('node:fs/promises');all.push(...JSON.parse(await readFile(`${out}/${row.raw}`,'utf8')));}return summary(all);};
  const before=await frames('baseline'),after=await frames('candidate');const allowance=Math.max(2,before.renderP95*.2);
  const comparison={backend,before,after,allowance,passed:after.renderP95-before.renderP95<=allowance};report.comparisons.push(comparison);
 }
 for(const backend of backends)for(let repeat=0;repeat<repeats;repeat++)for(const pace of repeat%2?[4,3,2,1]:[1,2,3,4])await condition(candidate,'candidate',backend,pace,repeat,repeat===0?60:seconds);
 if(process.env.ALWAYS_PERF_PEAK!=='0')await condition(candidate,'candidate',backends[0],4,'peak',600);
 assert.deepEqual(report.errors,[]);assert.ok(report.comparisons.every(c=>c.passed),'Legacy p95 regression gate failed; preserve all measured evidence');
}catch(e){report.failed=e.stack;process.exitCode=1;console.error(e);}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
