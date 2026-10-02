import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { openPanel, settingsTab } from './stage-helpers.mjs';
const base=process.env.SHOW_URL||'http://127.0.0.1:4188/',out=process.argv[2]||'test-results/cinematic-lifecycle';await mkdir(out,{recursive:true});
const browser=await chromium.launch(process.env.SHOW_SOFTWARE==='1'?{headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{channel:'chrome',headless:true});
const report={base,checks:[],errors:[],failed:null};
const snap=p=>p.evaluate(()=>window.__firecrackersQA.snapshot());
async function ready(p){await p.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});}
async function music(p){await openPanel(p,'settings');await settingsTab(p,'Sound');await p.getByRole('checkbox',{name:'Show music',exact:true}).check();await p.getByRole('checkbox',{name:'Sound',exact:true}).check();await p.getByRole('button',{name:'Close panel',exact:true}).click();}
try{
 const p=await browser.newPage({viewport:{width:393,height:851}});p.on('pageerror',e=>report.errors.push(e.message));
 await p.addInitScript(()=>localStorage.setItem('firecrackers.preferences.v1',JSON.stringify({version:4,onboarded:true,reducedFlashes:true,showMusic:true,quality:'standard'})));
 await p.goto(`${base}?qa=1&backend=canvas&display=scene&show=festival&theme=golden`);await ready(p);assert.equal((await snap(p)).cinematic.theme,'golden');assert.equal((await snap(p)).audioEnabled,false);
 await p.waitForFunction(()=>window.__firecrackersQA.snapshot().time>1);
 await p.evaluate(()=>document.activeElement?.blur());await p.keyboard.press('Escape');await music(p);await p.waitForFunction(()=>window.__firecrackersQA.snapshot().musicVoices>0);
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 const before=await snap(p);await p.waitForTimeout(300);assert.equal((await snap(p)).time,before.time);assert.equal((await snap(p)).musicVoices,0);
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));document.activeElement?.blur();});assert.equal((await snap(p)).paused,true);await p.keyboard.press('Space');await p.waitForFunction(()=>window.__firecrackersQA.snapshot().musicVoices>0);
 report.checks.push('Explicit display theme, no saved audio autoplay, hidden-page freeze and explicit offset resume');
 await p.evaluate(async()=>{await navigator.serviceWorker.ready;});await p.reload();await ready(p);await p.waitForFunction(()=>navigator.serviceWorker.controller);await p.keyboard.press('Escape');await music(p);await p.waitForFunction(()=>window.__firecrackersQA.snapshot().musicVoices>0);
 await p.waitForFunction(async()=>{const cache=await caches.open('firecrackers-music-v1');return(await cache.keys()).length>=2;});
 await p.context().setOffline(true);await p.reload({waitUntil:'domcontentloaded'});await ready(p);assert.equal((await snap(p)).audioEnabled,false);await p.keyboard.press('Escape');await music(p);await p.waitForFunction(()=>window.__firecrackersQA.snapshot().musicVoices>0);assert.equal((await snap(p)).musicFailure,'');
 report.checks.push('Consent-loaded score chunks and app reload work offline, without automatic sound');await p.context().setOffline(false);await p.close();
 const missing=await browser.newPage({viewport:{width:320,height:480}});missing.on('pageerror',e=>report.errors.push(e.message));await missing.route('**/music/*.flac',r=>r.fulfill({status:404,body:'missing'}));
 await missing.goto(`${base}?qa=1&backend=canvas&display=scene&show=finale&theme=moonlit`);await ready(missing);await missing.keyboard.press('Escape');await music(missing);await missing.waitForFunction(()=>window.__firecrackersQA.snapshot().musicFailure);
 const bad=await snap(missing);assert.equal(bad.show,'finale');assert.equal(bad.musicVoices,0);assert.equal(bad.audioEnabled,true);assert.match(bad.musicFailure,/visual show continues/);report.checks.push('Missing music gives a quiet notice while the visual show and sound effects continue');await missing.close();
 const recovery=await browser.newPage({viewport:{width:1280,height:800}});recovery.on('pageerror',e=>report.errors.push(e.message));
 await recovery.goto(`${base}?qa=1&backend=webgl&display=scene&show=festival&theme=moonlit`);await ready(recovery);await recovery.keyboard.press('Escape');await music(recovery);await recovery.waitForFunction(()=>window.__firecrackersQA.snapshot().musicVoices>0);
 await recovery.evaluate(()=>window.__firecrackersQA.injectOverloadSamples(3,400));await recovery.waitForFunction(()=>window.__firecrackersQA.snapshot().backend.startsWith('Canvas'),null,{timeout:30000});
 const recovered=await snap(recovery);assert.equal(recovered.show,'festival');assert.equal(recovered.cinematic.theme,'moonlit');assert.equal(recovered.recoveryHistory.length,1);assert.equal(recovered.recoveryHistory[0].from,'WebGL 2');assert.ok(recovered.musicStarts>0);assert.ok(recovered.musicRetainedBuffers<=2);
 report.checks.push('Genuine overload still recovers to Canvas, preserving show and recorded music phase');await recovery.close();assert.deepEqual(report.errors,[]);
 console.log(report.checks);
}catch(e){report.failed=e.stack;for(const c of browser.contexts())for(const p of c.pages())if(!p.isClosed()){report.lastSnapshot=await snap(p).catch(()=>null);await p.screenshot({path:`${out}/FAILED.png`}).catch(()=>{});}throw e;}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
