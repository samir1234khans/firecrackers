import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { SHOW_SCORES, SHOW_THEMES, CinematicDirector } from '../.test-build/engine/CinematicDirector.js';
import { newRecipe, parseRecipe, recipeLink, recipeFromHash, planRecipe } from '../.test-build/experience/ShowRecipe.js';
import { defaults,loadPreferences } from '../.test-build/platform/preferences.js';
const step=(s,n)=>{for(let i=0;i<Math.ceil(n*60);i++){s.advance(1/60);s.drainEvents();}};
test('reconciled scores retain all thirteen families and immutable cue definitions',()=>{
 const seen=new Set();for(const score of Object.values(SHOW_SCORES)){assert.ok(Object.isFrozen(score));assert.equal(score.filter(c=>c.featured).length,6);for(const c of score){assert.ok(c.impact<75&&Object.isFrozen(c));seen.add(c.family);}}
 assert.equal(seen.size,13);
});
test('phase-boundary selection never restarts a score or loses its pending theme',()=>{
 const d=new CinematicDirector();d.reset(0,'prismatic');d.update(12);d.request('golden');assert.equal(d.theme,'prismatic');assert.equal(d.pendingTheme,'golden');d.update(15);assert.equal(d.theme,'golden');assert.equal(d.pendingTheme,null);assert.equal(d.phase,15);d.update(90);assert.equal(d.phase,0);assert.equal(d.cycle,1);
});
test('all three themes finish at 90s, retain V4 response and reserve all future heads',()=>{
 for(const theme of SHOW_THEMES){const s=new Simulation(62);s.setShowThemes(theme,theme);s.reducedFlashes=false;s.startShow('finale');let peak=0;
 for(let i=0;i<89*60;i++){s.advance(1/60);s.drainEvents();const state=s.snapshot();assert.ok(state.headCount+state.futureHeads<=s.heads.capacity);peak=Math.max(peak,s.heads.count);assert.ok(state.cinematicResponse.exposure>=.85);}
 assert.equal(s.show,'finale');assert.ok(peak>100);assert.ok(s.cinematic.admitted>=4);assert.ok(s.cinematic.maxImpactError<=1/30+.00001);step(s,1.1);assert.equal(s.show,null);assert.equal(s.snapshot().showTiming.duration,90);step(s,35);assert.equal(s.heads.count+s.trails.count+s.cues.length+s.lights.length,0);}
});
test('theme-bearing Finale recipe survives save/share/replay and keeps selected controls',()=>{
 const recipe=parseRecipe({...newRecipe('Moonlit night',9),kind:'finale',cues:[],theme:'moonlit'});assert.equal(planRecipe(recipe).seconds,120);
 assert.deepEqual(recipeFromHash(new URL(recipeLink(recipe,'https://example.test/')).hash),recipe);
 const s=new Simulation();s.select('sapphire-saturn');s.setPlacement(.7);s.personal.start(recipe);assert.equal(s.cinematic.theme,'moonlit');assert.equal(s.selected,'sapphire-saturn');assert.equal(s.placement,.7);step(s,40);assert.equal(s.personal.status,'playing');s.setPaused(true);const t=s.time;step(s,8);assert.equal(s.time,t);s.setPaused(false);step(s,90);assert.equal(s.personal.status,'complete');assert.equal(s.personal.current.theme,'moonlit');
 assert.throws(()=>parseRecipe({...recipe,theme:'https://evil.invalid/'}),/theme/);assert.throws(()=>parseRecipe({...newRecipe(),theme:'moonlit'}),/theme/);
});
test('upgrading preferences retains richer-night and cinematic options while music remains opt-in',()=>{
 for(const version of [1,2,3]){globalThis.localStorage={getItem:()=>JSON.stringify({version,sound:true,headphones:true,adaptiveResolution:false,cinematicExposure:false,cameraMotion:true,showProgress:false,family:'royal-phoenix'})};const p=loadPreferences();assert.equal(p.version,4);assert.equal(p.sound,true);assert.equal(p.showMusic,false);assert.equal(p.headphones,true);assert.equal(p.adaptiveResolution,false);assert.equal(p.cinematicExposure,false);assert.equal(p.cameraMotion,true);assert.equal(p.showProgress,false);assert.equal(p.family,'royal-phoenix');}
 delete globalThis.localStorage;assert.equal(defaults().showMusic,false);
});
test('automatic cache migration cannot navigate away from a recording or unsaved Studio draft',async()=>{
 const text=await readFile('assets-source/service-worker/cache-lifecycle.template.js','utf8');assert.doesNotMatch(text,/\.navigate\(/);const vite=await readFile('vite.config.ts','utf8');assert.match(vite,/registerType:'prompt'/);assert.match(vite,/skipWaiting:false/);
});

// CI receives the unchanged original asset manifest from the held source, not regenerated music.
test('all eighteen original music assets match the recorded provenance',async()=>{
 const manifest=JSON.parse(await readFile('assets-source/music/manifest.json','utf8'));assert.equal(manifest.original,true);assert.equal(manifest.assets.length,18);
 for(const entry of manifest.assets){const bytes=await readFile('public/'+entry.file);assert.equal(bytes.subarray(0,4).toString(),'fLaC');assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);assert.equal(entry.duration,15.15);assert.ok(entry.peakDbfs<=-6);}
});
