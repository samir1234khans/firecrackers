import { Simulation } from '../.test-build/engine/Simulation.js';
import assert from 'node:assert/strict';
const seconds=Number(process.env.SOAK_SECONDS||7200),s=new Simulation(44221);s.quality=process.env.SOAK_QUALITY||'standard';s.reducedFlashes=false;s.startShow('festival');
let maxHeads=0,maxTrails=0,maxSmoke=0,maxCues=0,maxRockets=0;const start=performance.now();
for(let i=0;i<seconds*60;i++){
  s.advance(1/60);s.drainEvents();maxHeads=Math.max(maxHeads,s.heads.count);maxTrails=Math.max(maxTrails,s.trails.count);maxSmoke=Math.max(maxSmoke,s.smoke.count);maxCues=Math.max(maxCues,s.cues.length);maxRockets=Math.max(maxRockets,s.rockets.length);
  assert.ok(s.heads.count<=3072&&s.trails.count<=24000&&s.smoke.count<=160&&s.cues.length<=14&&s.rockets.length<=6);
}
console.log(JSON.stringify({kind:'accelerated logical simulation; not a GPU or physical-device soak',seconds,quality:s.quality,wallSeconds:(performance.now()-start)/1000,launched:s.launched,bursts:s.bursts,maxHeads,maxTrails,maxSmoke,maxCues,maxRockets},null,2));
