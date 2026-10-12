import { BUDGETS, FAMILIES, familyIndex, familyReservation, clamp, randomStream } from './catalog.js';
import type { FamilyId } from './catalog.js';
import type { Simulation, PreparedAutoShot } from './Simulation.js';
import type { LaunchProfile } from './LaunchProfile.js';
import { burstLightEnergy } from './BurstLighting.js';

export const CADENCES = [
  { name: 'Unhurried', gap: 2.3, description: 'A longer breath after the bright core.' },
  { name: 'Flowing', gap: 1.6, description: 'An easy rhythm with falling tails.' },
  { name: 'Lively', gap: 1.05, description: 'Closely connected, clear moments.' },
  { name: 'Festival', gap: .6, description: 'The closest clear moments within native limits.' },
] as const;
export type Cadence = 0 | 1 | 2 | 3;
export type RunKind = 'programme' | 'collection';
export type RunStatus = 'idle' | 'playing' | 'falling' | 'complete' | 'blocked';
export type CelebrationCue = { family: FamilyId; position: number; group: number };
export type CelebrationRecipe = { name: string; kind: RunKind; seed: number; groups: readonly (readonly CelebrationCue[])[]; repeating?: boolean; lively?: boolean };
const STEP = 1 / 60, RETRY = .25;
const group = (families: readonly FamilyId[], index: number): CelebrationCue[] =>
  families.map((family, i) => ({ family, position: families.length === 1 ? .5 : i ? .76 : .24, group: index }));

/** Identity is mirrored as well as position; each family keeps its native flight. */
export function mirroredRound(count: 2 | 3 | 4 | 5, identities: readonly FamilyId[], index = 0): CelebrationCue[] {
  const pattern = { 2: [0, 0], 3: [0, 1, 0], 4: [0, 1, 1, 0], 5: [0, 1, 2, 1, 0] }[count];
  if (identities.length <= Math.max(...pattern)) throw new Error('A mirrored round needs all authored identities.');
  return pattern.map((identity, i) => ({ family: identities[identity], position: count === 2 ? i ? .76 : .24 : .14 + .72 * i / (count - 1), group: index }));
}
const PROGRAMMES: readonly { name: string; families: readonly (readonly FamilyId[])[] }[] = [
  { name: 'Golden river', families: [['gold-willow'], ['chrysanthemum', 'gold-willow'], ['phoenix-palm'], ['silver-crossette-crackle', 'multicolor-peony'], ['imperial-crown']] },
  { name: 'Jewel garden', families: [['sapphire-saturn'], ['ruby-dahlia', 'multicolor-peony'], ['aurora-crown'], ['sapphire-saturn', 'chrysanthemum'], ['celestial-aurora']] },
  { name: 'Royal night', families: [['silver-crossette-crackle'], ['opal-supernova'], ['imperial-crown', 'royal-phoenix'], ['grand-finale'], ['royal-phoenix']] },
];
export const WATCH_PROGRAMMES = [...PROGRAMMES.map(({ name }) => name), 'Lively Celebration'];

const shuffled = <T>(values: readonly T[], seed: number): T[] => {
  const result = [...values], rng = randomStream(seed);
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
};
/** Seeded bounded cycles: all counts occur once, identities vary, native cost stays <=6. */
export function livelyCycle(seed: number, cycle: number): CelebrationCue[][] {
  const classics = shuffled(FAMILIES.slice(0, 4).map(f => f.id), seed ^ Math.imul(cycle + 1, 0x6113));
  const grands = shuffled(FAMILIES.slice(5, 9).map(f => f.id), seed ^ 0x5678);
  const signatures = shuffled(FAMILIES.slice(9, 13).map(f => f.id), seed ^ 0x9012);
  // Grand Finale cannot form a pair: two full native reservations exceed3072.
  // Give it a centre, where its complete carrier reservation fits unchanged.
  const centres = shuffled([FAMILIES[4].id, ...FAMILIES.slice(5).map(f => f.id)], seed ^ 0x4259);
  const counts = shuffled([2, 3, 4, 5] as const, seed ^ Math.imul(cycle + 1, 0x45d9f3b));
  return counts.map((count, i) => mirroredRound(count, count === 2 ? [signatures[cycle % signatures.length]] : count === 3 ?
    [classics[0], centres[cycle % centres.length]] : count === 4 ? [classics[1], grands[cycle % grands.length]] :
    [classics[2], classics[3], grands[(cycle + 1) % grands.length]], i));
}

