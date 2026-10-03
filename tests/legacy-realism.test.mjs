import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { FAMILIES, BUDGETS } from '../.test-build/engine/catalog.js';
import { LEGACY_FLIGHT, poweredFraction, recedingShellSize, particleDepthBucket, LEGACY_ENVELOPES } from '../.test-build/engine/LegacyRealism.js';
import { rocketPoint, SHELL_LOCAL_Y } from '../.test-build/engine/LaunchGeometry.js';
import { stageFraming, waterfrontHorizon, stageCameraFrame } from '../.test-build/engine/StageLayout.js';
import { resolveLegacyLaunchProfile, legacyCompositionScale } from '../.test-build/engine/LaunchProfile.js';
import { grandRecipe } from '../.test-build/engine/GrandEffects.js';
const run=(sim,t)=>{for(let i=0;i<Math.ceil(t*60);i++)sim.advance(1/60);};
for(const [index,family]of FAMILIES.slice(0,10).entries())for(const quality of ['low','standard','ultra'])test(`${family.id}/${quality}: continuous recession, reserved children and complete cleanup`,()=>{
 const sim=new Simulation(731);sim.quality=quality;sim.reducedFlashes=true;
 assert.ok(sim.igniteFamily(family.id));const r=sim.committed;
 assert.equal(r.thrust/r.ascent,poweredFraction(index));
 assert.ok(r.ascent-r.thrust>.5);const admitted=structuredClone(r);
 sim.setViewport(80,16);sim.select('royal-phoenix');assert.deepEqual(r,admitted);
 run(sim,r.fuse+.02);let previous={...r};let lastShell;
 while(r.stage==='ascent'){
  sim.advance(1/60);assert.ok(r.z<=previous.z+1e-5);assert.ok(Math.abs(r.z-previous.z)<3);assert.ok(Math.abs(r.y-previous.y)<5);
  if(r.stage==='ascent')lastShell=rocketPoint(r,SHELL_LOCAL_Y);previous={...r};
 }
 const report=sim.events.find(e=>e.type==='burst');assert.ok(report);
 assert.ok(Math.abs(report.z-LEGACY_FLIGHT[index].depth)<1e-4);assert.ok(Math.hypot(report.x-lastShell[0],report.y-lastShell[1],report.z-lastShell[2])<1);
 sim.setPaused(true);const frozen=sim.snapshot();run(sim,20);assert.deepEqual(sim.snapshot(),frozen);sim.setPaused(false);
 let dropped=0;const add=sim.heads.add.bind(sim.heads);sim.heads.add=(...args)=>{const n=add(...args);if(n<0)dropped++;return n;};
 for(let i=0;i<2400;i++){sim.advance(1/60);const s=sim.snapshot();assert.ok(s.headCount+s.futureHeads<=3072);assert.ok(s.trailCount<=BUDGETS[quality].trails);assert.ok(s.smoke<=BUDGETS[quality].smoke);}
 assert.equal(dropped,0);assert.equal(sim.heads.count+sim.trails.count+sim.smoke.count+sim.embers.count+sim.cues.length+sim.snapshot().futureHeads,0);
});
test('receding legacy shell contracts monotonically and bands retain far and near separation',()=>{
 for(let f=0;f<10;f++){let previous=3;for(let j=0;j<=100;j++){const size=recedingShellSize(f,j/100);assert.ok(size<=previous);assert.ok(size>=.7);previous=size;}}
 assert.ok(particleDepthBucket(-150)<particleDepthBucket(-60));assert.ok(particleDepthBucket(-60)<particleDepthBucket(50));
 assert.equal(particleDepthBucket(-Infinity),0);assert.equal(particleDepthBucket(Infinity),5);
});
test('grand flower/ring/crown roles and seven nonrecursive opal breaks remain distinct',()=>{
 for(const quality of ['low','standard','ultra']){
  const crown=grandRecipe(5,quality,42);assert.ok(crown.stars.some(s=>s.role===1));
  const flower=grandRecipe(6,quality,42);assert.ok(new Set(flower.stars.filter(s=>s.role===2).map(s=>Math.round(s.velocity[2]))).size>8);
  const saturn=grandRecipe(7,quality,42);assert.ok(saturn.stars.some(s=>s.role===2&&s.color[0]===1));
  const opal=grandRecipe(9,quality,42,.5);assert.equal(opal.carriers.length,7);
  for(const c of opal.carriers)assert.equal(grandRecipe(9,quality,c.seed,.36,c.palette).carriers.length,0);
 }
});
for(const [width,height]of [[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]])test(`all ten projected complete envelopes and point placement ${width}x${height}`,()=>{
 const layout={viewport:{width,height},heroRect:{x:0,y:0,width,height:height-76}};layout.unobstructedScene=layout.heroRect;
 const frame=stageCameraFrame(layout,16),camera=new PerspectiveCamera(42,width/height,1,1500);
 camera.position.set(0,frame.centerY+Math.sin(frame.pitch)*frame.distance,Math.cos(frame.pitch)*frame.distance);camera.lookAt(0,frame.centerY,0);camera.updateMatrixWorld();
 const project=(x,y,z)=>{const p=new Vector3(x,y,z).project(camera);return {x:(p.x+1)*width/2,y:(1-p.y)*height/2};};
 const worldAt=(x,y,z)=>{const p=new Vector3(x/width*2-1,1-y/height*2,.5).unproject(camera),dir=p.sub(camera.position);const t=(z-camera.position.z)/dir.z;return {x:camera.position.x+dir.x*t,y:camera.position.y+dir.y*t};};
 const prop={shellOffset:10,originY:16,modelScale:[3,10/3.25,3]};const shore=project(0,4.65,width/height<.72?-180:-1000).y;
 for(const family of FAMILIES.slice(0,10)){
  const a=resolveLegacyLaunchProfile(layout,family.id,worldAt,project,prop,shore,width*.05),b=resolveLegacyLaunchProfile(layout,family.id,worldAt,project,prop,shore,width*.95);
  assert.equal(a.effectScale,b.effectScale);assert.ok(a.effectScale>=.025&&a.effectScale<=1);assert.ok(a.burstDepth<0);assert.ok(a.apex>26);
  for(const position of [a,b]){
   const p=project(position.aimX,position.apex+10,position.burstDepth);assert.ok(p.x>=10&&p.x<=width-10);assert.ok(p.y>10&&p.y<shore);
   const e=LEGACY_ENVELOPES[FAMILIES.indexOf(family)];
   for(const dx of [-e[0],e[0]])for(const dy of [-e[2],e[1]])for(const dz of [-e[3],e[3]]){
    const q=project(position.aimX+dx*position.effectScale,position.apex+10+dy*position.effectScale,position.burstDepth+dz*position.effectScale);
    assert.ok(q.x>=11.9&&q.x<=width-11.9&&q.y>=11.9&&q.y<=height-87.9,JSON.stringify({family:family.id,width,height,q,position}));
   }
   const sim=new Simulation(731);sim.quality='ultra';sim.reducedFlashes=true;sim.setLaunchProfileResolver(()=>position);sim.igniteFamily(family.id);
   for(let i=0;i<180;i++){
    run(sim,.12);
    for(let j=0;j<sim.heads.count;j++){
     const h=sim.heads;if(h.age[j]<0||h.gain[j]<.02)continue;const q=project(h.x[j],h.y[j],h.z[j]);
     assert.ok(q.x>=1&&q.x<=width-1&&q.y>=1&&q.y<=height-77,JSON.stringify({family:family.id,width,height,time:sim.time,q,position,world:[h.x[j],h.y[j],h.z[j]]}));
    }
   }
  }
  const drop=worldAt(width*.55,shore*.48,a.burstDepth);const dropScale=legacyCompositionScale(layout,family.id,project,[drop.x,drop.y,a.burstDepth],shore);
  assert.ok(dropScale>0&&dropScale<=1);

 }
});
test('same seed repeats all legacy launch and burst states exactly',()=>{
 for(const f of FAMILIES.slice(0,10)){const a=new Simulation(92),b=new Simulation(92);for(const s of [a,b]){s.quality='ultra';s.igniteFamily(f.id);run(s,7);}assert.deepEqual(a.snapshot(),b.snapshot());assert.deepEqual(a.heads.x,b.heads.x);assert.deepEqual(a.heads.z,b.heads.z);}
});


