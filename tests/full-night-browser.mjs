import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.STAGE_URL || 'http://127.0.0.1:4173/';
const out = process.argv[2] || 'test-results/full-night';
await mkdir(out, {recursive:true});
const report = {base, hardwareQualified:false, physicalDevice:false, method:'Chromium software WebGL 2 and Canvas; deterministic simulation stepping; emulated desktop/mobile viewports', cases:[], errors:[]};
const browser = await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
async function pixels(page, buffer, horizon) {
  return page.evaluate(async ({data,horizon}) => {
    const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width=image.width; canvas.height=image.height;
    const context = canvas.getContext('2d'); context.drawImage(image,0,0);
    const {width:w,height:h} = canvas, rgba = context.getImageData(0,0,w,h).data;
    const region = (left,top,right,bottom) => {
      let r=0,g=0,b=0,n=0,bright=0;
      for(let y=Math.floor(top*h);y<Math.floor(bottom*h);y++) for(let x=Math.floor(left*w);x<Math.floor(right*w);x++) {
        const i=(y*w+x)*4; r+=rgba[i]; g+=rgba[i+1]; b+=rgba[i+2]; n++;
        if(Math.max(rgba[i],rgba[i+1],rgba[i+2])>80) bright++;
      }
      return {r:r/n,g:g/n,b:b/n,bright,n};
    };
    return {water:region(.15,horizon+.015,.85,Math.min(.86,horizon+.15)),sky:region(.15,.05,.85,horizon-.02)};
  },{data:buffer.toString('base64'),horizon});
}
try {
  for(const backend of ['canvas','webgl']) for(const [width,height] of [[1280,800],[393,851]]) for(const quality of ['low','ultra']) {
    const name=`${backend}-${quality}-${width}x${height}`, result={name,checks:[],errors:[]}; report.cases.push(result);
    const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,isMobile:width<500,deviceScaleFactor:1});
    await context.addInitScript(({quality})=>localStorage.setItem('firecrackers.preferences.v1',JSON.stringify({version:3,quality,reducedFlashes:false,reducedMotion:false,onboarded:true,sound:false,alwaysPace:4})),{quality});
    const page=await context.newPage(); page.on('pageerror',error=>result.errors.push(error.message));
    const snap=()=>page.evaluate(()=>window.__firecrackersQA.snapshot());
    const advance=seconds=>page.evaluate(seconds=>{window.__firecrackersQA.advance(seconds);window.__firecrackersQA.render();},seconds);
    const capture=async label=>{await page.waitForTimeout(100);return page.screenshot({path:`${out}/${name}-${label}.png`});};
    const expected=backend==='webgl'?'WebGL 2':'Canvas 2D · compatibility';
    try {
      await page.goto(`${base}?backend=${backend}&qa=1&seed=731`);
      await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});
      await page.evaluate(()=>window.__firecrackersQA.freeze(true));
      let s=await snap(); result.initial=s; assert.equal(s.backend,expected,'do not count a silent fallback as native rendering');
      const horizon=Number.isFinite(s.waterline)?s.waterline: .72;
      const idle=await capture('idle'); result.idlePixels=await pixels(page,idle,horizon);
      if(backend==='webgl') {
        assert.equal(s.reflectionAllocated,true); assert.equal(s.reflectionMode,'planar');
        assert.equal(s.waterBurstLightCapacity,12);
        if(quality==='low') {assert.equal(s.reflectionWidth,128); assert.equal(s.reflectionHz,6);}
      }
      result.checks.push('requested backend and persistent quality-tier reflection');
      // Use the same real icon/admission path as a user; no direct source injection.
      const launch=async id=>{
        const before=(await snap()).bursts;
        await page.locator(`[data-family-icon="${id}"]`).click();
        for(let i=0;i<48&&(await snap()).bursts===before;i++) await advance(.25);
        assert.ok((await snap()).bursts>before,`${id} reaches its actual first break`);
      };
      await launch('multicolor-peony'); await advance(1); await capture('peony-open');
      await advance(2.1); await capture('peony-falling');
      s=await snap(); assert.equal(s.backend,expected); result.peony=s;
      result.checks.push('Peony core/halo and 3.1-second falling pose captured');
      await advance(35);
      const beforeRed=await capture('before-red'); result.beforeRedPixels=await pixels(page,beforeRed,horizon);
      await launch('ruby-dahlia'); await advance(.7);
      const red=await capture('red-waterfront'); result.redPixels=await pixels(page,red,horizon);
      s=await snap(); result.red=s;
      assert.equal(s.backend,expected); assert.ok(s.waterBurstLightCount>=1);
      const redRise=result.redPixels.water.r-result.beforeRedPixels.water.r;
      const blueRise=result.redPixels.water.b-result.beforeRedPixels.water.b;
      assert.ok(redRise>.5,`red shell visibly lights a wide water region: ${redRise}`);
      assert.ok(redRise>blueRise,`incident wash retains the red shell colour: R=${redRise}, B=${blueRise}`);
      result.checks.push('wide water ROI gains light in the shell colour');
      await advance(35); await launch('silver-crossette-crackle'); await advance(1.8); await capture('crossette-leaves');
      result.crossette=await snap();
      await advance(35); const bursts=(await snap()).bursts;
      await launch('grand-finale'); await advance(.6); await capture('finale-principal');
      await advance(2.5); await capture('finale-following-breaks');
      await advance(3); s=await snap(); result.finale=s;
      assert.equal(s.bursts,bursts+6); assert.equal(s.backend,expected);
      result.checks.push('full first finale shell and all five moving following breaks');
      // Frozen capture, resize and a subsequent render must preserve the clock.
      const time=s.time; await page.waitForTimeout(200); assert.equal((await snap()).time,time);
      await page.setViewportSize({width:height,height:width}); await page.waitForTimeout(150);
      await page.evaluate(()=>window.__firecrackersQA.render());
      assert.equal((await snap()).time,time); assert.equal((await snap()).backend,expected);
      result.checks.push('freeze and rotation preserve shared time and backend');
      assert.deepEqual(result.errors,[]); result.pass=true; console.log('PASS',name,result.checks);
    } catch(error) {
      result.pass=false; result.failure=error.stack; result.final=await snap().catch(()=>null);
      await capture('FAILED').catch(()=>{}); console.error('FAIL',name,error.message); process.exitCode=1;
    } finally {await context.close();}
  }
} finally {
  await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)); await browser.close();
}
