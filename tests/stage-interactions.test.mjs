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
test('per-family launch commits the requested rocket once and leaves an in-flight rocket immutable',()=>{
 const s=new Simulation(711);s.quality='ultra';
 assert.equal(s.selected,'gold-willow');
 assert.equal(s.igniteFamily('sapphire-saturn'),true);
 assert.equal(s.selected,'sapphire-saturn');
 assert.equal(FAMILIES[s.committed.family].id,'sapphire-saturn');
 const committed=structuredClone(s.committed);
 assert.equal(s.igniteFamily('ruby-dahlia'),false,'a repeated or competing click cannot queue another rocket');
 assert.equal(s.selected,'sapphire-saturn','rejected clicks cannot change the next selection');
 assert.deepEqual(s.committed,committed);
 s.select('ruby-dahlia');
 assert.equal(s.selected,'ruby-dahlia');
 assert.deepEqual(s.committed,committed,'choosing the next style cannot rewrite the committed rocket');
 advance(s,1);
 assert.equal(s.launched,1);
 assert.equal(FAMILIES[s.committed.family].id,'sapphire-saturn');
});
test('manual launch takes over a show only when admitted',()=>{
 const s=new Simulation();s.startShow('festival');s.setPaused(true);
 assert.equal(s.igniteFamily('phoenix-palm'),false);
 assert.equal(s.show,'festival');assert.equal(s.selected,'gold-willow');
 s.setPaused(false);
 assert.equal(s.igniteFamily('phoenix-palm'),true);
 assert.equal(s.show,null);assert.equal(FAMILIES[s.committed.family].id,'phoenix-palm');
});
test('target-family capacity permits a smaller icon launch or drop when the current selection is too large',()=>{
 const launch=new Simulation();launch.quality='ultra';launch.select('opal-supernova');
 launch.heads.count=2400;
 assert.equal(launch.ready,false);
 assert.equal(launch.canLaunchFamily('gold-willow'),true);
 assert.equal(launch.canLaunchFamily('opal-supernova'),false);
 assert.equal(launch.igniteFamily('gold-willow'),true);
 assert.equal(FAMILIES[launch.committed.family].id,'gold-willow');
 const drop=new Simulation();drop.quality='ultra';drop.select('opal-supernova');drop.heads.count=2400;
 assert.equal(drop.ready,false);
 assert.equal(drop.burstAt('gold-willow',5,72),true);
 assert.equal(drop.selected,'gold-willow');assert.equal(drop.bursts,1);
});
