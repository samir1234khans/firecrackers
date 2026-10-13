import { clamp, hash01 } from '../engine/catalog.js';
import { SEA_FLEET, type SeaPose } from './SeaFleetState.js';
import { SEA_PASSENGERS, PASSENGERS_BY_BOAT, type PassengerSpec, type SeaPerformance } from './SeaPassengers.js';
import { SeaBurstFeed, type SeaBurstTarget } from './SeaBurstFeed.js';
import { worldToBoat, wrapSeaAngle, type SeaPoint, type SeaFloating } from './SeaSpace.js';
import { WATER_Y } from './WaterWaves.js';

export type PassengerPose = {
  id: number; stage: 'rest' | 'notice' | 'attend' | 'react' | 'share' | 'recover';
  performance: SeaPerformance; target: number; partner: number; since: number; cooldown: number;
  latency: number; intensity: number; bodyYaw: number; headYaw: number; headPitch: number; eyeYaw: number; eyePitch: number;
  pointX: number; pointY: number; pointZ: number; gesture: number; smile: number; clap: number;
  gazeError: number; reachable: boolean; lastCue: number; attentionSince: number;
};
export type SeaReactionCue = { person: number; boat: number; kind: 'clap' | 'cheer'; strength: number; time: number };
const BIG = new Set<SeaPerformance>(['clap', 'raised-arm', 'delighted-lean']);
const INDEX_BY_ID = new Map(SEA_PASSENGERS.map((person, index) => [person.id, index]));
const ease = (t: number) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };
export class SeaAudienceDirector {
  readonly poses: PassengerPose[] = SEA_PASSENGERS.map(person => ({
    id: person.id, stage: 'rest', performance: person.operator ? 'operator-glance' : 'quiet-watch', target: -1, partner: person.partner,
    since: 0, cooldown: 0, latency: 0, intensity: 0, bodyYaw: 0, headYaw: 0, headPitch: .05, eyeYaw: 0, eyePitch: 0,
    pointX: 1, pointY: 0, pointZ: 0, gesture: 0, smile: 0, clap: 0, gazeError: 0, reachable: false, lastCue: -1, attentionSince: 0,
  }));
  readonly cues: SeaReactionCue[] = [];
  private readonly local: SeaPoint = { x: 0, y: 0, z: 0 };
  private nextChoice = 0;
  private lastCheer = -100;
  private lastClap = -100;
  private readonly seen = new Int32Array(SEA_PASSENGERS.length).fill(-1);
  private readonly answerUntil = new Float64Array(SEA_PASSENGERS.length);
  private readonly answerPerson = new Int32Array(SEA_PASSENGERS.length).fill(-1);
  private now = 0;
  constructor(readonly feed = new SeaBurstFeed()) {}
  reset() {
    this.feed.reset(); this.seen.fill(-1); this.answerUntil.fill(0); this.answerPerson.fill(-1);
    this.cues.length = 0; this.nextChoice = 0; this.lastCheer = this.lastClap = -100;
    for (const pose of this.poses) { pose.stage = 'rest'; pose.target = -1; pose.since = this.now; pose.cooldown = this.now; pose.gesture = pose.smile = pose.clap = 0; }
  }
  private angles(person: PassengerSpec, target: SeaPoint, boat: SeaPose, floating: SeaFloating) {
    worldToBoat(target, boat, floating, WATER_Y, this.local);
    const dx = this.local.x - person.x, dy = this.local.y - (.22 + person.size * 1.04);
    // Compensate hull beam stretch: the person has uniform anatomy.
    const dz = (this.local.z - person.z) * (boat.beam / 1.84) / (boat.length / 6);
    const yaw = wrapSeaAngle(Math.atan2(-dz, dx) - person.facing);
    const pitch = Math.atan2(dy, Math.hypot(dx, dz));
    return { yaw, pitch, dx, dy, dz };
  }
  private obstructed(person: PassengerSpec, boat: SeaPose, target: SeaPoint, floating: SeaFloating) {
    if (person.boat !== 1 && person.boat !== 3 && person.boat !== 6) return false;
    worldToBoat(target, boat, floating, WATER_Y, this.local);
    const fromY = .22 + 1.04 * person.size, roof = person.boat === 3 ? 1.48 : 1.65;
    if (this.local.y <= fromY) return false;
    const t = (roof - fromY) / (this.local.y - fromY);
    if (t <= 0 || t >= 1) return false;
    const x = person.x + (this.local.x - person.x) * t, z = person.z + (this.local.z - person.z) * t;
    if (Math.abs(z) > .93) return false;
    return person.boat === 1 ? Math.abs(x + .15) < 1.7 : person.boat === 3 ? x > -1.5 && x < .62 : Math.abs(x) > 1.16 && Math.abs(x) < 2.5;
  }
  private choose(index: number, time: number, sceneTime: number, boats: readonly SeaPose[], floats: readonly SeaFloating[]) {
    const person = SEA_PASSENGERS[index], state = this.poses[index], boat = boats[person.boat];
    // Renew attention only to reported carrier bursts of the same spectacle.
    // Simultaneous mirrored centres are independent choices, never fabricated trajectories.
    const current = this.feed.targets.find(target => target.id === state.target);
    if (current && ['attend', 'react'].includes(state.stage) && [3, 8, 9, 11, 12].includes(current.family) && time - state.attentionSince >= 1.1) {
      const candidate = [...this.feed.targets].reverse().find(target => target.id > current.id && target.family === current.family && target.time > current.time + .22 && target.expires - sceneTime > .6 && target.strength >= current.strength * .65);
      if (candidate) {
        const angles = this.angles(person, candidate, boat, floats[person.boat]);
        if (Math.abs(angles.yaw) <= (person.operator ? 1.35 : 1.90) && angles.pitch <= 1.30 && angles.pitch >= -.20 && !this.obstructed(person, boat, candidate, floats[person.boat])) {
          state.target = candidate.id; state.attentionSince = time; this.seen[index] = candidate.id;
        }
      }
    }
    if (state.stage !== 'rest' && state.stage !== 'recover') return;
    if (time < state.cooldown) return;
    let best: SeaBurstTarget | undefined, score = 0;
    for (const target of this.feed.targets) {
      if (target.id <= this.seen[index] || target.expires - sceneTime < .5) continue;
      const angles = this.angles(person, target, boat, floats[person.boat]);
      if (Math.abs(angles.yaw) > (person.operator ? 1.35 : 1.90) || angles.pitch > 1.30 || angles.pitch < -.20 || this.obstructed(person, boat, target, floats[person.boat])) continue;
      const distance = Math.hypot(angles.dx, angles.dy, angles.dz);
      const childAttention = !person.operator && person.age !== 'child' && PASSENGERS_BY_BOAT[person.boat].some(child => {
        const pose = this.poses[INDEX_BY_ID.get(child.id)!];
        return child.age === 'child' && pose.target === target.id && (pose.stage === 'attend' || pose.stage === 'react');
      });
      const value = target.strength * (childAttention ? 1.4 : 1) * (target.family === person.preference ? 1.22 : 1) /
        (1 + distance * .016) * (.85 + .15 * hash01(person.id, target.id * 13));
      if (value > score) { best = target; score = value; }
    }
    if (!best) return;
    this.seen[index] = best.id;
    // Curiosity is varied, but quiet attending is common even without a cheer.
    if (hash01(person.id, best.id * 19 + 11) > (person.operator ? .40 : .91)) return;
    state.target = best.id; state.since = time; state.stage = 'notice'; state.reachable = true;
    state.attentionSince = time;
    state.latency = (person.age === 'child' ? .18 : .30) + hash01(person.id, best.id * 41) * (person.age === 'child' ? .27 : .5);
    state.intensity = clamp(score * person.enthusiasm * 1.4, .18, 1);
    const lively = !person.operator && hash01(person.id, best.id * 71) < person.enthusiasm;
    const bigCount = this.poses.filter(pose => BIG.has(pose.performance) && pose.stage !== 'rest' && pose.stage !== 'recover').length;
    const pick = hash01(person.id, best.id * 113);
    state.performance = person.operator ? 'operator-glance' : !lively ? 'smile' :
      [0, 3, 8, 9, 10, 11, 12].includes(best.family) ? 'point' :
      bigCount >= 6 ? 'point' : pick < .47 ? 'clap' : pick < .76 ? 'raised-arm' : 'delighted-lean';
    state.lastCue = -1;
  }
  step(time: number, sceneTime: number, dt: number, boats: readonly SeaPose[], floats: readonly SeaFloating[]) {
    this.now = time; this.feed.expire(sceneTime);
    if (time >= this.nextChoice) {
      this.nextChoice = time + .1;
      for (let index = 0; index < this.poses.length; index++) this.choose(index, time, sceneTime, boats, floats);
    }
    for (let index = 0; index < this.poses.length; index++) {
      const person = SEA_PASSENGERS[index], state = this.poses[index], elapsed = time - state.since;
      const target = this.feed.targets.find(event => event.id === state.target);
      if (state.stage === 'notice' && elapsed >= state.latency) state.stage = 'attend';
      if (state.stage === 'attend' && elapsed >= state.latency + .65) state.stage = 'react';
      if (state.stage === 'react' && elapsed >= state.latency + 2.15) {
        state.stage = person.operator || person.sociability < .42 ? 'recover' : 'share';
        if (state.stage === 'share') {
          const partner = this.poses.findIndex(pose => pose.id === person.boat * 8 + person.partner);
          if (partner >= 0 && !SEA_PASSENGERS[partner].operator) { this.answerUntil[partner] = time + 1.8; this.answerPerson[partner] = person.seat; }
        }
      }
      if (state.stage === 'share' && elapsed >= state.latency + 3.8) state.stage = 'recover';
      if (state.stage === 'recover') {
        state.gesture *= Math.exp(-dt * 5);
        if (elapsed >= state.latency + 4.5) {
          state.stage = 'rest'; state.target = -1; state.cooldown = time + (person.age === 'child' ? .5 : 2) + hash01(person.id, this.seen[index] * 137) * (person.age === 'child' ? 2 : 5);
        }
      }
      if (!target && ['notice', 'attend', 'react'].includes(state.stage)) { state.stage = 'recover'; state.reachable = false; }
      let yaw = 0, pitch = .10, answering = false;
      const family = PASSENGERS_BY_BOAT[person.boat];
      if (state.stage === 'share' || (this.answerUntil[index] > time && state.stage === 'rest')) {
        const partner = family[state.stage === 'share' ? person.partner : this.answerPerson[index]];
        if (partner && partner.id !== person.id) {
          const dx = partner.x - person.x, dz = (partner.z - person.z) * (boats[person.boat].beam / 1.84) / (boats[person.boat].length / 6);
          yaw = wrapSeaAngle(Math.atan2(-dz, dx) - person.facing);
          pitch = Math.atan2((partner.size - person.size) * 1.04, Math.hypot(dx, dz)); answering = true;
        }
      } else if (target && time >= state.since + state.latency) {
        const angles = this.angles(person, target, boats[person.boat], floats[person.boat]);
        if (Math.abs(angles.yaw) > (person.operator ? 1.35 : 1.90) || angles.pitch > 1.30 || angles.pitch < -.20 || this.obstructed(person, boats[person.boat], target, floats[person.boat])) {
          state.stage = 'recover'; state.reachable = false; state.target = -1;
        }
        yaw = angles.yaw; pitch = angles.pitch;
        const distance = Math.hypot(angles.dx, angles.dy, angles.dz) || 1;
        state.pointX = angles.dx / distance; state.pointY = angles.dy / distance; state.pointZ = angles.dz / distance;
      } else if (state.stage === 'rest') {
        yaw = Math.sin(time * .12 + person.id * 2.7) * .07;
        pitch = .08 + Math.sin(time * .17 + person.id) * .018;
      }
      if (answering) pitch += Math.sin(time * 4 + person.id) * .045;
      const safeYaw = clamp(yaw, -1.90, 1.90), safePitch = clamp(pitch, -.25, 1.30);
      const body = person.operator ? 0 : clamp(safeYaw * .34, -.524, .524);
      const head = clamp(safeYaw - body, -1.047, 1.047), eye = clamp(safeYaw - state.bodyYaw - state.headYaw, -.35, .35);
      const headPitch = clamp(safePitch, -.25, 1.134), eyePitch = clamp(safePitch - state.headPitch, -.15, .18);
      const orienting = Boolean(target) && ['notice', 'attend'].includes(state.stage);
      const bodyEase = orienting && elapsed < state.latency + .16 ? 0 : 1 - Math.exp(-dt * 5);
      const headEase = orienting && elapsed < state.latency + .06 ? 0 : 1 - Math.exp(-dt * 10), eyeEase = 1 - Math.exp(-dt * 20);
      state.bodyYaw += wrapSeaAngle(body - state.bodyYaw) * bodyEase;
      state.headYaw += (head - state.headYaw) * headEase; state.headPitch += (headPitch - state.headPitch) * headEase;
      state.eyeYaw += (eye - state.eyeYaw) * eyeEase; state.eyePitch += (eyePitch - state.eyePitch) * eyeEase;
      state.gazeError = Math.hypot(wrapSeaAngle(yaw - state.bodyYaw - state.headYaw - state.eyeYaw), pitch - state.headPitch - state.eyePitch);
      const reactionAge = elapsed - state.latency - .65;
      state.gesture = state.stage === 'react' ? ease(reactionAge / .32) * (1 - ease((reactionAge - 1.0) / .50)) * state.intensity : state.stage === 'recover' ? state.gesture : 0;
      state.smile = state.stage === 'react' || state.stage === 'share' || answering ? state.intensity || .35 : 0;
      const beat = Math.max(0, Math.floor(reactionAge * 2.8));
      state.clap = state.stage === 'react' && state.performance === 'clap' ? .5 + .5 * Math.cos(reactionAge * Math.PI * 5.6) : 0;
      if (state.stage === 'react' && state.performance === 'clap' && state.clap > .98 && state.gesture / state.intensity > .98 && reactionAge > .05 && state.lastCue !== beat) {
        state.lastCue = beat;
        if (time - this.lastClap > .18 && this.cues.length < 16) { this.lastClap = time; this.cues.push({ person: person.id, boat: person.boat, kind: 'clap', strength: state.intensity, time }); }
      }
      if (state.stage === 'react' && BIG.has(state.performance) && person.age === 'child' && reactionAge > .25 && time - this.lastCheer >= 8 && SEA_FLEET[person.boat].band === 'near' && this.cues.length < 16) {
        this.lastCheer = time; this.cues.push({ person: person.id, boat: person.boat, kind: 'cheer', strength: state.intensity, time });
      }
    }
  }
  drainCues() { const cues = this.cues.slice(); this.cues.length = 0; return cues; }
}
