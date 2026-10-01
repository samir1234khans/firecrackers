import { FAMILIES, clamp } from './catalog.js';
import type { FamilyId } from './catalog';
import type { StageLayout } from './StageLayout';
import { SHELL_LOCAL_Y } from './LaunchGeometry.js';
import { ROCKET_SCALE } from './FusePath.js';
import type { LaunchPropComposition } from './LaunchComposition.js';

export type LaunchProfile = { apex: number; apexMin: number; apexMax: number; centerFraction: number; effectScale?: number;
  prop?: LaunchPropComposition; padX?: number; ground?: number; aimX?: number; normalizedPlacement?: number };
// Principal structures including Willow canopy, tilted Saturn ring, Phoenix
// branches and Supernova's ascending secondary blossoms. No effect clipping.
const UPPER_EXTENT = [24, 26, 23, 27, 24, 38, 34, 35, 42, 34, 65, 55, 58] as const;
/** Move the shell only as far inward as its unchanged principal envelope needs. */
export function resolveLaunchAimScreenX(layout: StageLayout, family: FamilyId, scale: number, padScreenX: number, effectScale = 1, nearDepthFactor = 1) {
  const scene=layout.unobstructedScene, index=FAMILIES.findIndex(f=>f.id===family);
  // Near-depth projection magnifies both the radius AND the off-center shell.
  // Solve q*(aimOffset+radius) <= halfWidth-guard, rather than add pixels
  // to a flat radius. Signature depth is bounded by terminal displacement:
  // largest primary vz=34*.82 at drag=.43 gives <65 world units; children
  // have shorter, slower depth travel. Renderers resolve q at +/-95 vertical
  // extent and this near-depth plane using their actual projection.
  const radius=(index>=10?90*effectScale:55)*scale,guard=index>=10?24:12;
  const q=index>=10?Math.max(1,nearDepthFactor):1;
  const margin=Math.min(scene.width/2,scene.width/2-(scene.width/2-guard)/q+radius);
  return clamp(padScreenX,scene.x+margin,scene.x+scene.width-margin);
}
/** Conservative principal envelope including near-depth projection and child travel. */
export function signatureCompositionScale(layout: StageLayout, scale: number, x: number, y: number) {
  const r = layout.unobstructedScene;
  return Math.max(.025, Math.min(1, (Math.min(x - r.x, r.x + r.width - x) - 12) / (90 * scale),
    (y - r.y - 12) / (65 * scale), (r.y + r.height * .88 - y) / (95 * scale)));
}
export function resolveScreenLaunchProfile(layout: StageLayout, family: FamilyId, scale: number, worldHeightAt: (screenY: number) => number, centerX = layout.heroRect.x + layout.heroRect.width / 2, prop?: LaunchPropComposition): LaunchProfile {
  const scene = layout.unobstructedScene ?? layout.heroRect;
  const index = Math.max(0, FAMILIES.findIndex(f => f.id === family));
  const effectScale = index >= 10 ? signatureCompositionScale(layout, scale, centerX, scene.y + scene.height * .34) : 1;
  const extent = UPPER_EXTENT[index] * scale * effectScale;
  const safeFraction = (extent + Math.max(8, scene.height * .025)) / scene.height;
  const high = Math.min(.37, Math.max(.31, safeFraction));
  const centerFraction = Math.max(.34, high);
  // The solver moves the body's origin; primary effects start at the shell attachment.
  const attachment = prop?.shellOffset ?? SHELL_LOCAL_Y * ROCKET_SCALE[1];
  return { apex: worldHeightAt(scene.y + scene.height * centerFraction) - attachment,
    apexMin: worldHeightAt(scene.y + scene.height * .37) - attachment,
    apexMax: worldHeightAt(scene.y + scene.height * high) - attachment, centerFraction, ...(prop ? { prop, ground: prop.originY } : {}), ...(index >= 10 ? { effectScale } : {}) };
}
