import type { Quality } from '../engine/catalog.js';

/** Shared height field: the surface, hulls and contacts sample the same phase.
 * Wave vectors are 2*pi / wavelength; fixed coefficients and caller-owned output
 * keep frame sampling deterministic and allocation free.
 */
export const WATER_Y = 4.65;
/** Existing terrace coping's water-facing edge; waves flatten before it. */
export const WATER_NEAR_Z = -14.75;
export const WATER_WAVES = [
  { x: Math.cos(.61) * Math.PI * 2 / 180, z: Math.sin(.61) * Math.PI * 2 / 180, speed: .54, amplitude: .260, phase: .7 },
  { x: Math.cos(2.23) * Math.PI * 2 / 100, z: Math.sin(2.23) * Math.PI * 2 / 100, speed: .73, amplitude: .140, phase: 2.1 },
  { x: Math.cos(-.33) * Math.PI * 2 / 60, z: Math.sin(-.33) * Math.PI * 2 / 60, speed: .91, amplitude: .075, phase: 4.3 },
  { x: Math.cos(-1.87) * Math.PI * 2 / 40, z: Math.sin(-1.87) * Math.PI * 2 / 40, speed: 1.13, amplitude: .035, phase: 1.8 },
] as const;
export const WATER_MAX_DISPLACEMENT = .510;
export const WATER_FAR_FADE_MAX = 80;
export const WATER_FAR_FADE_FRACTION = .18;
export const WATER_NEAR_FADE_MAX = 18;
export const WATER_NEAR_FADE_FRACTION = .10;

export type WaterSample = { height: number; slopeX: number; slopeZ: number };
export const WATER_IMPULSE_LIMITS = Object.freeze({ count: 4, lifetime: 2.4, amplitude: .14, speed: 18, frequency: .65, width: 9 });
export type WaterImpulse = { x: number; z: number; startedAt: number; amplitude: number };
export type WaterBounds = { farZ: number; nearZ: number; waveCount: number; gains?: readonly number[]; impulses?: readonly WaterImpulse[]; time?: number; motionAllowed?: boolean };
export type WaterFrame = WaterBounds & { phase: number; motionAllowed: boolean };
export function waterDisplacementBound(bounds: Readonly<WaterBounds>) {
  const waves = bounds.gains ? WATER_WAVES.reduce((sum, wave, i) => sum + wave.amplitude * (bounds.gains?.[i] ?? 1), 0) : WATER_MAX_DISPLACEMENT;
  return waves + (bounds.impulses?.reduce((sum, impulse) => sum + Math.abs(impulse.amplitude), 0) ?? 0);
}
const DEFAULT_BOUNDS: Readonly<WaterBounds> = { farZ: -1000, nearZ: WATER_NEAR_Z, waveCount: 4 };

/** Four reused impulse slots; the world clock owns age and pause semantics. */
export class WaterInteraction {
  readonly impulses: WaterImpulse[] = Array.from({ length: WATER_IMPULSE_LIMITS.count }, () => ({ x: 0, z: 0, startedAt: -Infinity, amplitude: 0 }));
  add(x: number, z: number, time: number, bounds: Readonly<WaterBounds>) {
    if (!Number.isFinite(x + z + time) || z <= bounds.farZ || z >= bounds.nearZ || bounds.waveCount <= 0 || bounds.motionAllowed === false) return false;
    let oldest = this.impulses[0];
    for (const impulse of this.impulses) if (impulse.startedAt < oldest.startedAt) oldest = impulse;
    oldest.x = x; oldest.z = z; oldest.startedAt = time; oldest.amplitude = WATER_IMPULSE_LIMITS.amplitude;
    return true;
  }
  update(time: number, motionAllowed: boolean) {
    for (const impulse of this.impulses) if (!motionAllowed || time < impulse.startedAt || time - impulse.startedAt >= WATER_IMPULSE_LIMITS.lifetime) impulse.amplitude = 0;
  }
  activeCount() { let count = 0; for (const impulse of this.impulses) if (impulse.amplitude > 0) count++; return count; }
}

/** Resolve the quality/layout contract once per frame into preallocated state. */
export function updateWaterFrame(out: WaterFrame, simulationWaterPhase: number, quality: Quality, phone: boolean, motionAllowed: boolean) {
  out.waveCount = quality === 'ultra' ? 4 : quality === 'standard' ? 2 : 0;
  out.motionAllowed = motionAllowed && out.waveCount > 0;
  out.phase = out.motionAllowed ? simulationWaterPhase : 0;
  out.farZ = phone ? -180 : -1000;
  out.nearZ = WATER_NEAR_Z;
  return out;
}

/** Height and exact spatial derivatives, including the shoreline fade derivative.
 * The optional frame is structurally compatible with WaterBounds so renderers
 * and scenery pass a single shared object without per-sample options allocations.
 */
