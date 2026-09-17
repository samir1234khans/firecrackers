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
