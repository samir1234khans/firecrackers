import { BUDGETS, FAMILIES, randomStream } from './catalog.js';
import type { Quality } from './catalog.js';
import type { Pool } from './Pool.js';

export type RGB = [number, number, number];
type Vector = [number, number, number];
export type GrandStar = {
    velocity: Vector; color: RGB; life: number; size: number;
    drag: number; gravity: number; trail: number; split: number;
};
export type GrandCarrier = { velocity: Vector; delay: number; palette: number; seed: number; reserve: number };
export type GrandRecipe = { stars: GrandStar[]; carriers: GrandCarrier[]; light: RGB };
const TAU = Math.PI * 2;
export const OPAL_PALETTE: readonly RGB[] = [
    [.22, .76, 1], [.20, 1, .66], [.66, .30, 1],
    [1, .25, .46], [1, .65, .20], [.48, .88, 1], [.94, .62, 1],
];
const COOLING: readonly RGB[] = [[.47, .26, 1], [1, .44, .23], [.54, .79, 1], [1, .16, .40], [.72, .84, 1]];

/** No per-frame RNG: both renderers read the same evolving star color and trail history. */
export function coolGrandStar(pool: Pool, i: number, dt: number): void {
    const target = COOLING[pool.family[i] - 5];
    if (!target || pool.age[i] < pool.life[i] * .52) return;
    const amount = 1 - Math.exp(-dt * 1.1);
    pool.r[i] += (target[0] - pool.r[i]) * amount;
    pool.g[i] += (target[1] - pool.g[i]) * amount;
    pool.b[i] += (target[2] - pool.b[i]) * amount;
}

export function carrierTint(family: number, palette = 0): RGB {
    return family === 9 ? OPAL_PALETTE[Math.abs(palette) % OPAL_PALETTE.length] : [1, .69, .30];
}

/** Bounded, original virtual-display recipes. All distances/times are artistic parameters. */
export function grandRecipe(family: number, quality: Quality, seed: number, scale = 1, palette = -1): GrandRecipe {
    if (!Number.isInteger(family) || family < 5 || family > 9) throw new RangeError('Unknown grand firework');
    if (!Number.isFinite(scale) || scale <= 0 || scale > 1) throw new RangeError('Invalid effect scale');
    const f = FAMILIES[family], rand = randomStream(seed);
    const child = family === 9 && palette >= 0;
    const count = Math.round((child ? 76 : f.count) * BUDGETS[quality].scale);
    const stars: GrandStar[] = [], carriers: GrandCarrier[] = [];
    const rotation = (rand() - .5) * .16;
    const sphere = (i: number): Vector => {
        const y = 1 - 2 * (i + .5) / count;
        const theta = i * 2.399963229728653 + rotation + (rand() - .5) * .16;
        const radius = Math.sqrt(Math.max(0, 1 - y * y));
        return [Math.cos(theta) * radius, y, Math.sin(theta) * radius];
    };
    const add = (velocity: Vector, color: RGB, options: Partial<Omit<GrandStar, 'velocity' | 'color'>> = {}) => {
        stars.push({ velocity: velocity.map(v => v * scale) as Vector, color,
            life: f.life * (.86 + rand() * .23), size: .12, drag: f.drag,
            gravity: f.gravity, trail: f.trail, split: 0, ...options });
    };
    for (let i = 0; i < count; i++) {
        const jitter = .94 + rand() * .12;
        if (family === 5) {
            // Interleaved violet pistil and jade upper dome: both survive every quality tier.
            if (i % 4 === 0) {
                const v = sphere(i);
                add([v[0] * 15, v[1] * 14 + 5, v[2] * 15], [.64, .20, 1], { life: 4.3 + rand(), trail: .60 });
            } else {
                const theta = i * 2.399963229728653 + rotation;
                const rise = .14 + ((i * 37) % 101) / 101 * .82;
                const radius = Math.sqrt(1 - rise * rise);
                const speed = 28 * jitter;
                add([Math.cos(theta) * radius * speed * 1.05, rise * speed, Math.sin(theta) * radius * speed * .74],
                    i % 3 ? [.10, .96, .55] : [.24, .90, 1]);
            }
        } else if (family === 6) {
            // Twelve thick clusters, rather than another uniformly sampled spherical shell.
            if (i % 5 === 0) {
                add(sphere(i).map(v => v * 13) as Vector, [1, .72, .34], { life: 3.5 + rand(), trail: .45 });
            } else {
                const petal = Math.floor(i / 5) % 12;
                const angle = petal / 12 * TAU + rotation + (rand() - .5) * .13;
                const speed = (25 + rand() * 6) * jitter;
                add([Math.cos(angle) * speed, Math.sin(angle) * speed, (rand() - .5) * 14],
                    petal % 3 === 0 ? [1, .23, .47] : petal % 3 === 1 ? [1, .045, .14] : [.83, .07, .61], { size: .16 });
            }
        } else if (family === 7) {
            if (i % 2 === 0) {
                add(sphere(i).map(v => v * 18 * jitter) as Vector,
                    i % 6 ? [.12, .34, 1] : [.29, .78, 1], { life: 4.3 + rand() * .9, trail: .36 });
            } else {
                const theta = i * 2.399963229728653, x = Math.cos(theta) * 33 * jitter;
                const y = Math.sin(theta) * 11 * jitter, z = Math.sin(theta) * 29 * jitter;
                const roll = .42 + rotation;
                add([x * Math.cos(roll) - y * Math.sin(roll), x * Math.sin(roll) + y * Math.cos(roll), z],
                    [1, .71, .32], { life: 4.2 + rand() * .6, trail: .38, size: .14 });
            }
        } else if (family === 8) {
            const arm = i % 11, angle = -.95 + arm / 10 * 1.9 + (rand() - .5) * .045;
            const speed = (25 + rand() * 6) * jitter;
            const isLeafParent = i % 10 === 0;
            add([Math.sin(angle) * speed, Math.cos(angle) * speed, Math.sin(arm * 1.71) * 9 + (rand() - .5) * 3],
                arm % 3 ? [1, .44, .075] : [1, .68, .24],
                { size: .18, split: isLeafParent ? 1.3 + rand() * .45 : 0 });
        } else if (child) {
            const tone = OPAL_PALETTE[palette % OPAL_PALETTE.length];
            const v = sphere(i), speed = 16 + rand() * 3;
            add(v.map(value => value * speed) as Vector, tone,
                { life: 3.2 + rand() * .8, drag: .58, gravity: 3.1, trail: 1.05, size: .13 });
        } else {
            const v = sphere(i);
            add(v.map(value => value * 24 * jitter) as Vector, OPAL_PALETTE[i % OPAL_PALETTE.length],
                { life: 4.2 + rand() * .8, trail: 1.2, size: .14 });
        }
    }
    if (family === 9 && !child) {
        for (let i = 0; i < 7; i++) {
            const angle = i / 7 * TAU + rotation;
            carriers.push({ velocity: [Math.cos(angle) * (4.1 + rand() * 1.2), 8.6 + Math.sin(angle) * 1.5, Math.sin(angle) * 4.8],
                delay: 1.05 + i * .74, palette: i, seed: Math.floor(rand() * 0xffffffff), reserve: 92 });
        }
    }
    const light: RGB = [0, 0, 0];
    for (const star of stars) for (let channel = 0; channel < 3; channel++) light[channel] += star.color[channel] / stars.length;
    return { stars, carriers, light };
}
