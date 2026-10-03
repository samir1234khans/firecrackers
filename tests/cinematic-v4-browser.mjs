import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.STAGE_URL||'http://127.0.0.1:4173/';
const out=process.argv[2]||'test-results/cinematic-v4';await mkdir(out,{recursive:true});
const report={base,method:'Chromium software WebGL / Canvas, emulated desktop and phone, deterministic captures and real UI actions',physicalDevice:false,hardwareQualified:false,cases:[]};
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
async function nonblack(page,png){return page.evaluate(async text=>{const i=new Image();i.src='data:image/png;base64,'+text;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let n=0;for(let k=0;k<d.length;k+=4)if(d[k]+d[k+1]+d[k+2]>45)n++;return n;},png.toString('base64'));}
try{
 for(const backend of ['webgl','canvas'])for(const [width,height]of [[1280,800],[393,851],[320,480]]){
  const name=`${backend}-${width}x${height}`,entry={name,checks:[],errors:[],consoleErrors:[]};report.cases.push(entry);
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,isMobile:width<500,reducedMotion:'no-preference',serviceWorkers:'block',acceptDownloads:true});
  const old={schema:1,engine:'2026-10-03.2',name:'Earlier golden night',seed:731,kind:'cues',cues:[{family:'gold-willow',position:.5,gap:0,phase:'Opening'}]};
  await context.addInitScript(({old})=>{
   localStorage.setItem('firecrackers.preferences.v1',JSON.stringify({version:3,quality:'low',onboarded:true,sound:false,adaptiveResolution:false,reducedFlashes:true,reducedMotion:false,cameraMotion:true,cinematicExposure:true}));
   localStorage.setItem('firecrackers.nights.v1',JSON.stringify([{id:'historical',recipe:old}]));
  },{old});
  const page=await context.newPage();page.on('pageerror',e=>entry.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')entry.consoleErrors.push(m.text());});
  const snap=()=>page.evaluate(()=>window.__firecrackersQA.snapshot());
  const advance=t=>page.evaluate(t=>{window.__firecrackersQA.advance(t);window.__firecrackersQA.render();},t);
  const capture=async label=>{await page.waitForTimeout(100);const png=await page.screenshot({path:`${out}/${name}-${label}.png`});assert.ok(await nonblack(page,png)>200,'meaningful nonblack pixels');};
  const close=()=>page.getByRole('button',{name:'Close panel',exact:true}).click();
  try{
   await page.goto(`${base}?backend=${backend}&qa=1&seed=731`);await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});
   await page.evaluate(()=>window.__firecrackersQA.freeze(true));assert.match(await page.title(),/firecrackers/i);
   assert.equal((await snap()).backend,backend==='webgl'?'WebGL 2':'Canvas 2D · compatibility');await capture('ready');entry.checks.push('correct page/backend, ready content, no framework overlay');
   await page.getByRole('button',{name:'Controls',exact:true}).click();await page.getByRole('button',{name:'Just watch',exact:true}).click();
   assert.equal((await snap()).show,'finale');assert.equal((await snap()).audioEnabled,false);assert.equal(await page.locator('dialog[open]').count(),0);
   await advance(7);await capture('just-watch');const s=await snap();
   assert.ok(s.bursts>0);assert.ok(s.cinematicResponse.exposure>=.85&&s.cinematicResponse.exposure<=.95);entry.checks.push('Just watch starts existing finite show without sound or modal');
   const before=s.time;await page.waitForTimeout(150);assert.equal((await snap()).time,before);entry.checks.push('render/capture do not tick exposure or show clock');
   await page.keyboard.press('Escape');await page.getByRole('button',{name:'Controls',exact:true}).click();await page.getByRole('button',{name:'Settings',exact:true}).click();
   assert.equal(await page.getByLabel('Cinematic exposure',{exact:true}).isChecked(),true);
   if(backend==='canvas')assert.equal(await page.getByLabel('Gentle camera response',{exact:true}).isDisabled(),true);
   await page.getByLabel('Reduced interface motion',{exact:true}).check();assert.equal(await page.getByLabel('Gentle camera response',{exact:true}).isDisabled(),true);
   await close();await advance(.2);if(backend==='webgl')assert.deepEqual((await snap()).cameraResponsePixels,[0,0]);entry.checks.push('motion override and truthful Canvas capability');
   await page.getByRole('button',{name:'Night studio',exact:true}).click();await page.getByRole('button',{name:/^Saved nights/}).click();
   await page.getByRole('heading',{name:'Earlier golden night',exact:true}).waitFor();
   const bytes=await page.evaluate(()=>localStorage.getItem('firecrackers.nights.v1'));
   await page.getByRole('button',{name:'Adapt a copy of Earlier golden night',exact:true}).click();
   assert.match(await page.getByLabel('Show name',{exact:true}).inputValue(),/copy/);
   assert.equal(await page.evaluate(()=>localStorage.getItem('firecrackers.nights.v1')),bytes);
   await capture('adapted-copy');entry.checks.push('historical recipe stays visible; explicit adaptation leaves original untouched');
   await close();await advance(80);await page.locator('[data-family-icon="grand-finale"]').click();
   for(let i=0;i<40&&(await snap()).phase!=='burst';i++){await advance(.25);if((await snap()).headCount>0)break;}
   await advance(.7);await capture('finale-primary');await advance(2.2);await capture('finale-secondary');
   entry.final=await snap();assert.equal(entry.final.backend,backend==='webgl'?'WebGL 2':'Canvas 2D · compatibility');
   assert.deepEqual(entry.errors,[]);assert.deepEqual(entry.consoleErrors,[]);entry.pass=true;console.log('PASS',name,entry.checks.length);
  }catch(error){entry.pass=false;entry.failure=error.stack;await capture('FAILED').catch(()=>{});console.error('FAIL',name,error.message);process.exitCode=1;}
  finally{await context.close();}
 }
 // Matched captures use identical seed, effect, size, quality and fixed stepping.
 // The reference and candidate may differ in particle geometry by design; no FPS claim.
 if(process.env.BASELINE_URL)for(const [width,height]of [[1280,800],[393,851]])for(const variant of ['before','after']){
  const origin=variant==='before'?process.env.BASELINE_URL:base;
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
  await context.addInitScript(()=>localStorage.setItem('firecrackers.preferences.v1',JSON.stringify({version:3,quality:'ultra',onboarded:true,sound:false,adaptiveResolution:false,reducedFlashes:true,reducedMotion:false,cameraMotion:false})));
  const page=await context.newPage();
  try{
   await page.goto(`${origin}?backend=webgl&qa=1&seed=731`);await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});await page.evaluate(()=>window.__firecrackersQA.freeze(true));
   await page.locator('[data-family-icon="multicolor-peony"]').click();
   for(let i=0;i<40;i++){await page.evaluate(()=>window.__firecrackersQA.advance(.25));if((await page.evaluate(()=>window.__firecrackersQA.snapshot())).headCount>0)break;}
   for(const [label,t]of [['open',.8],['falling',2.4]]){await page.evaluate(t=>{window.__firecrackersQA.advance(t);window.__firecrackersQA.render();},t);await page.screenshot({path:`${out}/matched-${width}x${height}-${variant}-${label}.png`});}
  }catch(error){report.comparisonFailure=String(error);process.exitCode=1;}finally{await context.close();}
 }
}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close();}