type PreparedCue = CelebrationCue & { shot: PreparedAutoShot; ignited: boolean; rocket?: Simulation['rockets'][number] };
type Wave = { cues: PreparedCue[]; burstAt: number; baseAt: number; claimed: boolean; first: boolean };
// Principal core plus native child reports; shorter than falling tails.
// Live carrier/light predictions can extend these authored scenery envelopes.
const CORE_SECONDS = [3.8, 3.25, 3.5, 4.2, 8.5, 4.2, 3.7, 3.5, 5.3, 8.7, 6, 6.6, 7.2] as const;
const core = (id: FamilyId) => CORE_SECONDS[familyIndex(id)];
const tail = (id: FamilyId) => {
  const index = familyIndex(id), f = FAMILIES[index];
  return index >= 10 ? 26 : index === 9 ? 23 : index === 4 ? 21 : f.life * 1.08 + f.trail + 2;
};
const maxLead = (cues: readonly PreparedCue[]) => Math.max(...cues.map(c => c.shot.lead));
const cost = (cues: readonly CelebrationCue[]) => cues.reduce((n, c) => n + FAMILIES[familyIndex(c.family)].cost, 0);
const reservation = (cues: readonly CelebrationCue[]) => cues.reduce((n, c) => n + familyReservation(familyIndex(c.family)), 0);

/** One bounded pending round; finite/repeating shows share native pools and fixed steps. */
export class CelebrationRun {
  private recipe: CelebrationRecipe | null = null;
  private waves: PreparedCue[][] = [];
  private wave: Wave | null = null;
  private waveIndex = 0;
  private groupIndex = 0;
  private cue = 0;
  private rounds = 0;
  private began = 0;
  private finishAt = 0;
  private lastBurst = 0;
  private clearAt = 0;
  private status: RunStatus = 'idle';
  private kind: RunKind = 'programme';
  private cadence: Cadence = 2;
  private paused = false;
  private pausedAt = 0;
  constructor(private readonly sim: Simulation, private readonly profile: (family: FamilyId, placement: number) => LaunchProfile,
    private readonly notice: (message: string) => void = () => {}) {}

