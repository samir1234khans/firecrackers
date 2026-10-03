import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG_VERSION, FAMILIES, familyReservation } from '../.test-build/engine/catalog.js';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { parseRecipe, newRecipe, starterRecipe, planRecipe, spaceRecipe, recipeLink, recipeFromHash, RECIPE_LIMITS } from '../.test-build/experience/ShowRecipe.js';
import { readNights, writeNights, readFavourites, writeFavourites, LIBRARY_KEY, FAVOURITES_KEY } from '../.test-build/experience/NightLibrary.js';
import { SceneCapture, captureSize, chooseRecordingType } from '../.test-build/experience/SceneCapture.js';
import { smokeLayer, canopyAlpha, canopyStretch, illuminateSmoke } from '../.test-build/engine/SmokeCanopy.js';
import { SOUND_PROFILES, soundGeometry } from '../.test-build/engine/SoundProfiles.js';
import { SessionDiagnostics } from '../.test-build/experience/SessionDiagnostics.js';
import { RenderBudget } from '../.test-build/engine/RenderBudget.js';
import { resolveScreenLaunchProfile } from '../.test-build/engine/LaunchProfile.js';
import { stageFraming, waterfrontHorizon } from '../.test-build/engine/StageLayout.js';
const step=(s,seconds)=>{for(let i=0;i<Math.round(seconds*60);i++)s.advance(1/60);};
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k),data};};
const light=(more={})=>({x:0,y:50,z:0,r:1,g:.2,b:.04,age:.5,strength:1,...more});

