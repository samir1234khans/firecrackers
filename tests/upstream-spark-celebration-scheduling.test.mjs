import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { BUDGETS, FAMILIES, familyIndex, familyReservation } from '../.test-build/engine/catalog.js';
import { burstLightEnergy } from '../.test-build/engine/BurstLighting.js';
import { CADENCES, CelebrationRun, WATCH_PROGRAMMES, livelyCycle, mirroredRound } from '../.test-build/engine/CelebrationRun.js';

const STEP = 1 / 60;
const profile = (id, position) => {
  const ground = 42, apex = ground + 18 + familyIndex(id) * 6.2 + Math.abs(position - .5) * 4;
  return { ground, apex, apexMin: apex, apexMax: apex, centerFraction: .34,
    padX: (position - .5) * 90, aimX: (position - .5) * 30, effectScale: .32, burstDepth: 0 };
};
function create(quality = 'ultra') {
  const sim = new Simulation(81); sim.quality = quality; sim.reducedFlashes = false; sim.setLaunchProfileResolver(profile);
  const notices = [], run = new CelebrationRun(sim, profile, m => notices.push(m));
  sim.sceneDirector = { tick: () => run.tick() };
  return { sim, run, notices };
}
function recorder(sim) {
  const seen = new Set(), primaries = [], ignitions = [];
  let maxUnits = 0, maxHeads = 0, maxReserved = 0;
  return {
    primaries, ignitions,
    step() {
      sim.advance(STEP);
      for (const event of sim.drainEvents()) if (event.type === 'fuse') ignitions.push(event);
      maxUnits = Math.max(maxUnits, sim.activeUnits); maxHeads = Math.max(maxHeads, sim.heads.count);
      maxReserved = Math.max(maxReserved, sim.heads.count + sim.snapshot().futureHeads);
      for (const rocket of sim.rockets) if (rocket.stage === 'afterglow' && !seen.has(rocket.id)) {
        seen.add(rocket.id); primaries.push({ family: rocket.family, position: rocket.normalizedPlacement,
          time: sim.time, deadline: rocket.targetImpact, seed: rocket.seed,
          precedingGlare: Math.max(0, ...sim.lights.filter(l => l.age > STEP * 2).map(l => burstLightEnergy(l, sim.reducedFlashes))) });
      }
    },
    until(predicate, seconds = 200) { for (let i = 0; i < seconds * 60 && !predicate(); i++) this.step(); assert.ok(predicate(), 'Condition must resolve within bounded active time'); },
    bounds() { assert.ok(maxUnits <= BUDGETS[sim.quality].units); assert.ok(maxHeads <= sim.heads.capacity); assert.ok(maxReserved <= sim.heads.capacity); },
  };
}
const identities = ['multicolor-peony', 'chrysanthemum', 'ruby-dahlia'];
const recipe = (groups, extra = {}) => ({ name: 'Focused mirrored sequence', kind: 'programme', seed: 4281, groups, ...extra });

test('Lively uses seeded shuffled counts, disjoint mirrored identities, matching positions and all thirteen cost-safe native families', () => {
  assert.equal(WATCH_PROGRAMMES.length, 4); assert.equal(WATCH_PROGRAMMES[3], 'Lively Celebration');
  assert.deepEqual(CADENCES.map(c => c.gap), [2.3, 1.6, 1.05, .6]);
  const found = new Set(), cycles = [];
  for (let cycle = 0; cycle < 9; cycle++) {
    const groups = livelyCycle(318, cycle); cycles.push(groups);
    assert.deepEqual(groups.map(g => g.length).sort(), [2, 3, 4, 5]);
    assert.deepEqual(groups, livelyCycle(318, cycle));
    for (const group of groups) {
      assert.ok(group.reduce((n, c) => n + FAMILIES[familyIndex(c.family)].cost, 0) <= 6);
      assert.ok(group.reduce((n, c) => n + familyReservation(familyIndex(c.family)), 0) <= 3072);
      assert.equal(new Set(group.map(c => c.family)).size, group.length === 2 ? 1 : group.length === 5 ? 3 : 2);
      group.forEach((c, i) => { found.add(c.family); assert.equal(c.family, group[group.length - i - 1].family); assert.ok(Math.abs(c.position + group[group.length - i - 1].position - 1) < 1e-8); });
    }
  }
  assert.equal(new Set(cycles.map(g => g.map(r => r.length).join(','))).size > 1, true);
  assert.equal(found.size, 13); assert.notDeepEqual(livelyCycle(318, 0), livelyCycle(912, 0));
});

