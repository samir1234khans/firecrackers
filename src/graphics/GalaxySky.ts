import { randomStream } from '../engine/catalog';

export type GalaxySkyArt = {
  stars: HTMLCanvasElement;
  dust: HTMLCanvasElement;
  nearStars: HTMLCanvasElement;
  metadata: Readonly<{
    seed: number; width: number; height: number;
    fieldStars: number; clusteredStars: number; nearStars: number;
    dustSpecks: number; spiralClusters: number;
    rgbaBytes: number; rgbaWithMipmapsBytes: number;
  }>;
};

const SKY_SEED = 6102026;
const WIDTH = 2048, HEIGHT = 1024;
const FIELD_STARS = 5200, CLUSTER_STARS = 3400, NEAR_STARS = 128;
const TAU = Math.PI * 2;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => value * value * (3 - 2 * value);

/** Quiet central canopy and an alpha-free horizon/border, shared by all layers. */
function fade(x: number, y: number) {
  const horizon = smooth(clamp01((.72 - y) / .18));
  const center = 1 - .88 * Math.exp(-((x - .5) ** 2 / .040 + (y - .43) ** 2 / .068));
  const edge = Math.max(0, Math.min(1, x * 40, (1 - x) * 40, y * 65, (1 - y) * 65));
  return horizon * center * smooth(edge);
}

type NoiseGrid = { width: number; height: number; values: Float32Array };
function noiseGrid(width: number, height: number, rand: () => number): NoiseGrid {
  return { width, height, values: Float32Array.from({ length: width * height }, rand) };
}
function noise(grid: NoiseGrid, u: number, v: number) {
  const x = ((u % 1 + 1) % 1) * grid.width, y = ((v % 1 + 1) % 1) * grid.height;
  const ix = Math.floor(x), iy = Math.floor(y), tx = smooth(x - ix), ty = smooth(y - iy);
  const jx = (ix + 1) % grid.width, jy = (iy + 1) % grid.height;
  const a = grid.values[iy * grid.width + ix], b = grid.values[iy * grid.width + jx];
  const c = grid.values[jy * grid.width + ix], d = grid.values[jy * grid.width + jx];
  return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
}

function star(context: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number, warm: boolean, glint = false) {
  if (alpha < .003) return;
  const px = x * WIDTH, py = y * HEIGHT;
  const rgb = warm ? '235,211,170' : '190,212,245';
  context.fillStyle = `rgba(${rgb},${alpha})`;
  context.beginPath(); context.arc(px, py, radius, 0, TAU); context.fill();
  if (!glint) return;
  const halo = context.createRadialGradient(px, py, 0, px, py, 3.2);
  halo.addColorStop(0, `rgba(${rgb},${alpha * .18})`);
  halo.addColorStop(1, `rgba(${rgb},0)`);
  context.fillStyle = halo; context.fillRect(px - 3.2, py - 3.2, 6.4, 6.4);
  context.strokeStyle = `rgba(${rgb},${alpha * .22})`; context.lineWidth = .32;
  context.beginPath(); context.moveTo(px - 2.7, py); context.lineTo(px + 2.7, py);
  context.moveTo(px, py - 2.7); context.lineTo(px, py + 2.7); context.stroke();
}

