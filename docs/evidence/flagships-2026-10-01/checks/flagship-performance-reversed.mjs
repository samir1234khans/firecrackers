import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.argv[2]||'test-results/flagship-performance';await mkdir(out,{recursive:true});
const base='https://firecrackers-moon-preview.allygym-api.workers.dev/',candidate=process.env.FLAGSHIP_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{
 for(const [width,height]of[[393,851],[1280,800]])for(const [source,url,ids]of[['candidate',candidate,['gold-willow','opal-supernova']],['baseline',base,['gold-willow','opal-supernova']]])for(const id of ids){
  const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'});await page.goto(`${url}?qa=1&seed=20260916&backend=webgpu`);
  await page.waitForSelector('main[data-ready="true"]',{timeout:90000});await page.waitForFunction(()=>Object.values(window.__firecrackersQA.snapshot().authoredAssetStates||{}).length>=8&&Object.values(window.__firecrackersQA.snapshot().authoredAssetStates).every(s=>s==='active'),undefined,{timeout:90000});
  await page.evaluate(()=>window.__firecrackersQA.freeze(true));await page.locator(`[data-family-icon="${id}"]`).click();await page.evaluate(()=>window.__firecrackersQA.advance(.8));
  const s=await page.evaluate(()=>window.__firecrackersQA.snapshot());const relative=id==='gold-willow'?2.0:id==='imperial-crown'?4.2:3.1;
  await page.evaluate(t=>window.__firecrackersQA.advance(t),s.flight.ascent-s.flight.age+.02+relative);await page.evaluate(()=>{for(let i=0;i<30;i++)window.__firecrackersQA.render();});
  const before=await page.evaluate(()=>window.__firecrackersQA.snapshot());
  const sample=await page.evaluate(()=>new Promise(resolve=>{
   const frames=[],cpu=[];let last=performance.now(),start=last;
   function tick(now){const begin=performance.now();window.__firecrackersQA.render();cpu.push(performance.now()-begin);frames.push(now-last);last=now;
    if(now-start<6000)requestAnimationFrame(tick);else{frames.sort((a,b)=>a-b);cpu.sort((a,b)=>a-b);const q=(a,p)=>a[Math.min(a.length-1,Math.floor(a.length*p))];resolve({samples:frames.length,rafP50:q(frames,.5),rafP95:q(frames,.95),cpuP50:q(cpu,.5),cpuP95:q(cpu,.95)});}
   }requestAnimationFrame(tick);
  }));
  const release=await page.evaluate(()=>fetch('/release.json').then(r=>r.json()));results.push({source,url,id,width,height,relativeBurstSeconds:relative,backend:before.backend,particles:before.particles,quality:before.quality,release:{version:release.version,sha256:release.sha256},...sample});console.log(JSON.stringify(results.at(-1)));await page.close();
 }
}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify({method:'Sequential installed Chrome hardware WebGPU; fixed seed 20260916, 30 warmup renders, 6-second frozen effect state. CPU includes synchronous QA render submission; rAF is scheduling evidence, not completed GPU timing. No parallel test browser processes during the sample; emulated phone, not physical or thermal endurance.',results},null,2));}
