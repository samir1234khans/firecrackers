import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { inspectStage, inspectEdgeShelves, inspectEdgeSeparation, inspectOpenDock, edgeShelf, dockShelf, openPicker, chooseFamily } from './stage-helpers.mjs';
const base=process.env.STAGE_URL||'http://127.0.0.1:4173/';const out=process.argv[2]||'test-results/stage-full';await fs.mkdir(out,{recursive:true});
const report={url:base,checks:[],errors:[],physicalDevice:false};const pass=(name,data={})=>{report.checks.push({name,...data});console.log('PASS',name)};
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:393,height:851},hasTouch:true,isMobile:true});const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));
const snap=()=>p.evaluate(()=>window.__firecrackersQA.snapshot());
const advance=async t=>{await p.evaluate(t=>window.__firecrackersQA.advance(t),t);await p.waitForTimeout(50);await p.evaluate(()=>window.__firecrackersQA.render())};
const enter=async backend=>{await p.goto(`${base}?backend=${backend}&qa=1`);await p.waitForSelector('main[data-ready="true"]',{timeout:90000});};
const touchDrag=async(cdp,icon,x,y,end='touchEnd')=>{
 const r=await icon.boundingBox();assert.ok(r,`Missing drag source: ${icon}`);const sx=r.x+r.width/2,sy=r.y+r.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy}]});
 for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx+(x-sx)*i/8,y:sy+(y-sy)*i/8}]});
 await cdp.send('Input.dispatchTouchEvent',{type:end,touchPoints:[]});await p.waitForTimeout(50);
};
const mouseDrag=async(page,icon,x,y)=>{
 const r=await icon.boundingBox();assert.ok(r,`Missing drag source: ${icon}`);const sx=r.x+r.width/2,sy=r.y+r.height/2;
 await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(x,y,{steps:8});await page.mouse.up();await page.waitForTimeout(50);
};
try{
 await enter('canvas');
 for(const [width,height] of [[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]]){await p.setViewportSize({width,height});const result=await inspectStage(p);if(width>=768&&height>=621)await inspectEdgeShelves(p,width<1024?48:44);await p.screenshot({path:`${out}/layout-${width}x${height}.png`});pass(`${width}x${height}: center clearance, direct shelves or compact dock, and hit targets`,{ratio:result.hero.width/width});}
 const cdp=await context.newCDPSession(p);
 await p.setViewportSize({width:768,height:1024});await inspectStage(p);await inspectEdgeShelves(p,48);
 for(const [collection,id] of [['classics','gold-willow'],['grand','sapphire-saturn']]){
  const before=await snap(),hero=JSON.parse(await p.locator('main').getAttribute('data-hero-rect')||await p.locator('main').evaluate(e=>e.dataset.heroRect));
  await touchDrag(cdp,edgeShelf(p,collection).locator(`[data-family-icon="${id}"]`),hero.x+hero.width/2,hero.y+hero.height*.3);
  const after=await snap();assert.equal(after.launched,before.launched+1);assert.equal(after.bursts,before.bursts+1);assert.equal(after.selected,id);
  await advance(35);assert.equal((await snap()).particles,0);
 }
 pass('tablet: drag from both edge collections bursts immediately and exactly once');
 await p.setViewportSize({width:393,height:851});
 assert.equal(await p.locator('[data-family-dock]').getAttribute('data-open'),'false');
 await p.getByRole('button',{name:'Open fireworks dock to drag a style into the sky'}).click();await inspectOpenDock(p);await p.screenshot({path:`${out}/dock-open-393x851.png`});
 let dockBefore=await snap();await touchDrag(cdp,dockShelf(p,'classics').locator('[data-family-icon="multicolor-peony"]'),10,10);
 assert.equal((await snap()).launched,dockBefore.launched);assert.equal(await p.locator('[data-family-dock]').getAttribute('data-open'),'true');
 await touchDrag(cdp,dockShelf(p,'grand').locator('[data-family-icon="ruby-dahlia"]'),196,240,'touchCancel');
 assert.equal((await snap()).launched,dockBefore.launched);assert.equal(await p.locator('[data-family-dock]').getAttribute('data-open'),'true');
 await touchDrag(cdp,dockShelf(p,'classics').locator('[data-family-icon="gold-willow"]'),196,240);
 let dockAfter=await snap();assert.equal(dockAfter.launched,dockBefore.launched+1);assert.equal(dockAfter.bursts,dockBefore.bursts+1);assert.equal(dockAfter.selected,'gold-willow');assert.equal(await p.locator('[data-family-dock]').getAttribute('data-open'),'false');
 await advance(35);assert.equal((await snap()).particles,0);pass('mobile: expanded dock drag, invalid drop, cancel, and auto-close');
 await p.setViewportSize({width:320,height:480});await inspectStage(p);await p.getByRole('button',{name:'Open fireworks dock to drag a style into the sky'}).click();await inspectOpenDock(p);
 await dockShelf(p,'grand').locator('[data-family-icon="opal-supernova"]').focus();await p.keyboard.press('Escape');assert.equal(await p.locator('[data-family-dock]').getAttribute('data-open'),'false');
 await p.waitForFunction(()=>document.activeElement===document.querySelector('.family-dock-toggle'));pass('320px phone: ten touch targets fit and Escape restores dock focus');
 await p.setViewportSize({width:844,height:390});await inspectStage(p);await p.getByRole('button',{name:'Open fireworks dock to drag a style into the sky'}).click();
 const landscapeDock=await inspectOpenDock(p);assert.ok(landscapeDock.y>=200,`Expanded landscape dock must leave an upper sky: ${JSON.stringify(landscapeDock)}`);await p.screenshot({path:`${out}/dock-open-844x390.png`});
 const landscapeBefore=await snap(),landscapeHero=await p.locator('main').evaluate(e=>JSON.parse(e.dataset.heroRect));
 await touchDrag(cdp,dockShelf(p,'grand').locator('[data-family-icon="phoenix-palm"]'),landscapeHero.x+landscapeHero.width/2,landscapeHero.y+landscapeHero.height*.28);
 const landscapeAfter=await snap();assert.equal(landscapeAfter.launched,landscapeBefore.launched+1);assert.equal(landscapeAfter.bursts,landscapeBefore.bursts+1);assert.equal(await p.locator('[data-family-dock]').getAttribute('data-open'),'false');
 await advance(35);assert.equal((await snap()).particles,0);await p.setViewportSize({width:393,height:851});pass('short landscape: open dock preserves upper sky and drag bursts exactly once');
 const desktopContext=await browser.newContext({viewport:{width:1280,height:800}}),desktop=await desktopContext.newPage();desktop.on('pageerror',e=>report.errors.push(e.message));
 await desktop.goto(`${base}?backend=canvas&qa=1`);await desktop.waitForSelector('main[data-ready="true"]',{timeout:90000});await inspectStage(desktop);await inspectEdgeShelves(desktop,44);
 const desktopSnap=()=>desktop.evaluate(()=>window.__firecrackersQA.snapshot());
 const desktopAdvance=async t=>{await desktop.evaluate(t=>window.__firecrackersQA.advance(t),t);await desktop.waitForTimeout(50);};
 const leftIcon=edgeShelf(desktop,'classics').locator('[data-family-icon="multicolor-peony"]'),leftQuick=edgeShelf(desktop,'classics').locator('[data-family-launch="multicolor-peony"]');
 assert.equal(await leftQuick.evaluate(e=>{const s=getComputedStyle(e);return Number(s.opacity)<.1||s.visibility==='hidden'||s.pointerEvents==='none';}),true,'Quick Launch is hidden at rest');
 await leftIcon.hover();await desktop.waitForFunction(()=>{const e=document.querySelector('[data-edge="middle-left"] [data-family-launch="multicolor-peony"]'),s=getComputedStyle(e);return Number(s.opacity)>.9&&s.visibility==='visible'&&s.pointerEvents!=='none';});
 const iconBox=await leftIcon.boundingBox(),quickBox=await leftQuick.boundingBox();assert.ok(Math.hypot(iconBox.x+iconBox.width/2-quickBox.x-quickBox.width/2,iconBox.y+iconBox.height/2-quickBox.y-quickBox.height/2)<150,'Quick Launch stays near its hovered icon');
 let quickBefore=await desktopSnap();await leftQuick.click();let quickAfter=await desktopSnap();assert.equal(quickAfter.committedFamily,'Multicolor Peony');assert.equal(quickAfter.phase,'fuse');assert.equal(quickAfter.bursts,quickBefore.bursts);await leftQuick.evaluate(e=>e.click());assert.equal((await desktopSnap()).committedId,quickAfter.committedId);await desktopAdvance(1);assert.equal((await desktopSnap()).launched,quickBefore.launched+1);await desktopAdvance(35);pass('desktop: hovered Classic offers nearby Launch and admits one normal flight');
 const rightIcon=edgeShelf(desktop,'grand').locator('[data-family-icon="sapphire-saturn"]'),rightQuick=edgeShelf(desktop,'grand').locator('[data-family-launch="sapphire-saturn"]');
 await rightIcon.focus();await desktop.waitForFunction(()=>{const e=document.querySelector('[data-edge="middle-right"] [data-family-launch="sapphire-saturn"]'),s=getComputedStyle(e);return Number(s.opacity)>.9&&s.visibility==='visible'&&s.pointerEvents!=='none';});
 await rightQuick.focus();quickBefore=await desktopSnap();await desktop.keyboard.press('Enter');quickAfter=await desktopSnap();assert.equal(quickAfter.committedFamily,'Sapphire Saturn');assert.equal(quickAfter.phase,'fuse');assert.equal(quickAfter.bursts,quickBefore.bursts);await desktopAdvance(1);assert.equal((await desktopSnap()).launched,quickBefore.launched+1);await desktopAdvance(35);pass('desktop: focused Grand offers keyboard Launch through a normal flight');
 for(const [collection,id] of [['classics','gold-willow'],['grand','opal-supernova']]){
  const before=await desktopSnap(),hero=await desktop.locator('main').evaluate(e=>JSON.parse(e.dataset.heroRect));
  await mouseDrag(desktop,edgeShelf(desktop,collection).locator(`[data-family-icon="${id}"]`),hero.x+hero.width/2,hero.y+hero.height*.3);
  const after=await desktopSnap();assert.equal(after.launched,before.launched+1);assert.equal(after.bursts,before.bursts+1);assert.equal(after.selected,id);
  await desktopAdvance(35);assert.equal((await desktopSnap()).particles,0);
 }
 pass('desktop: dragging either edge collection into the sky bursts exactly once');
 await desktop.setViewportSize({width:1280,height:560});await inspectStage(desktop);await desktop.evaluate(()=>document.activeElement?.blur());await desktop.keyboard.press('3');
 assert.equal((await desktopSnap()).selected,'chrysanthemum');await inspectStage(desktop);await inspectEdgeShelves(desktop,44);await inspectEdgeSeparation(desktop);
 await desktop.screenshot({path:`${out}/layout-1280x560-long-caption.png`});await desktop.setViewportSize({width:1280,height:800});await inspectStage(desktop);await desktopContext.close();
 pass('1280x560: long selected caption keeps six edge groups separate and inside viewport');
 await p.evaluate(()=>{const m=document.querySelector('main');m.style.setProperty('--safe-top','30px');m.style.setProperty('--safe-bottom','24px');m.style.setProperty('--safe-left','4px');m.style.setProperty('--safe-right','4px')});await inspectStage(p);pass('safe insets preserve clear center');
 await p.evaluate(()=>document.querySelector('main').removeAttribute('style'));
 const before=await snap();await p.mouse.click(196,240);assert.equal((await snap()).launched,before.launched);assert.equal(await p.locator('main').getAttribute('data-overlay'),'none');pass('blank sky input is inert');
 await p.getByRole('button',{name:'Pause scene',exact:true}).click();await openPicker(p);await p.keyboard.press('Escape');assert.equal((await snap()).paused,true);await p.getByRole('button',{name:'Resume scene',exact:true}).click();pass('drawer close preserves manual pause');
 await p.getByRole('button',{name:'Open settings',exact:true}).click();const time=(await snap()).time;await p.waitForTimeout(250);assert.equal((await snap()).time,time);
 for(let i=0;i<22;i++){await p.keyboard.press('Tab');assert.ok(await p.evaluate(()=>document.activeElement?.closest('dialog')))}
 await p.keyboard.press('Escape');assert.equal(await p.getByRole('button',{name:'Open settings',exact:true}).evaluate(e=>e===document.activeElement),true);pass('panel pauses, traps focus, Escape restores invoker');
 await p.getByRole('button',{name:'Position firework'}).click();await p.getByRole('button',{name:'Right',exact:true}).click();await p.getByRole('button',{name:'Set position',exact:true}).click();assert.equal((await snap()).placement,.8);pass('position draft commits after overlay pause removal');
 await openPicker(p);await p.getByRole('button',{name:'Classics',exact:false}).click();let r=await p.getByRole('button',{name:'Gold Willow',exact:true}).boundingBox();
 await p.mouse.move(r.x+25,r.y+25);await p.mouse.down();await p.mouse.move(10,10,{steps:8});await p.mouse.up();assert.equal(await p.locator('main').getAttribute('data-overlay'),'picker');assert.equal((await snap()).launched,before.launched);pass('invalid drop cancels without launching');
 assert.equal(await p.getByRole('button',{name:'Burst selected style in center'}).isEnabled(),true,`Picker should be launch-ready: ${JSON.stringify(await snap())}`);
 r=await p.getByRole('button',{name:'Gold Willow',exact:true}).boundingBox();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+25,y:r.y+25}]});
 for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+25+(200-r.x-25)*i/8,y:r.y+25+(250-r.y-25)*i/8}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(50);const dropped=await snap();assert.equal(dropped.launched,before.launched+1);assert.equal(dropped.bursts,before.bursts+1);assert.equal(await p.locator('main').getAttribute('data-overlay'),'none');pass('touch drag produces exactly one immediate burst');
 await p.evaluate(()=>window.__firecrackersQA.freeze(true));await advance(35);assert.equal((await snap()).particles,0);
 await openPicker(p);await p.getByRole('button',{name:'Burst selected style in center'}).click();assert.equal((await snap()).launched,dropped.launched+1);await advance(35);pass('keyboard-accessible instant burst and complete cleanup');
 await p.getByRole('button',{name:'Launch selected firework',exact:true}).click();const committed=(await snap()).committedId;await chooseFamily(p,'Sapphire Saturn');assert.equal((await snap()).committedId,committed);assert.equal((await snap()).committedFamily,'Gold Willow');await p.setViewportSize({width:844,height:390});assert.equal((await snap()).committedId,committed);await advance(35);pass('drawer selection and rotation preserve committed rocket');
 const requests=[];p.on('request',r=>{if(r.url().includes('/audio/'))requests.push(r.url())});await enter('canvas');assert.equal(requests.length,0);await p.getByRole('button',{name:'Enable sound',exact:true}).click();await p.waitForFunction(()=>window.__firecrackersQA.snapshot().recordedSamples===3);assert.equal(requests.length,3);await p.getByRole('button',{name:'Launch selected firework',exact:true}).click();await p.waitForTimeout(200);await p.getByRole('button',{name:'Pause scene',exact:true}).click();assert.equal((await snap()).audioVoices,0);pass('recordings load after explicit sound activation; pause cancels voices');
 await p.getByRole('button',{name:'Mute sound',exact:true}).click();await enter('webgl');assert.match((await snap()).backend,/WebGL/);await p.waitForFunction(()=>document.querySelector('.scene-host').dataset.assets?.includes('smoke'));
 const phoneWaterlines=[];for(const [width,height] of [[320,480],[375,667],[393,851]]){await p.setViewportSize({width,height});await inspectStage(p);const waterline=(await snap()).waterline;assert.ok(waterline>=.68&&waterline<=.77,`Portrait waterline ${width}x${height}: ${waterline}`);phoneWaterlines.push(waterline);}
 await p.setViewportSize({width:1280,height:800});await inspectStage(p);const desktopWaterline=(await snap()).waterline;assert.ok(desktopWaterline>=.44&&desktopWaterline<=.55,`Desktop waterline ${desktopWaterline}`);
 pass('projected phone waterline sits below the burst and desktop shoreline stays stable',{phoneWaterlines,desktopWaterline});
 for(const quality of ['ultra','standard','low']){await p.getByRole('button',{name:'Open settings',exact:true}).click();await p.getByLabel('Graphics quality',{exact:true}).selectOption(quality);await p.getByRole('button',{name:'Close panel'}).click();await p.evaluate(()=>window.__firecrackersQA.freeze(true));await advance(35);await chooseFamily(p,'Sapphire Saturn');await p.getByRole('button',{name:'Launch selected firework',exact:true}).click();await advance(4.9);const s=await snap();assert.equal(s.quality,quality);if(quality!=='low')assert.ok(Math.max(s.reflectionWidth,s.reflectionHeight)<=(quality==='ultra'?512:256));await p.screenshot({path:`${out}/saturn-${quality}.png`});pass(`${quality}: authored assets and reflection budget`,{width:s.reflectionWidth,height:s.reflectionHeight});}
 const fallback=await browser.newContext({viewport:{width:393,height:851},serviceWorkers:'block'});await fallback.route('**/art/terrace-v004.glb',route=>route.abort());const fp=await fallback.newPage();fp.on('pageerror',e=>report.errors.push(e.message));await fp.goto(`${base}?backend=webgl&qa=1`);await fp.waitForSelector('main[data-ready="true"]',{timeout:90000});await fp.waitForFunction(()=>document.querySelector('.scene-host')?.dataset.assets);assert.ok(!(await fp.locator('.scene-host').getAttribute('data-assets')).includes('terrace'));await fp.getByRole('button',{name:'Launch selected firework',exact:true}).click();await fp.evaluate(()=>window.__firecrackersQA.advance(5));assert.ok((await fp.evaluate(()=>window.__firecrackersQA.snapshot())).bursts>0);await fallback.close();pass('missing v004 terrace retains procedural stage and launches');
 assert.deepEqual(report.errors,[]);
}catch(e){report.failed=e.stack;console.error(e);process.exitCode=1;await p.screenshot({path:`${out}/FAILED.png`}).catch(()=>{});}finally{await browser.close();await fs.writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}

