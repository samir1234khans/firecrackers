/** Fixed art direction, not a real-time astronomical ephemeris. CSS pixels keep
 * the disc circular on every backend and avoid per-launch camera movement. */
export const MOON_X = .78;
export type MoonFrame = { x: number; y: number; radius: number };
export function updateMoonFrame(width: number, height: number, horizon: number, out: MoonFrame) {
  out.radius = Math.min(30, Math.max(15, Math.min(width, height)*.039));
  out.x = width*MOON_X;
  out.y = Math.max(out.radius+24, Math.min(height*horizon*.23, height*.21));
  return out;
}