for (const quality of ['standard', 'ultra']) for (const count of [2, 3, 4, 5]) test(`${quality}: ${count} mirrored heterogeneous flights meet one burst deadline`, () => {
  const { sim, run, notices } = create(quality), group = mirroredRound(count, identities);
  const leads = group.map(c => sim.prepareAutoShot(familyIndex(c.family), c.position, .5, profile(c.family, c.position)).lead);
  if (count > 2) assert.ok(new Set(leads).size > 1, 'Fixture must exercise real heterogeneous native leads');
  assert.equal(run.start(recipe([group], { lively: true })), true); const record = recorder(sim), target = run.snapshot().nextBurst;
  record.until(() => run.snapshot().rounds === 1); record.bounds();
  assert.deepEqual(notices.filter(n => /stopped while/.test(n)), []); assert.equal(record.primaries.length, count);
  assert.ok(record.primaries.every(p => Math.abs(p.time - target) <= STEP + 1e-7));
  assert.ok(Math.max(...record.primaries.map(p => p.time)) - Math.min(...record.primaries.map(p => p.time)) <= STEP + 1e-7);
  const byPosition = [...record.primaries].sort((a, b) => a.position - b.position);
  assert.deepEqual(byPosition.map(p => p.family), group.map(c => familyIndex(c.family)));
  byPosition.forEach((p, i) => assert.equal(p.seed, byPosition[count - i - 1].seed, 'Mirrored particle identities must share native seed'));
  if (count > 2) assert.ok(new Set(record.ignitions.map(e => e.time)).size > 1, 'Synchrony must come from staggered native ignition deadlines');
});

test('Low retains every member of all mirrored counts in synchronous budget-safe symmetric waves', () => {
  const { sim, run, notices } = create('low'), groups = [2, 3, 4, 5].map((n, i) => mirroredRound(n, identities, i));
  assert.equal(run.start(recipe(groups, { lively: true })), true); const record = recorder(sim);
  record.until(() => run.snapshot().rounds === 4); record.bounds(); assert.equal(record.primaries.length, 14);
  const got = record.primaries.map(p => [p.family, p.position]).sort(), expected = groups.flat().map(c => [familyIndex(c.family), c.position]).sort();
  assert.deepEqual(got, expected); assert.equal(run.snapshot().cue, 14); assert.equal(run.snapshot().status, 'falling');
  assert.ok(record.primaries.every(p => Math.abs(p.time - p.deadline) <= STEP + 1e-7));
  assert.deepEqual(notices.filter(n => /stopped while/.test(n)), []);
});

test('cadence updates pending burst deadlines, truthful finite estimates and actual spacing without counting flight twice', () => {
  const { sim, run } = create(), groups = [mirroredRound(3, identities), mirroredRound(4, identities, 1), mirroredRound(5, identities, 2)];
  const authored = recipe(groups), estimates = [0, 1, 2, 3].map(c => { run.setCadence(c); return run.estimate(authored).seconds; });
  assert.ok(estimates.every((value, i) => !i || value < estimates[i - 1]));
  run.setCadence(0); assert.equal(run.start(authored), true); const record = recorder(sim);
  record.until(() => run.snapshot().rounds === 1 && !run.claimed);
  const slow = run.snapshot(); run.setCadence(3); const fast = run.snapshot();
  assert.ok(Math.abs(slow.nextBurst - fast.nextBurst - 1.7) <= STEP); assert.ok(fast.seconds < slow.seconds); assert.ok(fast.remaining < slow.remaining);
  record.until(() => run.snapshot().rounds === 2); record.bounds();
  const next = record.primaries.filter(p => Math.abs(p.deadline - fast.nextBurst) < STEP); assert.equal(next.length, 4);
  assert.ok(next.every(p => Math.abs(p.time - fast.nextBurst) <= STEP + 1e-7));
  assert.ok(next.every(p => p.precedingGlare <= .14), 'New primary opens after the native glare has cleared');
  assert.ok(fast.nextBurst - slow.lastBurst < 5, 'Core spacing must not add the next native flight a second time');
});

test('pause finishes a claimed coherent round, leaves residue moving, and resumes future deadlines without catch-up', () => {
  const { sim, run } = create(), groups = [mirroredRound(5, identities), mirroredRound(3, identities, 1)];
  assert.equal(run.start(recipe(groups, { repeating: true, lively: true })), true); const record = recorder(sim);
  record.until(() => run.claimed && run.snapshot().cue > 0 && run.snapshot().cue < 5);
  run.setPaused(true); assert.equal(run.snapshot().paused, true);
  record.until(() => run.snapshot().rounds === 1 && !run.claimed); assert.equal(record.primaries.length, 5);
  assert.equal(new Set(record.primaries.map(p => p.time.toFixed(6))).size, 1);
  const before = run.snapshot(), water = sim.waterPhase, headCount = sim.heads.count;
  for (let n = 0; n < 1200; n++) record.step();
  assert.equal(run.snapshot().cue, before.cue); assert.ok(sim.waterPhase > water); assert.ok(sim.heads.count < headCount);
  run.setPaused(false); const resumed = run.snapshot(); assert.ok(resumed.nextBurst >= before.nextBurst + 19.9);
  assert.ok(resumed.nextBurst > sim.time + .5); record.step(); assert.equal(run.snapshot().cue, before.cue);
  record.until(() => run.snapshot().rounds === 2); record.bounds();
});

