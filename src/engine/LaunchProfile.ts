import { FAMILIES, clamp } from './catalog.js';
import type { FamilyId } from './catalog';
import type { StageLayout } from './StageLayout';
import { SHELL_LOCAL_Y } from './LaunchGeometry.js';
import { ROCKET_SCALE } from './FusePath.js';
import type { LaunchPropComposition } from './LaunchComposition.js';

export type LaunchProfile = { apex: number; apexMin: number; apexMax: number; centerFraction: number; effectScale?: number;
  /** Maximum world-space travel of the smaller finale carriers. */
  finaleSpread?: number;
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
  const radius = index === 4 ? scene.width * .48 : (index >= 10 ? 90 * effectScale : index === 1 ? 75 * effectScale : index === 3 ? 60 * effectScale : 55) * scale;
  const guard = index >= 10 ? 24 : 12;
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
export function resolveScreenLaunchProfile(layout: StageLayout, family: FamilyId, scale: number, worldHeightAt: (screenY: number) => number, centerX = layout.heroRect.x + layout.heroRect.width / 2, prop?: LaunchPropComposition, skyBottom?: number): LaunchProfile {
  const scene = layout.unobstructedScene ?? layout.heroRect;
  const index = Math.max(0, FAMILIES.findIndex(f => f.id === family));
  const effectScale = index >= 10 ? signatureCompositionScale(layout, scale, centerX, scene.y + scene.height * .34) : index === 1 || index === 3 ? Math.max(.025, Math.min(1, (scene.width * .43 - 12) / ((index === 1 ? 75 : 60) * scale * 1.2))) : 1;
  if (index === 4) {
    const phone = layout.viewport.width / layout.viewport.height < .72;
    const shore = skyBottom ?? Math.min(phone ? .72 : .5, (scene.y + scene.height - 40) / layout.viewport.height) * layout.viewport.height;
    const skyHeight = Math.max(24, Math.min(scene.y + scene.height, shore) - scene.y - 10);
    const centerY = scene.y + skyHeight * .40;
    const fitted = Math.max(.025, Math.min(1.6, (scene.width * .43 - 12) / (88 * scale * 1.2),
      (skyHeight * .40 - 10) / (65 * scale * 1.2), (skyHeight * .60 - 10) / (112 * scale * 1.2)));
    const attachment = prop?.shellOffset ?? SHELL_LOCAL_Y * ROCKET_SCALE[1];
    return { apex: worldHeightAt(centerY) - attachment,
      apexMin: worldHeightAt(centerY + skyHeight * .012) - attachment,
      apexMax: worldHeightAt(centerY - skyHeight * .012) - attachment,
      centerFraction: (centerY - scene.y) / scene.height, effectScale: fitted,
      finaleSpread: Math.max(0, (scene.width * .43 - 12) / (scale * 1.2) - 60 * fitted),
      ...(prop ? { prop, ground: prop.originY } : {}) };
  }
  const extent = UPPER_EXTENT[index] * scale * effectScale;
  const safeFraction = (extent + Math.max(8, scene.height * .025)) / scene.height;
  const high = Math.min(.37, Math.max(.31, safeFraction));
  const centerFraction = Math.max(.34, high);
  // The solver moves the body's origin; primary effects start at the shell attachment.
  const attachment = prop?.shellOffset ?? SHELL_LOCAL_Y * ROCKET_SCALE[1];
  return { apex: worldHeightAt(scene.y + scene.height * centerFraction) - attachment,
    apexMin: worldHeightAt(scene.y + scene.height * .37) - attachment,
    apexMax: worldHeightAt(scene.y + scene.height * high) - attachment, centerFraction, ...(prop ? { prop, ground: prop.originY } : {}), ...(index >= 10 || index === 1 || index === 3 ? { effectScale } : {}) };
}
