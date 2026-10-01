import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateMoonFrame } from '../.test-build/graphics/MoonComposition.js';
import { sampleWater, WATER_WAVES } from '../.test-build/graphics/WaterWaves.js';
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
 sampleWater(-34,-85,12+1/60,b);assert.ok(Math.abs(a.height-b.height)<.001);
 assert.notEqual(a.height,b.height);
});
