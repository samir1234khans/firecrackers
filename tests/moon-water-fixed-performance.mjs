import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const out=process.argv[2]||'test-results/moon-performance';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try{
 for(const [source,url] of [['before','https://firecrackers.mainandmany.com/'],['after',process.env.MOON_URL||'http://127.0.0.1:4173/']])for(const [width,height] of [[393,851],[1280,800]]){
  const page=await browser.newPage({viewport:{width,height}});
  await page.goto(`${url}?qa=1&seed=20260916&backend=webgpu`);
  await page.waitForFunction(()=>window.__firecrackersQA&&document.querySelector('main').dataset.ready==='true',undefined,{timeout:90000});
  await page.waitForFunction(()=>Object.values(window.__firecrackersQA.snapshot().authoredAssetStates||{}).length>=8&&Object.values(window.__firecrackersQA.snapshot().authoredAssetStates).every(s=>s==='active'),undefined,{timeout:90000});
  await page.evaluate(()=>window.__firecrackersQA.freeze(true));
  await page.locator('[data-family-icon="gold-willow"]').click();
  await page.evaluate(()=>window.__firecrackersQA.advance(4.9));
  await page.evaluate(()=>{for(let i=0;i<30;i++)window.__firecrackersQA.render();});
  const sample=await page.evaluate(()=>new Promise(resolve=>{
   const frames=[],submits=[];let last=performance.now(),start=last;
   function tick(now){window.__firecrackersQA.render();frames.push(now-last);last=now;submits.push(window.__firecrackersQA.snapshot().submitMs);
    if(now-start<6000)requestAnimationFrame(tick);else{
     frames.sort((a,b)=>a-b);submits.sort((a,b)=>a-b);const q=(a,p)=>a[Math.min(a.length-1,Math.floor(a.length*p))];
     resolve({samples:frames.length,elapsedMs:now-start,rafP50:q(frames,.5),rafP95:q(frames,.95),submissionP95:q(submits,.95),backend:window.__firecrackersQA.snapshot().backend});
    }
   }requestAnimationFrame(tick);
  }));
  results.push({source,url,width,height,...sample});await page.close();
 }
}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify({method:'Installed headless Chrome hardware WebGPU, 6-second fixed Gold Willow 4.9s sample; 30 warmup renders, sequential source runs. rAF and CPU submission only; not completed GPU timing or physical endurance.',results},null,2));}
console.log(JSON.stringify(results));
