import { clamp, hash01 } from './catalog.js';
/** Small, coherent shell imperfections. Independent hashes do not consume the
 * launch, show, palette or smoke random streams. The authored envelope never grows. */
export function shellAxis(seed: number, axis: number): number { return .958 + hash01(seed, 1771 + axis * 79) * .042; }
export function starDrag(base: number, seed: number, index: number): number { return base * (.96 + .08 * hash01(seed ^ index, 3187)); }
/** Shared altitude shear: cloud drift and falling stars belong to the same air mass. */
export function altitudeWind(base: number, y: number, z = 0): number {
  const altitude = clamp((y - 16) / 160, 0, 1);
  return base * (.90 + .28 * altitude * altitude * (3 - 2 * altitude)) * (1 + .035 * Math.sin(z * .035));
}
/** Render-time colour only. Coloured chemical emitters retain their hue; gold
 * metal tails warm as they cool. Do not turn every blue/green star red. */
export function starColor(family: number, age: number, life: number, red: number, green: number, blue: number, out: Float32Array): void {
  const t = clamp(age / Math.max(.001, life), 0, 1);
  const hot = Math.exp(-Math.max(0, age) * 14) * (family >= 10 ? .035 : .08);
  const warm = family === 0 || family === 2 ? clamp((t - .48) / .52, 0, 1) : 0;
  out[0] = Math.max(0, red + hot * (1 - Math.min(1, red)));
  out[1] = Math.max(0, green * (1 - warm * (family===2?.85:.38)) + hot * (1 - Math.min(1, green)));
  out[2] = Math.max(0, blue * (1 - warm * .72) + hot * (1 - Math.min(1, blue)));
}
export function aerialTransmission(distance: number): number {
  // Local clear air stays clear; distant stars lose a little contrast, not identity.
  return Math.exp(-Math.max(0, Math.min(1200, distance) - 170) * .00065);
}
