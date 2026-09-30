import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
const base=process.env.FLAGSHIP_URL||'http://127.0.0.1:4173/',out=process.argv[2]||'test-results/flagship-offline';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const report={base,checks:[],errors:[],failed:null};
const context=await browser.newContext({viewport:{width:393,height:851}}),page=await context.newPage();
const snap=()=>page.evaluate(()=>window.__firecrackersQA.snapshot());
const enter=async backend=>{await page.goto(`${base}?qa=1&backend=${backend}`);await page.waitForSelector('main[data-ready="true"]',{timeout:90000});await page.evaluate(()=>window.__firecrackersQA.freeze(true));};
page.on('pageerror',e=>report.errors.push(e.message));
try{
 await enter('canvas');await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await page.waitForSelector('main[data-ready="true"]',{timeout:90000});await page.waitForFunction(()=>navigator.serviceWorker.controller);
 await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('main[data-ready="true"]',{timeout:90000});await page.evaluate(()=>window.__firecrackersQA.freeze(true));
 for(const [j,id]of['imperial-crown','celestial-aurora','royal-phoenix'].entries()){
  await page.locator(`[data-family-icon="${id}"]`).click();await page.evaluate(()=>window.__firecrackersQA.advance(9));const s=await snap();assert.ok(s.signatureStages[j*3]>0&&s.signatureStages[j*3+1]>0&&s.signatureStages[j*3+2]>0);await page.evaluate(()=>window.__firecrackersQA.advance(40));
 }
 report.checks.push('Actual service-worker cold offline reload: all three signatures play completely');await context.setOffline(false);
 await enter('webgl');await page.locator('[data-family-icon="royal-phoenix"]').click();await page.evaluate(()=>window.__firecrackersQA.advance(1));
 assert.equal(await page.evaluate(()=>{const g=document.querySelector('.scene-host canvas').getContext('webgl2'),e=g?.getExtension('WEBGL_lose_context');if(!e)return false;e.loseContext();return true;}),true);
 await page.getByRole('link',{name:'Use compatibility graphics',exact:true}).click();await page.waitForSelector('main[data-ready="true"]',{timeout:90000});assert.match(await page.locator('main').getAttribute('data-backend'),/Canvas/);await page.locator('[data-family-icon="imperial-crown"]').click();await page.waitForFunction(()=>Number(document.querySelector('main')?.dataset.bursts)>=3,undefined,{timeout:25000});report.checks.push('Actual WebGL context loss: explicit Canvas recovery and real-time three-stage signature replay');
 assert.deepEqual(report.errors,[]);
}catch(e){report.failed=e.stack;process.exitCode=1;console.error(e);}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await context.setOffline(false);await browser.close();}
console.log(JSON.stringify(report));