test('recipe parser round trips a Unicode title without importing settings',()=>{
  const recipe=newRecipe('A night · रात',4294967295),parsed=parseRecipe(JSON.stringify(recipe));
  assert.deepEqual(parsed,recipe);assert.notEqual(parsed,recipe);assert.notEqual(parsed.cues,recipe.cues);
  assert.equal(parsed.engine,CONFIG_VERSION);
  assert.deepEqual(recipeFromHash(new URL(recipeLink(recipe,'https://example.test/?sound=1')).hash),recipe);
  assert.equal(new URL(recipeLink(recipe,'https://example.test/?sound=1')).search,'');
  assert.equal(recipeFromHash('#ordinary-anchor'),null);
});
for(const [name,mutate] of [
  ['wrong engine',r=>({...r,engine:'old'})],['wrong schema',r=>({...r,schema:7})],['extra settings',r=>({...r,reducedFlashes:false})],
  ['negative seed',r=>({...r,seed:-1})],['oversized seed',r=>({...r,seed:2**32})],['noninteger seed',r=>({...r,seed:.1})],['NaN seed',r=>({...r,seed:NaN})],
  ['blank title',r=>({...r,name:'  '})],['oversized title',r=>({...r,name:'a'.repeat(61)})],['control character title',r=>({...r,name:'x\nscript'})],
  ['unknown family',r=>({...r,cues:[{...r.cues[0],family:'unknown'}]})],['negative position',r=>({...r,cues:[{...r.cues[0],position:-.01}]})],
  ['oversized position',r=>({...r,cues:[{...r.cues[0],position:1.01}]})],['NaN position',r=>({...r,cues:[{...r.cues[0],position:NaN}]})],
  ['infinite gap',r=>({...r,cues:[{...r.cues[0],gap:Infinity}]})],['oversized gap',r=>({...r,cues:[{...r.cues[0],gap:31}]})],
  ['unknown phase',r=>({...r,cues:[{...r.cues[0],phase:'Other'}]})],['wrong phase order',r=>({...r,cues:[r.cues[2],r.cues[0]]})],
  ['extra cue payload',r=>({...r,cues:[{...r.cues[0],url:'https://evil.test/file.js'}]})],['empty cue list',r=>({...r,cues:[]})],
  ['too many cues',r=>({...r,cues:Array.from({length:13},()=>r.cues[0])})],['preset with cues',r=>({...r,kind:'finale'})],
  ['unknown kind',r=>({...r,kind:'script'})],['null recipe',()=>null],['array recipe',()=>[]],
]) test(`reject ${name} before playback`,()=>assert.throws(()=>parseRecipe(mutate(newRecipe()))));
test('untrusted large, deep and malformed inputs fail within bounded parsing',()=>{
  assert.throws(()=>parseRecipe(' '.repeat(12001)));assert.throws(()=>recipeFromHash('#night='+'a'.repeat(8193)));
  assert.throws(()=>recipeFromHash('#night=<script>'));assert.throws(()=>recipeFromHash('#night=abc'));
  assert.throws(()=>parseRecipe('['.repeat(2000)+']'.repeat(2000)));
  const bad=JSON.stringify(newRecipe()).replace('"schema":1','"__proto__":{"polluted":true},"schema":1');
  assert.throws(()=>parseRecipe(bad));assert.equal({}.polluted,undefined);
});
test('all catalog identities can round trip without index renumbering',()=>{
  for(const f of FAMILIES){const r=newRecipe();r.cues=[{family:f.id,gap:0,position:.5,phase:'Opening'}];assert.equal(parseRecipe(r).cues[0].family,f.id);}
});
test('preflight catches simultaneous heavy shells and uses Ultra reservations',()=>{
  const r=newRecipe();r.cues=Array.from({length:4},()=>({family:'grand-finale',position:.5,gap:0,phase:'Opening'}));
  const plan=planRecipe(r);assert.ok(plan.conflicts.some(m=>m.includes('room')));assert.ok(plan.conflicts.some(m=>m.includes('3-second')));
  assert.equal(plan.cues[0].reserve,familyReservation(4));
  assert.deepEqual(planRecipe(spaceRecipe(r)).conflicts,[]);
});
test('preflight respects exact immutable viewport flight height',()=>{
  for(const [width,height] of [[320,480],[393,851],[844,390],[1920,1080]]){
    const layout={viewport:{width,height},heroRect:{x:0,y:0,width,height:height-76}};layout.unobstructedScene=layout.heroRect;
    const {scale,baseline}=stageFraming(layout),shore=waterfrontHorizon(layout,width/height<.72)*height;
    const r=spaceRecipe(newRecipe());
    const profiles=r.cues.map(c=>resolveScreenLaunchProfile(layout,c.family,scale,y=>16+(baseline-y)/scale,width*c.position,undefined,shore));
    const plan=planRecipe(r,profiles);assert.deepEqual(plan.conflicts,[]);assert.ok(plan.cues.every(c=>Number.isFinite(c.flight)&&c.flight>0));
  }
});
for(const quality of ['low','standard','ultra'])for(const starter of [0,1,2])test(`personal ${quality} starter ${starter}: every cue admitted once and residue finishes`,()=>{
  const s=new Simulation(19);s.quality=quality;s.reducedFlashes=true;s.selected='sapphire-saturn';s.placement=.8;s.placementMode='random';
  const recipe=starterRecipe(starter,20261003);assert.deepEqual(planRecipe(recipe).conflicts,[]);
  s.personal.start(recipe);
  assert.equal(s.selected,'sapphire-saturn');assert.equal(s.placement,.8);assert.equal(s.quality,quality);assert.equal(s.reducedFlashes,true);
  const seen=[];let last=0;
  for(let i=0;i<120*60;i++){
    s.advance(1/60);
    if(s.rockets.some(r=>r.id>last)){for(const rocket of s.rockets)if(rocket.id>last){seen.push(FAMILIES[rocket.family].id);last=Math.max(last,rocket.id);}}
    assert.ok(s.snapshot().futureHeads+s.heads.count<=s.heads.capacity);
    assert.notEqual(s.personal.status,'blocked',s.personal.reason);
    s.drainEvents();
  }
  assert.equal(s.personal.status,'complete');assert.deepEqual(seen,recipe.cues.map(c=>c.family));assert.equal(s.launched,3);
  assert.equal(s.heads.count+s.trails.count+s.smoke.count+s.embers.count+s.lights.length+s.cues.length,0);
});
test('personal recipe replay has the same logical events with the same settings',()=>{
  const s=new Simulation(1),r=starterRecipe(1,9881);s.reducedFlashes=false;
  const run=()=>{s.personal.start(r);const events=[];for(let f=0;f<90*60;f++){s.advance(1/60);for(const e of s.drainEvents())events.push({...e});}return events;};
  assert.deepEqual(run(),run());
});
test('invalid personal recipe never resets or interrupts the current sky',()=>{
  const s=new Simulation(53);s.ignite();step(s,.5);const before=s.snapshot();
  assert.throws(()=>s.personal.start({...newRecipe(),engine:'mismatched'}));assert.deepEqual(s.snapshot(),before);
  const over=newRecipe();over.cues=[over.cues[2],over.cues[2]];assert.throws(()=>s.personal.start(over));assert.deepEqual(s.snapshot(),before);
});
test('pause does not catch up personal cues and stop retains falling effects',()=>{
  const s=new Simulation(52);s.personal.start(newRecipe());step(s,5);const before=s.snapshot();
  s.setPaused(true);step(s,50);assert.equal(s.time,before.time);assert.equal(s.personal.snapshot().cue,before.personal.cue);
  s.setPaused(false);s.stopShow();const launched=s.launched;assert.equal(s.personal.status,'stopped');assert.ok(s.heads.count>0);
  step(s,90);assert.equal(s.launched,launched);assert.equal(s.heads.count+s.trails.count,0);
});
test('manual selection cancels future personal cues but never changes a committed rocket',()=>{
  const s=new Simulation(731);s.personal.start(newRecipe());step(s,.5);const committed=s.committed?.id;
  s.select('ruby-dahlia');assert.equal(s.personal.status,'stopped');assert.equal(s.committed?.id,committed);step(s,40);assert.equal(s.launched,1);
});
test('unexpected admission pressure blocks visibly instead of dropping a cue',()=>{
  const s=new Simulation(1);s.personal.start(newRecipe());const original=s.ignite;s.ignite=()=>false;step(s,.1);s.ignite=original;
  assert.equal(s.personal.status,'blocked');assert.equal(s.personal.snapshot().cue,0);assert.match(s.personal.reason,/No cue was silently skipped/);
});
test('finite main preset completes on its own clock without including held musical scores',()=>{
  const s=new Simulation(7),recipe={...newRecipe('Finale',7),kind:'finale',cues:[]};s.personal.start(recipe);
  step(s,31);assert.equal(s.show,'finale');step(s,2);assert.equal(s.show,null);assert.ok(['falling','complete'].includes(s.personal.status));
  step(s,50);assert.equal(s.personal.status,'complete');assert.equal(s.heads.count+s.trails.count+s.smoke.count,0);
});
test('local nights are bounded, independently named and preserved on corrupt reads',()=>{
  const store=memory(),items=[{id:'one',recipe:newRecipe('First')},{id:'two',recipe:starterRecipe(1)}];
  writeNights(store,items);assert.deepEqual(readNights(store),{nights:items,warning:''});
  const text=store.getItem(LIBRARY_KEY);assert.throws(()=>writeNights(store,Array.from({length:21},(_,i)=>({id:`n-${i}`,recipe:newRecipe()}))));assert.equal(store.getItem(LIBRARY_KEY),text);
  assert.throws(()=>writeNights(store,[items[0],items[0]]));assert.equal(store.getItem(LIBRARY_KEY),text);
  store.setItem(LIBRARY_KEY,'{broken');assert.ok(readNights(store).warning);assert.equal(store.getItem(LIBRARY_KEY),'{broken');
});
test('storage quota and blocked reads report failure rather than claiming persistence',()=>{
  const store={getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('quota');},removeItem:()=>{}};
  assert.ok(readNights(store).warning);assert.deepEqual(readFavourites(store),[]);
  assert.throws(()=>writeNights(store,[{id:'one',recipe:newRecipe()}]),/could not save/);
  assert.throws(()=>writeFavourites(store,['gold-willow']),/could not save/);
});
test('favourites keep canonical identities/order and never mutate preferences or night library',()=>{
  const store=memory();store.setItem('firecrackers.preferences.v1','unchanged');writeNights(store,[{id:'one',recipe:newRecipe()}]);const nights=store.getItem(LIBRARY_KEY);
  writeFavourites(store,['opal-supernova','gold-willow','gold-willow']);assert.deepEqual(readFavourites(store),['gold-willow','opal-supernova']);
  store.setItem(FAVOURITES_KEY,JSON.stringify(['unrecognised','gold-willow']));assert.deepEqual(readFavourites(store),['gold-willow']);
  assert.equal(store.getItem(LIBRARY_KEY),nights);assert.equal(store.getItem('firecrackers.preferences.v1'),'unchanged');
});
test('smoke layers are deterministic, bounded, varied and age smoothly',()=>{
  const layers=new Set(Array.from({length:128},(_,i)=>smokeLayer(i)));assert.deepEqual([...layers].sort(),[0,1,2]);
  for(let id=0;id<30;id++){assert.equal(smokeLayer(id),smokeLayer(id));for(const age of [0,.1,1,3,6,9])assert.ok(canopyStretch(id,age)>=.89&&canopyStretch(id,age)<=1.11);}
  assert.equal(canopyAlpha(0,8,.5,2),0);assert.equal(canopyAlpha(8,8,.5,2),0);
  assert.ok(canopyAlpha(1,8,.5,2)>canopyAlpha(6,8,.5,2));
});
test('all twelve sources relight smoke beyond the old hard cutoff without bleaching its hue',()=>{
  const out=new Float32Array(6);illuminateSmoke([light()],40,50,0,false,out);assert.ok(out[0]>.1);assert.ok(Math.abs(out[0]/out[1]-5)<1e-5);assert.ok(out[3]<0);
  illuminateSmoke(Array.from({length:12},(_,i)=>light({r:i<4?1:0,g:i<4?0:1,b:0})),0,50,0,false,out);assert.ok(Math.abs(out[1]/out[0]-2)<1e-5);
  const normal=[...out];illuminateSmoke(Array.from({length:12},(_,i)=>light({r:i<4?1:0,g:i<4?0:1,b:0})),0,50,0,true,out);assert.ok(out[0]<normal[0]);
  illuminateSmoke([],0,0,0,false,out);assert.deepEqual([...out],[0,0,0,0,0,0]);
});
test('all thirteen sounds have distinct bounded authored profiles',()=>{
  assert.equal(SOUND_PROFILES.length,FAMILIES.length);assert.equal(new Set(SOUND_PROFILES.map(p=>JSON.stringify(p))).size,13);
  for(const p of SOUND_PROFILES){assert.ok(p.decay>=1&&p.decay<=2.4);assert.ok(p.grains>=0&&p.grains<=5);assert.ok(p.sample>=0&&p.sample<=2);assert.ok(p.whistle<=1100);}
});
test('spatial geometry remains stereo/mono compatible with increasing delay at distance',()=>{
  const left=soundGeometry(-60,70,0,120),right=soundGeometry(60,70,0,120),near=soundGeometry(0,20,0,120),far=soundGeometry(0,150,-100,120);
  assert.equal(left.pan,-right.pan);assert.equal(left.delay,right.delay);assert.ok(far.delay>near.delay);assert.ok(far.gain<near.gain);assert.ok(far.delay<=1.2);
});
test('adaptive resolution protects counts/pace and uses slow asymmetric recovery',()=>{
  const b=new RenderBudget();assert.equal(b.evaluate(70,true),1);assert.equal(b.evaluate(70,true),1);assert.equal(b.evaluate(70,true),.9);
  for(let i=0;i<60;i++)b.evaluate(80,true);assert.equal(b.scale,.65);
  for(let i=0;i<11;i++)assert.equal(b.evaluate(25,true),.65);assert.equal(b.evaluate(25,true),.7);
  assert.equal(b.evaluate(NaN,true),.7);assert.equal(b.evaluate(80,false),1);assert.equal(b.scale,1);
});
test('capture sizes are bounded without inventing resolution and encoder choice is detected',()=>{
  assert.deepEqual(captureSize(393,851),[393,851]);assert.deepEqual(captureSize(3840,2160),[1280,720]);assert.deepEqual(captureSize(2160,3840),[720,1280]);
  assert.equal(chooseRecordingType(()=>false),null);assert.equal(chooseRecordingType(t=>t==='video/mp4'),'video/mp4');assert.match(chooseRecordingType(()=>true),/webm/);
});


