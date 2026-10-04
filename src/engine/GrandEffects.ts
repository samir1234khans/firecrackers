import { LEGACY_EXPANSION } from './LegacyRealism.js';
import { BUDGETS, FAMILIES, randomStream } from './catalog.js';
import type { Quality } from './catalog.js';
import type { Pool } from './Pool.js';
import { signatureTint } from './FlagshipEffects.js';

export type RGB = [number, number, number];
type Vector = [number, number, number];
export type GrandStar = {
    velocity: Vector; color: RGB; life: number; size: number;
    drag: number; gravity: number; trail: number; split: number; delay?: number; role?: number; wave?: number; curve?: number;
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

export function carrierTint(family: number, palette = 0, progress = 1): RGB {
    if (family >= 10) return signatureTint(family);
    if (family === 5) {
        const t = Math.max(0,Math.min(1,(progress-.65)/.35));
        return [.18+.46*t,.88-.68*t,.58+.42*t];
    }
    if (family === 7 && progress < .65) {
        const t = Math.max(0,Math.min(1,progress/.65));
        return [1-.52*t,.83-.13*t,.56+.44*t];
    }
    return family === 9 ? OPAL_PALETTE[Math.abs(palette) % OPAL_PALETTE.length]:family===6?[1,.18,.37]:family===7?[.48,.70,1]:family===3?[.83,.91,1]:[1,.69,.30];
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
        stars.push({ velocity: velocity.map(v => v * scale * LEGACY_EXPANSION) as Vector, color,
            life: f.life * (.86 + rand() * .23), size: .12, drag: f.drag,
            trail: f.trail, split: 0, delay:rand()*.065, role:0, wave:0, curve:0, ...options, gravity:(options.gravity??f.gravity)*scale });
    };
    for (let i = 0; i < count; i++) {
        const jitter = .94 + rand() * .12;
        if (family === 5) {
            // Interleaved violet pistil and jade upper dome: both survive every quality tier.
            if (i % 4 === 0) {
                const v = sphere(i);
                add([v[0] * 15, v[1] * 14 + 5, v[2] * 15], [.64, .20, 1], { life: 4.3 + rand(), trail: .60, role:1, delay:.06+rand()*.08 });
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
                add(sphere(i).map(v => v * 13) as Vector, [1, .72, .34], { life: 3.5 + rand(), trail: .45, role:1, delay:.08+rand()*.08 });
            } else {
                const petal = Math.floor(i / 5) % 12;
                const angle = petal / 12 * TAU + rotation + (rand() - .5) * .13;
                const speed = (25 + rand() * 6) * jitter;
                add([Math.cos(angle) * speed, Math.sin(angle) * speed, Math.sin(petal*2.399963)*16+(rand()-.5)*5],
                    petal % 3 === 0 ? [1, .23, .47] : petal % 3 === 1 ? [1, .045, .14] : [.83, .07, .61], { size: .125, role:2, delay:(petal%4)*.026+rand()*.035 });
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
                    [1, .71, .32], { life: 4.2 + rand() * .6, trail: .30, size: .115, role:2, delay:.035+rand()*.025 });
            }
        } else if (family === 8) {
            const arm = i % 11, angle = -.95 + arm / 10 * 1.9 + (rand() - .5) * .045;
            const speed = (25 + rand() * 6) * jitter;
            const isLeafParent = i % 10 === 0;
            add([Math.sin(angle) * speed, Math.cos(angle) * speed, Math.sin(arm * 1.71) * 9 + (rand() - .5) * 3],
                arm % 3 ? [1, .44, .075] : [1, .68, .24],
                { size: .13, role:arm+2, curve:Math.sin(angle)*.9*scale, delay:Math.floor(i/11)*.0025, split: isLeafParent ? 1.3 + rand() * .45 : 0 });
        } else if (child) {
            const tone = OPAL_PALETTE[palette % OPAL_PALETTE.length];
            const v = sphere(i), speed = 16 + rand() * 3;
            add(v.map(value => value * speed) as Vector, tone,
                { life: 3.2 + rand() * .8, drag: .58, gravity: 3.1, trail: 1.05, size: .13 });
        } else {
            const v = sphere(i);
            add(v.map(value => value * 24 * jitter) as Vector, OPAL_PALETTE[i % OPAL_PALETTE.length],
                { life: 4.2 + rand() * .8, trail: 1.2, size: .12 });
        }
    }
    if (family === 9 && !child) {
        for (let i = 0; i < 7; i++) {
            const angle = i / 7 * TAU + rotation;
            carriers.push({ velocity: [Math.cos(angle) * (4.1 + rand() * 1.2)*scale, (8.6 + Math.sin(angle) * 1.5)*scale, Math.sin(angle) * 7.2*scale],
                delay: 1.05 + i * .74, palette: i, seed: Math.floor(rand() * 0xffffffff), reserve: 92 });
        }
    }
    const light: RGB = [0, 0, 0];
    for (const star of stars) for (let channel = 0; channel < 3; channel++) light[channel] += star.color[channel] / stars.length;
    return { stars, carriers, light };
}
