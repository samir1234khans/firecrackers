import { SeaClock, SEA_FLEET, SEA_NEAR_BOATS, createSeaPose, sampleSeaRoute } from './SeaFleetState.js';
import { SeaBuoyancy } from './SeaBuoyancy.js';
import { SeaAudienceDirector } from './SeaAudienceDirector.js';
import type { WaterFrame } from './WaterWaves.js';
import type { SimEvent } from '../engine/Simulation.js';

/** Renderer-independent state; one owner survives WebGL -> Canvas recovery. */
export class SeaAudienceSession {
  readonly clock = new SeaClock();
  readonly poses = SEA_FLEET.map(createSeaPose);
  readonly floats = SEA_FLEET.map(() => new SeaBuoyancy());
  readonly audience = new SeaAudienceDirector();
  focus: number | null = null;
  moving = false;
  private stepCount = 0;
  private lastClock = NaN;
  private lastPhone = false;
  private lastPhase = NaN;
  private lastWaves = -1;
  private lastFar = NaN;
  ingest(events: readonly SimEvent[], now: number) { this.audience.feed.ingest(events, now); }
  resetReactions() { this.audience.reset(); this.focus = null; }
  setFocus(boat: number | null) { this.focus = boat !== null && SEA_NEAR_BOATS.some(index => index === boat) ? boat : null; }
  advance(sceneTime: number, moving: boolean, phone: boolean, frame: Readonly<WaterFrame>) {
    const unchanged = sceneTime === this.lastClock && phone === this.lastPhone && frame.phase === this.lastPhase && frame.waveCount === this.lastWaves && frame.farZ === this.lastFar && moving === this.moving;
    if (unchanged) return 0;
    this.moving = moving; this.lastClock = sceneTime; this.lastPhone = phone; this.lastPhase = frame.phase;
    this.lastWaves = frame.waveCount; this.lastFar = frame.farZ;
    const dt = this.clock.update(sceneTime, moving), time = this.clock.time;
    for (let index = 0; index < this.poses.length; index++) {
      sampleSeaRoute(index, time, phone, this.poses[index]);
      this.floats[index].update(this.poses[index], frame, dt, index === 1 || index === 3 || index === 6);
    }
    if (moving) {
      const targetStep = Math.floor(time * 60 + 1e-8);
      while (this.stepCount < targetStep) {
        this.stepCount++;
        this.audience.step(this.stepCount / 60, sceneTime - time + this.stepCount / 60, 1 / 60, this.poses, this.floats);
      }
    } else this.audience.cues.length = 0;
    return dt;
  }
  diagnostics() {
    return { seaFocus: this.focus, seaAudienceTargets: this.audience.feed.targets.map(target => ({ ...target })),
      seaAudienceEpoch: this.audience.feed.epoch, seaAudienceSteps: this.stepCount,
      seaAudience: this.audience.poses.map(pose => ({ ...pose })) };
  }
}
