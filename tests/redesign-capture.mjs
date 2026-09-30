import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const base=process.env.CAPTURE_URL||'https://firecrackers.mainandmany.com/';
const phase=process.env.CAPTURE_PHASE||'before';
const out=path.resolve(process.argv[2]||'test-results/redesign-captures');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={base,phase,seed:20260916,method:'Installed Chrome; viewport emulation; fixed seed and logical time, no physical mobile claim',projects:[],errors:[]};
try {
 for(const [width,height] of [[393,851],[768,1024],[1280,800]]) {
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(`${base}?backend=webgpu&qa=1&seed=20260916`);
  await page.waitForFunction(()=>window.__firecrackersQA&&document.querySelector('main')?.dataset.ready==='true',undefined,{timeout:90000});
  await page.waitForFunction(()=>Object.values(window.__firecrackersQA.snapshot().authoredAssetStates||{}).filter(s=>s==='active').length===8,undefined,{timeout:90000});
  await page.evaluate(()=>window.__firecrackersQA.freeze(true));
  const release=await page.evaluate(()=>fetch('/release.json',{cache:'no-store'}).then(r=>r.json()));
  const idle=await page.evaluate(()=>window.__firecrackersQA.snapshot());
  await page.screenshot({path:path.join(out,`${phase}-${width}x${height}-idle.png`)});
  if(phase==='before')await page.getByRole('button',{name:'Launch selected firework',exact:true}).click();
  else await page.locator('[data-family-icon="gold-willow"]').click();
  await page.evaluate(()=>{window.__firecrackersQA.advance(4.9);window.__firecrackersQA.render();});
  const burst=await page.evaluate(()=>window.__firecrackersQA.snapshot());
  await page.screenshot({path:path.join(out,`${phase}-${width}x${height}-willow.png`)});
  report.projects.push({width,height,backend:burst.backend,release:{version:release.version,sha256:release.sha256},idle,burst});
  console.log('CAPTURE',phase,width,height,burst.backend);await context.close();
 }
} finally {await writeFile(path.join(out,`${phase}.json`),JSON.stringify(report,null,2));await browser.close();}
