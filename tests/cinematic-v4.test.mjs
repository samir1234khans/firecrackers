import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CinematicResponse, CINEMA_BASE_EXPOSURE, CINEMA_MIN_EXPOSURE, CINEMA_MAX_CAMERA_PIXELS } from '../.test-build/engine/CinematicResponse.js';
import { altitudeWind, shellAxis, starDrag, starColor, aerialTransmission } from '../.test-build/engine/StarAppearance.js';
import { SmokeOcclusion, SMOKE_OCCLUDER_CAPACITY } from '../.test-build/engine/SmokeOcclusion.js';
import { Pool } from '../.test-build/engine/Pool.js';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { CONFIG_VERSION } from '../.test-build/engine/catalog.js';
import { inspectRecipe, parseRecipe, adaptRecipeCopy, newRecipe } from '../.test-build/experience/ShowRecipe.js';
import { readNights, writeNights, LIBRARY_KEY } from '../.test-build/experience/NightLibrary.js';
import { fingerprintEntries } from '../scripts/generate-release.mjs';
const light = {x:0,y:100,z:0,r:1,g:.2,b:.1,age:.4,strength:1};
const step=(s,t)=>{for(let f=0;f<Math.round(t*60);f++)s.advance(1/60);};

test('scene exposure is bounded, smooth, optional and never brighter than baseline',()=>{
 const c=new CinematicResponse();let last=c.exposure;
 for(let i=0;i<600;i++){
  c.step(1/60,i/60,Array(12).fill(light),true,false,false);
  assert.ok(c.exposure>=CINEMA_MIN_EXPOSURE&&c.exposure<=CINEMA_BASE_EXPOSURE);
  assert.ok(Math.abs(c.exposure-last)<.006);last=c.exposure;
 }
 assert.ok(c.exposure<.87);
 for(let i=0;i<1200;i++)c.step(1/60,10+i/60,[],true,false,false);
 assert.ok(Math.abs(c.exposure-CINEMA_BASE_EXPOSURE)<1e-5);
 c.step(1/60,31,[light],false,false,false);assert.equal(c.exposure,CINEMA_BASE_EXPOSURE);
 const before=c.snapshot();for(const dt of [0,-1,NaN,Infinity])c.step(dt,31,[light],true,true,false);assert.deepEqual(c.snapshot(),before);
});
test('reduced-flash exposure variation is smaller for the same light sources',()=>{
 const a=new CinematicResponse(),b=new CinematicResponse();
 for(let i=0;i<200;i++){a.step(1/60,i/60,[light],true,false,false);b.step(1/60,i/60,[light],true,false,true);}
 assert.ok(b.exposure>a.exposure);
});
test('large-shell camera responses are bounded, expire, and respect motion disable',()=>{
 const c=new CinematicResponse();c.report(1,1,0,0);assert.equal(c.snapshot().impulseCount,0);
 for(let i=0;i<100;i++)c.report(4,1,10,0);assert.equal(c.snapshot().impulseCount,6);
 let moved=false;
 for(let i=0;i<240;i++){
  c.step(1/60,i/60,[],true,true,false);
  assert.ok(Math.abs(c.cameraX)<=CINEMA_MAX_CAMERA_PIXELS&&Math.abs(c.cameraY)<=CINEMA_MAX_CAMERA_PIXELS);
  moved||=Math.abs(c.cameraX)+Math.abs(c.cameraY)>.001;
 }
 assert.ok(moved);assert.equal(c.snapshot().impulseCount,0);
 c.report(12,1,0,5);c.step(.01,5.2,[],true,false,false);assert.equal(c.cameraX+c.cameraY,0);
 c.reset();assert.deepEqual(c.snapshot(),new CinematicResponse().snapshot());
});
test('fixed-clock response freezes on pause and identical seeded runs match',()=>{
 const a=new Simulation(731),b=new Simulation(731);a.cameraMotion=b.cameraMotion=true;
 a.burstAt('grand-finale',0,100);b.burstAt('grand-finale',0,100);step(a,.8);step(b,.8);
 assert.deepEqual(a.cinema.snapshot(),b.cinema.snapshot());
 a.setPaused(true);const before=a.cinema.snapshot();step(a,20);assert.deepEqual(a.cinema.snapshot(),before);
 a.reset();assert.equal(a.cinema.exposure,CINEMA_BASE_EXPOSURE);
});
test('physics variation is deterministic, bounded, and wind is shared by altitude',()=>{
 for(let seed=0;seed<100;seed++)for(let axis=0;axis<3;axis++){
  const s=shellAxis(seed,axis);assert.ok(s>=.958&&s<=1);assert.equal(s,shellAxis(seed,axis));
  const d=starDrag(.5,seed,axis);assert.ok(d>=.48&&d<=.52);
 }
 assert.notEqual(shellAxis(731,0),shellAxis(732,0));
 assert.ok(altitudeWind(2,176)>altitudeWind(2,16));assert.equal(altitudeWind(0,100),0);
 assert.equal(altitudeWind(2,-100),altitudeWind(2,16));
 assert.ok(aerialTransmission(1000)<aerialTransmission(200));assert.equal(aerialTransmission(0),1);
});
test('metal tails warm, but colored emitters preserve their authored color',()=>{
 const a=new Float32Array(3),b=new Float32Array(3);
 starColor(0,.5,5,1,.7,.2,a);starColor(0,4.9,5,1,.7,.2,b);assert.ok(b[1]<a[1]&&b[2]<a[2]);
 for(const [r,g,blue]of [[.1,.2,1],[.1,1,.2],[1,.1,.05]]){
  starColor(1,4.9,5,r,g,blue,b);assert.ok(Math.abs(b[0]-r)<1e-6&&Math.abs(b[1]-g)<1e-6&&Math.abs(b[2]-blue)<1e-6);
 }
});
test('smoke attenuation depends on intervening depth, not just screen overlap',()=>{
 const p=new Pool(32);p.add(0,0,0,0,0,0,10,.5,.5,.5,15,.4,.5,0,0,2);p.age[0]=2;
 const field=new SmokeOcclusion();field.update(p,0,0,240);
 assert.equal(field.count,1);assert.ok(field.transmission(0,0,-20)<1);assert.equal(field.transmission(0,0,20),1);
 assert.equal(field.transmission(80,0,-20),1);
 for(let i=1;i<32;i++){p.add(0,0,i*.1,0,0,0,10,.5,.5,.5,15,.4,.5,0,0,2);p.age[i]=2;}
 field.update(p,0,0,240);assert.equal(field.count,SMOKE_OCCLUDER_CAPACITY);assert.ok(field.transmission(0,0,-20)>=.58);
 p.count=0;field.update(p,0,0,240);assert.equal(field.transmission(0,0,-20),1);
});
test('version change preserves historical recipes without silently making them playable',()=>{
 const original={...newRecipe('Previous night'),engine:'2026-10-03.2'};
 const data=new Map(),store={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const bytes=JSON.stringify([{id:'old',recipe:original}]);store.setItem(LIBRARY_KEY,bytes);
 const loaded=readNights(store);assert.equal(loaded.warning,'');assert.deepEqual(loaded.nights[0].recipe,original);assert.equal(store.getItem(LIBRARY_KEY),bytes);
 assert.throws(()=>parseRecipe(original),/will not silently change/);
 assert.deepEqual(inspectRecipe(JSON.stringify(original)),original);
 const copy=adaptRecipeCopy(original);assert.equal(copy.engine,CONFIG_VERSION);assert.notEqual(copy.name,original.name);assert.equal(original.engine,'2026-10-03.2');
 writeNights(store,[...loaded.nights,{id:'copy',recipe:copy}]);assert.deepEqual(readNights(store).nights[0].recipe,original);
 writeNights(store,[loaded.nights[0]]);assert.deepEqual(readNights(store).nights[0].recipe,original);
 assert.throws(()=>inspectRecipe({...original,engine:'<script>'}));
});
test('release fingerprint discovers new feature directories and includes static/build inputs',async()=>{
 const root=await mkdtemp(join(tmpdir(),'firecrackers-fingerprint-'));
 try{
  await mkdir(join(root,'src/experience'),{recursive:true});await mkdir(join(root,'public/music'),{recursive:true});
  await writeFile(join(root,'src/experience/NewFeature.ts'),'export const active = true;');
  await writeFile(join(root,'public/music/theme.ogg'),new Uint8Array([1,2,3]));
  await writeFile(join(root,'public/release.json'),'ignored receipt');await writeFile(join(root,'vite.config.ts'),'export default {};');
  const first=await fingerprintEntries(root);assert.deepEqual(first.map(m=>m.path),['public/music/theme.ogg','src/experience/NewFeature.ts','vite.config.ts']);
  await writeFile(join(root,'src/experience/Another.ts'),'export const value=1;');const second=await fingerprintEntries(root);assert.equal(second.length,4);
  await writeFile(join(root,'src/experience/NewFeature.ts'),'export const active = false;');const third=await fingerprintEntries(root);
  assert.notEqual(first.find(m=>m.path.includes('NewFeature')).sha256,third.find(m=>m.path.includes('NewFeature')).sha256);
  await writeFile(join(root,'public/release.json'),'a different receipt');assert.deepEqual(await fingerprintEntries(root),third);
 }finally{await rm(root,{recursive:true,force:true});}
});
