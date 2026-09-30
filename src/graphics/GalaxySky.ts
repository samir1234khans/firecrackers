import { randomStream } from '../engine/catalog';

export type GalaxySkyArt = { stars: HTMLCanvasElement; dust: HTMLCanvasElement };

/** Original seeded celestial art. Built once, then sampled by either rendering backend. */
export function makeGalaxySky(): GalaxySkyArt {
  const width = 1024, height = 512;
  const makeCanvas = () => {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    if (!canvas.getContext('2d')) throw new Error('The celestial sky canvas could not be created.');
    return canvas;
  };
  const stars = makeCanvas(), dust = makeCanvas();
  const s = stars.getContext('2d')!, d = dust.getContext('2d')!;
  const rand = randomStream(6102026);
  const fade = (x: number, y: number) => {
    const horizon = Math.max(0, Math.min(1, (.72 - y) / .18));
    // The upper corners can carry detail; the firework canopy remains quiet.
    const center = 1 - .48 * Math.exp(-((x - .5) ** 2 / .055 + (y - .43) ** 2 / .07));
    const edge = Math.min(1, x * 35, (1 - x) * 35, y * 50, (1 - y) * 50);
    return horizon * center * Math.max(0, edge);
  };
  for (let i = 0; i < 1650; i++) {
    const x = rand(), y = .012 + rand() * .70, brightness = rand(), warm = rand() > .79;
    const radius = brightness > .995 ? .85 : .19 + rand() * .38;
    const alpha = (.16 + brightness * .42) * fade(x, y);
    s.fillStyle = warm ? `rgba(235,210,170,${alpha})` : `rgba(190,213,245,${alpha})`;
    s.beginPath(); s.arc(x * width, y * height, radius, 0, Math.PI * 2); s.fill();
    if (brightness > .995) {
      const px = x * width, py = y * height;
      const halo = s.createRadialGradient(px, py, 0, px, py, 4.4);
      halo.addColorStop(0, `rgba(193,214,244,${alpha * .17})`); halo.addColorStop(1, 'rgba(193,214,244,0)');
      s.fillStyle = halo; s.fillRect(px - 4.4, py - 4.4, 8.8, 8.8);
      s.strokeStyle = `rgba(212,225,247,${alpha * .19})`; s.lineWidth = .35;
      s.beginPath(); s.moveTo(px - 2.6, py); s.lineTo(px + 2.6, py);
      s.moveTo(px, py - 2.6); s.lineTo(px, py + 2.6); s.stroke();
    }
  }

  // A bowed dust filament, with coherent clumps and dark gaps rather than a flat glow.
  // The small noise grid avoids a large procedural shader or a per-frame CPU bake.
  const noise = document.createElement('canvas'); noise.width = 256; noise.height = 128;
  const n = noise.getContext('2d')!, pixels = n.createImageData(256, 128);
  const knots = Array.from({ length: 23 }, () => ({ x: rand(), strength: .3 + rand() * .7, width: .016 + rand() * .035 }));
  const curve = (x: number) => .14 + .95 * (x - .52) ** 2;
  for (let y = 0; y < 128; y++) for (let x = 0; x < 256; x++) {
    const u = x / 255, v = y / 127, distance = v - curve(u);
    let clumps = .28;
    for (const knot of knots) clumps += knot.strength * Math.exp(-(((u - knot.x) / knot.width) ** 2)) * .17;
    const broad = Math.exp(-((distance / .074) ** 2)), lane = Math.exp(-(((distance + .015) / .014) ** 2));
    const mottling = .35 + rand() * .65;
    const alpha = Math.max(0, broad * (1 - lane * .65) * clumps * mottling * fade(u, v));
    const k = (y * 256 + x) * 4, warm = Math.max(0, (u - .60) * 2.2);
    pixels.data[k] = 132 + warm * 77; pixels.data[k + 1] = 164 + warm * 17;
    pixels.data[k + 2] = 224 - warm * 54; pixels.data[k + 3] = Math.round(alpha * 22);
  }
  n.putImageData(pixels, 0, 0); d.imageSmoothingEnabled = true; d.drawImage(noise, 0, 0, width, height);
  noise.width = noise.height = 1;
  for (let i = 0; i < 9500; i++) {
    const x = rand(), scatter = (rand() + rand() + rand() - 1.5) * .065;
    const y = curve(x) + scatter, envelope = Math.exp(-((scatter / .069) ** 2));
    const alpha = (.018 + rand() * .070) * envelope * fade(x, y);
    if (alpha < .003) continue;
    const warm = x > .68, radius = .15 + rand() * .45;
    d.fillStyle = warm ? `rgba(222,194,155,${alpha})` : `rgba(169,195,232,${alpha})`;
    d.beginPath(); d.arc(x * width, y * height, radius, 0, Math.PI * 2); d.fill();
  }
  return { stars, dust };
}
