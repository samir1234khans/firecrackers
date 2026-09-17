import * as THREE from 'three/webgpu';
import { randomStream } from '../engine/catalog';
import type { Simulation } from '../engine/Simulation';

/** Original environment art and light probe, generated locally; no remote textures. */
export class NightEnvironment {
  readonly group = new THREE.Group();
  readonly probe: THREE.DataTexture;
  private readonly sky: THREE.Mesh;
  private readonly skyTexture: THREE.CanvasTexture;
  private readonly washMaterial = new THREE.MeshBasicMaterial({
    color: '#e7b270', transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  private readonly wash: THREE.Mesh;
  private readonly floorTexture: THREE.CanvasTexture;
  private readonly washTexture: THREE.CanvasTexture;

  constructor() {
    this.group.name = 'Festival observatory environment';
    this.skyTexture = this.makeSky();
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(850, 40, 24),
      new THREE.MeshBasicMaterial({ map: this.skyTexture, side: THREE.BackSide, depthWrite: false, fog: false }));
    this.sky.rotation.y = Math.PI * .5;
    this.sky.renderOrder = -100;
    this.group.add(this.sky);
    this.probe = this.makeProbe();

    this.floorTexture = this.makeFloor();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1200),
      new THREE.MeshStandardMaterial({ map: this.floorTexture, color: '#727a86', roughness: .57,
        metalness: .18, envMapIntensity: .12 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 4.9, -220);
    this.group.add(floor);
    const matrix = new THREE.Matrix4();

    // Practical lights establish near/far perspective without one scene light per lamp.
    const lamps = new THREE.InstancedMesh(new THREE.BoxGeometry(.65, .12, 2.5),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, .82, .26) }), 28);
    const housings = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, .42, 3.7),
      new THREE.MeshStandardMaterial({ color: '#171e27', metalness: .42, roughness: .4 }), 28);
    for (let i = 0; i < 28; i++) {
      const z = 48 - Math.floor(i / 2) * 12;
      const x = (i % 2 ? 1 : -1) * 58;
      matrix.makeTranslation(x, 5.35, z); lamps.setMatrixAt(i, matrix);
      matrix.makeTranslation(x, 5.12, z); housings.setMatrixAt(i, matrix);
    }
    this.group.add(lamps, housings);

    const rand = randomStream(8341);
    for (let layer = 0; layer < 3; layer++) {
      const vertices: number[] = [], indices: number[] = [];
      for (let i = 0; i <= 64; i++) {
        const x = (i - 32) * 18;
        const y = 8 + Math.sin(i * .21 + layer) * 6 + Math.sin(i * .63) * 3 + rand() * 2;
        vertices.push(x, y + layer * 2, -180 - layer * 70, x, -110, -180 - layer * 70);
        if (i < 64) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 2, i * 2 + 1, i * 2 + 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.setIndex(indices); geo.computeVertexNormals();
      this.group.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: ['#0d1824', '#132131', '#1a2b3d'][layer] })));
    }
    this.washTexture = this.makeWash();
    this.washMaterial.map = this.washTexture;
    this.wash = new THREE.Mesh(new THREE.PlaneGeometry(125, 95), this.washMaterial);
    this.wash.rotation.x = -Math.PI / 2;
    this.wash.position.set(0, 4.96, -12);
    this.group.add(this.wash);
  }

  update(sim: Simulation, visible: boolean) {
    this.group.visible = visible;
    let energy = 0, r = 0, g = 0, b = 0;
    for (const light of sim.lights) {
      const e = Math.exp(-light.age * 1.7) * light.strength;
      energy += e; r += light.r * e; g += light.g * e; b += light.b * e;
    }
    if (energy > .001) this.washMaterial.color.setRGB(r / energy, g / energy, b / energy);
    this.washMaterial.opacity = Math.min(.18, energy * (sim.reducedFlashes ? .08 : .12));
  }

  private makeSky() {
    const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1024;
    const c = canvas.getContext('2d');
    if (!c) throw new Error('The night sky texture could not be created.');
    const gradient = c.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0, '#040812'); gradient.addColorStop(.36, '#081321');
    gradient.addColorStop(.53, '#1b2e43'); gradient.addColorStop(.64, '#111c2c');
    gradient.addColorStop(1, '#050a12'); c.fillStyle = gradient; c.fillRect(0, 0, 2048, 1024);
    const rand = randomStream(823841);
    for (let i = 0; i < 60; i++) {
      const x = rand() * 2048, y = 275 + rand() * 230, rx = 50 + rand() * 150;
      c.save(); c.translate(x, y); c.scale(1, .19 + rand() * .17);
      const haze = c.createRadialGradient(0, 0, 0, 0, 0, rx);
      haze.addColorStop(0, `rgba(101,130,155,${.016 + rand() * .025})`);
      haze.addColorStop(1, 'rgba(101,130,155,0)');
      c.fillStyle = haze; c.fillRect(-rx, -rx, rx * 2, rx * 2); c.restore();
    }
    for (let i = 0; i < 1100; i++) {
      const x = rand() * 2048, y = 30 + rand() * 460;
      const radius = rand() > .985 ? 1.3 : .35 + rand() * .38;
      const alpha = (.20 + rand() * .46) * Math.min(1, (540 - y) / 160);
      c.fillStyle = `rgba(191,211,235,${alpha})`;
      c.beginPath(); c.arc(x, y, radius, 0, Math.PI * 2); c.fill();
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private makeProbe() {
    const w = 128, h = 64, data = new Float32Array(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h, k = (y * w + x) * 4;
      const top = Math.max(0, 1 - Math.abs(v - .32) * 2);
      const cool = Math.exp(-((u - .2) ** 2 / .007 + (v - .38) ** 2 / .025));
      const warm = Math.exp(-((u - .72) ** 2 / .003 + (v - .40) ** 2 / .045));
      data[k] = .10 + top * .24 + cool * 1.1 + warm * 3.8;
      data[k + 1] = .13 + top * .30 + cool * 1.65 + warm * 2.6;
      data[k + 2] = .18 + top * .43 + cool * 2.5 + warm * 1.4;
      data[k + 3] = 1;
    }
    const texture = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.FloatType);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.LinearSRGBColorSpace; texture.needsUpdate = true;
    return texture;
  }

  private makeFloor() {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const c = canvas.getContext('2d')!;
    const image = c.createImageData(512, 512), rand = randomStream(1773);
    for (let i = 0; i < image.data.length; i += 4) {
      const grain = rand() * 4;
      image.data[i] = 15 + grain; image.data[i + 1] = 20 + grain;
      image.data[i + 2] = 28 + grain; image.data[i + 3] = 255;
    }
    c.putImageData(image, 0, 0);
    c.fillStyle = '#080c13'; c.fillRect(0, 0, 512, 3); c.fillRect(0, 0, 3, 512);
    c.fillStyle = '#ffffff05'; c.fillRect(3, 3, 509, 1);
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(52, 44); t.anisotropy = 4;
    return t;
  }

  private makeWash() {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const c = canvas.getContext('2d')!;
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.3, '#ffffff88'); g.addColorStop(1, '#ffffff00');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  dispose() {
    this.skyTexture.dispose(); this.probe.dispose(); this.washTexture.dispose(); this.floorTexture.dispose();
  }
}
