import test from 'node:test';
import assert from 'node:assert/strict';
import { signatureRecipe } from '../.test-build/engine/FlagshipEffects.js';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { FAMILIES, familyReservation, BUDGETS } from '../.test-build/engine/catalog.js';
import { resolveScreenLaunchProfile, signatureCompositionScale } from '../.test-build/engine/LaunchProfile.js';
const run=(s,t)=>{for(let i=0;i<Math.ceil(t*60);i++)s.advance(1/60);};
const ids=['imperial-crown','celestial-aurora','royal-phoenix'];
test('exactly three append-only signature IDs; existing ten order remains stable',()=>{
 assert.deepEqual(FAMILIES.map(f=>f.id),['gold-willow','multicolor-peony','chrysanthemum','silver-crossette-crackle','grand-finale','aurora-crown','ruby-dahlia','sapphire-saturn','phoenix-palm','opal-supernova',...ids]);
});
for(const [j,id] of ids.entries())for(const quality of ['low','standard','ultra']){
 test(`${id}/${quality}: deterministic geometry, all reserved nonrecursive breaks and bounded cleanup`,()=>{
  const f=j+10,r=signatureRecipe(f,quality,963),again=signatureRecipe(f,quality,963);assert.deepEqual(r,again);
  let reserve=r.stars.length;
  for(const c of r.carriers){reserve+=c.reserve;const child=signatureRecipe(f,'ultra',c.seed,.65,c.palette);assert.equal(child.carriers.length,0);assert.ok(child.stars.length<=c.reserve);}
  assert.ok(reserve<=familyReservation(f));assert.ok(r.carriers.some(c=>c.palette===1)&&r.carriers.some(c=>c.palette===2));
  for(const stage of [0,1,2])for(const star of signatureRecipe(f,quality,963,.65,stage).stars){
   for(const v of [...star.velocity,...star.color,star.life,star.size,star.trail,star.drag,star.gravity,star.delay,star.wave,star.curve])assert.ok(Number.isFinite(v));
   assert.ok(star.life>0&&star.size>0&&star.trail>0);
  }
  const s=new Simulation(963);s.quality=quality;s.select(id);let dropped=0;const add=s.heads.add.bind(s.heads);s.heads.add=(...a)=>{const n=add(...a);if(n<0)dropped++;return n;};
  assert.ok(s.ignite());assert.equal(s.ignite(),false);run(s,3.5);const flight=s.committed;
  s.setPaused(true);const frozen=JSON.stringify(s.snapshot());run(s,30);assert.equal(JSON.stringify(s.snapshot()),frozen);s.setPaused(false);run(s,9);
  assert.deepEqual(Array.from(s.signatureStages.slice(j*3,j*3+3)),[1,j===0?1:j===1?8:6,1]);assert.equal(dropped,0);
  assert.ok(s.heads.count<=3072&&s.trails.count<=BUDGETS[quality].trails);assert.ok(!flight||flight.launchProfile===undefined);
  run(s,30);for(const p of [s.heads,s.trails,s.smoke,s.embers])assert.equal(p.count,0);assert.equal(s.cues.length,0);
  s.reset();assert.deepEqual(Array.from(s.signatureStages),Array(9).fill(0));assert.equal(s.ready,true);
 });
 test(`${id}/${quality}: comfort policy preserves breaks and removes added curvature/modulation`,()=>{
  const s=new Simulation(12);s.quality=quality;s.reducedMotion=true;s.reducedFlashes=true;assert.ok(s.burstAt(id,0,95,.6));run(s,4.5);
  assert.deepEqual(Array.from(s.signatureStages.slice(j*3,j*3+3)),[1,j===0?1:j===1?8:6,1]);
  for(let i=0;i<s.heads.count;i++){assert.ok(Number.isFinite(s.heads.vx[i]+s.heads.y[i]+s.heads.r[i]));assert.equal(s.heads.gain[i],Math.fround(.63));}
 });
}
test('three silhouettes have different spatial topology and stage schedules',()=>{
 const crown=signatureRecipe(10,'ultra',17),aurora=signatureRecipe(11,'ultra',17),phoenix=signatureRecipe(12,'ultra',17);
 assert.ok(crown.stars.some(s=>s.velocity[1]<-25)&&crown.stars.some(s=>s.velocity[1]>25));
 assert.equal(new Set(aurora.stars.map(s=>s.role)).size,4);assert.ok(aurora.stars.some(s=>s.delay>.3));assert.ok(aurora.stars.some(s=>s.curve!==0));
 assert.ok(phoenix.stars.every(s=>s.velocity[1]>0));const left=phoenix.stars.filter(s=>s.velocity[0]<0),right=phoenix.stars.filter(s=>s.velocity[0]>0);assert.ok(left.length>right.length);assert.ok(Math.max(...left.map(s=>-s.velocity[0]))>Math.max(...right.map(s=>s.velocity[0])));
 assert.deepEqual([crown,aurora,phoenix].map(r=>r.carriers.at(-1).delay),[2.5,3.15,3.8]);
});
test('composition resolves finite upper-sky profiles and commits scale through rotation',()=>{
 for(const [w,h]of[[320,480],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]]){
  const layout={heroRect:{x:0,y:12,width:w,height:h-(w<680?188:76)-12},unobstructedScene:{x:0,y:12,width:w,height:h-(w<680?188:76)-12}};
  for(const id of ids){const p=resolveScreenLaunchProfile(layout,id,3,y=>130-y/3);assert.ok(p.effectScale>0&&p.effectScale<=1);assert.ok(p.apexMax>=p.apexMin);assert.ok(p.centerFraction>=.31&&p.centerFraction<=.37);}
  assert.ok(signatureCompositionScale(layout,3,20,50)<signatureCompositionScale(layout,3,w/2,h*.3));
 }
 const s=new Simulation(51);let profile={apex:100,apexMin:98,apexMax:102,centerFraction:.34,effectScale:.65};s.setLaunchProfileResolver(()=>profile);s.igniteFamily(ids[0]);const committed=s.committed.launchProfile;profile={...profile,apex:80,effectScale:.2};assert.equal(s.committed.launchProfile.effectScale,.65);assert.ok(Object.isFrozen(committed));run(s,20);assert.equal(s.signatureStages[0],1);
});
test('quality changes with unborn signature breaks preserve reservations',()=>{
 const s=new Simulation(54);s.quality='low';s.burstAt(ids[1],0,95);s.quality='ultra';run(s,4);assert.equal(s.signatureStages[4],8);assert.ok(s.heads.count<familyReservation(11));
});
for(const id of ids)test(`${id}: exact sky point and off-centre terrace admission`,()=>{
 const s=new Simulation(912);s.quality='ultra';assert.ok(s.burstAt(id,17,103,.6));
 for(let i=0;i<s.heads.count;i++){assert.equal(s.heads.x[i],17);assert.equal(s.heads.y[i],103);assert.equal(s.heads.z[i],0);}
 s.reset();for(const placement of [.2,.8]){const before=s.bursts;assert.ok(s.igniteFamily(id,placement));assert.equal(s.committed.padX,s.placementToX(placement));assert.equal(s.committed.stage,'fuse');assert.equal(s.bursts,before);run(s,40);}
});
