import test from 'node:test';
import assert from 'node:assert/strict';
import { StartupProgress, SCENE_STARTUP_DEADLINE_MS } from '../.test-build/engine/StartupProgress.js';
import { PauseIntent } from '../.test-build/platform/PauseIntent.js';
const assets = (completed,total=9,extra={}) => ({completed,total,pending:completed<total,degraded:false,detail:'Preparing waterfront',...extra});
test('graphics reports actual selection and initialization stages without invented transfer progress',()=>{
 const p=new StartupProgress();assert.deepEqual(p.snapshot,{phase:'graphics',completed:0,total:2,detail:'Choosing graphics',pending:true,degraded:false});
 p.graphics(1,'Starting WebGL');assert.equal(p.snapshot.completed,1);assert.equal(p.snapshot.detail,'Starting WebGL');
 p.update(assets(7),99999);assert.equal(p.snapshot.phase,'graphics');assert.equal(p.snapshot.completed,1,'asset and elapsed time cannot finish uninitialized graphics');
 p.continue();assert.equal(p.snapshot.pending,true,'continue cannot bypass graphics initialization');
});
test('decoded but inactive enhancements remain pending until renderer activation settles',()=>{
 const p=new StartupProgress();p.initialized(100,assets(0));
 assert.equal(p.snapshot.phase,'scene');assert.equal(p.snapshot.completed,0);
 p.update(assets(4),800);assert.equal(p.snapshot.completed,4);assert.equal(p.snapshot.pending,true);
 p.update(assets(9),801);assert.equal(p.snapshot.phase,'ready');assert.equal(p.snapshot.pending,false);assert.equal(p.snapshot.degraded,false,'all actual tasks finish without a minimum delay');
});
test('warm cache and procedural scene with no pending tasks present immediately',()=>{
 for(const value of [assets(9),assets(0,0)]){const p=new StartupProgress();p.initialized(25,value);assert.equal(p.snapshot.phase,'ready');assert.equal(p.snapshot.pending,false);}
});
test('settled failures present reduced detail automatically rather than waiting forever',()=>{
 const p=new StartupProgress();p.initialized(10,assets(9,9,{degraded:true}));
 assert.equal(p.snapshot.pending,false);assert.equal(p.snapshot.phase,'ready');assert.equal(p.snapshot.completed,9);assert.equal(p.snapshot.degraded,true);assert.match(p.snapshot.detail,/reduced scene detail/);
});
test('scene deadline changes feedback without fabricating completion or starting the scene',()=>{
 const p=new StartupProgress();p.initialized(100,assets(3));p.update(assets(3),100+SCENE_STARTUP_DEADLINE_MS-1);
 assert.equal(p.snapshot.degraded,false);p.update(assets(3),100+SCENE_STARTUP_DEADLINE_MS);
 assert.equal(p.snapshot.completed,3);assert.equal(p.snapshot.pending,true);assert.equal(p.snapshot.degraded,true);assert.match(p.snapshot.detail,/continue/);
});
test('explicit continuation is available immediately and keeps unfinished task counts truthful',()=>{
 const p=new StartupProgress();p.initialized(0,assets(2));p.continue();p.update(assets(2),1);
 assert.equal(p.snapshot.pending,false);assert.equal(p.snapshot.phase,'ready');assert.equal(p.snapshot.completed,2);assert.equal(p.snapshot.total,9);assert.equal(p.snapshot.degraded,true);
 p.update(assets(9),1000);assert.equal(p.snapshot.degraded,false);assert.equal(p.snapshot.completed,9,'later activation still reports actual settlement');
});
test('recovery cannot re-hide or re-gate a scene already presented',()=>{
 const p=new StartupProgress();p.initialized(0,assets(9));p.update(assets(0,1),50);
 assert.equal(p.snapshot.phase,'ready');assert.equal(p.snapshot.pending,false);
});
test('startup pause ownership preserves manually paused, overlay and hidden state',()=>{
 const pause=new PauseIntent();pause.setManual(true);pause.block('startup',true);pause.block('startup',false);assert.equal(pause.paused,true);
 pause.setManual(false);pause.block('startup',true);pause.block('overlay',true);pause.block('startup',false);assert.equal(pause.paused,true);
 pause.block('overlay',false);pause.block('hidden',true);pause.block('startup',true);pause.block('startup',false);assert.equal(pause.paused,true);
 pause.block('hidden',false);assert.equal(pause.paused,false);
});
