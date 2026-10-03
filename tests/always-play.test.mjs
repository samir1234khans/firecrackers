import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { AlwaysPlayDirector, paceValue } from '../.test-build/engine/AlwaysPlayDirector.js';
import { parsePresentation, presentationLink } from '../.test-build/platform/presentation.js';
import { defaults, loadPreferences, STORAGE_KEY } from '../.test-build/platform/preferences.js';
const run=(s,seconds)=>{for(let i=0;i<seconds*60;i++){s.advance(1/60);s.drainEvents();}};
const show=(pace,seed=42)=>{const s=new Simulation(seed);s.reducedFlashes=false;s.always.setPace(pace);s.startShow('always');return s;};

test('four admitted densities are distinct, ordered and cover thirteen identities',()=>{
 const rates=[];
 for(let pace=1;pace<=4;pace++){
  const s=show(pace);run(s,600);rates.push(s.always.admitted/10);
  assert.equal(s.show,'always');assert.ok(s.always.counts.every(n=>n>0));
  assert.ok(s.heads.count+s.snapshot().futureHeads<=3072);
 }
 assert.ok(rates[0]>=6&&rates[0]<=9,JSON.stringify(rates));
 assert.ok(rates[1]>=14&&rates[1]<=20,JSON.stringify(rates));
 assert.ok(rates[2]>=30&&rates[2]<=40,JSON.stringify(rates));
 assert.ok(rates[3]>=50&&rates[3]<=65,JSON.stringify(rates));
 assert.ok(rates[3]>=rates[2]*1.25);
});
test('admission/replay deterministic without consuming legacy show randomness',()=>{
 const a=show(4,123),b=show(4,123);run(a,90);run(b,90);assert.deepEqual(a.snapshot(),b.snapshot());
 const old=new Simulation(123);const touched=new Simulation(123);touched.always.reset(0);touched.always.choose(1);
 old.startShow('festival');touched.startShow('festival');run(old,60);run(touched,60);assert.deepEqual(old.snapshot().launched,touched.snapshot().launched);
 assert.deepEqual(old.heads.x,touched.heads.x);
});
test('busy manual takeover stops future auto cues and preserves committed rocket',()=>{
 const s=show(4);run(s,1);const r=s.committed;assert.ok(r);assert.equal(s.igniteFamily('royal-phoenix'),false);
 assert.equal(s.show,null);assert.equal(s.selected,'royal-phoenix');assert.equal(s.committed,r);assert.equal(s.always.family,-1);
 run(s,30);assert.equal(s.always.admitted,1);
});
test('pace changes ease without restarting session or moving admitted effects',()=>{
 const s=show(1);run(s,1);const r=s.committed, next=s.always.next;const before=s.always.interval;
 s.always.setPace(4);assert.equal(s.committed,r);assert.equal(s.always.next,next);assert.equal(s.always.interval,before);
 run(s,3);assert.ok(s.always.interval<before&&s.always.interval>.82);assert.equal(s.always.pace,4);
});
test('pause freezes the complete director, resume has no wall-clock backlog',()=>{
 const s=show(4);run(s,20);s.setPaused(true);const before=s.snapshot();run(s,120);assert.deepEqual(s.snapshot(),before);
 s.setPaused(false);s.advance(120);assert.ok(s.always.admitted-before.always.admitted<=1);
 s.stopShow();run(s,30);assert.equal(s.show,null);s.reset();assert.equal(s.always.admitted,0);
});
test('reduced flashes limits all four paces independently',()=>{
 for(let p=1;p<=4;p++){const s=show(p);s.reducedFlashes=true;run(s,120);assert.ok(s.always.admitted<=40);assert.equal(s.reducedFlashes,true);}
});
test('all Low heavy families remain eligible rather than permanently losing headroom',()=>{
 const s=show(4);s.quality='low';run(s,600);assert.ok(s.always.counts.every(n=>n>0));
 assert.ok(s.snapshot().activeUnits<=3);
});
test('bounded pending intent expires connectors and does not consume a blocked feature',()=>{
 const d=new AlwaysPlayDirector(5);d.reset(0);const feature=d.choose(1);assert.ok(feature>=0);
 for(let t=1;t<30;t++){d.choose(t);d.result(t,false,.9,false);}
 assert.equal(d.family,feature);assert.equal(d.admitted,0);assert.equal(d.snapshot().bufferCapacity,13);
 d.feature=false;d.result(31,false,.9,false);assert.equal(d.family,-1);assert.equal(d.expired,1);
});
test('performance feedback hysteresis is bounded and replayable, 30fps does not throttle indefinitely',()=>{
 const a=new AlwaysPlayDirector(9),b=new AlwaysPlayDirector(9);a.reset(0);b.reset(0);
 for(let i=0;i<600;i++){a.observe(i/60,45,true);b.observe(i/60,45,true);}
 assert.equal(a.demand,b.demand);assert.ok(a.demand>1&&a.demand<=3);
 for(let i=600;i<6600;i++)a.observe(i/60,33.3,true);
 assert.equal(a.demand,1);a.observe(111,0,false);assert.equal(a.snapshot().feedbackCapacity,120);
});
test('validated preferences migrate without sound or session auto-start',()=>{
 assert.equal(defaults().alwaysPace,2);assert.equal(defaults().sound,false);
 for(const value of [undefined,null,0,5,'4',1.1,NaN,Infinity])assert.equal(paceValue(value),2);
 globalThis.localStorage={getItem:key=>key===STORAGE_KEY?JSON.stringify({version:2,preset:'festival',sound:false}):null};
 assert.equal(loadPreferences().alwaysPace,2);assert.equal(loadPreferences().version,4);
 globalThis.localStorage={getItem:()=>JSON.stringify({version:3,alwaysPace:4,preset:'always'})};assert.equal(loadPreferences().alwaysPace,4);
 globalThis.localStorage={getItem:()=>{throw Error('denied');}};assert.equal(loadPreferences().alwaysPace,2);delete globalThis.localStorage;
});
test('explicit display links roundtrip pace; ordinary URLs retain interactive mode',()=>{
 const p=parsePresentation('?display=transparent&show=always&pace=4&seed=42');
 assert.equal(p.pace,4);assert.equal(p.show,'always');assert.deepEqual(parsePresentation(new URL(presentationLink('https://example.test',p)).search),p);
 assert.equal(parsePresentation('?show=always&pace=4').mode,'interactive');assert.equal(parsePresentation('?pace=99').pace,2);
});

test('featured bag entries cannot repeat the immediately preceding connector',()=>{
 const d=new AlwaysPlayDirector(42);d.setPace(4);d.reset(0);let previous=-1;
 for(let i=0;i<36000;i++){const t=i/60;d.tick(1/60);const family=d.choose(t);if(family>=0){assert.notEqual(family,previous);previous=family;d.result(t,true,0,false);}}
 assert.ok(d.counts.every(n=>n>0));
});

test('enabling reduced flashes retimes an already scheduled fast cue before admission',()=>{
 const s=show(4);run(s,1);assert.equal(s.always.admitted,1);const last=s.always.lastAdmission;
 s.reducedFlashes=true;run(s,2);assert.equal(s.always.admitted,1);assert.ok(s.time<last+3);
 run(s,1);assert.equal(s.always.admitted,2);assert.ok(s.always.lastAdmission>=last+3);
});
