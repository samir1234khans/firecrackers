import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.UPSTREAM_URL||'http://127.0.0.1:4205/';
const out=process.env.UPSTREAM_OUT||'test-results/upstream-browser';await mkdir(out,{recursive:true});
const report={origin,at:new Date().toISOString(),cases:[],errors:[],failed:null};
let activePage;
const ci=process.env.UPSTREAM_CI==='1';
const browser=await chromium.launch(ci?{headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']}:{channel:'chrome',headless:true});
const sizes=[[320,480],[360,640],[390,844],[768,1024],[844,390],[1280,800],[1920,1080]];
const cases=[...sizes.map(viewport=>({backend:'canvas',viewport})),...['webgl','webgpu'].flatMap(backend=>[[390,844],[1280,800]].map(viewport=>({backend,viewport})))];
try{
for(const {backend,viewport:[width,height]} of cases.filter(c=>(!process.env.UPSTREAM_BACKENDS||process.env.UPSTREAM_BACKENDS.split(',').includes(c.backend))&&(!process.env.UPSTREAM_FILTER||`${c.backend}-${c.viewport[0]}`.includes(process.env.UPSTREAM_FILTER)))){
 const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'});activePage=page;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('firecrackers.preferences.v1',JSON.stringify({version:4,onboarded:true,quality:'standard',sound:false,reducedFlashes:true})));
 await page.goto(`${origin}?qa=1&backend=${backend}&seed=42`);await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});
 const snap=()=>page.evaluate(()=>window.__firecrackersQA.snapshot());
 const s=await snap();assert.equal(s.backend,{canvas:'Canvas 2D · compatibility',webgl:'WebGL 2',webgpu:'WebGPU'}[backend]);assert.equal(s.riverSeatedFigures,33);assert.equal(await page.locator('[data-family-icon]').count(),13);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const targets=await page.locator('[data-family-icon]').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return{w:r.width,h:r.height,x:r.x,y:r.y,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}));
 for(const t of targets){assert.ok(t.w>=44&&t.h>=44,`target size ${width}: ${JSON.stringify(t)}`);if(height>=600)assert.ok(t.hit,`covered target ${width}: ${JSON.stringify(t)}`);}
 await page.getByRole('button',{name:/Explore the waterfront/}).click();
 await page.getByRole('button',{name:'Watch boats',exact:true}).click();
 for(const id of [0,1,5,6]){await page.getByLabel('Choose a family',{exact:true}).selectOption(String(id));assert.equal((await snap()).seaFocus,id);}
 await page.getByRole('button',{name:'Return to sky',exact:true}).click();assert.equal((await snap()).seaFocus,null);
 await page.getByRole('button',{name:'Far shore',exact:true}).click();
 const launched=(await snap()).launched;await page.locator('[data-family-icon="gold-willow"]').click();await page.evaluate(()=>window.__firecrackersQA.advance(1));assert.equal((await snap()).launched,launched+1,'far admission');
 await page.evaluate(()=>{window.__firecrackersQA.freeze(true);window.__firecrackersQA.advance(40);});
 await page.getByRole('button',{name:'Near launch',exact:true}).click();
 await page.getByRole('button',{name:'Lively Celebration',exact:true}).click();
 await page.evaluate(()=>window.__firecrackersQA.advance(20));assert.ok((await snap()).lively.rounds>=1);
 await page.getByRole('button',{name:'Hide controls',exact:true}).click();assert.equal(await page.locator('main').getAttribute('data-immersive'),'true');
 assert.equal(await page.locator('.world-tools').getAttribute('inert'),'');await page.getByRole('button',{name:'Show controls',exact:true}).click();
 await page.getByRole('button',{name:'Lively Celebration',exact:true}).click();
 await page.evaluate(()=>window.__firecrackersQA.advance(70));
 if(width===1280){
  await page.getByRole('button',{name:/Explore the waterfront/}).click();
  await page.getByRole('button',{name:'Open night studio',exact:true}).click();
  await page.getByText('Sky writing & draw with light',{exact:true}).click();
  await page.getByLabel('Sky lettering',{exact:true}).fill('HELLO SKY');
  await page.getByRole('button',{name:'Preview lettering',exact:true}).click();
  await page.evaluate(()=>window.__firecrackersQA.advance(1.4));
  const art=await snap();assert.notEqual(art.personal.status,'blocked');assert.ok(art.trailCount>0,'native lettering trails');
  await page.screenshot({path:`${out}/${backend}-lettering.png`});
  await page.evaluate(()=>window.__firecrackersQA.advance(12));assert.equal((await snap()).trailCount,0);
 }
 await page.screenshot({path:`${out}/${backend}-${width}x${height}.png`});
 assert.deepEqual(errors,[]);report.cases.push({backend,width,height,pass:true,people:s.riverSeatedFigures,triangles:s.seaFleetTriangles,targets:targets.length,errors});
 console.log('PASS',backend,width,height);await page.close();
}
const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});await page.goto(`${origin}?intro=1&backend=canvas`);await page.getByRole('heading',{name:'Firecrackers',exact:true}).waitFor();assert.equal(await page.locator('canvas').count(),0);await page.getByRole('button',{name:'Skip to play',exact:true}).click();await page.waitForSelector('main[data-ready="true"][data-presented="true"]',{timeout:90000});report.cases.push({name:'optional entrance is GPU-free; Skip starts playable Canvas',pass:true});
await page.close();
}catch(error){report.failed=error.stack;await activePage?.screenshot({path:`${out}/failure.png`});await writeFile(`${out}/failure-dom.txt`,await activePage?.locator('body').innerText()||'');throw error;}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
