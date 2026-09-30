import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.CAPTURE_URL||'https://firecrackers-flagship-preview.allygym-api.workers.dev/';
const phase=process.env.CAPTURE_PHASE||'before',out=process.argv[2]||'test-results/open-sky-captures';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const report={base,phase,seed:20260916,method:'Installed Chrome native WebGPU, emulated CSS viewports; matched seed and relative burst time. Not physical-device evidence.',captures:[],errors:[]};
try{
 for(const [width,height]of[[393,851],[768,1024],[1280,800]]){
  const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'});page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(`${base}?backend=webgpu&qa=1&seed=20260916`);await page.waitForFunction(()=>window.__firecrackersQA?.snapshot().backend==='WebGPU',undefined,{timeout:90000});
  await page.waitForFunction(()=>Object.values(window.__firecrackersQA.snapshot().authoredAssetStates||{}).length>=9&&Object.values(window.__firecrackersQA.snapshot().authoredAssetStates).every(s=>s==='active'),undefined,{timeout:90000});
  await page.evaluate(()=>window.__firecrackersQA.freeze(true));
  await page.getByRole('button',{name:'Controls',exact:true}).click();await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('tab',{name:'Device',exact:true}).click();await page.getByRole('button',{name:'Reset this sky',exact:true}).click();await page.getByRole('button',{name:'Reset sky and preferences',exact:true}).click();
  await page.locator('.startup-ready-note').waitFor({state:'hidden',timeout:10000});
  await page.mouse.move(width/2,20);await page.evaluate(()=>window.__firecrackersQA.render());
  const release=await page.evaluate(()=>fetch('/release.json').then(r=>r.json()));
  async function shot(name){const snapshot=await page.evaluate(()=>window.__firecrackersQA.snapshot());const file=`${phase}-${width}x${height}-${name}.png`;await page.screenshot({path:`${out}/${file}`});report.captures.push({file,width,height,backend:snapshot.backend,release:{version:release.version,sha256:release.sha256},snapshot});}
  await shot('ready');await page.locator('[data-family-icon="gold-willow"]').click();await page.evaluate(()=>window.__firecrackersQA.advance(.8));let s=await page.evaluate(()=>window.__firecrackersQA.snapshot());await page.evaluate(t=>window.__firecrackersQA.advance(t),s.flight.ascent-s.flight.age+2.02);await page.mouse.move(width/2,20);await shot('willow');
  await page.close();console.log('CAPTURE',phase,width,height);
 }
}finally{await browser.close();await writeFile(`${out}/${phase}.json`,JSON.stringify(report,null,2));}
