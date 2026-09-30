import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const origin=process.argv[2], output=process.argv[3];
const expected=JSON.parse(await readFile('public/release.json','utf8'));
const report={origin,method:'Installed Chrome headless, hardware WebGPU, no software GPU flags; portrait/touch emulated on PC. Screenshots unmodified.',expectedFingerprint:expected.sha256,checks:[],captures:[],errors:[],failed:null};
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
report.browserVersion=browser.version();
try{
  for(const [label,viewport,touch] of [['desktop',{width:1280,height:800},false],['portrait',{width:393,height:851},true]]){
    const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,serviceWorkers:'block'});
    await context.addInitScript(()=>{
      const original=GPUAdapter.prototype.requestDevice;
      GPUAdapter.prototype.requestDevice=async function(...args){
        window.__captureAdapter={vendor:this.info.vendor,architecture:this.info.architecture,fallback:this.info.isFallbackAdapter};
        const device=await original.apply(this,args);
        device.addEventListener('uncapturederror',e=>console.error(`GPU validation: ${e.error.message}`));
        return device;
      };
    });
    const page=await context.newPage();
    page.on('pageerror',e=>report.errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
    await page.goto(new URL('?backend=webgpu&qa=1&seed=20260916',origin).href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('main')?.dataset.ready==='true' && window.__firecrackersQA,{timeout:90000});
    await page.waitForFunction(()=>Object.values(window.__firecrackersQA.snapshot().authoredAssetStates||{}).filter(s=>s==='active').length===8,undefined,{timeout:90000});
    const release=await page.evaluate(async()=>await(await fetch('/release.json',{cache:'no-store'})).json());
    assert.equal(release.sha256,expected.sha256);assert.deepEqual(release.modules,expected.modules);
    const hardware=await page.evaluate(()=>window.__captureAdapter);
    assert.equal(hardware?.fallback,false);assert.equal((await page.evaluate(()=>window.__firecrackersQA.snapshot())).backend,'WebGPU');
    report.checks.push({label,hardware,release:{version:release.version,sha256:release.sha256,entries:release.modules.length}});
    await page.evaluate(()=>window.__firecrackersQA.freeze(true));
    await page.getByRole('button',{name:'Open settings',exact:true}).click();
    await page.getByRole('dialog').waitFor();
    const capture=async(panel)=>{
      const file=`${label}-${panel}.png`;await page.screenshot({path:path.join(output,file)});
      const bytes=await readFile(path.join(output,file));
      report.captures.push({file,viewport,backend:'WebGPU',panel,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
    };
    await capture('graphics');
    await page.getByRole('button',{name:'Close panel',exact:true}).click();
    await page.getByRole('button',{name:/^Choose firework:/}).click();
    await page.getByRole('button',{name:'Grand collection',exact:false}).click();
    await capture('picker');
    await context.close();
  }
  assert.deepEqual(report.errors,[]);
}catch(error){report.failed=String(error.stack||error);process.exitCode=1;}
finally{await browser.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks:report.checks.length,captures:report.captures.length,errors:report.errors,failed:report.failed}));}
