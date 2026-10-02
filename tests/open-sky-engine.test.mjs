import test from 'node:test';
import assert from 'node:assert/strict';
import { FAMILIES } from '../.test-build/engine/catalog.js';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { stageFraming } from '../.test-build/engine/StageLayout.js';
import { resolvePropComposition, resolveLaunchBounds, PROP_CONTACT_Y, PROP_FOOT_Y } from '../.test-build/engine/LaunchComposition.js';
import { resolveScreenLaunchProfile } from '../.test-build/engine/LaunchProfile.js';
import { fusePointAt } from '../.test-build/engine/FusePath.js';
import { rocketPoint, MOTOR_LOCAL_Y, SHELL_LOCAL_Y } from '../.test-build/engine/LaunchGeometry.js';

const sizes = [[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]];
const near = (a,b,message) => assert.ok(Math.abs(a-b)<1e-8, `${message}: ${a} vs ${b}`);
const run = (sim,seconds) => { for(let i=0;i<Math.ceil(seconds*60);i++)sim.advance(1/60);sim.drainEvents(); };
function composition(width,height,id) {
  const scene={x:0,y:0,width,height:height-76};
  const columns=height<=600?3:width>=680&&height-92>=624?1:2;
  const layout={viewport:{x:0,y:0,width,height},heroRect:scene,unobstructedScene:scene,
    safe:{top:0,right:0,bottom:0,left:0},controls:{
      collection:{x:8,y:height-84-Math.ceil(FAMILIES.length/columns)*48,width:columns*48,height:Math.ceil(FAMILIES.length/columns)*48},
      rail:{x:width-56,y:height-240,width:48,height:148}}};
  const {scale,baseline}=stageFraming(layout);
  const project=(x,y)=>({x:width/2+x*scale,y:baseline-(y-16)*scale});
  const worldY=y=>16+(baseline-y)/scale;
  const contact=project(0,PROP_CONTACT_Y);
  const prop=resolvePropComposition(layout,id,contact.y,worldY);
  const bounds=resolveLaunchBounds(layout,prop,project,x=>(x-width/2)/scale);
  return {layout,prop,bounds,project,worldY,scale};
}
for(const [width,height] of sizes)test(`all thirteen grounded prop envelopes and usable terrace ${width}x${height}`,()=>{
  for(const family of FAMILIES){
    const {prop,bounds,project,scale,layout}=composition(width,height,family.id);
    const foot=prop.originY+prop.localFoot*prop.modelScale[1];
    near(foot,PROP_CONTACT_Y,`${family.id}: shared physical contact`);
    assert.equal(prop.localFoot,PROP_FOOT_Y);
    const top=prop.originY+prop.localTop*prop.modelScale[1];
    near(project(0,foot).y-project(0,top).y,prop.standingHeight,`${family.id}: projected height`);
    const allowed=height<520?[49,56]:width<680?[61,96]:width<1024?[86,119]:[86,140];
    assert.ok(prop.standingHeight>=allowed[0]&&prop.standingHeight<=allowed[1],`${family.id}: responsive ${prop.standingHeight}px`);
    assert.ok(project(0,foot).y<height-76,'ground contact stays above footer');
    assert.ok(Object.isFrozen(prop)&&Object.isFrozen(prop.modelScale),'composition is immutable');
    assert.ok(prop.padRadius>=1.4&&prop.padRadius<=5,'bounded shared pad footprint');
    for(let i=0;i<=16;i++){
      const p=fusePointAt(i/16);
      assert.ok(p[1]>=prop.localFoot&&p[1]<=prop.localTop,'fuse within standing envelope');
      assert.ok(Math.abs(p[0])<=prop.localRadius,'fuse horizontally within prop footprint');
    }
    const rocket={stage:'fuse',x:0,y:prop.originY,z:0,vx:0,vy:0,vz:0,launchProfile:{prop}};
    near(rocketPoint(rocket,MOTOR_LOCAL_Y)[1],prop.originY+prop.motorOffset,'shared motor attachment');
    near(rocketPoint(rocket,SHELL_LOCAL_Y)[1],prop.originY+prop.shellOffset,'shared shell attachment');
    assert.ok(prop.motorOffset<prop.shellOffset&&prop.shellOffset<prop.localTop*prop.modelScale[1]);
    assert.ok(bounds.worldMin<bounds.worldMax,'nonempty full usable terrace');
    near(project(bounds.worldMin,PROP_CONTACT_Y).x,bounds.screenMin,'left inverse projection');
    near(project(bounds.worldMax,PROP_CONTACT_Y).x,bounds.screenMax,'right inverse projection');
    const margin=Math.max(prop.localRadius*prop.modelScale[0],prop.padRadius)*scale;
    for(const x of [bounds.worldMin,bounds.worldMax]){
      const p=project(x,PROP_CONTACT_Y);
      assert.ok(p.x-margin>=layout.safe.left&&p.x+margin<=width-layout.safe.right,'complete footprint within safe viewport');
      for(const rect of Object.values(layout.controls)) {
        const bottom=p.y+8,topY=p.y-prop.standingHeight-5;
        assert.ok(rect.y>=bottom||rect.y+rect.height<=topY||p.x+margin<=rect.x||p.x-margin>=rect.x+rect.width,'standing footprint avoids real collection and rail');
      }
    }
  }
});

