import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { FAMILIES } from '../.test-build/engine/catalog.js';
const advance=(s,t)=>{for(let i=0;i<t*60;i++)s.advance(1/60)};
for(const f of FAMILIES) test(`drawer burst ${f.id}: admission, cleanup and deterministic replay`,()=>{
 const a=new Simulation(719),b=new Simulation(719);
 for(const s of [a,b]){
  s.quality='ultra';assert.equal(s.burstAt(f.id,5,72),true);assert.equal(s.launched,1);
  assert.equal(s.burstAt(f.id,8,75),false,'duplicate drop during rearm');
  advance(s,9);assert.ok(s.bursts>=1);assert.ok(s.heads.count<=4096);advance(s,40);
  assert.equal(s.heads.count+s.trails.count+s.embers.count+s.smoke.count+s.cues.length,0);assert.equal(s.ready,true);
 }
 assert.deepEqual(a.snapshot(),b.snapshot());
});
test('drawer rejects pause, invalid positions and committed-flight replacement',()=>{
 const s=new Simulation();s.setPaused(true);assert.equal(s.burstAt('gold-willow',0,75),false);s.setPaused(false);
 assert.equal(s.burstAt('gold-willow',NaN,75),false);s.ignite();const r=structuredClone(s.committed);
 assert.equal(s.burstAt('sapphire-saturn',0,75),false);assert.deepEqual(s.committed,r);
});
