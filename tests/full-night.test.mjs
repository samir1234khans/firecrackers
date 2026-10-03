import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { FAMILIES, BUDGETS, familyReservation } from '../.test-build/engine/catalog.js';
import { burstLightEnergy, gatherBurstLighting, limitBurstRadiance, BURST_LIGHT_CAPACITY, BURST_LIGHT_LIFETIME } from '../.test-build/engine/BurstLighting.js';
import { NativeRenderRecovery } from '../.test-build/engine/RendererRecovery.js';
import { resolveScreenLaunchProfile, resolveLaunchAimScreenX } from '../.test-build/engine/LaunchProfile.js';
import { stageFraming, waterfrontHorizon } from '../.test-build/engine/StageLayout.js';
const advance = (s, seconds) => { for (let i = 0; i < Math.round(seconds * 60); i++) s.advance(1 / 60); };
const light = (values = {}) => ({ x: 0, y: 60, z: -20, r: 1, g: .15, b: .05, age: .4, strength: 1, ...values });

test('all twelve live lights contribute without allocating or depending on quality', () => {
  const out = new Float32Array(7), lights = Array.from({length: BURST_LIGHT_CAPACITY}, (_, i) => light({ x: i, r: i < 4 ? 1 : 0, g: i < 4 ? 0 : 1, b: 0 }));
  gatherBurstLighting(lights, out);
  assert.ok(Math.abs(out[1] / out[0] - 2) < 1e-6, 'lights five through twelve are not discarded');
  assert.ok(Math.abs(out[3] - 5.5) < 1e-5);
  const snapshot = [...out]; gatherBurstLighting([...lights, light({strength: 100})], out);
  assert.deepEqual([...out], snapshot, 'work stays bounded at twelve');
  gatherBurstLighting([], out); assert.deepEqual([...out], [0,0,0,0,0,0,0], 'no stale wash');
});
test('light envelope has a smooth attack, a visible tail and a clean end', () => {
  assert.ok(burstLightEnergy(light({age: .18})) > burstLightEnergy(light({age: 0})));
  assert.ok(burstLightEnergy(light({age: 3})) > .05);
  assert.ok(burstLightEnergy(light({age: BURST_LIGHT_LIFETIME - .01})) < .001);
  assert.equal(burstLightEnergy(light({age: BURST_LIGHT_LIFETIME})), 0);
  for (const age of [0,.1,.4,1,2,3,4]) assert.ok(burstLightEnergy(light({age}), true) <= burstLightEnergy(light({age})));
  for (const age of [-1, NaN, Infinity]) assert.equal(burstLightEnergy(light({age})), 0);
});
test('radiance limiting preserves shell hue rather than clipping channels to white', () => {
  for (const rgb of [[10,1,.2], [.2,1,10], [1,10,.2]]) {
    const out = new Float32Array([...rgb, 2,3,4,8]); limitBurstRadiance(out, .7);
    assert.ok(Math.max(...out.slice(0,3)) < .7);
    assert.ok(Math.abs(out[0] / out[1] - rgb[0] / rgb[1]) < 1e-5);
    assert.deepEqual([...out.slice(3)], [2,3,4,8]);
  }
});
test('invalid source positions cannot contaminate a whole scene wash', () => {
  const out = new Float32Array(7);
  gatherBurstLighting([light({x: NaN}), light({strength: Infinity}), light()], out);
  assert.ok([...out].every(Number.isFinite)); assert.equal(out[3], 0);
  assert.ok(Math.abs(out[6] - burstLightEnergy(light())) < 1e-6);
});
for (const quality of ['low','standard','ultra']) {
  test(`Peony/${quality}: complete count, larger heads, core and falling colour after 3s`, () => {
    const s = new Simulation(123); s.quality = quality;
    assert.ok(s.burstAt('multicolor-peony', 0, 100, .5));
    const n = Math.round(FAMILIES[1].count * BUDGETS[quality].scale);
    assert.equal(s.heads.count, n, 'geometry fitting cannot thin the shell a second time');
    const speeds = Array.from({length: n}, (_, i) => Math.hypot(s.heads.vx[i], s.heads.vy[i], s.heads.vz[i]));
    assert.ok(Math.max(...speeds) > Math.min(...speeds) * 2, 'slower inner stars form a core');
    assert.ok([...s.heads.size.slice(0,n)].every(size => size >= .18));
    advance(s, 3.2); assert.equal(s.heads.count, n); assert.ok(s.trails.count > n);
    assert.ok(s.heads.x.slice(0,n).some(x => Math.abs(x) > 10));
  });
  test(`Crossette/${quality}: at least 64 authored parents, all four travelling leaves survive`, () => {
    const s = new Simulation(731); s.quality = quality;
    assert.ok(s.burstAt('silver-crossette-crackle', 0, 100));
    const parents = Math.round(64 * BUDGETS[quality].scale);
    assert.equal(s.heads.count, parents);
    advance(s, 1.5); assert.equal(s.heads.count, parents * 4);
    assert.ok([...s.heads.split.slice(0,s.heads.count)].every(v => v === 0), 'leaves do not recursively split');
    const ids = [...s.heads.id.slice(0,s.heads.count)], xs = [...s.heads.x.slice(0,s.heads.count)];
    advance(s, .5); assert.deepEqual([...s.heads.id.slice(0,s.heads.count)], ids);
    assert.ok(xs.some((x,i) => Math.abs(s.heads.x[i] - x) > .5));
  });
  test(`Finale/${quality}: immediate full first shell and five fully reserved moving breaks`, () => {
    for (const seed of [1,61,422]) {
      const s = new Simulation(seed); s.quality = quality;
      assert.ok(s.burstAt('grand-finale', 0, 120));
      assert.equal(s.bursts, 1); assert.equal(s.cues.length, 5);
      assert.equal(s.heads.count, Math.round(FAMILIES[1].count * BUDGETS[quality].scale));
      assert.ok(s.heads.count + s.snapshot().futureHeads <= familyReservation(4));
      const initial = structuredClone(s.cues);
      advance(s, .5);
      assert.ok(s.cues.every((cue, i) => Math.hypot(cue.x-initial[i].x, cue.y-initial[i].y, cue.z-initial[i].z) > .1));
      s.quality = 'ultra';
      for (let frame = 0; frame < 600; frame++) {
        s.advance(1/60);
        assert.ok(s.heads.count + s.snapshot().futureHeads <= s.heads.capacity);
      }
      assert.equal(s.bursts, 6); assert.equal(s.cues.length, 0);
      advance(s, 25); assert.equal(s.heads.count + s.trails.count + s.lights.length, 0);
    }
  });
}
test('finale fits the actual shore while widening across a desktop sky', () => {
  let wideSpread = 0, phoneSpread = 0;
  for (const [width,height] of [[320,480],[393,851],[844,390],[1280,800],[1920,1080]]) {
    const layout = {viewport:{width,height},heroRect:{x:0,y:0,width,height:height-76}};
    layout.unobstructedScene = layout.heroRect;
    const {scale,baseline} = stageFraming(layout);
    const shore = waterfrontHorizon(layout,width/height < .72) * height;
    const profile = resolveScreenLaunchProfile(layout,'grand-finale',scale,y=>16+(baseline-y)/scale, width/2,undefined,shore);
    assert.ok(profile.effectScale > 0 && profile.finaleSpread >= 0);
    const aim = resolveLaunchAimScreenX(layout,'grand-finale',scale,0,profile.effectScale);
    assert.ok(aim >= width*.48 && aim <= width*.52);
    const topMargin = profile.centerFraction*layout.heroRect.height - 65*profile.effectScale*scale*1.2;
    assert.ok(topMargin >= 0);
    if (width === 1920) wideSpread = profile.finaleSpread;
    if (width === 393) phoneSpread = profile.finaleSpread;
  }
  assert.ok(wideSpread > phoneSpread * 3, 'wide sky cannot retain the narrow fixed-radius composition');
});
test('transient native overload reduces detail without replacing the renderer', () => {
  const p = new NativeRenderRecovery();
  assert.equal(p.observe(450,true,false), null); assert.equal(p.observe(600,true,false), null);
  assert.equal(p.observe(700,true,false), 'reduce-quality');
  for (let i=0;i<3;i++) assert.equal(p.observe(700,true,true), null);
  for (let i=0;i<120;i++) assert.equal(p.observe(33.3,true,true), null);
});
test('Low native recovery still falls back for sustained unusable frames', () => {
  const p = new NativeRenderRecovery(); let action = null, frames = 0;
  while (!action && frames < 100) { action = p.observe(300,true,true); frames++; }
  assert.equal(action,'recover'); assert.ok(frames >= 24 && frames*300 >= 6000);
});
test('hidden, idle and healthy transitions clear native overload evidence', () => {
  for (const reset of ['idle','explicit','healthy']) {
    const p = new NativeRenderRecovery();
    for(let i=0;i<20;i++) assert.equal(p.observe(300,true,true),null);
    if(reset==='idle') p.observe(300,false,true);
    else if(reset==='explicit') p.reset();
    else for(let i=0;i<180;i++) p.observe(33.3,true,true);
    for(let i=0;i<4;i++) assert.equal(p.observe(300,true,true),null);
    assert.equal(p.observe(NaN,true,true),null);
  }
});
