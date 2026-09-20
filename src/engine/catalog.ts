/** Versioned virtual-animation parameters, not physical firework specifications. */
export const CONFIG_VERSION = '2026-09-20.1';
export const FAMILIES = [
    { id: 'gold-willow', name: 'Gold Willow', short: 'Willow', note: 'A slow-falling canopy of gold.', color: '#eac17a', count: 192, speed: 25, life: 7.8, drag: 0.41, gravity: 4.3, trail: 3.1, cost: 1, ascent: 2.2 },
    { id: 'multicolor-peony', name: 'Multicolor Peony', short: 'Peony', note: 'A crisp sphere of jewel-like stars.', color: '#dd819d', count: 248, speed: 24, life: 2.7, drag: 0.66, gravity: 2.8, trail: 0.14, cost: 1, ascent: 1.9 },
    { id: 'chrysanthemum', name: 'Chrysanthemum', short: 'Chrysanthemum', note: 'Radiant copper rays with ruby tips.', color: '#ed9b69', count: 192, speed: 25, life: 4.8, drag: 0.50, gravity: 3.1, trail: 1.7, cost: 1, ascent: 2.1 },
    { id: 'silver-crossette-crackle', name: 'Silver Crossette Crackle', short: 'Crossette', note: 'Silver stars open into four smaller trails.', color: '#c2d9e6', count: 32, speed: 19, life: 3.2, drag: 0.38, gravity: 3.0, trail: 0.9, cost: 1, ascent: 2.0 },
    { id: 'grand-finale', name: 'Grand Finale', short: 'Finale', note: 'A constellation of bursts. A golden ending.', color: '#c5a4dc', count: 1, speed: 18, life: 7.2, drag: 0.43, gravity: 3.2, trail: 2.9, cost: 3, ascent: 2.4 },
] as const;
export type FamilyId = typeof FAMILIES[number]['id'];
export type Quality = 'low' | 'standard' | 'ultra';
export type ShowPreset = 'calm' | 'festival' | 'finale';
export const BUDGETS = {
    low: { scale: 0.60, units: 3, ratio: 1, pixels: 1000000, trailRate: 24, trails: 12000, smoke: 32, bloom: 0.12 },
    standard: { scale: 1, units: 6, ratio: 1.5, pixels: 2100000, trailRate: 36, trails: 20000, smoke: 64, bloom: 0.30 },
    ultra: { scale: 1.20, units: 6, ratio: 1.75, pixels: 3700000, trailRate: 48, trails: 24000, smoke: 96, bloom: 0.40 },
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
/** Stateless variation: changing smoke emission cannot perturb a star's trajectory. */
export function hash01(id: number, salt: number) {
    let x = Math.imul((id ^ salt) >>> 0, 0x45d9f3b);
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
