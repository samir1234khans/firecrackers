import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { inspectStage, openPicker, chooseFamily } from './stage-helpers.mjs';
const base=process.env.STAGE_URL||'http://127.0.0.1:4173/';const out=process.argv[2]||'test-results/stage-full';await fs.mkdir(out,{recursive:true});
const report={url:base,checks:[],errors:[],physicalDevice:false};const pass=(name,data={})=>{report.checks.push({name,...data});console.log('PASS',name)};
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:393,height:851},hasTouch:true,isMobile:true});const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));
const snap=()=>p.evaluate(()=>window.__firecrackersQA.snapshot());
const advance=async t=>{await p.evaluate(t=>window.__firecrackersQA.advance(t),t);await p.waitForTimeout(50);await p.evaluate(()=>window.__firecrackersQA.render())};
const enter=async backend=>{await p.goto(`${base}?backend=${backend}&qa=1`);await p.waitForSelector('main[data-ready="true"]',{timeout:90000});};
try{
 await enter('canvas');
 for(const [width,height] of [[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]]){await p.setViewportSize({width,height});const result=await inspectStage(p);await p.screenshot({path:`${out}/layout-${width}x${height}.png`});pass(`${width}x${height}: center clearance and hit targets`,{ratio:result.hero.width/width});}
 await p.setViewportSize({width:393,height:851});
 await p.evaluate(()=>{const m=document.querySelector('main');m.style.setProperty('--safe-top','30px');m.style.setProperty('--safe-bottom','24px');m.style.setProperty('--safe-left','4px');m.style.setProperty('--safe-right','4px')});await inspectStage(p);pass('safe insets preserve clear center');
 await p.evaluate(()=>document.querySelector('main').removeAttribute('style'));
 const before=await snap();await p.mouse.click(196,240);assert.equal((await snap()).launched,before.launched);assert.equal(await p.locator('main').getAttribute('data-overlay'),'none');pass('blank sky input is inert');
 await p.getByRole('button',{name:'Pause scene',exact:true}).click();await openPicker(p);await p.keyboard.press('Escape');assert.equal((await snap()).paused,true);await p.getByRole('button',{name:'Resume scene',exact:true}).click();pass('drawer close preserves manual pause');
 await p.getByRole('button',{name:'Open settings',exact:true}).click();const time=(await snap()).time;await p.waitForTimeout(250);assert.equal((await snap()).time,time);
 for(let i=0;i<22;i++){await p.keyboard.press('Tab');assert.ok(await p.evaluate(()=>document.activeElement?.closest('dialog')))}
 await p.keyboard.press('Escape');assert.equal(await p.getByRole('button',{name:'Open settings',exact:true}).evaluate(e=>e===document.activeElement),true);pass('panel pauses, traps focus, Escape restores invoker');
 await p.getByRole('button',{name:'Position firework'}).click();await p.getByRole('button',{name:'Right',exact:true}).click();await p.getByRole('button',{name:'Set position',exact:true}).click();assert.equal((await snap()).placement,.8);pass('position draft commits after overlay pause removal');
 await openPicker(p);let r=await p.getByRole('button',{name:'Gold Willow',exact:true}).boundingBox();
 await p.mouse.move(r.x+25,r.y+25);await p.mouse.down();await p.mouse.move(10,10,{steps:8});await p.mouse.up();assert.equal(await p.locator('main').getAttribute('data-overlay'),'picker');assert.equal((await snap()).launched,before.launched);pass('invalid drop cancels without launching');
 r=await p.getByRole('button',{name:'Gold Willow',exact:true}).boundingBox();const cdp=await context.newCDPSession(p);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+25,y:r.y+25}]});
 for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+25+(200-r.x-25)*i/8,y:r.y+25+(250-r.y-25)*i/8}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(50);const dropped=await snap();assert.equal(dropped.launched,before.launched+1);assert.equal(dropped.bursts,before.bursts+1);assert.equal(await p.locator('main').getAttribute('data-overlay'),'none');pass('touch drag produces exactly one immediate burst');
 await p.evaluate(()=>window.__firecrackersQA.freeze(true));await advance(35);assert.equal((await snap()).particles,0);
 await openPicker(p);await p.getByRole('button',{name:'Burst selected style in center'}).click();assert.equal((await snap()).launched,dropped.launched+1);await advance(35);pass('keyboard-accessible instant burst and complete cleanup');
 await p.getByRole('button',{name:'Launch selected firework',exact:true}).click();const committed=(await snap()).committedId;await chooseFamily(p,'Sapphire Saturn');assert.equal((await snap()).committedId,committed);assert.equal((await snap()).committedFamily,'Gold Willow');await p.setViewportSize({width:844,height:390});assert.equal((await snap()).committedId,committed);await advance(35);pass('drawer selection and rotation preserve committed rocket');
 const requests=[];p.on('request',r=>{if(r.url().includes('/audio/'))requests.push(r.url())});await enter('canvas');assert.equal(requests.length,0);await p.getByRole('button',{name:'Enable sound',exact:true}).click();await p.waitForFunction(()=>window.__firecrackersQA.snapshot().recordedSamples===3);assert.equal(requests.length,3);await p.getByRole('button',{name:'Launch selected firework',exact:true}).click();await p.waitForTimeout(200);await p.getByRole('button',{name:'Pause scene',exact:true}).click();assert.equal((await snap()).audioVoices,0);pass('recordings load after explicit sound activation; pause cancels voices');
 await p.getByRole('button',{name:'Mute sound',exact:true}).click();await enter('webgl');assert.match((await snap()).backend,/WebGL/);await p.waitForFunction(()=>document.querySelector('.scene-host').dataset.assets?.includes('smoke'));
 for(const quality of ['ultra','standard','low']){await p.getByRole('button',{name:'Open settings',exact:true}).click();await p.getByLabel('Graphics quality',{exact:true}).selectOption(quality);await p.getByRole('button',{name:'Close panel'}).click();await p.evaluate(()=>window.__firecrackersQA.freeze(true));await advance(35);await chooseFamily(p,'Sapphire Saturn');await p.getByRole('button',{name:'Launch selected firework',exact:true}).click();await advance(4.9);const s=await snap();assert.equal(s.quality,quality);if(quality!=='low')assert.ok(Math.max(s.reflectionWidth,s.reflectionHeight)<=(quality==='ultra'?512:256));await p.screenshot({path:`${out}/saturn-${quality}.png`});pass(`${quality}: authored assets and reflection budget`,{width:s.reflectionWidth,height:s.reflectionHeight});}
 assert.deepEqual(report.errors,[]);
}catch(e){report.failed=e.stack;console.error(e);process.exitCode=1;await p.screenshot({path:`${out}/FAILED.png`}).catch(()=>{});}finally{await browser.close();await fs.writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}

