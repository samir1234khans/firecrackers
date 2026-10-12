import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {openPanel} from './stage-helpers.mjs';
const base=process.env.UPSTREAM_URL||'http://127.0.0.1:4206/';
const out=process.env.UPSTREAM_OUT||'test-results/upstream-details';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={base,cases:[],errors:[],failed:null};let page;
async function enter(backend='webgl',options={}){
 page=await browser.newPage({viewport:{width:1280,height:800},serviceWorkers:'block',...options});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('firecrackers.preferences.v1',JSON.stringify({version:4,onboarded:true,quality:'standard',sound:false})));
 await page.goto(`${base}?qa=1&seed=42&backend=${backend}`);
 await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});
}
const snap=()=>page.evaluate(()=>window.__firecrackersQA.snapshot());
const advance=t=>page.evaluate(t=>{window.__firecrackersQA.freeze(true);window.__firecrackersQA.advance(t);},t);
async function studio(){await page.getByRole('button',{name:'Open night studio',exact:true}).click();await page.getByText('Sky writing & draw with light',{exact:true}).click();}
try{
 await enter();
 await studio();
 const pad=page.getByRole('application',{name:'Draw with light'});await pad.scrollIntoViewIfNeeded();
 const box=await pad.boundingBox();await page.mouse.move(box.x+box.width*.2,box.y+box.height*.3);await page.mouse.down();
 await page.mouse.move(box.x+box.width*.7,box.y+box.height*.7,{steps:12});await page.mouse.up();
 await pad.focus();await page.keyboard.press('Space');for(let i=0;i<8;i++)await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');
 assert.equal(await pad.locator('polyline').count(),2);
 await page.getByRole('button',{name:'Undo stroke',exact:true}).click();assert.equal(await pad.locator('polyline').count(),1);
 await page.getByRole('button',{name:'Add drawing cue',exact:true}).click();
 await page.getByLabel('Sky lettering',{exact:true}).fill('HELLO SKY');await page.getByRole('button',{name:'Add lettering cue',exact:true}).click();
 await page.getByRole('button',{name:'Add mirrored round',exact:true}).click();
 await page.getByRole('button',{name:'Save night',exact:true}).click();
 const exportButton=page.getByRole('button',{name:'Export recipe',exact:true});
 const [download]=await Promise.all([page.waitForEvent('download'),exportButton.click()]);
 const filename=`${out}/creative-recipe.json`;await download.saveAs(filename);const recipe=JSON.parse(await readFile(filename,'utf8'));
 assert.equal(recipe.schema,2);for(const type of ['drawing','text','group'])assert.ok(recipe.cues.some(c=>c.type===type));
 await page.getByLabel('Import show recipe file',{exact:true}).setInputFiles(filename);await page.getByText('Imported for review.',{exact:false}).waitFor();
 await page.getByLabel('Sky lettering',{exact:true}).fill('HELLO SKY');await page.getByRole('button',{name:'Preview lettering',exact:true}).click();
 await advance(1.4);assert.ok((await snap()).trailCount>0);await page.screenshot({path:`${out}/formed-lettering.png`});
 await advance(10);assert.equal((await snap()).trailCount,0);
 await studio();await pad.focus();await page.keyboard.press('Space');for(let i=0;i<8;i++)await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await page.getByRole('button',{name:'Preview drawing',exact:true}).click();await advance(.2);assert.ok((await snap()).trailCount>0);await advance(9);assert.equal((await snap()).trailCount,0);
 report.cases.push('Pointer/keyboard drawing, Undo, schema-2 save/export/import, formed lettering, complete cooling');
 await page.getByRole('button',{name:/Explore the waterfront/}).click();await page.getByRole('button',{name:'Watch boats',exact:true}).click();
 await page.evaluate(()=>window.__firecrackersQA.freeze(false));
 for(const id of [0,1,5,6]){await page.getByLabel('Choose a family',{exact:true}).selectOption(String(id));await page.waitForTimeout(600);await page.screenshot({path:`${out}/boat-${id}-blend.png`});await page.waitForTimeout(900);await page.screenshot({path:`${out}/boat-${id}.png`});assert.equal((await snap()).seaFocus,id);}
 await page.keyboard.press('Escape');assert.equal((await snap()).seaFocus,null);await page.waitForTimeout(1400);assert.equal(await page.getByRole('button',{name:'Watch boats',exact:true}).evaluate(e=>e===document.activeElement),true);
 report.cases.push('Four 1.2-second boat blends, return, Escape and restored focus');await page.close();
 await enter('canvas');let audioRequests=0;page.on('request',r=>{if(/\/(audio|music)\//.test(r.url()))audioRequests++;});
 await page.getByRole('button',{name:/Explore the waterfront/}).click();await page.getByLabel('Instrumental ambience',{exact:true}).check();
 await page.waitForTimeout(500);assert.equal(audioRequests,0,'No pre-consent audio fetching');
 await page.getByRole('button',{name:'Enable sound',exact:true}).click();await page.waitForFunction(()=>window.__firecrackersQA.snapshot().ambientMusicVoices===1,undefined,{timeout:30000});
 await openPanel(page,'settings');assert.equal((await snap()).ambientMusicHeld,false,'Settings may retain opted-in ambience');
 await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await page.getByRole('button',{name:'Pause scene',exact:true}).first().click();assert.equal((await snap()).ambientMusicHeld,true);
 await page.getByRole('button',{name:'Resume scene',exact:true}).first().click();assert.equal((await snap()).ambientMusicHeld,false);
 await page.getByLabel('Fireworks sound',{exact:true}).uncheck();assert.equal((await snap()).effectsSoundEnabled,false);
 await page.getByRole('button',{name:'Mute sound',exact:true}).click();assert.equal((await snap()).ambientMusicHeld,true);assert.ok((await snap()).ambientMusicBytes<=24*1024*1024);
 report.cases.push('No pre-consent audio requests, one ambient voice, settings continuity, global pause, independent effects and master mute');await page.close();
 await enter('canvas',{reducedMotion:'reduce',forcedColors:'active'});assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.world-tools')).backdropFilter),'none');
 await page.getByRole('button',{name:/Explore the waterfront/}).click();await page.getByRole('button',{name:'Watch boats',exact:true}).click();assert.equal((await snap()).seaFocus,0);await page.keyboard.press('Escape');
 report.cases.push('Forced colours glass fallback and reduced-motion boat selection');await page.close();
 assert.deepEqual(report.errors,[]);
}catch(e){report.failed=e.stack;await page?.screenshot({path:`${out}/failure.png`});throw e;}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
