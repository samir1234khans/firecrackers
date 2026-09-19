import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { Trails } from '../.test-build/engine/Trails.js';
import { Pool } from '../.test-build/engine/Pool.js';
import { BUDGETS } from '../.test-build/engine/catalog.js';
import { QualityGovernor } from '../.test-build/engine/QualityGovernor.js';
import { PauseIntent } from '../.test-build/platform/PauseIntent.js';
import { WakeLockController } from '../.test-build/platform/WakeLockController.js';
import { parsePresentation, presentationLink } from '../.test-build/platform/presentation.js';
const run = (s, seconds) => { for (let i = 0; i < Math.ceil(seconds * 60); i++) s.advance(1 / 60); };

for (const phase of ['fuse', 'thrust', 'coast', 'afterglow']) {
  test(`virtual motion reaches ${phase} without non-finite state`, () => {
    const s = new Simulation(123); s.ignite(); let found = false;
    for (let i = 0; i < 8 * 60; i++) {
      s.advance(1 / 60);
      const r = s.rockets[0];
      if (r?.phase === phase) { found = true; assert.ok(Number.isFinite(r.x + r.y + r.z + r.vy)); }
    }
    assert.ok(found);
  });
}
test('powered ascent accelerates; coast loses speed without a discontinuity', () => {
  const s = new Simulation(4); s.ignite(); let last = null, accelerating = false, coasting = false;
  for (let i = 0; i < 6 * 60; i++) {
    s.advance(1 / 60); const r = s.rockets[0]; if (!r) continue;
    if (last?.phase === 'thrust' && r.phase === 'thrust') accelerating ||= r.vy > last.vy;
    if (last?.phase === 'coast' && r.phase === 'coast') coasting ||= r.vy < last.vy;
    if (last?.phase === 'thrust' && r.phase === 'coast') assert.ok(Math.abs(r.vy - last.vy) < 2);
    last = { phase: r.phase, vy: r.vy };
  }
  assert.ok(accelerating && coasting);
});
test('resizing does not change existing airborne trajectories', () => {
  const a = new Simulation(11), b = new Simulation(11); a.ignite(); b.ignite();
  run(a, 3); run(b, 3); b.setViewport(65, 42); run(a, 3); run(b, 3);
  assert.deepEqual(a.heads.x, b.heads.x); assert.deepEqual(a.heads.y, b.heads.y);
  assert.deepEqual(a.heads.z, b.heads.z);
});
test('pool identity and previous position move together during compaction', () => {
  const p = new Pool(2); p.add(1, 2, 3, 0, 0, 0, 2, 1, 1, 1, 1);
  p.add(4, 5, 6, 0, 0, 0, 2, 1, 1, 1, 1);
  const id = p.id[1]; p.px[1] = 3.5; p.remove(0);
  assert.equal(p.id[0], id); assert.equal(p.px[0], 3.5);
  p.add(8, 9, 10, 0, 0, 0, 2, 1, 1, 1, 1); assert.notEqual(p.id[1], id);
});
test('invalid pool removal cannot underflow live particles', () => {
  const p = new Pool(1); p.remove(0); p.remove(-1); assert.equal(p.count, 0);
});
test('trail endpoints stay owned after the source particle is recycled', () => {
  const s = new Simulation(5); s.ignite(); run(s, 5.7);
  assert.ok(s.trails.count > 0);
  const old = [s.trails.ax[0], s.trails.ay[0], s.trails.az[0], s.trails.owner[0]];
  s.heads.clear(); s.heads.add(999, 999, 999, 0, 0, 0, 1, 1, 1, 1, 1);
  assert.deepEqual([s.trails.ax[0], s.trails.ay[0], s.trails.az[0], s.trails.owner[0]], old);
});
test('trail pool ignores non-finite endpoints and remains bounded', () => {
  const p = new Trails(1);
  assert.equal(p.add(NaN,0,0,1,1,1,1,.1,1,1,1,7,0),false);
  assert.equal(p.add(0,0,0,1,1,1,1,.1,1,1,1,7,0),true);
  assert.equal(p.add(1,1,1,2,2,2,1,.1,1,1,1,8,0),false);
  assert.equal(p.count,1);p.advance(1.1,0);assert.equal(p.count,0);
});
test('additional smoke randomness cannot change the next rocket', () => {
  const a = new Simulation(16), b = new Simulation(16);
  a.quality = 'low'; b.quality = 'ultra'; a.ignite(); b.ignite(); run(a, 28); run(b, 28);
  a.ignite(); b.ignite();
  const pick = s => { const r = s.rockets[0]; return [r.top, r.ascent, r.fuse, r.seed, r.vx, r.vz]; };
  assert.deepEqual(pick(a), pick(b));
});
test('finale carriers travel before breaking at their own positions', () => {
  const s = new Simulation(31); s.ignite('manual', 4); let found = false;
  for (let i = 0; i < 8 * 60; i++) {
    s.advance(1 / 60);
    if (s.cues.length) {
      const c = s.cues[s.cues.length - 1], id = c.id, x = c.x, y = c.y, z = c.z;
      s.advance(1 / 60); const next = s.cues.find(v => v.id === id);
      if (next) { assert.ok(Math.hypot(next.x - x, next.y - y, next.z - z) > 0); found = true; break; }
    }
  }
  assert.ok(found);
});
test('crossette splitting produces spatially moving children', () => {
  const s = new Simulation(6); s.ignite('manual', 3); run(s, 5.4);
  const splitChildren = [];
  for (let i = 0; i < s.heads.count; i++) if (!s.heads.split[i]) splitChildren.push(s.heads.vz[i]);
  assert.ok(splitChildren.length > 0); assert.ok(splitChildren.some(z => Math.abs(z) > .5));
});
for (const quality of ['low', 'standard', 'ultra']) {
  test(`${quality} overlapping shows respect configured smoke and trail budgets`, () => {
    const s = new Simulation(47); s.quality = quality; s.startShow('festival');
    for (let i = 0; i < 120 * 60; i++) {
      s.advance(1 / 60); s.drainEvents();
      assert.ok(s.heads.count <= s.heads.capacity);
      assert.ok(s.trails.count <= BUDGETS[quality].trails);
      assert.ok(s.smoke.count <= BUDGETS[quality].smoke);
    }
  });
}
test('independent pause blockers preserve a manual pause', () => {
  const p = new PauseIntent(); p.setManual(true); p.block('overlay', true); p.block('overlay', false);
  assert.equal(p.paused, true); p.setManual(false); assert.equal(p.paused, false);
});
test('closing an overlay cannot clear hidden or graphics blockers', () => {
  const p = new PauseIntent(); p.block('hidden', true); p.block('overlay', true); p.block('overlay', false);
  assert.equal(p.paused, true); p.block('hidden', false); p.block('graphics', true); p.setManual(false);
  assert.equal(p.paused, true); p.block('graphics', false); assert.equal(p.paused, false);
});
test('pause intent reset clears every blocker', () => {
  const p = new PauseIntent(); p.setManual(true); p.block('overlay', true); p.reset(); assert.equal(p.paused, false);
});
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const token = () => ({ released: 0, release: async function () { this.released++; }, addEventListener() {} });
test('a cancelled pending wake request releases its late token', async () => {
  const d = deferred(), t = token(), changes = [];
  const c = new WakeLockController(() => d.promise, () => true, active => changes.push(active));
  const pending = c.acquire(); c.release(); d.resolve(t);
  assert.equal(await pending, false); assert.equal(t.released, 1); assert.ok(!changes.includes(true));
});
test('a hidden page cannot acquire a pending wake token', async () => {
  const d = deferred(), t = token(); let allowed = true;
  const c = new WakeLockController(() => d.promise, () => allowed, () => {});
  const pending = c.acquire(); allowed = false; d.resolve(t);
  assert.equal(await pending, false); assert.equal(t.released, 1);
});
test('wake disposal invalidates requests and future acquisition', async () => {
  const d = deferred(), t = token(); const c = new WakeLockController(() => d.promise, () => true, () => {});
  const pending = c.acquire(); c.dispose(); d.resolve(t); assert.equal(await pending, false);
  assert.equal(await c.acquire(), false); assert.equal(t.released, 1);
});
test('unsupported wake locking fails without throwing', async () => {
  const c = new WakeLockController(null, () => true, () => {}); assert.equal(await c.acquire(), false);
});
test('presentation parser rejects arbitrary modes, seeds and rectangles', () => {
  const p = parsePresentation('?display=malicious&seed=NaN&fps=900&safe=1,1,0,0');
  assert.equal(p.mode, 'interactive'); assert.equal(p.fps, 60); assert.ok(Number.isFinite(p.seed));
  assert.ok(p.safeRect[0] < p.safeRect[2]);
});
test('presentation links roundtrip only allowlisted operator settings', () => {
  const p = parsePresentation('?display=transparent&show=festival&seed=42&fps=30&protect=1&safe=.2,.1,.8,.7');
  const link = presentationLink('https://example.test/app/?arbitrary=secret#other', p);
  assert.ok(!link.includes('arbitrary')); assert.ok(!link.includes('#other'));
  assert.deepEqual(parsePresentation(new URL(link).search), p);
});
test('quality changes use hysteresis rather than one slow frame', () => {
  const q = new QualityGovernor(); for (let i = 0; i < 80; i++) q.add(50);
  assert.equal(q.evaluate('standard', 60, true), 'standard');
  assert.equal(q.evaluate('standard', 60, true), 'standard');
  assert.equal(q.evaluate('standard', 60, true), 'low');
});
test('manual graphics selection is not overridden by the governor', () => {
  const q = new QualityGovernor(); for (let i = 0; i < 80; i++) q.add(80);
  for (let i = 0; i < 8; i++) assert.equal(q.evaluate('ultra', 60, false), 'ultra');
});
