import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {chromium} from 'playwright';
const base=process.env.OPEN_SKY_URL||'https://firecrackers-open-sky-preview.allygym-api.workers.dev/';
const out=process.argv[2]||'test-results/open-sky-hosted';await mkdir(out,{recursive:true});
const report={base,method:'HTTP byte parity and default no-QA startup in installed Chrome; emulated viewports, native WebGPU',checks:[],errors:[],failed:null};
const hash=b=>createHash('sha256').update(b).digest('hex');
async function files(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())result.push(...await files(p));else result.push(p);}return result;}
let browser;
try{
 for(const file of await files('dist')){
  const path=relative('dist',file).replaceAll('\\','/'),response=await fetch(new URL(path,base));assert.equal(response.status,200,path);
  const sha256=hash(Buffer.from(await response.arrayBuffer()));assert.equal(sha256,hash(await readFile(file)),path);report.checks.push({path,status:200,sha256});
 }
 const production=await fetch('https://firecrackers.mainandmany.com/release.json').then(r=>r.json());
 assert.equal(production.version,'2026-09-30.8');assert.equal(production.sha256,'5a0020b7c9260140d4fff57a6abe97d53f7406dedffc6635c64148facb478535');report.production=production.sha256;
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const [width,height]of[[393,851],[1280,800]]){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.goto(base);await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});await page.locator('.startup-ready-note').waitFor({state:'hidden',timeout:10000});
  assert.equal(await page.locator('main').getAttribute('data-backend'),'WebGPU');
  assert.equal(await page.evaluate(()=>!!window.__firecrackersQA),false,'Default startup must not expose QA hooks');
  assert.equal(await page.locator('[data-family-icon]').count(),13);assert.equal(await page.locator('.stage-brand').count(),0);
  await page.screenshot({path:`${out}/default-${width}x${height}.png`});
  await page.locator('[data-family-icon="gold-willow"]').click();await page.waitForFunction(()=>Number(document.querySelector('main').dataset.bursts)>=1,undefined,{timeout:25000});
  assert.equal(await page.locator('main').getAttribute('data-launched'),'1');
  await page.getByRole('button',{name:'Pause scene',exact:true}).click();
  await page.getByRole('button',{name:'Controls',exact:true}).click();await page.getByRole('button',{name:'Help',exact:true}).click();await page.getByRole('button',{name:'Close panel',exact:true}).click();
  assert.equal(await page.locator('main').getAttribute('data-paused'),'true');
  await page.getByRole('button',{name:/^Show mode:/}).click();await page.getByRole('button',{name:'Calm',exact:true}).click();
  assert.equal(await page.locator('main').getAttribute('data-paused'),'true');
  report.checks.push({name:'Default startup, real-time launch, modal and mode pause ownership',width,height,backend:'WebGPU'});await context.close();
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failed=e.stack;process.exitCode=1;console.error(e);}finally{await browser?.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
console.log(JSON.stringify({checks:report.checks.length,failed:report.failed,errors:report.errors}));
