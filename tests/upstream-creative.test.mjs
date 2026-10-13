import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSkyText, validateLightStrokes, skyTextPaths, emitSkyArt, SKY_GLYPHS } from '../.test-build/experience/SkyArt.js';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { CONFIG_VERSION } from '../.test-build/engine/catalog.js';
import { parseRecipe, recipeFromHash, recipeLink, newRecipe } from '../.test-build/experience/ShowRecipe.js';

test('complete original alphabet, bounded text and normalized drawing validation',()=>{
 for(const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')assert.ok(SKY_GLYPHS[c]?.length,c);
 assert.equal(validateSkyText('firecrackers'),'FIRECRACKERS');
 for(const bad of ['','X'.repeat(25),'A\nB\nC','<script>','हिन्दी'])assert.throws(()=>validateSkyText(bad));
 assert.throws(()=>validateLightStrokes([[[0,0],[NaN,1]]]));
 assert.throws(()=>validateLightStrokes([Array.from({length:257},()=>[.2,.2])]));
 assert.deepEqual(validateLightStrokes([[[.1,.2],[.3,.4]]]),[[[.1,.2],[.3,.4]]]);
});
test('lettering is atomic, frozen while paused, cools completely and respects existing reservations',()=>{
 for(const quality of ['low','standard','ultra']){
  const sim=new Simulation(12);sim.quality=quality;
  assert.equal(emitSkyArt(sim,skyTextPaths('FIRECRACKERS')),true,quality);
  const count=sim.trails.count;assert.ok(count>30);assert.ok(count<=640);
  sim.setPaused(true);sim.advance(1);assert.equal(sim.trails.count,count);
  sim.setPaused(false);for(let i=0;i<660;i++)sim.advance(1/60);
  assert.equal(sim.trails.count,0);assert.equal(sim.heads.count,0);
  sim.setPaused(true);assert.equal(emitSkyArt(sim,skyTextPaths('HI')),false);
 }
});
test('schema one stays strict, schema two creative content round-trips without changing comfort settings',()=>{
 const old=newRecipe();assert.equal(parseRecipe(old).schema,1);
 const cues=[{family:'gold-willow',position:.5,gap:0,phase:'Opening',type:'text',text:'HELLO SKY'}];
 const recipe={schema:2,engine:CONFIG_VERSION,name:'Lettered night',seed:42,kind:'cues',cues};
 const link=recipeLink(recipe,'https://example.test/');assert.deepEqual(recipeFromHash(new URL(link).hash),recipe);
 assert.throws(()=>parseRecipe({...recipe,schema:1}));
 assert.throws(()=>parseRecipe({...recipe,cues:[{...cues[0],volume:1}]}));
 assert.throws(()=>parseRecipe({...recipe,cues:[{...cues[0],type:'group',text:undefined,group:['unknown','gold-willow']}]}));
 assert.throws(()=>parseRecipe({...recipe,engine:'2020-01-01.1'}));
});