test('native admission pressure postpones the whole unclaimed round without dropping identities or synchrony', () => {
  const { sim, run, notices } = create(); sim.ignite('auto', 4, .5, sim.prepareAutoShot(4, .5, .5, profile('grand-finale', .5)));
  assert.equal(run.start(recipe([mirroredRound(5, identities)])), true); const initial = run.snapshot().nextBurst, record = recorder(sim);
  for (let n = 0; n < 12; n++) record.step(); assert.equal(run.snapshot().cue, 0); assert.ok(run.snapshot().nextBurst > initial);
  record.until(() => run.snapshot().rounds === 1); record.bounds(); const owned = record.primaries.filter(p => p.deadline !== undefined);
  assert.equal(owned.length, 5); assert.equal(new Set(owned.map(p => p.time.toFixed(6))).size, 1); assert.equal(run.snapshot().cue, 5);
  assert.deepEqual(notices.filter(n => /stopped while/.test(n)), []);
});

test('claimed co-play reserves every still-unignited head and unit slot', () => {
  const { sim, run } = create(); run.start(recipe([mirroredRound(5, identities)])); const record = recorder(sim);
  record.until(() => run.claimed && run.snapshot().cue > 0 && run.snapshot().cue < 5);
  assert.equal(sim.canAdmitScene(0), true, 'Native simulator alone has free current-flight slots');
  assert.equal(run.canAdmitManual('gold-willow'), false, 'Claimed future slots must also count');
  record.until(() => !run.claimed); assert.equal(run.canAdmitManual('gold-willow'), true); record.bounds();
});

test('new programme forecasts a fresh native glare attack before opening its first burst', () => {
  const { sim, run } = create(); assert.equal(sim.burstAt('gold-willow', 0, 95, .6, -60), true);
  assert.equal(sim.lights[0].age, 0); run.start(recipe([mirroredRound(2, identities)]));
  assert.ok(run.snapshot().nextBurst >= 3.2, 'Fresh low-energy attack must not be mistaken for cleared glare');
  const record = recorder(sim); record.until(() => run.snapshot().rounds === 1);
  assert.ok(record.primaries.every(p => p.precedingGlare <= .14)); record.bounds();
});

test('all finite programmes retain truthful whole-duration estimates under uncontested native budgets', () => {
  for (const quality of ['low', 'ultra']) for (const programme of [0, 1, 2]) {
    const { sim, run } = create(quality), authored = run.starter(programme), predicted = run.estimate(authored).seconds;
    run.start(authored); const record = recorder(sim); record.until(() => !run.playing);
    assert.equal(run.snapshot().status, 'complete'); assert.equal(run.snapshot().cue, authored.groups.flat().length);
    assert.ok(sim.time <= predicted + STEP + 1e-6 && sim.time >= predicted - 1.1, 'Estimate must include native Opal/composite child glare and final residue'); record.bounds();
  }
});

for (const quality of ['low', 'ultra']) test(`${quality}: repeating cycles retain only one bounded prepared round and never exhaust into a finite ending`, () => {
  const { sim, run, notices } = create(quality), authored = run.starter(3); assert.equal(run.estimate(authored).seconds, Infinity);
  run.start(authored); assert.equal(run.start(authored), false); const record = recorder(sim); let maxPlanned = 0;
  for (let n = 0; n < 30000 && run.snapshot().rounds < 8; n++) { record.step(); maxPlanned = Math.max(maxPlanned, run.snapshot().planned); }
  assert.ok(run.snapshot().rounds >= 8); assert.equal(run.snapshot().repeating, true); assert.equal(run.playing, true); assert.equal(run.remaining, Infinity);
  assert.ok(maxPlanned <= 5); assert.equal(run.snapshot().cue >= 28, true); record.bounds(); assert.deepEqual(notices.filter(n => /stopped while/.test(n)), []);
  run.cancel(); const admissions = run.snapshot().cue, fuseEvents = record.ignitions.length; for (let n = 0; n < 300; n++) record.step();
  assert.equal(run.snapshot().cue, admissions); assert.equal(record.ignitions.length, fuseEvents); assert.equal(run.playing, false);
});