  setCadence(value: number) {
    this.cadence = clamp(Math.floor(value), 0, 3) as Cadence;
    if (this.wave && !this.wave.claimed && !this.wave.first) {
      const now = this.paused ? this.pausedAt : this.sim.time;
      this.wave.burstAt = Math.max(this.wave.baseAt + CADENCES[this.cadence].gap, now + maxLead(this.wave.cues));
    }
  }
  starter(index: number): CelebrationRecipe {
    if (clamp(Math.floor(index), 0, 3) === 3) {
      const seed = this.sim.seed ^ 0x6134;
      return { name: WATCH_PROGRAMMES[3], kind: 'programme', seed, repeating: true, lively: true, groups: livelyCycle(seed, 0) };
    }
    const chosen = PROGRAMMES[clamp(Math.floor(index), 0, 2)];
    return { name: chosen.name, kind: 'programme', seed: this.sim.seed ^ 0x1984, groups: chosen.families.map((families, i) => group(families, i)) };
  }
  collection(): CelebrationRecipe {
    const groups: CelebrationCue[][] = [];
    for (let i = 0; i < 12; i += 2) groups.push(group([FAMILIES[i].id, FAMILIES[i + 1].id], i / 2));
    groups.push(group([FAMILIES[12].id], 6));
    return { name: 'The full collection', kind: 'collection', seed: this.sim.seed ^ 0x4113, groups };
  }
  private prepare(authored: readonly CelebrationCue[], seed: number, salt: number, mirrorSeeds = false): PreparedCue[] {
    return authored.map((c, i) => ({ ...c, ignited: false, shot: { ...this.sim.prepareAutoShot(familyIndex(c.family), c.position, .5, this.profile(c.family, c.position)),
      seed: (seed ^ Math.imul(salt + (mirrorSeeds ? Math.min(i, authored.length - i - 1) : i) + 1, 0x45d9f3b)) >>> 0 } }));
  }
  private partitions(cues: PreparedCue[]) {
    const fits = (part: PreparedCue[]) => cost(part) <= BUDGETS[this.sim.quality].units && reservation(part) <= this.sim.heads.capacity;
    if (fits(cues)) return [cues];
    const mirror = cues.every((c, i) => c.family === cues[cues.length - i - 1].family && Math.abs(c.position + cues[cues.length - i - 1].position - 1) < 1e-8);
    if (!mirror) return cues.map(c => [c]);
    const parts: PreparedCue[][] = [];
    for (let i = 0; i < Math.ceil(cues.length / 2); i++) {
      const j = cues.length - i - 1, pair = i === j ? [cues[i]] : [cues[i], cues[j]];
      parts.push(...(fits(pair) ? [pair] : pair.map(c => [c])));
    }
    return parts;
  }
  estimate(recipe: CelebrationRecipe) {
    if (recipe.repeating) return { seconds: Infinity, conflicts: [] as string[] };
    let burst = 0, clear = 0, first = true, seconds = 0;
    const conflicts: string[] = [];
    recipe.groups.forEach((authored, i) => {
      const parts = this.partitions(this.prepare(authored, recipe.seed, i * 7));
      if (parts.length > 1) conflicts.push('Round ' + (i + 1) + ' uses native-budget waves; every identity remains.');
      for (const part of parts) {
        burst = first ? maxLead(part) : Math.max(clear, burst + maxLead(part) + STEP) + CADENCES[this.cadence].gap;
        clear = burst + Math.max(...part.map(c => core(c.family))); seconds = burst + Math.max(...part.map(c => tail(c.family))); first = false;
      }
    });
    return { seconds: Math.ceil(seconds), conflicts };
  }
  start(recipe: CelebrationRecipe) {
    if (this.playing) { this.notice('A celebration is already playing. Stop it before starting another.'); return false; }
    if (this.sim.paused || this.sim.reducedMotion || !recipe.groups.length || recipe.groups.some(g => !g.length)) return false;
    this.recipe = recipe; this.groupIndex = this.waveIndex = this.cue = this.rounds = 0; this.began = this.sim.time;
    this.lastBurst = this.clearAt = this.sim.time; this.kind = recipe.kind; this.status = 'playing'; this.paused = false;
    this.loadRound(true); this.notice(recipe.kind === 'collection' ? 'The full collection is playing.' : 'Your celebration is playing.'); return true;
  }
  private loadRound(first = false) {
    const authored = this.recipe!.groups[this.groupIndex];
    this.waves = this.partitions(this.prepare(authored, this.recipe!.seed, this.rounds * 7, this.recipe!.lively)); this.waveIndex = 0; this.loadWave(first);
  }
  private glareClearance() {
    let at = this.clearAt;
    // Forecast native reports without waiting for every faint particle to die.
    for (const light of this.sim.lights) if (burstLightEnergy({ ...light, age: Math.max(.5, light.age) }, this.sim.reducedFlashes) > .14)
      at = Math.max(at, this.sim.time - light.age + 3.2);
    for (const carrier of this.sim.cues) at = Math.max(at, carrier.at + 3.2);
    return at;
  }
  private loadWave(first = false) {
    const cues = this.waves[this.waveIndex], lead = maxLead(cues);
    const baseAt = Math.max(this.glareClearance(), this.sim.time + lead);
    this.wave = { cues, baseAt, burstAt: baseAt + (first ? 0 : CADENCES[this.cadence].gap), claimed: false, first };
    if (this.paused) this.pausedAt = this.sim.time;
  }
  /** Explicit intent pauses new rounds; an already claimed coherent wave finishes. */
  setPaused(value: boolean) {
    if (value === this.paused) return;
    if (value) this.pausedAt = this.sim.time;
    else if (this.wave && !this.wave.claimed) {
      const delay = Math.max(0, this.sim.time - this.pausedAt); this.wave.baseAt += delay; this.wave.burstAt += delay;
    }
    this.paused = value;
  }
  get claimed() { return Boolean(this.wave?.claimed); }
  /** Runtime co-play must keep the claimed wave's unignited native slots free. */
  canAdmitManual(id: FamilyId) {
    const pending = this.claimed ? this.wave!.cues.filter(c => !c.ignited) : [];
    return this.sim.activeUnits + cost(pending) + FAMILIES[familyIndex(id)].cost <= BUDGETS[this.sim.quality].units &&
      this.sim.canAdmitScene(familyIndex(id), reservation(pending));
  }
  tick() {
    if (!this.playing || this.sim.paused || this.sim.reducedMotion) return;
    if (this.status === 'falling') {
      if (this.sim.time + 1e-8 >= this.finishAt) { this.status = 'complete'; this.notice(this.kind === 'collection' ? 'You have seen all thirteen fireworks.' : 'Your celebration is complete.'); }
      return;
    }
    const wave = this.wave!;
    if (this.paused && !wave.claimed) return;
    const firstAt = wave.burstAt - maxLead(wave.cues) + STEP;
    if (!wave.claimed && this.sim.time + 1e-8 >= firstAt) {
      const room = this.sim.activeUnits + cost(wave.cues) <= BUDGETS[this.sim.quality].units && wave.cues.every(c =>
        this.sim.canAdmitScene(familyIndex(c.family), reservation(wave.cues) - familyReservation(familyIndex(c.family))));
      if (!room) { wave.baseAt += RETRY; wave.burstAt += RETRY; return; }
      wave.claimed = true;
    }
    if (wave.claimed) {
      for (const c of wave.cues) {
        if (c.ignited || this.sim.time + 1e-8 < wave.burstAt - c.shot.lead + STEP) continue;
        if (!this.sim.ignite('auto', familyIndex(c.family), c.position, c.shot, wave.burstAt)) {
          this.status = 'blocked'; this.wave = null; this.notice('Your show stopped while the sky was busy. Existing sparks will finish.'); return;
        }
        c.ignited = true; c.rocket = this.sim.rockets[this.sim.rockets.length - 1]; this.cue++;
      }
      if (wave.cues.every(c => c.rocket?.stage === 'afterglow')) {
        this.lastBurst = wave.burstAt; this.clearAt = wave.burstAt + Math.max(...wave.cues.map(c => core(c.family)));
        this.waveIndex++;
        if (this.waveIndex < this.waves.length) this.loadWave();
        else {
          this.rounds++; this.groupIndex++;
          if (this.groupIndex >= this.recipe!.groups.length && !this.recipe!.repeating) {
            this.status = 'falling'; this.finishAt = wave.burstAt + Math.max(...wave.cues.map(c => tail(c.family))); this.wave = null; this.waves = [];
          } else {
            if (this.groupIndex >= this.recipe!.groups.length && this.recipe!.lively)
              this.recipe = { ...this.recipe!, groups: livelyCycle(this.recipe!.seed, Math.floor(this.rounds / 4)) };
            this.groupIndex %= this.recipe!.groups.length; this.loadRound();
          }
        }
      }
    }
  }
  private predictedFinish() {
    if (!this.wave || !this.recipe) return this.finishAt;
    let burst = this.wave.burstAt, clear = burst + Math.max(...this.wave.cues.map(c => core(c.family)));
    let end = burst + Math.max(...this.wave.cues.map(c => tail(c.family)));
    const future = this.waves.slice(this.waveIndex + 1);
    for (const authored of this.recipe.groups.slice(this.groupIndex + 1)) future.push(...this.partitions(this.prepare(authored, this.recipe.seed, 0)));
    for (const part of future) {
      burst = Math.max(clear, burst + maxLead(part) + STEP) + CADENCES[this.cadence].gap;
      clear = burst + Math.max(...part.map(c => core(c.family))); end = burst + Math.max(...part.map(c => tail(c.family)));
    }
    return end;
  }
  cancel() { this.recipe = null; this.wave = null; this.waves = []; this.groupIndex = this.waveIndex = this.cue = this.rounds = 0; this.paused = false; this.status = 'idle'; }
  get playing() { return this.status === 'playing' || this.status === 'falling'; }
  get remaining() {
    if (!this.playing) return 0;
    if (this.recipe?.repeating) return Infinity;
    const now = this.paused && !this.claimed && this.status === 'playing' ? this.pausedAt : this.sim.time;
    return Math.max(0, Math.ceil(this.predictedFinish() - now));
  }
  snapshot() { return { status: this.status, kind: this.kind, cadence: this.cadence, cue: this.cue,
    total: this.recipe?.repeating ? Infinity : this.recipe?.groups.reduce((n, g) => n + g.length, 0) ?? 0,
    group: this.groupIndex, remaining: this.remaining, seconds: this.recipe?.repeating ? Infinity : Math.max(0, Math.ceil(this.predictedFinish() - this.began)),
    repeating: Boolean(this.recipe?.repeating), paused: this.paused, claimed: this.claimed, rounds: this.rounds,
    nextBurst: this.wave?.burstAt ?? null, planned: this.waves.reduce((n, w) => n + w.filter(c => !c.ignited).length, 0), wave: this.waveIndex, waves: this.waves.length,
    lastBurst: this.lastBurst }; }
}
