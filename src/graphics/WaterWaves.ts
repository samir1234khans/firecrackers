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
export type WaterBounds = { farZ: number; nearZ: number; waveCount: number };
export type WaterFrame = WaterBounds & { phase: number; motionAllowed: boolean };
const DEFAULT_BOUNDS: Readonly<WaterBounds> = { farZ: -1000, nearZ: WATER_NEAR_Z, waveCount: 4 };

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
    const slope = Math.cos(angle) * wave.amplitude;
    out.height += Math.sin(angle) * wave.amplitude;
    out.slopeX += slope * wave.x;
    out.slopeZ += slope * wave.z;
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
    height += Math.sin(x * wave.x + z * wave.z - phase * wave.speed + wave.phase) * wave.amplitude;
  }
  const farT = Math.min(1, (z - bounds.farZ) / Math.min(WATER_FAR_FADE_MAX, span * WATER_FAR_FADE_FRACTION));
  const nearT = Math.min(1, (bounds.nearZ - z) / Math.min(WATER_NEAR_FADE_MAX, span * WATER_NEAR_FADE_FRACTION));
  return height * (farT * farT * (3 - 2 * farT)) * (nearT * nearT * (3 - 2 * nearT));
}
