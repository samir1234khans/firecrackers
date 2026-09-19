import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../.test-build/engine/Simulation.js';
const run = (s, seconds) => { for (let i = 0; i < Math.ceil(seconds * 60); i++) s.advance(1 / 60); };

test('detached embers are bounded, finite and cleared on reset', () => {
  const s = new Simulation(79); s.quality = 'ultra'; s.ignite(); run(s, 7);
  assert.ok(s.embers.count > 0 && s.embers.count <= 768);
  for (let i = 0; i < s.embers.count; i++) assert.ok(Number.isFinite(s.embers.x[i] + s.embers.y[i] + s.embers.z[i]));
  s.reset(); assert.equal(s.embers.count, 0);
});
test('ember detail does not perturb the core trajectory stream', () => {
  const a = new Simulation(73), b = new Simulation(73); a.ignite(); b.ignite(); run(a, 7); run(b, 7);
  assert.deepEqual(a.heads.x, b.heads.x); assert.deepEqual(a.embers.x, b.embers.x);
  a.setPaused(true); const count = a.embers.count, y = Array.from(a.embers.y); run(a, 2);
  assert.equal(a.embers.count, count); assert.deepEqual(Array.from(a.embers.y), y);
});
test('fuse path clamps invalid inputs and travels continuously along one curve', async () => {
  const { fusePointAt, FUSE_POINTS } = await import('../.test-build/engine/FusePath.js');
  assert.deepEqual(fusePointAt(0), [...FUSE_POINTS[0]]);
  assert.deepEqual(fusePointAt(1), [...FUSE_POINTS[3]]);
  assert.deepEqual(fusePointAt(NaN), fusePointAt(0));
  let prior = fusePointAt(0); const steps = [];
  for (let i = 1; i <= 100; i++) {
    const next = fusePointAt(i / 100);
    steps.push(Math.hypot(...next.map((x, j) => x - prior[j]))); prior = next;
  }
  assert.ok(Math.max(...steps) / Math.min(...steps) < 1.02);
});


test('visible slow frames preserve virtual time up to the bounded catch-up budget', async () => {
  const { advanceVisibleFrame } = await import('../.test-build/engine/VisibleFrame.js');
  const fast = new Simulation(318), slow = new Simulation(318);
  fast.ignite(); slow.ignite();
  for (let i = 0; i < 360; i++) advanceVisibleFrame(fast, 1 / 60);
  for (let i = 0; i < 24; i++) advanceVisibleFrame(slow, .25);
  assert.ok(Math.abs(fast.time - slow.time) < 1 / 60 + 1e-8);
  assert.equal(fast.launched, slow.launched);
  assert.equal(fast.bursts, slow.bursts);
  assert.ok(slow.bursts > 0);
});

test('visible frame adapter rejects invalid deltas and caps a long interruption', async () => {
  const { advanceVisibleFrame } = await import('../.test-build/engine/VisibleFrame.js');
  const calls = []; const target = { advance: value => calls.push(value) };
  for (const value of [NaN, Infinity, -1, 0]) advanceVisibleFrame(target, value);
  assert.equal(calls.length, 0);
  advanceVisibleFrame(target, 3600);
  assert.ok(calls.length <= 5);
  assert.ok(calls.reduce((sum, value) => sum + value, 0) <= .50000001);
  assert.ok(calls.every(value => value <= .1));
});

test('manual selection during an automatic fuse preserves the committed effect and takes over', () => {
  const s = new Simulation(901);
  s.startShow('festival');
  for (let i = 0; i < 60; i++) s.advance(1 / 60);
  const rocket = s.rockets.find(r => r.stage === 'fuse');
  assert.ok(rocket);
  const originalFamily = rocket.family;
  assert.equal(s.select('chrysanthemum'), true);
  assert.equal(s.show, null);
  assert.equal(s.selected, 'chrysanthemum');
  assert.equal(s.ready, false);
  assert.equal(rocket.family, originalFamily);
  for (let i = 0; i < 300; i++) s.advance(1 / 60);
  assert.equal(s.rockets.length, 1);
  assert.equal(s.ready, true);
});
