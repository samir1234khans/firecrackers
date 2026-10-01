import { FAMILIES } from './catalog.js';
import type { FamilyId } from './catalog';
import type { StageLayout } from './StageLayout';
import { SHELL_LOCAL_Y } from './LaunchGeometry.js';
import { ROCKET_SCALE } from './FusePath.js';

export type LaunchProfile = { apex: number; apexMin: number; apexMax: number; centerFraction: number; effectScale?: number };
// Principal structures including Willow canopy, tilted Saturn ring, Phoenix
// branches and Supernova's ascending secondary blossoms. No effect clipping.
const UPPER_EXTENT = [24, 26, 23, 27, 24, 38, 34, 35, 42, 34, 65, 55, 58] as const;
/** Conservative principal envelope including near-depth projection and child travel. */
export function signatureCompositionScale(layout: StageLayout, scale: number, x: number, y: number) {
  const r = layout.unobstructedScene;
  return Math.max(.025, Math.min(1, (Math.min(x - r.x, r.x + r.width - x) - 12) / (90 * scale),
    (y - r.y - 12) / (65 * scale), (r.y + r.height * .88 - y) / (95 * scale)));
}
export function resolveScreenLaunchProfile(layout: StageLayout, family: FamilyId, scale: number, worldHeightAt: (screenY: number) => number, centerX = layout.heroRect.x + layout.heroRect.width / 2): LaunchProfile {
  const scene = layout.unobstructedScene ?? layout.heroRect;
  const index = Math.max(0, FAMILIES.findIndex(f => f.id === family));
  const effectScale = index >= 10 ? signatureCompositionScale(layout, scale, centerX, scene.y + scene.height * .34) : 1;
  const extent = UPPER_EXTENT[index] * scale * effectScale;
  const safeFraction = (extent + Math.max(8, scene.height * .025)) / scene.height;
  const high = Math.min(.37, Math.max(.31, safeFraction));
  const centerFraction = Math.max(.34, high);
  // The solver moves the body's origin; primary effects start at the shell attachment.
  const attachment = SHELL_LOCAL_Y * ROCKET_SCALE[1];
  return { apex: worldHeightAt(scene.y + scene.height * centerFraction) - attachment,
    apexMin: worldHeightAt(scene.y + scene.height * .37) - attachment,
    apexMax: worldHeightAt(scene.y + scene.height * high) - attachment, centerFraction, ...(index >= 10 ? { effectScale } : {}) };
}
