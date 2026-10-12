import test from 'node:test';
import * as THREE from 'three/webgpu';
import assert from 'node:assert/strict';
import { SEA_FLEET, SEA_WAVE_GAINS, SeaClock, SeaWakePool, SEA_WAKE_CAPACITY, createSeaPose, sampleSeaRoute } from '../.test-build/graphics/SeaFleetState.js';
import { sampleWater, sampleWaterHeight, waterDisplacementBound } from '../.test-build/graphics/WaterWaves.js';
import { SeaBuoyancy } from '../.test-build/graphics/SeaBuoyancy.js';
import { WaterReflection } from '../.test-build/graphics/WaterReflection.js';
import { SeaBoatModels } from '../.test-build/graphics/SeaBoatModels.js';

test('ten distinct identities and thirty-three anonymous occupants', () => {
  assert.equal(SEA_FLEET.length, 10); assert.equal(new Set(SEA_FLEET.map(b => b.id)).size, 10);
  assert.equal(SEA_FLEET.reduce((n,b) => n + b.people, 0), 33);
});
test('routes stay in sea, preserve clearance and turn smoothly for 20 minutes', () => {
  for (const phone of [true,false]) {
    const poses=SEA_FLEET.map(createSeaPose), previous=SEA_FLEET.map(() => undefined);
    for (let time=0;time<=1200;time+=.05) {
      for(let i=0;i<10;i++) {
        const p=sampleSeaRoute(i,time,phone,poses[i]);
        assert.ok(p.z < -25 && p.z > (phone ? -179 : -950));
        assert.ok(Math.abs(p.x) < (phone ? 47 : 170));
        if(previous[i]!==undefined) {
          const angle=Math.atan2(Math.sin(p.yaw-previous[i]),Math.cos(p.yaw-previous[i]));
          assert.ok(Math.abs(angle)/.05 < .106, `turn limit boat ${i}: ${angle/.05}`);
        }
        previous[i]=p.yaw;
      }
      for(let i=0;i<10;i++) for(let j=i+1;j<10;j++) {
        const a=poses[i],b=poses[j];
        assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=Math.max(a.length,b.length),`clearance ${i}/${j} at ${time}`);
      }
    }
  }
});
test('30/60/120 Hz clocks give the same continuous pose; pause and replay do not restart', () => {
  const clocks=[];
  for(const hz of [30,60,120]) {
    const clock=new SeaClock(); clock.update(0,true);
    for(let i=1;i<=hz*20;i++) clock.update(i/hz,true);
    clocks.push(clock.time);
  }
  for(const t of clocks) assert.ok(Math.abs(t-20)<1e-9);
  const c=new SeaClock();c.update(0,true);c.update(.1,true);c.update(15,false);assert.equal(c.time,.1);
  c.update(0,true);assert.equal(c.time,.1);c.update(.1,true);assert.equal(c.time,.2);
  const a=sampleSeaRoute(0,40,true,createSeaPose()),b=sampleSeaRoute(0,40,false,createSeaPose());
  assert.ok(Math.abs(a.x/46-b.x/165)<1e-9); // persistent coordinates, not a reset on resize
});
test('wake marks stay behind the stern, bounded, age out and reject same-clock emission', () => {
  const pool=new SeaWakePool(),p=sampleSeaRoute(0,0,true,createSeaPose());
  pool.emit(0,0,p);const mark={...pool.marks[0]};pool.emit(0,0,p);assert.equal(pool.active(0),1);
  assert.ok((p.x-mark.x)*Math.cos(p.yaw)-(p.z-mark.z)*Math.sin(p.yaw)>0);
  sampleSeaRoute(0,60,true,p);assert.equal(pool.marks[0].x,mark.x);
  for(let t=.3;t<120;t+=.3) for(let i=0;i<10;i++) pool.emit(i,t,sampleSeaRoute(i,t,true,createSeaPose()));
  assert.equal(pool.marks.length,SEA_WAKE_CAPACITY);assert.ok(pool.active(120)<=SEA_WAKE_CAPACITY);
  assert.equal(pool.active(140),0);pool.reset();assert.equal(pool.active(0),0);
});
test('Spark gained water shares exact height and derivatives; legacy values remain unchanged', () => {
  const normal={farZ:-180,nearZ:-14.75,waveCount:4},sea={...normal,gains:SEA_WAVE_GAINS};
  assert.equal(waterDisplacementBound(normal),.510);assert.ok(waterDisplacementBound(sea)>.51);
  for(let x=-50;x<=50;x+=10) for(let z=-179;z<-15;z+=11) {
    const out=sampleWater(x,z,17,{height:0,slopeX:0,slopeZ:0},sea),h=.0001;
    assert.ok(Math.abs(out.height-sampleWaterHeight(x,z,17,sea))<1e-12);
    assert.ok(Math.abs(out.slopeX-(sampleWaterHeight(x+h,z,17,sea)-sampleWaterHeight(x-h,z,17,sea))/(2*h))<1e-7);
    assert.ok(Math.abs(out.slopeZ-(sampleWaterHeight(x,z+h,17,sea)-sampleWaterHeight(x,z-h,17,sea))/(2*h))<1e-7);
    assert.ok(Math.abs(out.height)<=waterDisplacementBound(sea));
  }
});

