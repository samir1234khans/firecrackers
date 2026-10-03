import { BURST_LIGHT_CAPACITY, burstLightEnergy } from './BurstLighting.js';
import type { BurstSource } from './BurstLighting.js';

export const CINEMA_BASE_EXPOSURE = .95;
export const CINEMA_MIN_EXPOSURE = .85;
export const CINEMA_MAX_CAMERA_PIXELS = .35;
const IMPULSE_CAPACITY = 6;
type Impulse = { at: number; power: number; direction: number };
/** A bounded perceptual/camera response, not a photometric eye or shock-wave model.
 * Lives on the fixed simulation clock: drawing, capturing and mirrors never tick it. */
export class CinematicResponse {
  exposure = CINEMA_BASE_EXPOSURE;
  pressure = 0;
  cameraX = 0;
  cameraY = 0;
  private readonly impulses: Impulse[] = [];
  reset(): void {
    this.exposure = CINEMA_BASE_EXPOSURE; this.pressure = this.cameraX = this.cameraY = 0;
    this.impulses.length = 0;
  }
  report(family: number, strength: number, x: number, at: number): void {
    if ((family !== 4 && family < 9) || !Number.isFinite(strength + x + at) || strength <= 0) return;
    if (this.impulses.length === IMPULSE_CAPACITY) this.impulses.shift();
    this.impulses.push({at, power: Math.min(1, strength), direction: Math.sin(x * .17 + family * 2.3)});
  }
  step(dt: number, time: number, lights: readonly BurstSource[], enabled: boolean,
    motion: boolean, reducedFlashes: boolean): void {
    if (!Number.isFinite(dt + time) || dt <= 0) return;
    let energy = 0;
    for (let i = 0; i < Math.min(lights.length, BURST_LIGHT_CAPACITY); i++) energy += burstLightEnergy(lights[i], reducedFlashes);
    // Only attenuate a little during bright passages. Never raise global exposure,
    // whiten the waterfront, remove stars, or introduce a full-screen flash.
    const target = energy / (1 + energy);
    const tau = target > this.pressure ? .32 : 1.65;
    this.pressure += (target - this.pressure) * (1 - Math.exp(-Math.min(dt, .1) / tau));
    this.exposure = enabled ? CINEMA_BASE_EXPOSURE - this.pressure * (reducedFlashes ? .055 : .10) : CINEMA_BASE_EXPOSURE;
    this.cameraX = this.cameraY = 0;
    for (let i = this.impulses.length - 1; i >= 0; i--) {
      const impulse = this.impulses[i], age = time - impulse.at;
      if (age > 2.8 || age < 0) { this.impulses.splice(i, 1); continue; }
      if (!motion) continue;
      const envelope = (1 - Math.exp(-age * 8)) * Math.exp(-age * 2.8) * impulse.power;
      this.cameraX += Math.sin(age * 7) * envelope * impulse.direction;
      this.cameraY += Math.sin(age * 9) * envelope * .65;
    }
    this.cameraX = Math.tanh(this.cameraX) * CINEMA_MAX_CAMERA_PIXELS;
    this.cameraY = Math.tanh(this.cameraY) * CINEMA_MAX_CAMERA_PIXELS;
  }
  snapshot() { return {exposure: this.exposure, lightPressure: this.pressure, cameraX: this.cameraX,
    cameraY: this.cameraY, impulseCount: this.impulses.length, impulseCapacity: IMPULSE_CAPACITY}; }
}