/** Original seeded art, baked once per renderer, never from its animation loop. */
export function makeGalaxySky(): GalaxySkyArt {
  const makeCanvas = () => {
    const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT;
    if (!canvas.getContext('2d')) throw new Error('The celestial sky canvas could not be created.');
    return canvas;
  };
  const stars = makeCanvas(), dust = makeCanvas(), nearStars = makeCanvas();
  const s = stars.getContext('2d')!, d = dust.getContext('2d')!, n = nearStars.getContext('2d')!;
  // Keep the original field seed and its first star locations; refinements use
  // separate streams, so new art cannot perturb simulation randomness.
  const rand = randomStream(SKY_SEED);
  for (let i = 0; i < FIELD_STARS; i++) {
    const x = rand(), y = .012 + rand() * .70, brightness = rand(), warm = rand() > .79;
    const radius = brightness > .995 ? .85 : .19 + rand() * .38;
    const alpha = (.12 + brightness * .38) * fade(x, y);
    star(s, x, y, radius, alpha, warm, brightness > .995);
  }

  const clump = randomStream(SKY_SEED ^ 0x41c057);
  // Inner upper corners survive portrait composition while avoiding the canopy.
  const clusters = [
    { x: .25, y: .15, sx: .072, sy: .062 }, { x: .315, y: .085, sx: .087, sy: .043 },
    { x: .72, y: .13, sx: .10, sy: .062 }, { x: .785, y: .235, sx: .070, sy: .068 },
  ];
  for (let i = 0; i < CLUSTER_STARS; i++) {
    const group = clusters[i % clusters.length];
    const x = group.x + (clump() + clump() + clump() - 1.5) * group.sx;
    const y = group.y + (clump() + clump() + clump() - 1.5) * group.sy;
    const alpha = (.075 + clump() * .20) * fade(x, y);
    star(s, x, y, .13 + clump() * .30, alpha, clump() > .89);
  }

  // Six periodic coherent scales create continuous filaments. The field is
  // generated directly at its final size; there is no upscaled noise rectangle.
  const mist = randomStream(SKY_SEED ^ 0x6a17);
  const grids = [16, 32, 64, 128, 256, 512].map(width => noiseGrid(width, width / 2, mist));
  const pixels = d.createImageData(WIDTH, HEIGHT);
  const curve = (x: number) => .14 + .95 * (x - .52) ** 2;
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const u = x / (WIDTH - 1), v = y / (HEIGHT - 1), envelope = fade(u, v);
    if (envelope < .0001) continue;
    const coarse = noise(grids[0], u, v), middle = noise(grids[1], u, v);
    const detail = noise(grids[2], u, v) * .45 + noise(grids[3], u, v) * .28 +
      noise(grids[4], u, v) * .17 + noise(grids[5], u, v) * .10;
    const warp = (coarse - .5) * .063 + (middle - .5) * .030;
    const distance = v - curve(u) - warp;
    const band = Math.exp(-((distance / .072) ** 2));
    const upperCorners = Math.exp(-(((u - .27) / .17) ** 2 + ((v - .18) / .15) ** 2)) * .28 +
      Math.exp(-(((u - .74) / .16) ** 2 + ((v - .22) / .18) ** 2)) * .36;
    const laneDistance = distance + .012 + (middle - .5) * .038 + Math.sin(u * 29) * .010;
    const lane = Math.exp(-((laneDistance / .013) ** 2));
    const mottling = Math.max(0, (detail - .19) * 1.22) * (.46 + coarse * .70);
    let density = (band + upperCorners) * mottling * (1 - lane * .79);
    // One faint elliptical spiral beyond the central canopy, without a bright
    // circular core, planet, lens flare or large decorative glint.
    const gx = (u - .27) / .037, gy = (v - .15) / .026;
    const radius = Math.sqrt(gx * gx + gy * gy), angle = Math.atan2(gy, gx);
    const spiral = Math.exp(-(radius * radius * 1.8)) *
      Math.max(0, Math.cos(angle * 2 - radius * 11)) ** 4 * .26;
    density += spiral;
    const alpha = Math.round(Math.min(.23, density * .17) * envelope * 255);
    if (alpha === 0) continue;
    const warm = clamp01((u - .62) * 2.0) * clamp01((middle - .27) * 1.7) * .62;
    const violet = clamp01((coarse - .45) * 2.0) * (1 - warm);
    const index = (y * WIDTH + x) * 4;
    pixels.data[index] = Math.round(112 + violet * 35 + warm * 85);
    pixels.data[index + 1] = Math.round(147 - violet * 24 + warm * 13);
    pixels.data[index + 2] = Math.round(222 - violet * 9 - warm * 86);
    pixels.data[index + 3] = alpha;
  }
  d.putImageData(pixels, 0, 0);
  let dustSpecks = 0;
  for (let i = 0; i < 24000; i++) {
    const x = mist(), scatter = (mist() + mist() + mist() - 1.5) * .073;
    const y = curve(x) + scatter, envelope = Math.exp(-((scatter / .074) ** 2));
    const alpha = (.012 + mist() * .055) * envelope * fade(x, y);
    if (alpha < .003) continue;
    star(d, x, y, .13 + mist() * .32, alpha, x > .72);
    dustSpecks++;
  }

  const near = randomStream(SKY_SEED ^ 0x1eaf27);
  for (let i = 0; i < NEAR_STARS; i++) {
    const cluster = clusters[i % clusters.length];
    const x = cluster.x + (near() + near() + near() - 1.5) * cluster.sx * 1.35;
    const y = cluster.y + (near() + near() + near() - 1.5) * cluster.sy * 1.35;
    const brightness = near(), alpha = (.14 + brightness * .32) * fade(x, y);
    star(n, x, y, .29 + brightness * .48, alpha, near() > .87, i % 11 === 0);
  }
  return {
    stars, dust, nearStars,
    metadata: Object.freeze({ seed: SKY_SEED, width: WIDTH, height: HEIGHT,
      fieldStars: FIELD_STARS, clusteredStars: CLUSTER_STARS, nearStars: NEAR_STARS,
      dustSpecks, spiralClusters: 1, rgbaBytes: WIDTH * HEIGHT * 4 * 3,
      rgbaWithMipmapsBytes: Math.ceil(WIDTH * HEIGHT * 4 * 3 * 4 / 3) }),
  };
}