test('personal elapsed time freezes on completion and old Encore does not override a newly selected show',()=>{
  const sim=new Simulation(730);sim.personal.start(newRecipe('Complete once',731));step(sim,110);
  assert.equal(sim.personal.status,'complete');const elapsed=sim.personal.snapshot().elapsed;
  step(sim,8);assert.equal(sim.personal.snapshot().elapsed,elapsed);
  sim.startShow('festival');assert.equal(sim.personal.status,'idle');assert.equal(sim.personal.current,null);
  assert.equal(sim.snapshot().showTiming.preset,'festival');assert.equal(sim.snapshot().personal.estimate,0);
});
test('manual selection dismisses a completed personal Encore without removing its reusable recipe',()=>{
  const sim=new Simulation(730);sim.personal.start(newRecipe('Complete once',731));step(sim,110);
  assert.equal(sim.personal.status,'complete');sim.select('ruby-dahlia');
  assert.equal(sim.personal.status,'stopped');assert.equal(sim.personal.current.name,'Complete once');
  assert.equal(sim.ignite(),true);assert.equal(sim.personal.status,'stopped');
});
test('stopping a personal show freezes its progress and leaves only already committed effects',()=>{
  const sim=new Simulation(730);sim.personal.start(newRecipe('Stop once',731));step(sim,6);
  sim.stopShow();const state=sim.personal.snapshot(),launched=sim.launched;step(sim,40);
  assert.equal(sim.personal.snapshot().elapsed,state.elapsed);assert.equal(sim.launched,launched);
});


test('diagnostics stop at 60 seconds even when idle or paused',()=>{
  const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout;
  let callback,cleared=0;
  globalThis.setTimeout=(fn,delay)=>{assert.equal(delay,60000);callback=fn;return 123;};
  globalThis.clearTimeout=id=>{assert.equal(id,123);cleared++;};
  try{const d=new SessionDiagnostics();d.start();d.pause();assert.equal(d.active,true);callback();assert.equal(d.active,false);assert.equal(cleared,1);d.start();d.stop();assert.equal(cleared,2);}
  finally{globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
});
test('disposed capture cannot start and releases supplied audio on rejection',async()=>{
  const c=new SceneCapture();c.dispose();let releases=0;
  assert.throws(()=>c.start({},()=>{},15,{stream:{},release:()=>releases++}),/Finish/);
  assert.equal(releases,1);await assert.rejects(()=>c.photo({},()=>{}),/closed/);
});
