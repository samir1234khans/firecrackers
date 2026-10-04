import { clamp, hash01 } from './catalog.js';
/** Authored display distances, not metres or firing specifications. Signatures
 * retain their original flight and recipes. Immutable admission owns these values. */
export const LEGACY_FLIGHT = [
  { powered: .29, depth: -62 }, { powered: .21, depth: -48 },
  { powered: .27, depth: -58 }, { powered: .23, depth: -64 },
  { powered: .30, depth: -76 }, { powered: .26, depth: -60 },
  { powered: .25, depth: -56 }, { powered: .22, depth: -70 },
  { powered: .31, depth: -62 }, { powered: .28, depth: -78 },
] as const;
export const LEGACY_EXPANSION = 1.22;
export const LEGACY_FINALE_SPREAD = 75;
// Complete principal and child envelopes, including falling tails and carrier
// travel. Tuple: half-width, rise, full fall, half-depth, opening fall.
// Fitting projects both near and far corners, never only a flat disc.
export const LEGACY_ENVELOPES = [
  [88,54,154,86,40], [83,67,97,82,42], [70,51,91,69,35], [59,46,74,59,33],
  [160,78,148,100,48], [80,50,50,58,28], [78,57,105,47,44], [81,34,67,76,25],
  [74,57,24,34,18], [64,46,86,66,33],
] as const;
export function poweredFraction(family: number): number { return LEGACY_FLIGHT[family]?.powered ?? [.28,.22,.31][family-10] ?? .24; }
export function burstDepth(family: number): number { return LEGACY_FLIGHT[family]?.depth ?? 0; }
export function recedingShellSize(family: number, progress: number): number {
  const t=clamp(progress,0,1);
  return family<10 ? 2.2*(1-.68*t*t*(3-2*t)) : 2.2+.8*clamp((t-.16)/.50,0,1)**2*(3-2*clamp((t-.16)/.50,0,1));
}
/** Fine cores retain a soft halo in every tier. No additional particle or pass. */
export function legacyStarGain(family: number, age: number, life: number, id: number): number {
  if(family>=10)return 1;
  const t=clamp(age/Math.max(.001,life),0,1);
  return clamp(age/.10,0,1)*Math.pow(Math.max(0,1-t),.20+hash01(id,4821)*.22);
}
/** Fixed six bounded depth bands spanning receded shells plus signature near stars. */
export function particleDepthBucket(z: number): number { return Math.max(0,Math.min(5,Math.floor((z+210)/55))); }
