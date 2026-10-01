import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitWaterSurfaceGrid } from '../.test-build/graphics/WaterSurfaceGeometry.js';
import { sampleWater, sampleWaterHeight, WATER_NEAR_Z } from '../.test-build/graphics/WaterWaves.js';
import { stageCameraFrame } from '../.test-build/engine/StageLayout.js';
import { PerspectiveCamera, Vector3 } from 'three';

test('height-only reflection sampling agrees with the full shared field and attenuation',()=>{
 const out={height:0,slopeX:0,slopeZ:0};
 for(const farZ of [-180,-1000]) for(const waveCount of [0,2,4]) for(const phase of [0,.1,26,100]) {
  const bounds={farZ,nearZ:WATER_NEAR_Z,waveCount};
  for(let i=0;i<=100;i++) {
   const z=farZ-1+(WATER_NEAR_Z-farZ+2)*i/100,x=Math.sin(i*1.37)*600;
   sampleWater(x,z,phase,out,bounds);
   assert.ok(Math.abs(out.height-sampleWaterHeight(x,z,phase,bounds))<1e-12);
  }
 }
});

test('fitted water grids cover both camera edges at every row in seven viewports',()=>{
 for(const [width,height] of [[320,480],[375,667],[393,851],[768,1024],[844,390],[1280,800],[1920,1080]]) {
  const layout={viewport:{width,height},heroRect:{x:0,y:0,width,height:height-76}};
  const f=stageCameraFrame(layout,0),camera=new PerspectiveCamera(42,width/height,1,1500);
  camera.position.set(0,f.centerY+Math.sin(f.pitch)*f.distance,Math.cos(f.pitch)*f.distance);
  camera.lookAt(0,f.centerY,0);camera.updateMatrixWorld();
  const phone=width/height<.72,farZ=phone?-180:-1000,centerZ=phone?10:-400,columns=phone?64:96,rows=phone?48:64;
  const edge=z=>{const p=new Vector3(0,4.65,z).project(camera),r=new Vector3(1,p.y,.5).unproject(camera);return Math.abs(camera.position.x+(r.x-camera.position.x)*(4.65-camera.position.y)/(r.y-camera.position.y))+40;};
  const farHalf=edge(farZ),nearHalf=edge(WATER_NEAR_Z),xScale=Math.max(1,farHalf/700);
  const positions=new Float32Array((columns+1)*(rows+1)*3);
  fitWaterSurfaceGrid(positions,columns,rows,farZ,WATER_NEAR_Z,centerZ,xScale,nearHalf,farHalf);
  assert.ok(positions.length/3<=6305);
  for(let row=0;row<=rows;row++) for(const column of [0,columns]) {
   const i=(row*(columns+1)+column)*3,z=centerZ-positions[i+1];
   const point=new Vector3(positions[i]*xScale,4.65,z).project(camera);
   assert.ok(column===0?point.x<=-1:point.x>=1,JSON.stringify({width,height,row,point}));
   assert.ok(z>=farZ-.0001&&z<=WATER_NEAR_Z+.0001);
  }
  const nearOffset=rows*(columns+1)*3;
  assert.ok(Math.abs(centerZ-positions[nearOffset+1]-WATER_NEAR_Z)<.0001);
  // Fine geometry is concentrated near the terrace, not wasted on distant rows.
  assert.ok(Math.abs(positions[nearOffset+1]-positions[nearOffset-(columns+1)*3+1])<1);
 }
});

test('water grid rejects invalid buffers and bounds before writing',()=>{
 assert.throws(()=>fitWaterSurfaceGrid(new Float32Array(3),2,2,-180,-14.75,10,1,100,400),RangeError);
 assert.throws(()=>fitWaterSurfaceGrid(new Float32Array(27),2,2,0,-14.75,10,1,100,400),RangeError);
});
