import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {inspectStage,openPanel,settingsTab,classicIds,grandIds,signatureIds} from './stage-helpers.mjs';
const base=process.env.OPEN_SKY_URL||'http://127.0.0.1:4173/',out=process.argv[2]||'test-results/open-sky';await mkdir(out,{recursive:true});
const hardware=process.env.OPEN_SKY_HARDWARE==='1',quick=process.env.OPEN_SKY_QUICK==='1';
const browser=await chromium.launch(hardware?{channel:'chrome',headless:true}:{headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={base,seed:20260916,method:hardware?'Installed Chrome native GPU and Canvas; viewport/touch emulation':'Bundled Chromium software WebGL and Canvas; viewport/touch emulation',checks:[],errors:[],failed:null};
const pass=(name,details={})=>{report.checks.push({name,...details});console.log('PASS',name);};let page;
const snap=()=>page.evaluate(()=>window.__firecrackersQA.snapshot());
const advance=t=>page.evaluate(t=>window.__firecrackersQA.advance(t),t);
const knob=()=>page.getByRole('button',{name:/^Show mode:/});
const slider=()=>page.getByRole('slider',{name:'Next rocket position',exact:true});
const choose=async name=>{await knob().click();await page.getByRole('button',{name,exact:true}).click();};
try{
 for(const backend of hardware?['webgpu','webgl','canvas']:['webgl','canvas']){
  page=await browser.newPage({viewport:{width:393,height:851},hasTouch:true,serviceWorkers:'block'});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.goto(`${base}?backend=${backend}&qa=1&seed=20260916`);await page.waitForFunction(()=>window.__firecrackersQA&&document.querySelector('main').dataset.ready==='true',undefined,{timeout:90000});await page.evaluate(()=>window.__firecrackersQA.freeze(true));
  assert.equal((await snap()).backend,backend==='webgpu'?'WebGPU':backend==='webgl'?'WebGL 2':'Canvas 2D · compatibility');
  if(hardware&&backend==='webgpu'){const a=await page.evaluate(async()=>{const a=await navigator.gpu.requestAdapter();return{vendor:a.info.vendor,fallback:a.info.isFallbackAdapter};});assert.equal(a.fallback,false);pass('Native WebGPU adapter',a);}
  for(const [width,height]of quick?[[393,851],[844,390],[1280,800]]:[[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]]){
   await page.setViewportSize({width,height});const layout=await inspectStage(page);await page.mouse.move(width/2,15);
   assert.equal(await page.locator('.stage-brand,.bottom-collection-caption').count(),0);
   const targets=await page.locator('[data-mode-control] button,[data-position-control] [role="slider"],[data-position-control] button').evaluateAll(es=>es.filter(e=>!e.closest('dialog')).map(e=>{const r=e.getBoundingClientRect();return{w:r.width,h:r.height,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}));
   for(const t of targets)assert.ok(t.w>=48&&t.h>=48&&t.hit,JSON.stringify(t));
   for(const id of [...classicIds,...grandIds,...signatureIds]){
    await advance(40);await page.locator(`[data-family-icon="${id}"]`).click();await page.evaluate(()=>window.__firecrackersQA.render());const s=await snap();assert.equal(s.phase,'fuse');assert.equal(s.selected,id);
    assert.ok(s.launchProfile?.prop,'Resolved model composition must be committed');
    const p=s.launchProfile.prop;assert.ok(p.modelScale?.every(n=>n>0&&Number.isFinite(n)));
    const b=s.propBounds;assert.ok(b&&b.width>0&&b.height>0,'Projected standing bounds');
    assert.ok(b.x>=layout.safe.left-1&&b.x+b.width<=width-layout.safe.right+1,JSON.stringify(b));
    assert.ok(b.y>=layout.safe.top-1&&b.y+b.height<=height-76-layout.safe.bottom+1,JSON.stringify(b));
    assert.ok(Math.abs(b.height-p.standingHeight)<3,'Resolved standing height matches projection');
    assert.ok(Math.abs(b.y+b.height-s.padContact.y)<2,'Model stays grounded');
    if(backend==='webgpu'&&(width===393||width===1280)){await page.mouse.move(width/2,15);await page.screenshot({path:`${out}/prop-${width}x${height}-${id}.png`});}
    await advance(40);
   }
   pass(`${backend}/${width}x${height}: thirteen launch props, control bounds and targets`,{layout});
  }
  await page.setViewportSize({width:393,height:851});await inspectStage(page);
  const before=await snap();await page.mouse.click(196,160);assert.equal((await snap()).launched,before.launched);
  await page.getByRole('button',{name:'Pause scene',exact:true}).click();
  for(const mode of ['Calm','Festival','Finale','Manual']){await choose(mode);assert.equal((await snap()).paused,true);assert.equal((await snap()).show,mode==='Manual'?null:mode.toLowerCase());}
  await knob().click();for(const key of ['Tab','Tab','Tab','Tab','Tab','Shift+Tab']){await page.keyboard.press(key);assert.ok(await page.evaluate(()=>document.activeElement.closest('dialog:modal')));}await page.keyboard.press('Escape');assert.equal((await snap()).paused,true);assert.ok(await knob().evaluate(e=>e===document.activeElement));
  await page.getByRole('button',{name:'Resume scene',exact:true}).click();
  for(const mode of ['Calm','Festival','Finale']){await choose(mode);assert.equal((await snap()).show,mode.toLowerCase());assert.equal((await snap()).paused,false);}
  await advance(40);assert.equal((await snap()).show,null);pass(`${backend}: mode choice, modal focus, independent pause and finite Finale`);
  // Directional knob uses committed pointerup, cancel/Escape never changes a show.
  let k=await knob().boundingBox();await page.mouse.move(k.x+k.width/2,k.y+k.height/2);await page.mouse.down();await page.mouse.move(k.x+k.width/2-48,k.y+k.height/2,{steps:5});await page.mouse.up();assert.equal((await snap()).show,'finale');await choose('Manual');
  k=await knob().boundingBox();await page.mouse.move(k.x+32,k.y+32);await page.mouse.down();await page.mouse.move(k.x+32,k.y-30,{steps:5});await page.keyboard.press('Escape');await page.mouse.up();assert.equal((await snap()).show,null);pass(`${backend}: directional mode gesture and cancellation`);
  await slider().focus();await page.keyboard.press('Home');assert.equal((await snap()).placement,0);await page.keyboard.press('End');assert.equal((await snap()).placement,1);await page.keyboard.press('Shift+ArrowLeft');assert.ok((await snap()).placement>.95);await page.keyboard.press('Home');
  let r=await slider().boundingBox(),s=await snap();await page.mouse.move(r.x+5,r.y+24);await page.mouse.down();await page.mouse.move(r.x+r.width-5,r.y+24,{steps:5});await page.keyboard.press('Escape');await page.mouse.up();assert.equal((await snap()).placement,s.placement);
  await page.getByRole('button',{name:'Random launch position',exact:true}).click();assert.equal((await snap()).placementMode,'random');
  const places=[];for(let n=0;n<4;n++){await advance(40);await page.locator('[data-family-icon="gold-willow"]').click();s=await snap();places.push(s.committedPlacement);const profile=JSON.stringify(s.launchProfile),flightId=s.committedId;await slider().focus();await page.keyboard.press('End');assert.equal((await snap()).committedId,flightId);assert.equal(JSON.stringify((await snap()).launchProfile),profile);await page.setViewportSize({width:844,height:390});assert.equal(JSON.stringify((await snap()).launchProfile),profile);await page.setViewportSize({width:393,height:851});if(n<3)await page.getByRole('button',{name:'Random launch position',exact:true}).click();}
  assert.ok(new Set(places).size>1);pass(`${backend}: full range, fine adjustment, cancel, random admissions and immutable in-flight geometry`,{places});
  await advance(40);await slider().focus();await page.keyboard.press('Home');await page.reload();await page.waitForFunction(()=>window.__firecrackersQA&&document.querySelector('main').dataset.ready==='true',undefined,{timeout:90000});assert.equal((await snap()).placement,0);assert.equal((await snap()).placementMode,'fixed');await page.evaluate(()=>window.__firecrackersQA.freeze(true));
  await openPanel(page,'settings');await settingsTab(page,'Device');await page.getByRole('button',{name:'Reset this sky',exact:true}).click();await page.getByRole('button',{name:'Reset sky and preferences',exact:true}).click();assert.equal((await snap()).placement,.5);assert.equal((await snap()).placementMode,'fixed');pass(`${backend}: position preferences reload and reset`);
  await page.close();
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failed=e.stack;process.exitCode=1;console.error(e);if(page&&!page.isClosed())await page.screenshot({path:`${out}/FAILED.png`}).catch(()=>{});}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
