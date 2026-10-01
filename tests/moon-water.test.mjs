import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateMoonFrame } from '../.test-build/graphics/MoonComposition.js';
import { sampleWater, WATER_WAVES, WATER_MAX_DISPLACEMENT, WATER_NEAR_Z, updateWaterFrame } from '../.test-build/graphics/WaterWaves.js';
import { Simulation } from '../.test-build/engine/Simulation.js';
test('lunar composition stays circular and clear of top and horizon in supported viewports',()=>{
 for(const [w,h] of [[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]]){
  const m={x:0,y:0,radius:0};assert.equal(updateMoonFrame(w,h,.5,m),m);
  assert.ok(m.y-m.radius>=24);assert.ok(m.y+m.radius<h*.5);
  assert.ok(m.x+m.radius<w-48);assert.ok(m.radius>=15&&m.radius<=30);
 }
});
test('buoyancy is bounded and uses the analytic slope of the same field',()=>{
 const out={height:0,slopeX:0,slopeZ:0},left={...out},right={...out};
 const limit=WATER_WAVES.reduce((sum,w)=>sum+w.amplitude,0),epsilon=.001;
 for(let t=0;t<120;t+=.37){
  assert.equal(sampleWater(62,-165,t,out),out);assert.ok(Math.abs(out.height)<=limit);
  sampleWater(62-epsilon,-165,t,left);sampleWater(62+epsilon,-165,t,right);
  assert.ok(Math.abs((right.height-left.height)/(2*epsilon)-out.slopeX)<1e-8);
  sampleWater(62,-165-epsilon,t,left);sampleWater(62,-165+epsilon,t,right);
  assert.ok(Math.abs((right.height-left.height)/(2*epsilon)-out.slopeZ)<1e-8);
 }
});
test('stationary shared clock produces identical boat state; waves evolve smoothly',()=>{
 const a={height:0,slopeX:0,slopeZ:0},b={...a};
 sampleWater(-34,-85,12,a);sampleWater(-34,-85,12,b);assert.deepEqual(a,b);
 sampleWater(-34,-85,12+1/60,b);assert.ok(Math.abs(a.height-b.height)<.007);
 assert.notEqual(a.height,b.height);
});
test('four wave scales and total displacement remain within the authored calm-water bound',()=>{
 assert.equal(WATER_WAVES.length,4);
 for(const [index,wavelength] of [180,100,60,40].entries()){
  const wave=WATER_WAVES[index];
  assert.ok(Math.abs(Math.hypot(wave.x,wave.z)-2*Math.PI/wavelength)<1e-12);
 }
 assert.ok(Math.abs(WATER_WAVES.reduce((sum,w)=>sum+w.amplitude,0)-WATER_MAX_DISPLACEMENT)<1e-12);
 const out={height:0,slopeX:0,slopeZ:0};
 for(const farZ of [-1000,-180])for(let z=farZ;z<=WATER_NEAR_Z;z+=(WATER_NEAR_Z-farZ)/19)for(let t=0;t<16;t+=.31){
  sampleWater(37,z,t,out,{farZ,nearZ:WATER_NEAR_Z,waveCount:4});
  assert.ok(Math.abs(out.height)<=WATER_MAX_DISPLACEMENT);
 }
});
test('shoreline attenuation and its derivative agree on desktop and phone',()=>{
 const out={height:0,slopeX:0,slopeZ:0},left={...out},right={...out},epsilon=.00001;
 for(const farZ of [-1000,-180]){
  const bounds={farZ,nearZ:WATER_NEAR_Z,waveCount:4};
  for(const z of [farZ-1,farZ,farZ+.001,farZ+7,farZ+31,WATER_NEAR_Z-18,WATER_NEAR_Z-9,WATER_NEAR_Z-.001,WATER_NEAR_Z,WATER_NEAR_Z+1]){
   sampleWater(17,z,3,out,bounds);
   sampleWater(17-epsilon,z,3,left,bounds);sampleWater(17+epsilon,z,3,right,bounds);
   assert.ok(Math.abs((right.height-left.height)/(2*epsilon)-out.slopeX)<1e-7,`x derivative at ${z}`);
   sampleWater(17,z-epsilon,3,left,bounds);sampleWater(17,z+epsilon,3,right,bounds);
   assert.ok(Math.abs((right.height-left.height)/(2*epsilon)-out.slopeZ)<1e-7,`z derivative at ${z}`);
   if(z<=farZ||z>=WATER_NEAR_Z)assert.deepEqual(out,{height:0,slopeX:0,slopeZ:0});
  }
 }
});
test('shared frame resolves every quality and static motion without allocations',()=>{
 const frame={phase:-1,waveCount:-1,farZ:1,nearZ:1,motionAllowed:false};
 assert.equal(updateWaterFrame(frame,12,'ultra',false,true),frame);
 assert.deepEqual(frame,{phase:12,waveCount:4,farZ:-1000,nearZ:WATER_NEAR_Z,motionAllowed:true});
 updateWaterFrame(frame,12,'standard',true,true);
 assert.deepEqual(frame,{phase:12,waveCount:2,farZ:-180,nearZ:WATER_NEAR_Z,motionAllowed:true});
 const out={height:1,slopeX:1,slopeZ:1};
 updateWaterFrame(frame,12,'low',false,true);sampleWater(17,-40,frame.phase,out,frame);
 assert.deepEqual(frame,{phase:0,waveCount:0,farZ:-1000,nearZ:WATER_NEAR_Z,motionAllowed:false});
 assert.deepEqual(out,{height:0,slopeX:0,slopeZ:0});
 updateWaterFrame(frame,12,'ultra',false,false);
 assert.deepEqual(frame,{phase:0,waveCount:4,farZ:-1000,nearZ:WATER_NEAR_Z,motionAllowed:false});
});
test('default wave boundary flattens exactly at the authored terrace coping',()=>{
 assert.equal(WATER_NEAR_Z,-14.75);
 const out={height:1,slopeX:1,slopeZ:1};
 for(let phase=0;phase<12;phase+=.17){
  sampleWater(37,WATER_NEAR_Z,phase,out);
  assert.deepEqual(out,{height:0,slopeX:0,slopeZ:0});
 }
});
test('water phase integrates wind continuously on the fixed clock, freezes, and resets',()=>{
 const sim=new Simulation();
 let wind=1;
 Object.defineProperty(sim,'wind',{get:()=>wind});
 for(let i=0;i<60;i++)sim.advance(1/60);
 assert.ok(Math.abs(sim.waterPhase-1)<1e-12);
 const before=sim.waterPhase;
 wind=2;
 assert.equal(sim.waterPhase,before);
 sim.advance(1/60);
 assert.ok(Math.abs(sim.waterPhase-before-2/60)<1e-12);
 sim.setPaused(true);const frozen=sim.waterPhase;
 sim.advance(1);assert.equal(sim.waterPhase,frozen);
 sim.setPaused(false);sim.advance(1/60);
 assert.ok(Math.abs(sim.waterPhase-frozen-2/60)<1e-12);
 sim.reset();assert.equal(sim.waterPhase,0);
});
test('smooth changing wind is integrated instead of multiplying historical time',()=>{
 const sim=new Simulation();
 for(let i=0;i<600;i++)sim.advance(1/60);
 // Integral of .85 + .24*sin(.12*t), with fixed-step trapezoidal tolerance.
 const expected=.85*sim.time+2*(1-Math.cos(.12*sim.time));
 assert.ok(Math.abs(sim.waterPhase-expected)<1e-6);
 assert.ok(Math.abs(sim.waterPhase-sim.time*sim.wind)>.1);
});
