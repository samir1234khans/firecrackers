import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import { SEA_PASSENGERS, SEA_PERFORMANCES } from '../.test-build/graphics/SeaPassengers.js';
import { SEA_FLEET, sampleSeaRoute, createSeaPose } from '../.test-build/graphics/SeaFleetState.js';
import { SeaAudienceSession } from '../.test-build/graphics/SeaAudienceSession.js';
import { SeaBurstFeed } from '../.test-build/graphics/SeaBurstFeed.js';
import { boatToWorld, worldToBoat } from '../.test-build/graphics/SeaSpace.js';
import { SeaBoatModels } from '../.test-build/graphics/SeaBoatModels.js';
import { SeaPassengerRig, solveSeaArm } from '../.test-build/graphics/SeaPassengerRig.js';
import { WATER_Y } from '../.test-build/graphics/WaterWaves.js';
import { readFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { restoreSkyView } from '../.test-build/engine/SceneSession.js';
const frame={phase:0,farZ:-180,nearZ:-14.75,waveCount:4,motionAllowed:true,gains:[1.5,1.35,1.1,1]};
const event=(id,time=0,family=1,x=0)=>Object.freeze({id,time,type:'burst',family,x,y:100,z:-80,strength:1});

test('actual compact Blender hull export has five distinct roots and borrowed resource ownership',async()=>{
 const bytes=await readFile('public/scene/sea-boat-hulls-v002.glb');assert.ok(bytes.length<100000);
 const {scene,animations}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 assert.equal(scene.children.length,5);assert.equal(animations.length,0);let meshes=0;
 scene.traverse(object=>{assert.ok(!object.isLight&&!object.isCamera);if(object.isMesh){meshes++;const pos=object.geometry.getAttribute('position');assert.ok(Array.from(pos.array).every(Number.isFinite));}});assert.equal(meshes,6);
 const factory=new SeaBoatModels(),boats=SEA_FLEET.map((_,i)=>factory.build(i));assert.equal(factory.adoptOriginalHulls(scene,boats),5);
 let disposed=0;scene.traverse(o=>{if(o.isMesh)o.geometry.addEventListener('dispose',()=>disposed++);});factory.dispose();assert.equal(disposed,0);
 const geometry=new Set(),materials=new Set();scene.traverse(o=>{if(o.isMesh){geometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());assert.equal(disposed,6);
});
test('33 anonymous passengers, 12 children, twelve performances, 4/2/4 fleet',()=>{
 assert.equal(SEA_PASSENGERS.length,33);assert.equal(SEA_PASSENGERS.filter(p=>p.age==='child').length,12);
 assert.equal(SEA_PERFORMANCES.length,12);assert.deepEqual(['near','middle','far'].map(b=>SEA_FLEET.filter(p=>p.band===b).length),[4,2,4]);
 for(const child of SEA_PASSENGERS.filter(p=>p.age==='child')){const partner=SEA_PASSENGERS.find(p=>p.id===child.boat*8+child.partner);assert.ok(partner&&partner.age!=='child','children share with an actual adult relative');}
});
test('immutable feed, exact coordinates, deduplication, 32-target bound and reset',()=>{
 const feed=new SeaBurstFeed(), batch=Object.freeze(Array.from({length:40},(_,i)=>event(i+1,0,i%13,i*3)));
 feed.ingest(batch,0);assert.equal(feed.targets.length,32);assert.equal(batch[39].x,117);assert.equal(feed.targets.at(-1).x,117);
 feed.ingest(batch,0);assert.equal(feed.targets.length,32);feed.expire(10);assert.equal(feed.targets.length,0);
 feed.reset();feed.ingest([event(1)],0);assert.equal(feed.targets.length,1);feed.ingest([event(2,0)],10);assert.equal(feed.targets.length,0);
});
test('actual nonuniform hull transform round-trips heading, pitch, roll and position',()=>{
 for(let i=0;i<10;i++)for(let t=0;t<20;t+=.31){const pose=sampleSeaRoute(i,t,true,createSeaPose()),float={height:.3,roll:.04,pitch:-.03},local={x:-.6,y:1.2,z:.45},world={},out={};boatToWorld(local,pose,float,-1,world);worldToBoat(world,pose,float,-1,out);for(const k of ['x','y','z'])assert.ok(Math.abs(out[k]-local[k])<1e-12);}
});
test('mirrored real bursts, all families, six-gesture cap, cooldown and anatomical limits',()=>{
 const sea=new SeaAudienceSession();sea.advance(0,true,true,frame);let notices=0,cheers=0,claps=0,lastCheer=-100;
 for(let n=1;n<=60*65;n++){const t=n/60;if(n%120===0){const id=n;sea.ingest([event(id,t,(n/120-1)%13,-50),event(id+1,t,(n/120-1)%13,50)],t);}sea.advance(t,true,true,{...frame,phase:t});
  const large=sea.audience.poses.filter(p=>['clap','raised-arm','delighted-lean'].includes(p.performance)&&!['rest','recover'].includes(p.stage));assert.ok(large.length<=6);
  for(const p of sea.audience.poses){assert.ok(Math.abs(p.bodyYaw)<=.524+1e-8);assert.ok(Math.abs(p.headYaw)<=1.047+1e-8);assert.ok(p.headPitch<=1.134+1e-8);if(p.stage==='attend')notices++;}
  for(const cue of sea.audience.drainCues()){if(cue.kind==='cheer'){assert.ok(t-lastCheer>=8-1e-8);lastCheer=t;cheers++;}else claps++;}
 }
 assert.ok(notices>0);assert.ok(cheers>0);assert.ok(claps>0);assert.equal(sea.audience.feed.targets.length<=32,true);
 const progress=sea.clock.time;sea.advance(100,false,true,{...frame,phase:65});assert.equal(sea.clock.time,progress);
 sea.resetReactions();assert.equal(sea.clock.time,progress);assert.equal(sea.audience.feed.targets.length,0);assert.ok(sea.audience.poses.every(p=>p.stage==='rest'));
});
test('30/60/120Hz attention decisions are stable at matched times',()=>{
 const samples=[];
 for(const hz of [30,60,120]){const sea=new SeaAudienceSession();sea.advance(0,true,true,frame);for(let n=1;n<=hz*12;n++){const t=n/hz;if(n===hz*2)sea.ingest([event(1,t,1,-30),event(2,t,4,30)],t);sea.advance(t,true,true,{...frame,phase:t});}samples.push(sea.audience.poses.map(p=>({target:p.target,stage:p.stage,performance:p.performance,cooldown:p.cooldown})));}
 assert.deepEqual(samples[0],samples[1]);assert.deepEqual(samples[1],samples[2]);
});
test('two-link limbs retain length and remain bounded, procedural rig is complete and disposable',()=>{
 const out={elbow:new THREE.Vector3(),hand:new THREE.Vector3()},shoulder=new THREE.Vector3(0,.69,.19);
 for(let i=0;i<100;i++){solveSeaArm(shoulder,new THREE.Vector3(Math.sin(i)*2,Math.cos(i)*2,.1),1,out);assert.ok(Math.abs(shoulder.distanceTo(out.elbow)-.30)<1e-10);assert.ok(Math.abs(out.elbow.distanceTo(out.hand)-.28)<1e-10);assert.ok(shoulder.distanceTo(out.hand)<.581);}
 const factory=new SeaBoatModels(),boats=SEA_FLEET.map((_,i)=>factory.build(i)),rig=new SeaPassengerRig(boats),sea=new SeaAudienceSession();sea.advance(0,true,true,frame);
 for(let i=0;i<10;i++){const p=sea.poses[i];boats[i].root.scale.set(p.length/6,p.length/6,p.beam/1.84);boats[i].root.position.set(p.x,-1,p.z);boats[i].root.rotation.set(0,p.yaw,0,'YXZ');}
 rig.render(boats,sea);const d=rig.diagnostics();assert.equal(d.contacts.length,33);assert.equal(d.draws,7);assert.ok(d.triangles<20000);assert.ok(d.contacts.every(p=>Math.abs(p.upper-.30)<1e-8&&Math.abs(p.fore-.28)<1e-8));
 sea.setFocus(0);rig.render(boats,sea);assert.equal(rig.diagnostics().draws,9);assert.ok(rig.batches.get('close-skin').used>0);assert.ok(rig.batches.get('skin').used>rig.batches.get('close-skin').used,'only the selected family receives close geometry');rig.dispose();factory.dispose();
});
test('real reachable gaze settles within eight degrees; obstructed and unreachable targets are declined',()=>{
 const factory=new SeaBoatModels(),boats=SEA_FLEET.map((_,i)=>factory.build(i)),rig=new SeaPassengerRig(boats),sea=new SeaAudienceSession();sea.advance(0,true,true,frame);
 for(let i=0;i<10;i++){const p=sea.poses[i],f=sea.floats[i];boats[i].root.scale.set(p.length/6,p.length/6,p.beam/1.84);boats[i].root.position.set(p.x,WATER_Y+f.height,p.z);boats[i].root.rotation.set(f.roll,p.yaw,f.pitch,'YXZ');}
 let checked=0;
 for(let family=0;family<13;family++){
  sea.audience.reset();const t=family*10,local={x:.5,y:10,z:12},world={};boatToWorld(local,sea.poses[0],sea.floats[0],WATER_Y,world);
  sea.ingest([{...event(1,t,family),...world}],t);
  for(let n=0;n<90;n++){sea.clock.time=t+n/60;sea.audience.step(t+n/60,t+n/60,1/60,sea.poses,sea.floats);rig.render(boats,sea);}
  for(const pose of sea.audience.poses.slice(0,3))if(pose.reachable&&['attend','react'].includes(pose.stage)){assert.ok(pose.gazeError<8*Math.PI/180,`gaze ${pose.id}: ${pose.gazeError}`);checked++;}
 }
 assert.ok(checked>3);
 sea.audience.reset();const world={};boatToWorld({x:-60,y:2,z:0},sea.poses[0],sea.floats[0],WATER_Y,world);sea.ingest([{...event(1,200),...world}],200);
 for(let n=0;n<60;n++)sea.audience.step(200+n/60,200+n/60,1/60,sea.poses,sea.floats);
 assert.equal(sea.audience.poses[0].target,-1,'operator declines the rearward target');
 const person=SEA_PASSENGERS.find(p=>p.boat===1&&p.seat===1),target={};boatToWorld({x:person.x,y:20,z:person.z},sea.poses[1],sea.floats[1],WATER_Y,target);
 assert.equal(sea.audience.obstructed(person,sea.poses[1],target,sea.floats[1]),true,'roof ray is blocked');rig.dispose();factory.dispose();
});
test('rowing grips and seated contacts persist; clap palms meet and pointing uses the actual burst',()=>{
 const factory=new SeaBoatModels(),boats=SEA_FLEET.map((_,i)=>factory.build(i)),rig=new SeaPassengerRig(boats),sea=new SeaAudienceSession();let maximumGrip=0;
 for(let n=0;n<=180;n++){
  const t=n/60;sea.advance(t,true,true,{...frame,phase:t});
  for(let i=0;i<10;i++){const p=sea.poses[i],f=sea.floats[i];boats[i].root.scale.set(p.length/6,p.length/6,p.beam/1.84);boats[i].root.position.set(p.x,WATER_Y+f.height,p.z);boats[i].root.rotation.set(f.roll,p.yaw,f.pitch,'YXZ');for(let j=0;j<boats[i].oars.length;j++){const side=j===0?-1:1;boats[i].oars[j].rotation.set(side*Math.max(0,Math.cos(t*1.55+SEA_FLEET[i].phase))*.17,p.row*.34*side,0);}}
  rig.render(boats,sea);for(const contact of rig.diagnostics().contacts)maximumGrip=Math.max(maximumGrip,contact.oarGripError);
 }
 assert.ok(maximumGrip<.01,`rowlock contact error ${maximumGrip}`);
 const person=sea.audience.poses[1];Object.assign(person,{stage:'react',performance:'clap',gesture:1,intensity:1,clap:1});sea.clock.time+=1;rig.render(boats,sea);
 assert.ok(rig.diagnostics().contacts[1].clapPalmGap<=.002,'palm geometry meets at contact');
 const world={};boatToWorld({x:1,y:12,z:14},sea.poses[0],sea.floats[0],WATER_Y,world);sea.ingest([{...event(1,3),...world}],3);
 Object.assign(person,{performance:'point',target:1,gesture:1});sea.clock.time+=1;rig.render(boats,sea);assert.ok(rig.diagnostics().contacts[1].pointingError<12*Math.PI/180);
 for(const contact of rig.diagnostics().contacts){const spec=SEA_PASSENGERS.find(p=>p.id===contact.person),floor=spec.age==='child'?contact.footY:-.0075;assert.ok(Math.abs(contact.footY-floor)<.01);}
 rig.dispose();factory.dispose();
});

test('family sharing aims at the other actual head under heading and buoyancy',()=>{
 const factory=new SeaBoatModels(),boats=SEA_FLEET.map((_,i)=>factory.build(i)),rig=new SeaPassengerRig(boats),sea=new SeaAudienceSession();sea.advance(0,true,true,frame);
 for(let i=0;i<10;i++){const p=sea.poses[i],f=sea.floats[i];boats[i].root.scale.set(p.length/6,p.length/6,p.beam/1.84);boats[i].root.position.set(p.x,WATER_Y+f.height,p.z);boats[i].root.rotation.set(f.roll,p.yaw,f.pitch,'YXZ');}
 Object.assign(sea.audience.poses[2],{stage:'share',since:0,latency:0});
 for(let n=1;n<=90;n++){sea.clock.time=n/60;sea.audience.step(n/60,n/60,1/60,sea.poses,sea.floats);rig.render(boats,sea);}
 const actor=rig.actors[2],partner=rig.actors[1],from=new THREE.Vector3(),to=new THREE.Vector3(),rotation=new THREE.Quaternion();actor.head.getWorldPosition(from);partner.head.getWorldPosition(to);actor.head.getWorldQuaternion(rotation);rotation.multiply(actor.eyes.quaternion);
 const look=new THREE.Vector3(1,0,0).applyQuaternion(rotation);assert.ok(look.angleTo(to.sub(from).normalize())<8*Math.PI/180);rig.dispose();factory.dispose();
});

test('an adult can follow a child to the child’s real burst without inventing a target',()=>{
 let followed=0;
 for(let pair=0;pair<20;pair++){
  const make=()=>{const sea=new SeaAudienceSession();sea.advance(0,true,true,frame);const a={},b={};boatToWorld({x:-3.65,y:10,z:12},sea.poses[0],sea.floats[0],WATER_Y,a);boatToWorld({x:2.35,y:10,z:12},sea.poses[0],sea.floats[0],WATER_Y,b);sea.ingest([{...event(pair*2+1),...a},{...event(pair*2+2),...b,strength:.82}],0);return sea;};
  const base=make(),social=make();base.audience.choose(1,0,0,base.poses,base.floats);Object.assign(social.audience.poses[2],{stage:'attend',target:pair*2+2});social.audience.choose(1,0,0,social.poses,social.floats);
  if(base.audience.poses[1].target===pair*2+1&&social.audience.poses[1].target===pair*2+2)followed++;
 }
 assert.ok(followed>=3,`observed child-led attention choices: ${followed}`);
});

test('twenty-minute live-target soak keeps audience resources bounded',()=>{
 const sea=new SeaAudienceSession();sea.advance(0,true,true,frame);let id=0;
 for(let n=1;n<=36000;n++){const t=n/30;if(n%15===0)sea.ingest([event(++id,t,id%13,-45),event(++id,t,id%13,45)],t);sea.advance(t,true,true,{...frame,phase:t});assert.ok(sea.audience.feed.targets.length<=32);assert.ok(sea.audience.cues.length<=16);assert.equal(sea.audience.poses.length,33);sea.audience.drainCues();}
 assert.ok(Math.abs(sea.clock.time-1200)<1e-7);
});

test('leaving a boat restores the renderer camera before same-turn launch projection',()=>{
 const old=globalThis.location;globalThis.location={search:''};
 try{
  const sea=new SeaAudienceSession();let camera='sky';
  const renderer={render:()=>{camera=sea.focus===null?'sky':'boat';},resetBoatView:()=>{camera='sky';},resolveLaunchProfile:()=>({camera})};
  sea.setFocus(0);renderer.render();assert.equal(camera,'boat');restoreSkyView(renderer,sea);assert.equal(renderer.resolveLaunchProfile(0).camera,'sky');
 }finally{globalThis.location=old;}
});
