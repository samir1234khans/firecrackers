import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { CinematicDirector, SHOW_SCORES, SHOW_THEMES } from '../.test-build/engine/CinematicDirector.js';
import { BurstLightFrame } from '../.test-build/engine/BurstLightFrame.js';
import { defaults, loadPreferences } from '../.test-build/platform/preferences.js';
import { parsePresentation, presentationLink } from '../.test-build/platform/presentation.js';
const run=(s,n)=>{for(let i=0;i<Math.ceil(n*60);i++){s.advance(1/60);s.drainEvents();}};

test('three immutable scores jointly feature all thirteen identities and safe formations',()=>{
 const families=new Set();for(const score of Object.values(SHOW_SCORES)){assert.ok(Object.isFrozen(score));assert.equal(score.filter(c=>c.featured).length,6);
  for(const cue of score){assert.ok(Object.isFrozen(cue));assert.ok(cue.impact<75);assert.ok([.2,.5,.8].includes(cue.placement));assert.ok(cue.apex>=.35&&cue.apex<=.70);families.add(cue.family);}}
 assert.deepEqual([...families].sort((a,b)=>a-b),Array.from({length:13},(_,i)=>i));
});
test('prepared launches use solved flight timing without advancing manual randomness',()=>{
 const a=new Simulation(17),b=new Simulation(17);
 a.setLaunchProfileResolver(()=>({apex:92,apexMin:85,apexMax:105,centerFraction:.34,padX:8,ground:12,aimX:9}));
 for(let i=0;i<100;i++){const shot=a.prepareAutoShot(7,.8,.7);assert.equal(shot.top,99);assert.equal(shot.x,8);assert.equal(shot.fuse,40/60);assert.ok(shot.lead>shot.ascent);}
 a.setLaunchProfileResolver(null);a.ignite();b.ignite();assert.deepEqual(a.committed,b.committed);
});
for(const theme of SHOW_THEMES) for(const quality of ['standard','ultra'])test(`${theme}/${quality}: complete 90s score, bounded resources and actual impact timing`,()=>{
 const s=new Simulation(42);s.quality=quality;s.reducedFlashes=false;s.setShowThemes(theme,'cycle');s.startShow('finale');
 for(let i=0;i<90*60;i++){s.advance(1/60);s.drainEvents();assert.ok(s.heads.count+s.snapshot().futureHeads<=3072);}
 assert.ok(s.cinematic.admitted>=6,JSON.stringify(s.cinematic.snapshot()));
 assert.ok(s.cinematic.maxImpactError<=1/30+1e-7,JSON.stringify(s.cinematic.snapshot()));
 run(s,.1);assert.equal(s.show,null);const count=s.launched;run(s,40);assert.equal(s.launched,count);assert.equal(s.heads.count+s.cues.length+s.rockets.length,0);
});
test('cycle changes at 90s; a requested theme changes at the next phrase without restarting',()=>{
 const d=new CinematicDirector();d.reset(10,'cycle');d.update(22);d.request('golden');d.update(24.99);assert.equal(d.theme,'moonlit');d.update(25);assert.equal(d.theme,'golden');assert.equal(d.phase,15);assert.equal(d.pendingTheme,null);
 d.request('cycle');d.update(40);assert.equal(d.phase,30);assert.equal(d.theme,'moonlit');d.update(100);assert.equal(d.theme,'golden');assert.equal(d.phase,0);d.update(190);assert.equal(d.theme,'prismatic');assert.equal(d.phase,0);
});
test('fixed-clock fractional boundaries restart every endless score at its opening',()=>{
 const d=new CinematicDirector();d.reset(0,'cycle');d.update(89.999999999999);assert.equal(d.theme,'golden');assert.equal(d.phase,0);assert.equal(d.cue.impact,5);d.update(90.0166666667);assert.equal(d.cue.impact,5);
 const s=new Simulation(6);s.setShowThemes('prismatic','cycle');s.startShow('festival');run(s,89);const first=s.cinematic.admitted;run(s,90);assert.ok(s.cinematic.admitted-first>=6);run(s,90);assert.ok(s.cinematic.admitted-first>=12);
});
test('a theme boundary preserves an admitted shot and the saved Manual placement',()=>{
 const s=new Simulation(9);s.reducedFlashes=false;s.setPlacement(.91);s.setShowThemes('moonlit','moonlit');s.startShow('festival');run(s,14.8);
 const shot=s.rockets.find(r=>r.stage!=='afterglow');assert.ok(shot);s.setShowThemes('moonlit','golden');run(s,.3);
 assert.equal(s.cinematic.theme,'golden');assert.ok(s.rockets.includes(shot));assert.equal(s.placement,.91);
 s.select('gold-willow');run(s,40);assert.equal(s.ignite(),true);assert.equal(s.committed.normalizedPlacement,.91);
});
test('paused score freezes, and stopped or reset shows cancel pending intent',()=>{
 const s=new Simulation();s.startShow('festival');run(s,8);s.setShowThemes('golden','golden');s.setPaused(true);const before=s.snapshot();run(s,30);assert.deepEqual(s.snapshot(),before);
 s.setPaused(false);s.advance(60);assert.ok(s.time-before.time<=.1000001);s.stopShow();const n=s.launched;run(s,20);assert.ok(s.launched<=n+1);s.reset();assert.equal(s.cinematic.admitted,0);
});
test('reduced flashes maintains at least three seconds between primary admissions in every theme',()=>{
 for(const theme of SHOW_THEMES){const s=new Simulation();s.setShowThemes(theme,theme);s.startShow('festival');let last=-100;
  for(let i=0;i<120*60;i++){s.advance(1/60);for(const e of s.drainEvents())if(e.type==='fuse'){assert.ok(e.time-last>=3-1e-8);last=e.time;}}}
});
test('shared lights are strongest-first, tier bounded, comfort limited and spatially coherent',()=>{
 const frame=new BurstLightFrame(),lights=Array.from({length:64},(_,i)=>({x:i,y:20,z:0,r:1,g:.3,b:.1,age:0,strength:i/64}));
 frame.update(lights,'ultra',false);assert.equal(frame.count,4);assert.equal(frame.sources[0].x,63);const power=frame.energies[0];
 frame.update(lights,'standard',true);assert.equal(frame.count,2);assert.ok(frame.energies[0]<power);const near=new Float32Array(3),far=new Float32Array(3);frame.sample(63,20,0,39,near);frame.sample(-400,20,0,39,far);assert.ok(near[0]>far[0]);
 frame.update(lights,'low',false);assert.equal(frame.count,1);frame.update([],'ultra',false);assert.equal(frame.count,0);
});
test('schema 4 preserves earlier preferences and separates music opt-in from master sound',()=>{
 for(const version of [1,2,3]){globalThis.localStorage={getItem:()=>JSON.stringify({version,family:'royal-phoenix',placement:.83,sound:true,reducedFlashes:false,alwaysPace:4})};const p=loadPreferences();assert.equal(p.version,4);assert.equal(p.family,'royal-phoenix');assert.equal(p.placement,.83);assert.equal(p.sound,true);assert.equal(p.showMusic,false);assert.equal(p.endlessTheme,'cycle');}
 globalThis.localStorage={getItem:()=>JSON.stringify({...defaults(),showMusic:true,musicVolume:.2,endlessTheme:'golden'})};assert.equal(loadPreferences().showMusic,true);assert.equal(loadPreferences().musicVolume,.2);delete globalThis.localStorage;
});
test('display themes roundtrip, without music consent in URLs',()=>{
 const p=parsePresentation('?display=scene&show=finale&theme=moonlit&music=1');assert.equal(p.theme,'moonlit');assert.ok(!('showMusic' in p));const url=presentationLink('https://example.test/',p);assert.ok(!url.includes('music='));assert.deepEqual(parsePresentation(new URL(url).search),p);assert.equal(parsePresentation('?show=calm&theme=golden').theme,undefined);
});
test('all 18 original FLAC assets have recorded source hashes, bounded size and exact phrase handles',async()=>{
 const manifest=JSON.parse(await readFile('assets-source/music/manifest.json','utf8'));assert.equal(manifest.original,true);assert.equal(manifest.assets.length,18);assert.ok(manifest.totalBytes<18*1024*1024);
 for(const entry of manifest.assets){const bytes=await readFile('public/'+entry.file);assert.equal(bytes.subarray(0,4).toString(),'fLaC');assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);assert.equal(entry.duration,15.15);assert.ok(entry.peakDbfs<=-6);assert.equal(entry.frames,363600);}
});