export function sampleWater(x: number, z: number, phase: number, out: WaterSample, bounds: Readonly<WaterBounds> = DEFAULT_BOUNDS) {
  out.height = out.slopeX = out.slopeZ = 0;
  const span = bounds.nearZ - bounds.farZ;
  if (span <= 0 || z <= bounds.farZ || z >= bounds.nearZ || bounds.waveCount <= 0) return out;
  const waveCount = Math.min(WATER_WAVES.length, bounds.waveCount);
  for (let i = 0; i < waveCount; i++) {
    const wave = WATER_WAVES[i];
    const angle = x * wave.x + z * wave.z - phase * wave.speed + wave.phase;
    const amplitude = wave.amplitude * (bounds.gains?.[i] ?? 1);
    const slope = Math.cos(angle) * amplitude;
    out.height += Math.sin(angle) * amplitude;
    out.slopeX += slope * wave.x;
    out.slopeZ += slope * wave.z;
  }
  if (bounds.motionAllowed !== false && bounds.impulses && bounds.time !== undefined) for (const impulse of bounds.impulses) {
    const age = bounds.time - impulse.startedAt;
    if (impulse.amplitude <= 0 || age < 0 || age >= WATER_IMPULSE_LIMITS.lifetime) continue;
    const dx = x - impulse.x, dz = z - impulse.z, radius = Math.hypot(dx, dz);
    const delta = radius - WATER_IMPULSE_LIMITS.speed * age;
    const envelope = Math.exp(-delta * delta / (2 * WATER_IMPULSE_LIMITS.width ** 2)) * (1 - age / WATER_IMPULSE_LIMITS.lifetime) ** 2 * impulse.amplitude;
    const angle = radius * WATER_IMPULSE_LIMITS.frequency - age * WATER_IMPULSE_LIMITS.speed * WATER_IMPULSE_LIMITS.frequency;
    const slope = envelope * (Math.cos(angle) * WATER_IMPULSE_LIMITS.frequency - Math.sin(angle) * delta / WATER_IMPULSE_LIMITS.width ** 2);
    out.height += Math.sin(angle) * envelope;
    if (radius > .0001) { out.slopeX += slope * dx / radius; out.slopeZ += slope * dz / radius; }
  }
  const farWidth = Math.min(WATER_FAR_FADE_MAX, span * WATER_FAR_FADE_FRACTION);
  const nearWidth = Math.min(WATER_NEAR_FADE_MAX, span * WATER_NEAR_FADE_FRACTION);
  const farT = Math.min(1, (z - bounds.farZ) / farWidth);
  const nearT = Math.min(1, (bounds.nearZ - z) / nearWidth);
  const farFade = farT * farT * (3 - 2 * farT);
  const nearFade = nearT * nearT * (3 - 2 * nearT);
  const fade = farFade * nearFade;
  const fadeDerivative = 6 * farT * (1 - farT) / farWidth * nearFade - farFade * 6 * nearT * (1 - nearT) / nearWidth;
  out.slopeZ = out.slopeZ * fade + out.height * fadeDerivative;
  out.height *= fade;
  out.slopeX *= fade;
  return out;
}

/** Height-only path for nearby Canvas reflection facets; hull/normal callers
 * continue using the complete analytic sample. No temporary sample is allocated.
 */
export function sampleWaterHeight(x: number, z: number, phase: number, bounds: Readonly<WaterBounds> = DEFAULT_BOUNDS) {
  const span = bounds.nearZ - bounds.farZ;
  if (span <= 0 || z <= bounds.farZ || z >= bounds.nearZ || bounds.waveCount <= 0) return 0;
  let height = 0;
  for (let i = 0; i < Math.min(WATER_WAVES.length, bounds.waveCount); i++) {
    const wave = WATER_WAVES[i];
    height += Math.sin(x * wave.x + z * wave.z - phase * wave.speed + wave.phase) * wave.amplitude * (bounds.gains?.[i] ?? 1);
  }
  if (bounds.motionAllowed !== false && bounds.impulses && bounds.time !== undefined) for (const impulse of bounds.impulses) {
    const age = bounds.time - impulse.startedAt;
    if (impulse.amplitude <= 0 || age < 0 || age >= WATER_IMPULSE_LIMITS.lifetime) continue;
    const radius = Math.hypot(x - impulse.x, z - impulse.z), delta = radius - WATER_IMPULSE_LIMITS.speed * age;
    height += Math.sin(radius * WATER_IMPULSE_LIMITS.frequency - age * WATER_IMPULSE_LIMITS.speed * WATER_IMPULSE_LIMITS.frequency) *
      Math.exp(-delta * delta / (2 * WATER_IMPULSE_LIMITS.width ** 2)) * (1 - age / WATER_IMPULSE_LIMITS.lifetime) ** 2 * impulse.amplitude;
  }
  const farT = Math.min(1, (z - bounds.farZ) / Math.min(WATER_FAR_FADE_MAX, span * WATER_FAR_FADE_FRACTION));
  const nearT = Math.min(1, (bounds.nearZ - z) / Math.min(WATER_NEAR_FADE_MAX, span * WATER_NEAR_FADE_FRACTION));
  return height * (farT * farT * (3 - 2 * farT)) * (nearT * nearT * (3 - 2 * nearT));
}
