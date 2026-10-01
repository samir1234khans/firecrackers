/** Shared long waves: visual surface normals and buoyant scenery use one field.
 * Fixed coefficients, analytic slopes, caller-owned output, no frame allocations.
 */
export const WATER_WAVES = [
  { x: .036, z: .052, speed: .54, amplitude: .030, phase: .7 },
  { x: -.065, z: .031, speed: .73, amplitude: .018, phase: 2.1 },
  { x: .11, z: -.083, speed: .91, amplitude: .009, phase: 4.3 },
] as const;
export type WaterSample = { height: number; slopeX: number; slopeZ: number };
export function sampleWater(x: number, z: number, time: number, out: WaterSample) {
  out.height = out.slopeX = out.slopeZ = 0;
  for (const wave of WATER_WAVES) {
    const phase = x*wave.x + z*wave.z - time*wave.speed + wave.phase;
    const slope = Math.cos(phase)*wave.amplitude;
    out.height += Math.sin(phase)*wave.amplitude;
    out.slopeX += slope*wave.x; out.slopeZ += slope*wave.z;
  }
  return out;
}