test('full-range position changes and resize leave committed prop, pad and flight immutable',()=>{
 const sim=new Simulation(447);sim.quality='ultra';let width=393,height=851;
 sim.setLaunchProfileResolver((id,p)=>{const c=composition(width,height,id),padX=c.bounds.worldMin+p*(c.bounds.worldMax-c.bounds.worldMin);return {...resolveScreenLaunchProfile(c.layout,id,c.scale,c.worldY,c.project(padX,120).x,c.prop),padX,ground:c.prop.originY,normalizedPlacement:p};});
 for(const placement of [0,1]){
  sim.setPlacement(placement);assert.equal(sim.igniteFamily('sapphire-saturn'),true);
  const committed=sim.committed,before=structuredClone(committed);
  assert.equal(committed.normalizedPlacement,placement);assert.equal(committed.y,committed.launchProfile.prop.originY);
  sim.setPlacement(1-placement);width=width===393?844:393;height=height===851?390:851;sim.setViewport(90,16);
  assert.deepEqual(committed,before,'future draft and viewport never mutate committed geometry');
  assert.ok(Object.isFrozen(committed.launchProfile)&&Object.isFrozen(committed.launchProfile.prop));
  run(sim,40);
 }
});
const randomSim=seed=>{const sim=new Simulation(seed);sim.quality='ultra';sim.setPlacementMode('random');return sim;};
const admit=sim=>{assert.equal(sim.igniteFamily('gold-willow'),true);const r=sim.committed;return {position:r.normalizedPlacement,seed:r.seed,top:r.top,fuse:r.fuse,ascent:r.ascent};};
test('placement randomness is deterministic and independent of launch effect randomness',()=>{
 const a=randomSim(862),b=randomSim(862),fixed=new Simulation(862);fixed.quality='ultra';const positions=[];
 for(let i=0;i<5;i++){
  const ar=admit(a),br=admit(b),fr=admit(fixed);assert.deepEqual(ar,br);positions.push(ar.position);
  const {position,...launch}=ar;const {position:unused,...fixedLaunch}=fr;assert.deepEqual(launch,fixedLaunch,'position policy does not perturb effect/flight random stream');
  for(const s of [a,b,fixed])run(s,40);
 }
 assert.ok(new Set(positions).size>1);assert.ok(positions.every(p=>p>=0&&p<=1));
});
test('paused, capacity, invalid and duplicate rejections consume no next random position',()=>{
 const a=randomSim(914),b=randomSim(914);
 a.setPaused(true);assert.equal(a.igniteFamily('gold-willow'),false);a.setPaused(false);
 a.heads.count=a.heads.capacity;assert.equal(a.igniteFamily('gold-willow'),false);a.heads.clear();
 assert.equal(a.igniteFamily('gold-willow',NaN),false);
 assert.deepEqual(admit(a),admit(b));
 assert.equal(a.igniteFamily('gold-willow'),false);assert.equal(a.igniteFamily('ruby-dahlia'),false);
 for(const s of [a,b])run(s,40);assert.deepEqual(admit(a),admit(b));
});
test('sky drops and explicit terrace drops never consume random placement',()=>{
 const sky=randomSim(221),terrace=randomSim(221),reference=randomSim(221);
 assert.equal(sky.burstAt('gold-willow',12,87),true);const burst=sky.events.find(e=>e.type==='burst');near(burst.x,12,'sky x');near(burst.y,87,'sky y');run(sky,40);
 assert.equal(terrace.igniteFamily('gold-willow',.91),true);near(terrace.committed.normalizedPlacement,.91,'explicit terrace overrides policy');assert.equal(terrace.placementMode,'random');run(terrace,40);
 const expected=admit(reference).position;near(admit(sky).position,expected,'sky leaves next random draw');near(admit(terrace).position,expected,'terrace leaves next random draw');
});
test('Calm retains saved placement while cinematic modes preserve it for manual takeover',()=>{
 for(const mode of ['calm','festival','finale','always']){
  const fixed=new Simulation(551),a=randomSim(551),b=randomSim(551);fixed.quality='ultra';fixed.setPlacement(.93);
  for(const sim of [fixed,a,b]){sim.startShow(mode);for(let t=0;t<300&&!sim.committed;t++)sim.advance(1/60);assert.ok(sim.committed);}
  if(mode==='calm')near(fixed.committed.normalizedPlacement,.93,'Calm: fixed draft');
  else {assert.ok([.2,.5,.8].includes(fixed.committed.normalizedPlacement));near(fixed.placement,.93,'saved Manual placement');}
  near(a.committed.normalizedPlacement,b.committed.normalizedPlacement,`${mode}: deterministic placement`);
  assert.equal(a.committed.family,fixed.committed.family,'placement never changes family choice');
 }
});
test('reset restarts the seeded random placement sequence and restores fixed center',()=>{
 const sim=randomSim(625),first=admit(sim).position;run(sim,40);admit(sim);sim.reset();assert.equal(sim.placement,.5);assert.equal(sim.placementMode,'fixed');sim.setPlacementMode('random');near(admit(sim).position,first,'reset placement stream');
});