test('four-point buoyancy stays attached, bounded and stable across frame rates', () => {
  const results=[];
  for(const hz of [30,60,120]) {
    const floats=SEA_FLEET.map(() => new SeaBuoyancy()),poses=SEA_FLEET.map(createSeaPose);
    const frame={phase:0,farZ:-180,nearZ:-14.75,waveCount:4,gains:SEA_WAVE_GAINS,motionAllowed:true};
    for(let n=0;n<=hz*20;n++) {
      frame.phase=n/hz;
      for(let i=0;i<10;i++) {
        const p=sampleSeaRoute(i,frame.phase,true,poses[i]),f=floats[i].update(p,frame,n ? 1/hz : 0,i===1||i===3);
        assert.ok(Math.abs(f.height)<=waterDisplacementBound(frame));
        assert.ok(Math.abs(f.pitch)<=.087 && Math.abs(f.roll)<=.087);
        const ax=Math.cos(p.yaw),az=-Math.sin(p.yaw),h=p.length*.42,b=p.beam*.36;
        const heights=[[p.x+h*ax,p.z+h*az],[p.x-h*ax,p.z-h*az],[p.x-b*az,p.z+b*ax],[p.x+b*az,p.z-b*ax]];
        const mean=heights.reduce((sum,[x,z])=>sum+sampleWaterHeight(x,z,frame.phase,frame),0)/4;
        assert.ok(Math.abs(mean-f.height)<1e-12, 'hull follows actual rendered contact points');
      }
    }
    results.push(floats.map(f=>({...f})));
    const held=floats[0].pitch; floats[0].update(poses[0],frame,0,false);assert.equal(floats[0].pitch,held);
  }
  for(let i=0;i<10;i++) assert.ok(Math.abs(results[0][i].pitch-results[2][i].pitch)<.0003);
});

test('original fallback models keep complete identities and release owned resources', () => {
  const factory=new SeaBoatModels(),boats=SEA_FLEET.map((_,i)=>factory.build(i));
  assert.deepEqual(boats.map(b=>b.people.length),[3,5,2,2,1,5,6,3,2,4]);
  assert.deepEqual(boats.map(b=>b.lamps.length),[1,2,1,1,1,2,2,1,1,1]);
  assert.equal(boats.reduce((n,b)=>n+b.heads.length,0),33);
  assert.equal(boats[0].oars.length,2);assert.ok(boats[1].canopy && boats[3].canopy);
  let triangles=0,disposed=0;
  for(const boat of boats) boat.root.traverseVisible(o=>{if(o.isMesh) triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
  assert.ok(triangles<35000);
  const owned=factory.geometries.size+factory.materials.size;
  for(const resource of [...factory.geometries,...factory.materials]) resource.addEventListener('dispose',()=>disposed++);
  factory.dispose();assert.equal(disposed,owned);
});


test('changed gains invalidate a paused reflection; omitted gains restore legacy waves', () => {
  const water=new WaterReflection(),frame={phase:3,waveCount:4,farZ:-180,nearZ:-14.75,motionAllowed:true};
  try {
    water.setFrame(frame);water.last=100;
    water.setFrame({...frame,gains:SEA_WAVE_GAINS});assert.equal(water.last,-Infinity);
    assert.equal(water.diagnostics().waterDisplacementBound,waterDisplacementBound({...frame,gains:SEA_WAVE_GAINS}));
    water.last=100;water.setFrame(frame);assert.equal(water.last,-Infinity);
    assert.equal(water.diagnostics().waterDisplacementBound,.510);
  } finally {water.dispose();}
});


test('licensed hull and original woven cover retain shared resources after fleet disposal', () => {
  const source=new THREE.Group(),a=new THREE.Group(),c=new THREE.Group();a.name='Boat_A';c.name='Boat_C';source.add(a,c);
  const geometry=new THREE.BoxGeometry(6,.7,1.8),coverGeometry=new THREE.BoxGeometry(3.5,.98,1.96);
  const wood=new THREE.MeshStandardMaterial(),cover=new THREE.MeshStandardMaterial();
  wood.name='CC0 Canoe | baked weathered wood and fittings PBR';cover.name='RiverLife | v008 finely woven weathered reed shelter';
  a.add(new THREE.Mesh(geometry,wood));c.add(new THREE.Mesh(coverGeometry,cover));
  let sourceDisposed=0;for(const resource of [geometry,coverGeometry,wood,cover]) resource.addEventListener('dispose',()=>sourceDisposed++);
  const factory=new SeaBoatModels(),boats=SEA_FLEET.map((_,i)=>factory.build(i));assert.equal(factory.adoptCanoe(source,boats),true);
  assert.match(boats[1].canopy.name,/Preserved original v008/);
  assert.ok(boats[0].root.getObjectByName('Licensed OuterSpaceSimon CC0 canoe'));
  factory.dispose();assert.equal(sourceDisposed,0, 'asset cache retains ownership of original maps and geometry');
  for(const resource of [geometry,coverGeometry,wood,cover]) resource.dispose();
});
