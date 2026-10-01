import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.IMMERSIVE_URL || 'http://127.0.0.1:4173/';
const out=process.argv[2] || 'test-results/immersive';
await mkdir(out,{recursive:true});
const browser=await chromium.launch(process.env.IMMERSIVE_SOFTWARE === '1' ? {headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']} : {channel:'chrome',headless:true});
const results=[];
try {
for(const backend of (process.env.IMMERSIVE_BACKENDS || 'webgpu,webgl,canvas').split(',')) {
 const page=await browser.newPage({serviceWorkers:'block'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}?backend=${backend}&qa=1&seed=20260916`);
 await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});
 await page.evaluate(()=>window.__firecrackersQA.freeze(true));
 assert.equal((await page.evaluate(()=>window.__firecrackersQA.snapshot())).backend, {webgpu:'WebGPU',webgl:'WebGL 2',canvas:'Canvas 2D · compatibility'}[backend]);
 for(const [width,height] of [[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]]) {
  await page.setViewportSize({width,height});
  await page.getByRole('button',{name:/^Show mode:/}).click();
  await page.getByRole('button',{name:'Festival',exact:true}).click();
  await page.getByRole('button',{name:'Hide controls',exact:true}).waitFor();
  const before=await page.locator('main').getAttribute('data-hero-rect');
  const state=await page.evaluate(()=>window.__firecrackersQA.snapshot());
  await page.getByRole('button',{name:'Hide controls',exact:true}).click();
  assert.equal(await page.locator('.chrome').evaluateAll(nodes=>nodes.every(e=>!!e.closest('[inert]'))),true);
  await page.waitForFunction(()=>[...document.querySelectorAll('.chrome')].every(e=>Number(getComputedStyle(e).opacity)===0),undefined,{timeout:5000});
  assert.equal(await page.locator('main').getAttribute('data-immersive'),'true');
  assert.equal(await page.locator('main').getAttribute('data-hero-rect'),before);
  assert.equal(await page.locator('.reveal-controls button').count(),0);
  assert.equal(await page.locator('.chrome').evaluateAll(nodes=>nodes.every(e=>!!e.closest('[inert]') && Number(getComputedStyle(e).opacity)===0)),true);
  const button=page.getByRole('button',{name:'Show controls',exact:true});
  const box=await button.boundingBox();assert.ok(box.width>=48&&box.height>=48&&box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height);
  await page.mouse.move(width/2,height/3);await page.mouse.click(width/2,height/3);
  assert.equal(await page.locator('main').getAttribute('data-immersive'),'true');
  const after=await page.evaluate(()=>window.__firecrackersQA.snapshot());
  assert.equal(after.launched,state.launched);assert.equal(after.paused,state.paused);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('.chrome')),false);
  await button.focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('main').getAttribute('data-immersive'),'false');
  await page.getByRole('button',{name:'Hide controls',exact:true}).click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('main').getAttribute('data-immersive'),'false');
  await page.getByRole('button',{name:/^Show mode:/}).click();
  await page.getByRole('button',{name:'Manual',exact:true}).click();
  assert.equal(await page.locator('.immersive-toggle').count(),0);
  results.push({backend,width,height});console.log('PASS',backend,width,height);
 }
 // Exercise finite-show completion and progression while controls remain hidden.
 for(const mode of ['Calm','Finale']) {
  await page.getByRole('button',{name:/^Show mode:/}).click();
  await page.getByRole('button',{name:mode,exact:true}).click();
  await page.getByRole('button',{name:'Hide controls',exact:true}).click();
  await page.evaluate(()=>window.__firecrackersQA.advance(2));
  assert.equal(await page.locator('main').getAttribute('data-immersive'),'true');
  if(mode==='Finale') {
   await page.evaluate(()=>window.__firecrackersQA.advance(35));
   await page.waitForSelector('main[data-immersive="false"]');
   assert.equal(await page.locator('.immersive-toggle').count(),0);
  } else { await page.keyboard.press('Escape'); }
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:/^Show mode:/}).click();
 await page.getByRole('button',{name:'Festival',exact:true}).click();
 await page.getByRole('button',{name:'Hide controls',exact:true}).click();
 assert.equal(await page.locator('.toggle-glyph').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
 await page.screenshot({path:`${out}/${backend}-immersive.png`});
 await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);await page.close();
}
} finally {await browser.close();await writeFile(`${out}/report.json`,JSON.stringify({base,results},null,2));}
