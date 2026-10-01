import { BUDGETS, clamp, randomStream } from './catalog.js';
import type { Quality } from './catalog.js';
import type { GrandRecipe, GrandStar, RGB } from './GrandEffects.js';
import type { Pool } from './Pool.js';

export type SignatureStar = GrandStar & { delay: number; role: number; wave: number; curve: number };
export type SignatureRecipe = GrandRecipe & { stars: SignatureStar[] };
const GOLD: RGB = [1, .73, .36], ICE: RGB = [.40, .77, 1], FIRE: RGB = [1, .23, .035];
export const signatureTint = (family: number): RGB => family === 11 ? ICE : family === 12 ? FIRE : GOLD;
export const signatureBody = ['#c5ae81', '#203654', '#64272c'] as const;
const TAU = Math.PI * 2;

/** Discrete-break allocation only. Later breaks never create further carriers. */
export function signatureRecipe(family: number, quality: Quality, seed: number, scale = 1, stage = 0): SignatureRecipe {
  if (![10, 11, 12].includes(family) || !Number.isFinite(scale) || scale <= 0 || scale > 1 || ![0, 1, 2].includes(stage)) throw new RangeError('Invalid signature recipe');
  const rand = randomStream(seed), stars: SignatureStar[] = [], carriers: GrandRecipe['carriers'] = [];
  const count = Math.round((family === 10 ? [300, 100, 60] : family === 11 ? [260, 16, 80] : [160, 28, 60])[stage] * BUDGETS[quality].scale);
  const rotation = rand() * TAU;
  const add = (vx: number, vy: number, vz: number, color: RGB, life: number, trail: number, size: number, drag: number, gravity: number, role: number, wave: number, delay = 0, curve = 0) => {
    stars.push({ velocity: [vx * scale, vy * scale, vz * scale], color, life: life * (.92 + rand() * .15), trail,
      size: size * (.72 + rand() * .55), drag, gravity: gravity * scale, split: 0, role, wave, delay, curve: curve * scale });
  };
  const sphere = (i: number, n: number) => {
    const y = clamp(1 - 2 * (i + .5) / n + (rand() - .5) * .055, -1, 1);
    const a = i * 2.3999632297 + rotation + (rand() - .5) * .12;
    const r = Math.sqrt(1 - y * y);
    return [Math.cos(a) * r, y, Math.sin(a) * r] as const;
  };
  for (let i = 0; i < count; i++) {
    const q = i / count, jitter = (rand() - .5);
    if (family === 10) {
      if (stage === 0) {
        const v = sphere(i, count), inner = i % 7 === 0, rank = i % 3 === 0 ? .80 : 1;
        const speed = inner ? 14 : (30 + rand() * 4) * rank;
        add(v[0] * speed, v[1] * speed, v[2] * speed * .82, inner ? [.75, .065, .09] : [1, .75 + rand() * .11, .39], inner ? 3.7 : 7.4, inner ? .55 : 2.55, inner ? .13 : .16, .43, 2.7, inner ? 1 : 0, q);
      } else if (stage === 1) {
        const arm = i % 11, a = arm * TAU / 11 + rotation + jitter * .035;
        const elevation = .26 + (Math.floor(i / 11) / Math.ceil(count / 11)) * .70;
        const speed = 24 + rand() * 6;
        add(Math.cos(a) * speed * Math.sqrt(1 - elevation * elevation), elevation * speed,
          Math.sin(a) * speed * .72, [1, .79, .46], 6.3, 2.4, .19, .48, 3.3, 2, q, rand() * .10);
      } else {
        const v = sphere(i, count);
        add(v[0] * 10, v[1] * 10 + 1, v[2] * 9, [1, .91, .70], 3.5, 1.3, .115, .55, 2.5, 3, q, rand() * .12);
      }
    } else if (family === 11) {
      if (stage === 0) {
        const rank = i % 3, a = q * TAU * 3 + rotation + jitter * .035;
        const speed = 25 + rank * 3 + rand() * 1.6;
        // Each orbit has a different depth/tilt, scalloped petals and a wave phase.
        const petal = 1 + .18 * Math.sin(a * (5 + rank) + rank);
        const vx = Math.cos(a) * speed * petal, vy = Math.sin(a) * speed * (.66 + rank * .10);
        if (i % 5 === 0) { const v = sphere(i, count); add(v[0] * 14, v[1] * 14, v[2] * 14, [.25,.37,.85], 4.5, .4, .125, .56, 2.0, 3, q, rand() * .15); }
        else add(vx, vy, Math.sin(a + rank * .86) * (11 + rank * 4), [.18, .39, .82], 5.7, .85, .16, .48, 2.2, rank, q + rank * .12, rank * .16 + rand() * .08, (rank - 1) * .8);
      } else {
        const v = sphere(i, count), speed = stage === 1 ? 10 + rand() * 3 : 13;
        add(v[0] * speed, v[1] * speed, v[2] * speed, stage === 1 ? [.57, .83, 1] : [.23, .76, .53], stage === 1 ? 2.9 : 3.6, stage === 1 ? 1.0 : .65, .13, .60, 2.6, stage + 3, q, rand() * .12, jitter * .5);
      }
    } else {
      if (stage === 0) {
        // Unequal wing lengths and slopes; coherent feather bundles, no radial fan.
        const branch = i % 16, side = branch < 9 ? -1 : 1, k = branch < 9 ? branch / 8 : (branch - 9) / 6;
        const a = .18 + k * .75 + jitter * .09;
        const speed = (side < 0 ? 37 : 31) * (.89 + rand() * .13);
        add(side * Math.cos(a) * speed, Math.sin(a) * speed * (side < 0 ? .8 : 1.06), Math.sin(branch * 1.73) * 11 + jitter * 1.8,
          i % 5 ? [1, .47, .10] : [.90, .055, .055], 5.8, 2.0, .15, .42, 3.7, branch, q, Math.floor(i / 16) * .016, side * 1.2);
      } else {
        const v = sphere(i, count), speed = stage === 1 ? 9 + rand() * 4 : 12;
        add(v[0] * speed, v[1] * speed, v[2] * speed, stage === 1 ? [1, .62, .19] : [1, .91, .63], stage === 1 ? 3.2 : 3.6, stage === 1 ? 1.6 : 1.25, .13, .60, 3.1, stage + 16, q, rand() * .08);
      }
    }
  }
  if (stage === 0) {
    const child = (vx: number, vy: number, vz: number, delay: number, palette: number, reserve: number) => carriers.push({ velocity: [vx * scale, vy * scale, vz * scale], delay, palette, reserve, seed: Math.floor(rand() * 0xffffffff) });
    if (family === 10) { child(0, 1, 0, .95, 1, 120); child(0, .6, 0, 2.5, 2, 72); }
    if (family === 11) {
      for (let j = 0; j < 8; j++) { const a = j * TAU / 8 + rotation; child(Math.cos(a) * 15, Math.sin(a) * 10 + 2, Math.sin(a + .4) * 8, 1.30 + j * .11, 1, 20); }
      child(0, 0, 0, 3.15, 2, 96);
    }
    if (family === 12) {
      for (let j = 0; j < 6; j++) { const side = j < 3 ? -1 : 1, k = j % 3; child(side * (20 - k * 3.5), 6 + k * 5, (j - 2.5) * 2.7, 1.2 + j * .22, 1, 34); }
      child(0, .7, 0, 3.8, 2, 72);
    }
  }
  return { stars, carriers, light: signatureTint(family) };
}

