/** Versioned, virtual-animation values; never physical firework instructions. */
export const CONFIG_VERSION = '2026-09-16.1';
export const FAMILIES = [
  { id: 'gold-willow', name: 'Gold Willow', short: 'Willow', note: 'A slow-falling canopy of gold.', color: '#eac17a', count: 170, speed: 18, life: 5.8, drag: 0.35, gravity: 3.0, trail: 2.6, cost: 1, ascent: 2.2 },
  { id: 'multicolor-peony', name: 'Multicolor Peony', short: 'Peony', note: 'A crisp sphere of jewel-like stars.', color: '#dd819d', count: 230, speed: 19, life: 2.3, drag: 0.58, gravity: 2.1, trail: 0.1, cost: 1, ascent: 1.7 },
  { id: 'chrysanthemum', name: 'Chrysanthemum', short: 'Chrysanthemum', note: 'Radiant golden spokes. Ruby tips.', color: '#ed9b69', count: 180, speed: 22, life: 3.4, drag: 0.68, gravity: 2.3, trail: 1.55, cost: 1, ascent: 1.9 },
  { id: 'silver-crossette-crackle', name: 'Silver Crossette Crackle', short: 'Crossette', note: 'Silver stars that split and softly crackle.', color: '#c2d9e6', count: 26, speed: 17, life: 2.9, drag: 0.4, gravity: 2.4, trail: 1.1, cost: 1, ascent: 1.8 },
  { id: 'grand-finale', name: 'Grand Finale', short: 'Finale', note: 'Layered bursts, ending in a golden curtain.', color: '#c5a4dc', count: 1, speed: 16, life: 6, drag: 0.4, gravity: 3, trail: 2, cost: 3, ascent: 2.4 },
] as const;
export type FamilyId = typeof FAMILIES[number]['id'];
export type Quality = 'low' | 'standard' | 'ultra';
export type ShowPreset = 'calm' | 'festival' | 'finale';
export const BUDGETS = {
  low: { scale: 0.60, units: 3, ratio: 1, trailRate: 22, smoke: 48 },
  standard: { scale: 1, units: 6, ratio: 1.5, trailRate: 32, smoke: 100 },
  ultra: { scale: 1.22, units: 6, ratio: 2, trailRate: 42, smoke: 160 },
} as const;
export const familyIndex = (id: string) => Math.max(0, FAMILIES.findIndex(f => f.id === id));
export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(x) ? x : lo));
export function randomStream(seed: number) {
  let n = seed >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
