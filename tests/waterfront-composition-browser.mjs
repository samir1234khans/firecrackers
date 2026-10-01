import { selectedLaunch, openPanel } from './stage-helpers.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chooseFamily, settingsTab } from './stage-helpers.mjs';
const base = process.env.WATERFRONT_URL || 'http://127.0.0.1:4186/';
const before = process.env.WATERFRONT_BEFORE;
const output = path.resolve(process.argv[2] || 'test-results/waterfront-composition');
const release = JSON.parse(await readFile(new URL('../public/release.json', import.meta.url), 'utf8'));
await mkdir(output, { recursive: true });
const report = { startedAt: new Date().toISOString(), base, before, expectedFingerprint: release.sha256,
  method: 'Installed Chrome, headless, no software GPU flags; deterministic seed 20260916 and actual UI inputs. Tablet/phone sizes are viewport emulation.',
  limitations: 'Visual and functional qualification; no physical mobile, thermal or completed-GPU-frame timing claim.', checks: [], projects: [], errors: [], failed: null };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
report.browserVersion = browser.version();
let page;
const snapshot = () => page.evaluate(() => window.__firecrackersQA.snapshot());
try {
  for (const [phase, origin] of [['before', before], ['after', base]]) {
    if (!origin) continue;
    const views = [[1280,800,'webgpu'], [1920,1080,'webgpu'], [768,1024,'webgpu'], [1024,768,'webgpu'], [393,851,'webgpu']];
    if (phase === 'after') views.push([1280,800,'webgl'], [393,851,'canvas']);
    for (const [width,height,backend] of views) {
      const label = `${phase}-${width}x${height}-${backend}`;
      const context = await browser.newContext({ viewport: { width,height }, serviceWorkers: 'block' });
      page = await context.newPage();
      page.on('pageerror', error => report.errors.push(`${label}: ${error.message}`));
      page.on('console', message => { if(message.type()==='error') report.errors.push(`${label}: ${message.text()}`); });
      await page.addInitScript(() => {
        if (!navigator.gpu) return;
        const request = GPUAdapter.prototype.requestDevice;
        GPUAdapter.prototype.requestDevice = async function(...args) {
          window.__waterfrontAdapter = { vendor:this.info.vendor, architecture:this.info.architecture, fallback:this.info.isFallbackAdapter };
          const device = await request.apply(this,args);
          device.addEventListener('uncapturederror', event => console.error(`GPU validation: ${event.error.message}`));
          return device;
        };
      });
      const url = new URL(origin); url.search = `?backend=${backend}&qa=1&seed=20260916`;
      await page.goto(url.href);
      await page.waitForFunction(() => document.querySelector('main')?.dataset.ready === 'true' && window.__firecrackersQA, undefined, { timeout:90000 });
      if (backend !== 'canvas') await page.waitForFunction(() => Object.values(window.__firecrackersQA.snapshot().authoredAssetStates || {}).filter(x=>x==='active').length===9, undefined, { timeout:90000 });
      assert.equal((await snapshot()).backend, backend==='webgpu'?'WebGPU':backend==='webgl'?'WebGL 2':'Canvas 2D · compatibility');
      const hardware = await page.evaluate(() => {
        const canvas=document.querySelector('.scene-host canvas');let gl;try {gl=canvas.getContext('webgl2');}catch{}
        const ext=gl?.getExtension('WEBGL_debug_renderer_info');return {adapter:window.__waterfrontAdapter||null, renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null};
      });
      if(backend==='webgpu') assert.equal(hardware.adapter?.fallback,false);
      if(backend==='webgl'){assert.ok(hardware.renderer);assert.doesNotMatch(hardware.renderer,/SwiftShader|software|llvmpipe/i);}
      const served=await page.evaluate(async()=>fetch('/release.json',{cache:'no-store'}).then(r=>r.json()));
      if(phase==='after') assert.equal(served.sha256,release.sha256);
      await page.evaluate(()=>window.__firecrackersQA.freeze(true));
      await openPanel(page, 'settings');await settingsTab(page,'Device');
      await page.getByRole('button',{name:'Reset this sky',exact:true}).click();
      await page.getByRole('button',{name:'Reset sky and preferences',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('main').dataset.overlay==='none');
      await page.evaluate(()=>window.__firecrackersQA.render());
      const idle=await snapshot();assert.equal(idle.time,0);
      if(phase==='after' && backend!=='canvas') {
        assert.ok(Math.abs(idle.riverBankScreen.y-idle.waterline)<.018, `Homes must touch the far water edge: ${JSON.stringify(idle.riverBankScreen)} / ${idle.waterline}`);
        const homes=idle.riverVillageScreenBounds, terrace=idle.terraceScreenBounds;
        assert.ok(homes.right-homes.left>.12 && homes.bottom-homes.top>.008,'Architecture must remain readable at this size');
        assert.ok(homes.bottom-homes.top<.12,'Village must remain distant');
        assert.ok(terrace.left<0 && terrace.right>1 && terrace.bottom>=1 && terrace.top>.72,`Quay must span the foreground: ${JSON.stringify(terrace)}`);
        assert.equal(idle.riverWaterContactInstances,21);assert.equal(idle.riverSeatedFigures,2);
        report.checks.push(`${label}: far-bank contact, readable homes, full-width quay and bounded boats`);
      }
      await page.screenshot({path:path.join(output,`${label}-idle.png`)});
      await chooseFamily(page,'Sapphire Saturn');await selectedLaunch(page).click();
      await page.evaluate(()=>{window.__firecrackersQA.advance(4.9);window.__firecrackersQA.render();});
      const burst=await snapshot();assert.ok(burst.particles>0);
      await page.screenshot({path:path.join(output,`${label}-saturn.png`)});
      report.projects.push({label,viewport:{width,height},backend,hardware,release:{version:served.version,sha256:served.sha256},idle,burst});
      report.checks.push(`${label}: seeded idle and Saturn captures`);console.log('PASS',label);await context.close();
    }
  }
  assert.deepEqual(report.errors,[]);
} catch(error){report.failed=error.stack||String(error);process.exitCode=1;console.error(report.failed);await page?.screenshot({path:path.join(output,'FAILED.png')}).catch(()=>{});}
finally{report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close();}
