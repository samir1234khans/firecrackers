import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { BUDGETS } from '../.test-build/engine/catalog.js';
const out=process.argv[2]||'test-results/always-play-soak';await mkdir(out,{recursive:true});
const seconds=Number(process.env.ALWAYS_SOAK_SECONDS||7200);const rows=[];
for(const quality of ['low','standard','ultra'])for(let pace=1;pace<=4;pace++){
 const s=new Simulation((process.env.ALWAYS_SOAK_MIXED==='1'?20260916:42)+pace);s.quality=quality;s.always.setPace(pace);s.reducedFlashes=false;s.startShow('always');
 const peak={heads:0,reserved:0,trails:0,smoke:0,units:0};
 for(let i=0;i<seconds*60;i++){
  if(process.env.ALWAYS_SOAK_MIXED==='1'){s.reducedFlashes=Math.floor(i/1800)%2===1;s.reducedMotion=Math.floor(i/2700)%2===1;}
  s.advance(1/60);s.drainEvents();
  if(i%60===0){
   const state=s.snapshot();
   assert.ok(state.headCount+state.futureHeads<=3072);assert.ok(state.trailCount<=BUDGETS[quality].trails);
   assert.ok(state.smoke<=BUDGETS[quality].smoke);assert.ok(state.activeUnits<=BUDGETS[quality].units);assert.ok(state.embers<=768);
   assert.ok(s.rockets.length<=16&&s.cues.length<=64&&s.lights.length<=64);assert.ok(Number.isFinite(state.time)&&Number.isFinite(state.always.interval));
   peak.heads=Math.max(peak.heads,state.headCount);peak.reserved=Math.max(peak.reserved,state.headCount+state.futureHeads);
   peak.trails=Math.max(peak.trails,state.trailCount);peak.smoke=Math.max(peak.smoke,state.smoke);peak.units=Math.max(peak.units,state.activeUnits);
  }
 }
 assert.ok(s.always.counts.every(n=>n>0));assert.equal(s.show,'always');
 rows.push({quality,pace,seconds,rate:s.always.admitted/(seconds/60),peak,director:s.always.snapshot()});
 console.log('PASS',quality,pace,rows.at(-1).rate.toFixed(1));
 await writeFile(`${out}/report.json`,JSON.stringify({method:'Fixed-clock logical soak. No rendering, physical phone or thermal qualification.',mixedComfort:process.env.ALWAYS_SOAK_MIXED==='1',rows},null,2));
}
