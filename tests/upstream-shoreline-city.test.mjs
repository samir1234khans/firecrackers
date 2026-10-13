import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { FAMILIES } from '../.test-build/engine/catalog.js';
import { makeTown, SHORELINE_TOWN, inShoreline, shorelineBand, SHORELINE_HEIGHT_SCALE, SHORELINE_TERRAIN, shoreZ, roadPoint, roadLife } from '../.test-build/graphics/ShorelineModel.js';

test('town is stable, bounded, varied and has inhabited/unlit rooms',()=>{
  assert.deepEqual(makeTown(),SHORELINE_TOWN);
  assert.ok(SHORELINE_TOWN.buildings.length>45 && SHORELINE_TOWN.buildings.length<90);
  assert.ok(SHORELINE_TOWN.windows.length>100 && SHORELINE_TOWN.windows.length<600);
  assert.equal(SHORELINE_TOWN.mountains.length,3);
  assert.ok(new Set(SHORELINE_TOWN.buildings.map(b=>b.tone)).size===6);
  assert.ok(SHORELINE_TOWN.windows.some(w=>w.lit)&&SHORELINE_TOWN.windows.some(w=>!w.lit));
  assert.equal(inShoreline(.5,.47,.5,1440,900),true);
  assert.equal(inShoreline(.5,.68,.72,390,844),true);
  for(const [x,y] of [[NaN,.5],[.5,.2],[-1,.47],[.5,.8]])assert.equal(inShoreline(x,y,.5,1440,900),false);
});
test('both portrait and wide shore heights are exactly twenty percent shorter',()=>{
  assert.equal(SHORELINE_HEIGHT_SCALE,.8);
  for(const [w,h,old] of [[1440,900,.17],[390,844,.135],[844,390,.17]]) {
    const band=shorelineBand(.72,w,h);assert.equal(band.span,old*.8);
    assert.equal(inShoreline(.5,.72-old*.9,.72,w,h),false);
  }
  assert.ok(SHORELINE_TOWN.windows.filter(w=>w.lit).length<300);
});
test('natural land has relief, a cove, grounded mixed clusters and restrained road life',()=>{
  const t=SHORELINE_TOWN;assert.ok(t.buildings.filter(b=>b.kind==='house').length/t.buildings.length>.8);assert.equal(t.buildings.filter(b=>b.kind==='apartment').length,4);assert.ok(t.buildings.some(b=>b.kind==='boathouse'));assert.ok(t.buildings.filter(b=>b.roof).length/t.buildings.length>.7);
  assert.ok(Math.max(...t.buildings.map(b=>b.z))-Math.min(...t.buildings.map(b=>b.z))>55);
  assert.ok(shoreZ(35)<shoreZ(-400)-15);assert.equal(SHORELINE_TERRAIN.length,4);
  for(const terrain of SHORELINE_TERRAIN){assert.equal(terrain.positions.length,terrain.colors.length);assert.ok(terrain.positions.every(Number.isFinite));assert.ok(terrain.colors.every(v=>Number.isFinite(v)&&v>=0&&v<=1));assert.ok(terrain.indices.every(i=>i>=0&&i<terrain.positions.length/3));}
  assert.notDeepEqual(roadLife(0),roadLife(30));for(const p of roadLife(30))assert.ok(p.z<shoreZ(p.x));assert.ok(roadPoint(0).z<roadPoint(-400).z-10);
});
test('all thirteen effects keep committed far origins, fuse traces, flight and bursts far away',()=>{
  for(const family of FAMILIES){
    const sim=new Simulation(72);sim.quality='ultra';sim.protectCenter=false;
    const profile={ground:8,padX:-30,aimX:-20,originDepth:-998,burstDepth:-1016,apex:72,apexMin:72,apexMax:72,effectScale:.5,centerFraction:.34,normalizedPlacement:.35};
    assert.equal(sim.igniteAtProfile(family.id,profile),true,family.id);
    const rocket=sim.committed;assert.equal(rocket.z,-998);assert.equal(sim.events.at(-1).z,-998);
    profile.originDepth=0;assert.equal(rocket.launchProfile.originDepth,-998);
    sim.advance(.25);
    for(let i=0;i<sim.trails.count;i++)assert.ok(sim.trails.az[i]<-990);
    while(sim.bursts===0&&sim.time<12){sim.advance(1/60);if(rocket.stage==='ascent')assert.ok(rocket.z<=-998&&rocket.z>=-1016,family.id);}
    assert.ok(sim.bursts>0,family.id);assert.ok(rocket.z<=-1015.9);
    assert.ok(sim.events.filter(e=>e.type==='burst').every(e=>e.z<-900));
  }
});
test('bad profiles and paused admission cannot mutate selection or commit a rocket',()=>{
  const sim=new Simulation(72), original=sim.selected;
  const profile={ground:8,padX:-30,aimX:-20,originDepth:-998,burstDepth:-1016,apex:72,apexMin:72,apexMax:72,effectScale:.5,centerFraction:.34};
  for(const patch of [{originDepth:NaN},{effectScale:2},{apexMin:Infinity}])assert.equal(sim.igniteAtProfile(FAMILIES[2].id,{...profile,...patch}),false);
  assert.equal(sim.selected,original);assert.equal(sim.committed,undefined);
  sim.setPaused(true);assert.equal(sim.igniteAtProfile(FAMILIES[2].id,profile),false);assert.equal(sim.committed,undefined);
});
