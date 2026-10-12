import { sampleWater } from './WaterWaves.js';
import type { WaterFrame } from './WaterWaves.js';
import type { SeaPose } from './SeaFleetState.js';

/** Same four contact points and size-dependent damping in 3D and Canvas. */
export class SeaBuoyancy {
  height = 0;
  pitch = 0;
  roll = 0;
  targetPitch = 0;
  targetRoll = 0;
  private initialized = false;
  private readonly samples = Array.from({ length: 4 }, () => ({ height: 0, slopeX: 0, slopeZ: 0 }));
  update(pose: Readonly<SeaPose>, frame: Readonly<WaterFrame>, dt: number, heavy: boolean) {
    const x = Math.cos(pose.yaw), z = -Math.sin(pose.yaw), half = pose.length * .42, beam = pose.beam * .36;
    sampleWater(pose.x + half * x, pose.z + half * z, frame.phase, this.samples[0], frame);
    sampleWater(pose.x - half * x, pose.z - half * z, frame.phase, this.samples[1], frame);
    sampleWater(pose.x - beam * z, pose.z + beam * x, frame.phase, this.samples[2], frame);
    sampleWater(pose.x + beam * z, pose.z - beam * x, frame.phase, this.samples[3], frame);
    this.height = this.samples.reduce((sum, sample) => sum + sample.height, 0) * .25;
    this.targetPitch = Math.max(-.087, Math.min(.087, Math.atan2(this.samples[0].height - this.samples[1].height, half * 2)));
    this.targetRoll = Math.max(-.087, Math.min(.087, -Math.atan2(this.samples[2].height - this.samples[3].height, beam * 2)));
    const smooth = this.initialized ? 1 - Math.exp(-dt * (heavy ? 2.6 : 4.8)) : 1;
    this.pitch += (this.targetPitch - this.pitch) * smooth;
    this.roll += (this.targetRoll - this.roll) * smooth;
    this.initialized = true;
    return this;
  }
}
