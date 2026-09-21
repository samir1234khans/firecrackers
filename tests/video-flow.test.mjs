import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { FAMILIES } from '../.test-build/engine/catalog.js';
import { flightAxis, flightBodyOpacity, rocketPoint, SHELL_LOCAL_Y, MOTOR_LOCAL_Y, REARM_SECONDS } from '../.test-build/engine/LaunchGeometry.js';
const advance = (s, n) => { for (let i = 0; i < Math.ceil(n * 60); i++) s.advance(1 / 60); };

for (const f of FAMILIES) test(`${f.name}: one committed rocket, apex break, and explicit rearm`, () => {
  const s = new Simulation(61); s.quality = 'ultra'; s.select(f.id);
  assert.equal(s.ignite(), true);
  const r = s.committed, id = r.id;
  for (let i = 0; i < 30; i++) assert.equal(s.ignite(), false);
  assert.equal(s.rockets.length, 1);
  while (r.stage === 'fuse') s.advance(1 / 60);
  assert.equal(s.prepared, false);
  assert.equal(s.ready, false);
  let priorSpeed = -1, priorHeight = s.ground, coastSpeed = Infinity;
  while (r.stage === 'ascent') {
    s.advance(1 / 60);
    assert.ok(r.y >= priorHeight - 1e-6); priorHeight = r.y;
    if (r.phase === 'thrust') { assert.ok(r.vy >= priorSpeed); priorSpeed = r.vy; }
    if (r.phase === 'coast') { assert.ok(r.vy <= coastSpeed + 1e-6); coastSpeed = r.vy; }
    if (r.stage !== 'afterglow') assert.equal(s.ignite(), false);
  }
  assert.ok(Math.abs(r.y - r.top) < .002);
  assert.ok(Math.abs(r.vy) < .001);
  assert.equal(r.id, id);
  const burst = s.events.find(e => e.type === 'burst');
  const point = rocketPoint(r, SHELL_LOCAL_Y);
  assert.ok(Math.hypot(burst.x - point[0], burst.y - point[1], burst.z - point[2]) < 1e-6);
  assert.equal(s.activeUnits, 0);
  assert.equal(s.launchBlock, 'busy');
  advance(s, REARM_SECONDS + .05);
  assert.ok(s.ready || s.launchBlock === 'capacity');
  advance(s, 18);
  assert.equal(s.ready, true);
  assert.equal(s.ignite(), true);
});
test('selecting and positioning during a committed flight cannot mutate that rocket', () => {
  const s = new Simulation(); s.select('gold-willow'); s.setPlacement(.28); s.ignite();
  const r = s.committed, x = r.x;
  s.select('multicolor-peony'); s.setPlacement(.72);
  assert.equal(r.family, 0); assert.equal(r.x, x); assert.equal(s.placement, .28);
  assert.equal(s.selected, 'multicolor-peony'); assert.equal(s.ready, false);
  advance(s, 4); assert.equal(s.ready, true); s.ignite(); assert.equal(s.committed.family, 1);
});
test('fuse and in-flight pause preserve the same exact state', () => {
  const s = new Simulation(); s.ignite(); advance(s, .2); s.setPaused(true);
  const before = JSON.stringify(s.snapshot()); advance(s, 10);
  assert.equal(JSON.stringify(s.snapshot()), before); assert.equal(s.ignite(), false);
  s.setPaused(false); advance(s, 1.1); s.setPaused(true);
  const rocket = JSON.stringify(s.committed); advance(s, 10); assert.equal(JSON.stringify(s.committed), rocket);
  s.setPaused(false); advance(s, 4); assert.equal(s.bursts, 1);
});
test('shared body, motor and shell attachments remain finite and ordered through the apex', () => {
  const r = { stage: 'ascent', x: 4, y: 80, z: -2, vx: .2, vy: 0, vz: -.1 };
  const axis = flightAxis(r); assert.ok(axis.every(Number.isFinite)); assert.ok(axis[1] > .999);
  const shell = rocketPoint(r, SHELL_LOCAL_Y), motor = rocketPoint(r, MOTOR_LOCAL_Y);
  assert.ok(shell[1] > motor[1]); assert.ok(motor[1] > r.y);
  let prior = 1;
  for (let t = 0; t <= 100; t++) { const a = flightBodyOpacity(t / 100, 1); assert.ok(a >= 0 && a <= prior); prior = a; }
  assert.equal(flightBodyOpacity(0, 2), 1); assert.equal(flightBodyOpacity(2, 2), 0);
});
test('afterglow does not reserve a fictitious occupied launch pad for sixteen seconds', () => {
  const s = new Simulation(); s.quality = 'low'; s.ignite(); advance(s, 4);
  assert.ok(s.rockets.some(r => r.stage === 'afterglow')); assert.equal(s.activeUnits, 0);
  assert.equal(s.ready, true); assert.equal(s.ignite(), true);
});
test('rapid manual attempts cannot spawn duplicates during any active flight', () => {
  const s = new Simulation(); s.quality = 'ultra';
  let accepted = 0;
  for (let i = 0; i < 120 * 60; i++) { if (s.ignite()) accepted++; s.advance(1 / 60); assert.ok(s.rockets.filter(r => r.stage !== 'afterglow').length <= 1); }
  assert.ok(accepted > 20); assert.ok(s.heads.count <= s.heads.capacity); assert.ok(s.trails.count <= s.trails.capacity);
});
