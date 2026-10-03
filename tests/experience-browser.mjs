import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const base=process.env.STAGE_URL||'http://127.0.0.1:4173/';
const out=process.argv[2]||'test-results/experience';await mkdir(out,{recursive:true});
const report={base,method:'Chromium software WebGL 2 and Canvas; emulated viewports, real UI actions plus labelled deterministic stepping',hardwareQualified:false,physicalDevice:false,cases:[]};
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const viewports=[[1280,800],[393,851],[320,480]];
try{
 for(const backend of ['canvas','webgl'])for(const [width,height]of viewports){
  const name=`${backend}-${width}x${height}`,entry={name,checks:[],errors:[],consoleErrors:[]};report.cases.push(entry);
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,isMobile:width<500,deviceScaleFactor:1,acceptDownloads:true,serviceWorkers:'block'});
  await context.addInitScript(()=>localStorage.setItem('firecrackers.preferences.v1',JSON.stringify({version:3,onboarded:true,quality:'low',adaptiveResolution:false,reducedMotion:false,reducedFlashes:true,sound:false,headphones:false})));
  const page=await context.newPage();page.on('pageerror',e=>entry.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')entry.consoleErrors.push(m.text());});
  const snap=()=>page.evaluate(()=>window.__firecrackersQA.snapshot());
  const advance=seconds=>page.evaluate(s=>{window.__firecrackersQA.advance(s);window.__firecrackersQA.render();},seconds);
  const screenshot=async label=>{await page.screenshot({path:`${out}/${name}-${label}.png`});};
  const close=()=>page.getByRole('button',{name:'Close panel',exact:true}).click();
  const check=label=>{entry.checks.push(label);console.log('PASS',name,label);};
  try{
   await page.goto(`${base}?backend=${backend}&qa=1&seed=731`);
   await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});
   assert.match(await page.title(),/firecrackers/i);assert.equal((await snap()).backend,backend==='webgl'?'WebGL 2':'Canvas 2D · compatibility');
   await page.evaluate(()=>window.__firecrackersQA.freeze(true));await screenshot('home');check('nonblank intended page, requested backend and reachable new tools');
   const before=await snap();await page.getByRole('button',{name:'Browse fireworks',exact:true}).click();
   await page.getByRole('heading',{name:'Gold Willow',exact:true}).waitFor();
   await page.getByRole('button',{name:'Pin Gold Willow',exact:true}).click();
   await page.locator('[data-effect-card="gold-willow"]').getByRole('button',{name:'Preview',exact:true}).click();
   await page.waitForTimeout(900);assert.equal((await snap()).time,before.time);assert.equal((await snap()).launched,before.launched);assert.equal((await snap()).selected,before.selected);
   assert.equal(await page.locator('dialog canvas').count(),1);await screenshot('browse-preview');
   await page.getByRole('button',{name:'Favourites',exact:true}).click();assert.equal(await page.locator('[data-effect-card]').count(),1);
   await page.getByRole('button',{name:'Grand',exact:true}).click();await page.getByRole('button',{name:'Select Ruby Dahlia',exact:true}).click();
   assert.equal(await page.locator('dialog[open]').count(),0);assert.equal((await snap()).selected,'ruby-dahlia');assert.equal((await snap()).launched,before.launched);
   await page.getByRole('button',{name:'Browse fireworks',exact:true}).click();await page.getByRole('button',{name:'Launch Ruby Dahlia',exact:true}).click();
   assert.equal((await snap()).phase,'fuse');assert.equal((await snap()).committedFamily,'Ruby Dahlia');
   await advance(5);await screenshot('ruby-water-and-smoke');await advance(35);check('preview is isolated and silent, favourites persist, Select and Launch remain distinct');

   await page.getByRole('button',{name:'Open night studio',exact:true}).click();
   await page.getByRole('button',{name:'Play from start',exact:true}).waitFor();
   await page.getByLabel('Show name',{exact:true}).fill('Ember study');
   await page.getByLabel('Cue 2 firework',{exact:true}).selectOption('silver-crossette-crackle');
   await page.getByLabel('Cue 2 gap',{exact:true}).fill('18');
   await page.getByLabel('Cue 3 position',{exact:true}).selectOption('0.65');
   await page.getByRole('button',{name:'Undo edit',exact:true}).click();assert.equal(await page.getByLabel('Cue 3 position',{exact:true}).inputValue(),'0.5');
   await page.getByRole('button',{name:'Redo edit',exact:true}).click();assert.equal(await page.getByLabel('Cue 3 position',{exact:true}).inputValue(),'0.65');
   await screenshot('studio');
   await page.getByRole('button',{name:'Save night',exact:true}).click();
   await page.getByRole('button',{name:/^Saved nights/}).click();await page.getByRole('button',{name:'Rename Ember study',exact:true}).click();
   await page.getByLabel('New show name',{exact:true}).fill('River encore');await page.getByRole('button',{name:'Save name',exact:true}).click();
   const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export River encore',exact:true}).click();const download=await downloadPromise;
   const downloaded=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(downloaded.name,'River encore');assert.equal(downloaded.cues.length,3);assert.equal(downloaded.cues[1].family,'silver-crossette-crackle');
   await page.getByRole('button',{name:'Review River encore',exact:true}).click();
   const savedText=await page.evaluate(()=>localStorage.getItem('firecrackers.nights.v1'));
   await page.getByLabel('Import show recipe file',{exact:true}).setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...downloaded,reducedFlashes:false}))});
   await page.getByText('Unsupported show recipe format.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('firecrackers.nights.v1')),savedText);
   await page.getByRole('button',{name:'Share recipe',exact:true}).click();const share=await page.getByLabel('Share link',{exact:true}).inputValue();assert.match(share,/#night=/);
   check('three-cue edits, undo/redo, save, rename, recipe export, bounded import rejection and share link');

   await page.getByRole('button',{name:'Play from start',exact:true}).click();
   assert.equal(await page.locator('dialog[open]').count(),0);assert.equal((await snap()).personal.status,'playing');
   await advance(6);await screenshot('personal-opening');
   await page.getByRole('button',{name:'Open night studio',exact:true}).click();const paused=(await snap()).time;
   await page.evaluate(()=>window.__firecrackersQA.freeze(false));await page.waitForTimeout(250);assert.equal((await snap()).time,paused);
   await page.evaluate(()=>window.__firecrackersQA.freeze(true));await close();await advance(110);
   assert.equal((await snap()).personal.status,'complete');assert.equal((await snap()).launched,3);await screenshot('encore');
   await page.getByRole('button',{name:'Replay',exact:true}).click();await advance(6);assert.equal((await snap()).personal.status,'playing');assert.equal((await snap()).personal.name,'River encore');
   check('same-clock personal playback, dialog pause, full residue completion and deliberate Encore');

   await page.getByRole('button',{name:'Capture this night',exact:true}).click();await page.getByRole('button',{name:'Take photo',exact:true}).click();
   await page.getByRole('img',{name:'Captured fireworks and waterfront',exact:true}).waitFor();
   const image=await page.getByRole('img',{name:'Captured fireworks and waterfront',exact:true}).evaluate(async image=>{await image.decode();const c=document.createElement('canvas');c.width=32;c.height=32;const x=c.getContext('2d');x.drawImage(image,0,0,32,32);const data=x.getImageData(0,0,32,32).data;return {width:image.naturalWidth,height:image.naturalHeight,visible:[...data].filter((_,i)=>i%4!==3).some(v=>v>30)};});
   assert.ok(image.width>100&&image.width<=1280&&image.height<=1280&&image.visible);entry.photo=image;
   const pngPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download',exact:true}).click();const png=await pngPromise;assert.equal((await readFile(await png.path())).subarray(1,4).toString(),'PNG');await screenshot('photo-preview');check('actual scene PNG preview, truthful dimensions and decodable download');

   if(width!==320){
    await page.evaluate(()=>window.__firecrackersQA.freeze(false));await page.getByRole('button',{name:'Record clip',exact:true}).click();
    await page.getByRole('button',{name:'Stop recording clip',exact:true}).waitFor();await page.waitForTimeout(2500);
    await page.getByRole('button',{name:'Stop recording clip',exact:true}).click();await page.locator('dialog video').waitFor();
    const video=await page.locator('dialog video').evaluate(async video=>{
     await new Promise((resolve,reject)=>{if(video.readyState>=2)return resolve();video.onloadeddata=resolve;video.onerror=()=>reject(new Error('Exported clip could not decode'));setTimeout(()=>reject(new Error('Video decode timed out')),10000);});
     await video.play();await new Promise(resolve=>{if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(()=>resolve());else setTimeout(resolve,250);});video.pause();
     const c=document.createElement('canvas');c.width=32;c.height=32;const x=c.getContext('2d');x.drawImage(video,0,0,32,32);const data=x.getImageData(0,0,32,32).data;
     return {width:video.videoWidth,height:video.videoHeight,visible:[...data].filter((_,i)=>i%4!==3).some(v=>v>30),time:video.currentTime};
    });assert.ok(video.width>100&&video.width<=1280&&video.height<=1280&&video.visible);entry.video=video;assert.equal((await snap()).capture.recording,false);
    const videoPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download',exact:true}).click();const movie=await videoPromise;assert.ok((await readFile(await movie.path())).length>1000);
    await screenshot('video-preview');check('short scene-only clip records, stops, releases and decodes real nonblack frames');
   }
   await close();await page.evaluate(()=>window.__firecrackersQA.freeze(true));
   const recipient=await context.newPage();await recipient.goto(`${base}?backend=${backend}&qa=1${new URL(share).hash}`);await recipient.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});
   assert.equal(await recipient.evaluate(()=>window.__firecrackersQA.snapshot().launched),0);assert.equal(await recipient.evaluate(()=>window.__firecrackersQA.snapshot().audioEnabled),false);
   await recipient.getByRole('button',{name:'Review shared night',exact:true}).click();assert.equal(await recipient.getByLabel('Show name',{exact:true}).inputValue(),'River encore');
   await recipient.getByRole('button',{name:'Close panel',exact:true}).click();await recipient.getByRole('button',{name:'Browse fireworks',exact:true}).click();await recipient.getByRole('button',{name:'Favourites',exact:true}).click();assert.equal(await recipient.locator('[data-effect-card="gold-willow"]').count(),1);await recipient.close();check('recipient must review then choose Play; link never autoplays or unmutes; favourites persist');
   assert.deepEqual(entry.errors,[]);assert.deepEqual(entry.consoleErrors,[]);entry.pass=true;
  }catch(error){entry.pass=false;entry.failure=error.stack;entry.final=await snap().catch(()=>null);await screenshot('FAILED').catch(()=>{});process.exitCode=1;console.error('FAIL',name,error.stack);}
  finally{await context.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
 }
}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
