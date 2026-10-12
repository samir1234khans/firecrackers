import { burstDepth, LEGACY_ENVELOPES } from '../engine/LegacyRealism.js';
import type { LaunchProfile } from '../engine/LaunchProfile.js';
import { FAMILIES } from '../engine/catalog.js';
import type { FamilyId } from '../engine/catalog.js';
import { inShoreline } from './ShorelineModel.js';
type Projection = (x: number, y: number, z: number) => { x: number; y: number };

/** One immutable far origin and far apex. Admission still belongs to the existing engine. */
export function resolveShorelineLaunch(id: FamilyId, x: number, y: number, width: number, height: number, horizon: number,
  base: LaunchProfile, world: Projection, screen: Projection): LaunchProfile | null {
  if (!inShoreline(x, y, horizon, width, height)) return null;
  const family = FAMILIES.findIndex(f => f.id === id); if (family < 0) return null;
  const originZ = width / height < .72 ? -178 : -998;
  const depth = originZ + burstDepth(family) * .24;
  const origin = world(x * width, (horizon - .006) * height, originZ);
  const apexY = Math.max(.10, horizon - Math.min(.26, horizon * .42)) * height;
  const target = world(x * width, apexY, depth);
  const shell = base.prop?.shellOffset ?? 0;
  const envelope = LEGACY_ENVELOPES[family] ?? [90, 65, 95, 65, 65];
  // Real perspective keeps a distant effect smaller. Fit the complete lifetime,
  // including child travel and near-depth fragments, rather than just its centre.
  const fits = (scale: number) => {
    for (const dx of [-envelope[0], envelope[0]]) for (const dy of [-envelope[2], envelope[1]]) for (const dz of [-envelope[3], envelope[3]]) {
      const p = screen(target.x + dx * scale, target.y + dy * scale, depth + dz * scale);
      if (p.x < 10 || p.x > width - 10 || p.y < 12 || p.y > horizon * height - 4) return false;
    }
    return true;
  };
  if (!fits(.06)) return null;
  let low = .06, high = .72;
  for (let i = 0; i < 14; i++) { const mid = (low + high) / 2; if (fits(mid)) low = mid; else high = mid; }
  const apex = Math.max(origin.y + 10, target.y - shell);
  return { ...base, ground: origin.y, padX: origin.x, aimX: target.x, originDepth: originZ, burstDepth: depth,
    apex, apexMin: apex, apexMax: apex, effectScale: low,
    ...(family === 4 ? { finaleSpread: 60 * low } : {}), normalizedPlacement: x };
}