/** Fixed scalar state, independent phase variation; no per-frame RNG/objects. */
export function evolveSignature(p: Pool, i: number, dt: number, reducedFlashes: boolean, reducedMotion: boolean) {
  const family = p.family[i], age = p.age[i], t = age / p.life[i], phase = p.wave[i];
  if (family === 11) {
    const wave = clamp((age - .45 - phase * .85) / 1.05, 0, 1);
    const violet = clamp((age - 1.35 - phase * .7) / .85, 0, 1);
    const emerald = clamp((age - 3.65 - phase * .55) / .9, 0, 1);
    p.r[i] = (.16 + wave * .20) * (1 - violet) + .52 * violet;
    p.g[i] = (.32 + wave * .50) * (1 - violet) + .20 * violet;
    p.b[i] = .77 + wave * .19;
    p.r[i] += (.14 - p.r[i]) * emerald; p.g[i] += (.70 - p.g[i]) * emerald; p.b[i] += (.49 - p.b[i]) * emerald;
    if (p.role[i] >= 4) { p.r[i] = .58; p.g[i] = .80; p.b[i] = .89; }
  } else if (family === 10 && p.role[i] !== 1) {
    p.r[i] = 1; p.g[i] = .81 - .35 * t; p.b[i] = .43 - .35 * t;
    if (p.role[i] === 3) { p.g[i] = .90 - .15 * t; p.b[i] = .68 - .28 * t; }
  } else if (family === 12) {
    const heat = clamp(age / 2.4, 0, 1);
    p.r[i] = 1; p.g[i] = .14 + heat * .51; p.b[i] = .055 + heat * .12;
    if (p.role[i] === 18) { p.g[i] = .90 - .22 * t; p.b[i] = .66 - .35 * t; }
  }
  const shimmer = reducedFlashes || reducedMotion ? 1 : .79 + .21 * Math.sin(age * 7.4 + phase * 19) ** 6;
  p.gain[i] = Math.min(1, age * 12) * (t > .60 ? shimmer : 1) * .63;
  if (!reducedMotion && age < 2.8) {
    const bend = Math.sin(age * .85 + phase * 3.1) * p.curve[i] * dt;
    const turn = family === 12 ? .10 : .055;
    p.vx[i] += -p.vy[i] * bend * turn; p.vy[i] += p.vx[i] * bend * turn;
  }
}