for(const [width,height]of [[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]])test(`Canvas complete depth projection and point fitting ${width}x${height}`,()=>{
 const layout={viewport:{width,height},heroRect:{x:0,y:0,width,height:height-76}};layout.unobstructedScene=layout.heroRect;
 const {scale,baseline}=stageFraming(layout),shore=height*waterfrontHorizon(layout,true);
 const project=(x,y,z)=>{const q=240/Math.max(140,240-z);return{x:width/2+x*scale*q,y:baseline-(y-16)*scale*q}};
 const worldAt=(x,y,z)=>{const q=240/Math.max(140,240-z);return{x:(x-width/2)/(scale*q),y:16+(baseline-y)/(scale*q)}};
 for(const family of FAMILIES.slice(0,10))for(const requestedX of[width*.05,width*.95]){
  const position=resolveLegacyLaunchProfile(layout,family.id,worldAt,project,{originY:16,shellOffset:10,modelScale:[3,10/3.25,3]},shore,requestedX);
  const sim=new Simulation(731);sim.quality='ultra';sim.setLaunchProfileResolver(()=>position);sim.igniteFamily(family.id);
  for(let frame=0;frame<180;frame++){run(sim,.12);const h=sim.heads;for(let j=0;j<h.count;j++){if(h.age[j]<0||h.gain[j]<.02)continue;const q=project(h.x[j],h.y[j],h.z[j]);assert.ok(q.x>=1&&q.x<=width-1&&q.y>=1&&q.y<=height-77,JSON.stringify({family:family.id,width,height,time:sim.time,q,position}));}}
 }
});
