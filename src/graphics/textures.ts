import * as THREE from 'three/webgpu';
import { hash01, randomStream } from '../engine/catalog';
function noise(x: number, y: number, z: number) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const smooth = (v: number) => v * v * (3 - 2 * v);
    const fx = smooth(x - ix), fy = smooth(y - iy), fz = smooth(z - iz);
    const at = (a: number, b: number, c: number) => hash01(Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(c, 83492791), 7829);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const plane = (k: number) => lerp(lerp(at(ix, iy, k), at(ix + 1, iy, k), fx), lerp(at(ix, iy + 1, k), at(ix + 1, iy + 1, k), fx), fy);
    return lerp(plane(iz), plane(iz + 1), fz);
}
export const SMOKE_CELL = 68, SMOKE_INNER = 64, SMOKE_COLS = 4, SMOKE_ROWS = 12;
/** Original deterministic density + gradient atlas. Not a fluid simulation or imported media. */
export function makeSmokeAtlas() {
    const width = SMOKE_CELL * SMOKE_COLS, height = SMOKE_CELL * SMOKE_ROWS;
    const data = new Uint8Array(width * height * 4);
    for (let variant = 0; variant < 3; variant++)
        for (let frame = 0; frame < 16; frame++) {
            const t = frame / 15, density = new Float32Array(SMOKE_CELL * SMOKE_CELL);
            for (let y = 0; y < SMOKE_CELL; y++)
                for (let x = 0; x < SMOKE_CELL; x++) {
                    const u = (x - 34) / 31, v = (y - 34) / 31;
                    const radius = Math.hypot(u, v);
                    const warpX = u + Math.sin(v * 5 + t * 3 + variant) * 0.12;
                    const warpY = v + Math.cos(u * 4 - t * 2) * 0.11;
                    const n = noise(warpX * 2.5 + 10 + variant * 9, warpY * 2.5 + 10, variant * 4 + t * 1.4) * 0.60
                        + noise(warpX * 5 + 21, warpY * 5 + 21, t * 1.8 + variant) * 0.28
                        + noise(u * 10 + 30, v * 10 + 30, t * 2.2) * 0.12;
                    const edge = Math.max(0, 1 - radius * radius);
                    const shape = Math.max(0, 1 - radius * radius * (1.15 + .26 * Math.sin(Math.atan2(v, u) * 5 + variant)));
                    const curls = Math.max(0, (n - .28) * 2.7);
                    density[y * SMOKE_CELL + x] = Math.min(.95, Math.pow(edge, .7) * shape * curls);
                }
            const ox = (frame % 4) * SMOKE_CELL, oy = (variant * 4 + Math.floor(frame / 4)) * SMOKE_CELL;
            for (let y = 0; y < SMOKE_CELL; y++)
                for (let x = 0; x < SMOKE_CELL; x++) {
                    const k = y * SMOKE_CELL + x, i = ((oy + y) * width + ox + x) * 4;
                    const dx = density[y * SMOKE_CELL + Math.min(67, x + 1)] - density[y * SMOKE_CELL + Math.max(0, x - 1)];
                    const dy = density[Math.min(67, y + 1) * SMOKE_CELL + x] - density[Math.max(0, y - 1) * SMOKE_CELL + x];
                    data[i] = Math.round(density[k] * 255);
                    data[i + 1] = Math.round(Math.max(0, Math.min(1, 0.5 - dx * 2.5)) * 255);
                    data[i + 2] = Math.round(Math.max(0, Math.min(1, 0.5 - dy * 2.5)) * 255);
                    data[i + 3] = data[i];
                }
        }
    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.NoColorSpace;
    texture.needsUpdate = true;
    return texture;
}
/** Original printed-paper wrap: grain, seam and fine foil artwork, not a metal rocket body. */
export function makePaperTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 1024;
    const c = canvas.getContext('2d');
    if (!c) throw new Error('Paper texture could not be created.');
    const rand = randomStream(74291), image = c.createImageData(512, 1024);
    for (let y = 0; y < 1024; y++) for (let x = 0; x < 512; x++) {
        const i = (y * 512 + x) * 4, grain = rand() * 10 + Math.sin(y * .32) * 1.4;
        image.data[i] = 66 + grain; image.data[i + 1] = 80 + grain;
        image.data[i + 2] = 99 + grain; image.data[i + 3] = 255;
    }
    c.putImageData(image, 0, 0);
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(228,187,121,.78)';
    for (let i = 0; i < 22; i++) {
        c.beginPath();
        const x = 70 + (i % 7) * 63, y = i * 43;
        c.moveTo(x, y); c.bezierCurveTo(x - 105, y + 64, x + 145, y + 120, x + 14, y + 220);
        c.stroke();
    }
    c.fillStyle = '#b89560'; c.fillRect(0, 82, 512, 3); c.fillRect(0, 946, 512, 3);
    c.fillStyle = '#c2a271'; c.font = '24px Georgia'; c.textAlign = 'center';
    c.fillText('F I R E C R A C K E R S', 256, 535);
    c.strokeStyle = 'rgba(237,220,193,.16)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(4, 0); c.lineTo(13, 1024); c.stroke();
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}
export function makeHorizonTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1536;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Environment texture could not be created.');
    const rand = randomStream(8291);
    ctx.fillStyle = '#04070b';
    ctx.beginPath();
    ctx.moveTo(0, 256);
    for (let x = 0; x <= 1536; x += 4) ctx.lineTo(x, 132 + Math.sin(x * .009) * 7 + rand() * 5);
    ctx.lineTo(1536, 256); ctx.fill();
    for (let x = 0; x < 1536; x += 12 + rand() * 23) {
        const h = 8 + rand() * 25;
        ctx.fillRect(x, 135 - h, 1.5, h);
        ctx.beginPath(); ctx.ellipse(x, 134 - h * .6, 5 + rand() * 6, h * .5, 0, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 18; i++) {
        ctx.fillStyle = `rgba(225,176,109,${.09 + rand() * .20})`;
        ctx.fillRect(rand() * 1536, 138 + rand() * 6, 1.5, 1);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}
