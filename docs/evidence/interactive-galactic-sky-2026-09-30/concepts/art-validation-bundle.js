"use strict";
var GalaxyArt = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/graphics/GalaxySky.ts
  var GalaxySky_exports = {};
  __export(GalaxySky_exports, {
    makeGalaxySky: () => makeGalaxySky
  });

  // src/engine/catalog.ts
  function randomStream(seed) {
    let n = seed >>> 0;
    return () => {
      n += 1831565813;
      let t = Math.imul(n ^ n >>> 15, 1 | n);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // src/graphics/GalaxySky.ts
  var SKY_SEED = 6102026;
  var WIDTH = 2048;
  var HEIGHT = 1024;
  var FIELD_STARS = 5200;
  var CLUSTER_STARS = 3400;
  var NEAR_STARS = 128;
  var TAU = Math.PI * 2;
  var clamp01 = (value) => Math.max(0, Math.min(1, value));
  var smooth = (value) => value * value * (3 - 2 * value);
  function fade(x, y) {
    const horizon = smooth(clamp01((0.72 - y) / 0.18));
    const center = 1 - 0.88 * Math.exp(-((x - 0.5) ** 2 / 0.04 + (y - 0.43) ** 2 / 0.068));
    const edge = Math.max(0, Math.min(1, x * 40, (1 - x) * 40, y * 65, (1 - y) * 65));
    return horizon * center * smooth(edge);
  }
  function noiseGrid(width, height, rand) {
    return { width, height, values: Float32Array.from({ length: width * height }, rand) };
  }
  function noise(grid, u, v) {
    const x = (u % 1 + 1) % 1 * grid.width, y = (v % 1 + 1) % 1 * grid.height;
    const ix = Math.floor(x), iy = Math.floor(y), tx = smooth(x - ix), ty = smooth(y - iy);
    const jx = (ix + 1) % grid.width, jy = (iy + 1) % grid.height;
    const a = grid.values[iy * grid.width + ix], b = grid.values[iy * grid.width + jx];
    const c = grid.values[jy * grid.width + ix], d = grid.values[jy * grid.width + jx];
    return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
  }
  function star(context, x, y, radius, alpha, warm, glint = false) {
    if (alpha < 3e-3) return;
    const px = x * WIDTH, py = y * HEIGHT;
    const rgb = warm ? "235,211,170" : "190,212,245";
    context.fillStyle = `rgba(${rgb},${alpha})`;
    context.beginPath();
    context.arc(px, py, radius, 0, TAU);
    context.fill();
    if (!glint) return;
    const halo = context.createRadialGradient(px, py, 0, px, py, 3.2);
    halo.addColorStop(0, `rgba(${rgb},${alpha * 0.18})`);
    halo.addColorStop(1, `rgba(${rgb},0)`);
    context.fillStyle = halo;
    context.fillRect(px - 3.2, py - 3.2, 6.4, 6.4);
    context.strokeStyle = `rgba(${rgb},${alpha * 0.22})`;
    context.lineWidth = 0.32;
    context.beginPath();
    context.moveTo(px - 2.7, py);
    context.lineTo(px + 2.7, py);
    context.moveTo(px, py - 2.7);
    context.lineTo(px, py + 2.7);
    context.stroke();
  }
  function makeGalaxySky() {
    const makeCanvas = () => {
      const canvas = document.createElement("canvas");
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      if (!canvas.getContext("2d")) throw new Error("The celestial sky canvas could not be created.");
      return canvas;
    };
    const stars = makeCanvas(), dust = makeCanvas(), nearStars = makeCanvas();
    const s = stars.getContext("2d"), d = dust.getContext("2d"), n = nearStars.getContext("2d");
    const rand = randomStream(SKY_SEED);
    for (let i = 0; i < FIELD_STARS; i++) {
      const x = rand(), y = 0.012 + rand() * 0.7, brightness = rand(), warm = rand() > 0.79;
      const radius = brightness > 0.995 ? 0.85 : 0.19 + rand() * 0.38;
      const alpha = (0.12 + brightness * 0.38) * fade(x, y);
      star(s, x, y, radius, alpha, warm, brightness > 0.995);
    }
    const clump = randomStream(SKY_SEED ^ 4309079);
    const clusters = [
      { x: 0.25, y: 0.15, sx: 0.072, sy: 0.062 },
      { x: 0.315, y: 0.085, sx: 0.087, sy: 0.043 },
      { x: 0.72, y: 0.13, sx: 0.1, sy: 0.062 },
      { x: 0.785, y: 0.235, sx: 0.07, sy: 0.068 }
    ];
    for (let i = 0; i < CLUSTER_STARS; i++) {
      const group = clusters[i % clusters.length];
      const x = group.x + (clump() + clump() + clump() - 1.5) * group.sx;
      const y = group.y + (clump() + clump() + clump() - 1.5) * group.sy;
      const alpha = (0.075 + clump() * 0.2) * fade(x, y);
      star(s, x, y, 0.13 + clump() * 0.3, alpha, clump() > 0.89);
    }
    const mist = randomStream(SKY_SEED ^ 27159);
    const grids = [16, 32, 64, 128, 256, 512].map((width) => noiseGrid(width, width / 2, mist));
    const pixels = d.createImageData(WIDTH, HEIGHT);
    const curve = (x) => 0.14 + 0.95 * (x - 0.52) ** 2;
    for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
      const u = x / (WIDTH - 1), v = y / (HEIGHT - 1), envelope = fade(u, v);
      if (envelope < 1e-4) continue;
      const coarse = noise(grids[0], u, v), middle = noise(grids[1], u, v);
      const detail = noise(grids[2], u, v) * 0.45 + noise(grids[3], u, v) * 0.28 + noise(grids[4], u, v) * 0.17 + noise(grids[5], u, v) * 0.1;
      const warp = (coarse - 0.5) * 0.063 + (middle - 0.5) * 0.03;
      const distance = v - curve(u) - warp;
      const band = Math.exp(-((distance / 0.072) ** 2));
      const upperCorners = Math.exp(-(((u - 0.27) / 0.17) ** 2 + ((v - 0.18) / 0.15) ** 2)) * 0.28 + Math.exp(-(((u - 0.74) / 0.16) ** 2 + ((v - 0.22) / 0.18) ** 2)) * 0.36;
      const laneDistance = distance + 0.012 + (middle - 0.5) * 0.038 + Math.sin(u * 29) * 0.01;
      const lane = Math.exp(-((laneDistance / 0.013) ** 2));
      const mottling = Math.max(0, (detail - 0.19) * 1.22) * (0.46 + coarse * 0.7);
      let density = (band + upperCorners) * mottling * (1 - lane * 0.79);
      const gx = (u - 0.27) / 0.037, gy = (v - 0.15) / 0.026;
      const radius = Math.sqrt(gx * gx + gy * gy), angle = Math.atan2(gy, gx);
      const spiral = Math.exp(-(radius * radius * 1.8)) * Math.max(0, Math.cos(angle * 2 - radius * 11)) ** 4 * 0.26;
      density += spiral;
      const alpha = Math.round(Math.min(0.23, density * 0.17) * envelope * 255);
      if (alpha === 0) continue;
      const warm = clamp01((u - 0.62) * 2) * clamp01((middle - 0.27) * 1.7) * 0.62;
      const violet = clamp01((coarse - 0.45) * 2) * (1 - warm);
      const index = (y * WIDTH + x) * 4;
      pixels.data[index] = Math.round(112 + violet * 35 + warm * 85);
      pixels.data[index + 1] = Math.round(147 - violet * 24 + warm * 13);
      pixels.data[index + 2] = Math.round(222 - violet * 9 - warm * 86);
      pixels.data[index + 3] = alpha;
    }
    d.putImageData(pixels, 0, 0);
    let dustSpecks = 0;
    for (let i = 0; i < 24e3; i++) {
      const x = mist(), scatter = (mist() + mist() + mist() - 1.5) * 0.073;
      const y = curve(x) + scatter, envelope = Math.exp(-((scatter / 0.074) ** 2));
      const alpha = (0.012 + mist() * 0.055) * envelope * fade(x, y);
      if (alpha < 3e-3) continue;
      star(d, x, y, 0.13 + mist() * 0.32, alpha, x > 0.72);
      dustSpecks++;
    }
    const near = randomStream(SKY_SEED ^ 2010919);
    for (let i = 0; i < NEAR_STARS; i++) {
      const cluster = clusters[i % clusters.length];
      const x = cluster.x + (near() + near() + near() - 1.5) * cluster.sx * 1.35;
      const y = cluster.y + (near() + near() + near() - 1.5) * cluster.sy * 1.35;
      const brightness = near(), alpha = (0.14 + brightness * 0.32) * fade(x, y);
      star(n, x, y, 0.29 + brightness * 0.48, alpha, near() > 0.87, i % 11 === 0);
    }
    return {
      stars,
      dust,
      nearStars,
      metadata: Object.freeze({
        seed: SKY_SEED,
        width: WIDTH,
        height: HEIGHT,
        fieldStars: FIELD_STARS,
        clusteredStars: CLUSTER_STARS,
        nearStars: NEAR_STARS,
        dustSpecks,
        spiralClusters: 1,
        rgbaBytes: WIDTH * HEIGHT * 4 * 3,
        rgbaWithMipmapsBytes: Math.ceil(WIDTH * HEIGHT * 4 * 3 * 4 / 3)
      })
    };
  }
  return __toCommonJS(GalaxySky_exports);
})();
