import * as THREE from 'three/webgpu';
import { cos, screenUV, sin, smoothstep, texture, uniform, vec2 } from 'three/tsl';
import { randomStream } from '../engine/catalog';
import type { Simulation } from '../engine/Simulation';
import { makeGalaxySky } from './GalaxySky';
import { RiverLife } from './RiverLife';

/** Original environment art and light probe, generated locally; no remote textures. */
export class NightEnvironment {
  readonly group = new THREE.Group();
  private readonly shoreline = new THREE.Group();
  private readonly river = new RiverLife();
  readonly probe: THREE.DataTexture;
  private terrace: THREE.Group | null = null;
  private readonly floor: THREE.Mesh;
  private readonly sky: THREE.Mesh;
  readonly skyTexture: THREE.CanvasTexture;
  readonly skyCrop = uniform(1);
  readonly skyWaterline = uniform(.5);
  readonly authoredSky = uniform(0);
  private readonly celestialArt = makeGalaxySky();
  private readonly galaxyTexture = new THREE.CanvasTexture(this.celestialArt.dust);
  private readonly skyTime = uniform(0);
  private readonly galaxyStrength = uniform(.55);
  private readonly reducedSkyMotion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  private readonly washMaterial = new THREE.MeshBasicMaterial({
    color: '#e7b270', transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  private readonly wash: THREE.Mesh;
  private readonly floorTexture: THREE.CanvasTexture;
  private readonly washTexture: THREE.CanvasTexture;

  constructor() {
    this.group.name = 'Waterfront terrace and distant shoreline';
    this.shoreline.name = 'Low distant shoreline silhouettes';
    this.group.add(this.shoreline);
    this.group.add(this.river.group);
    this.skyTexture = this.makeSky();
    this.galaxyTexture.colorSpace = THREE.SRGBColorSpace;
    this.galaxyTexture.generateMipmaps = true;
    this.galaxyTexture.name = 'Original curved celestial dust';
    const skyMaterial = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false, fog: false });
    const skyUV = vec2(screenUV.x.sub(.5).mul(this.skyCrop).add(.5), screenUV.y.mul(.872).div(this.skyWaterline).clamp(0, .995).oneMinus());
    const angle = sin(this.skyTime.mul(.022)).mul(.010), cs = cos(angle), sn = sin(angle);
    const p = skyUV.sub(.5);
    const drift = vec2(sin(this.skyTime.mul(.018)).mul(.005), cos(this.skyTime.mul(.018)).sub(1).mul(.003));
    const galaxyUV = vec2(p.x.mul(cs).sub(p.y.mul(sn)), p.x.mul(sn).add(p.y.mul(cs))).add(.5).add(drift);
    const galaxy = texture(this.galaxyTexture, galaxyUV);
    // Multiply straight alpha explicitly, with a shared horizon fade; transparent
    // border RGB must never become a luminous rectangle through additive sampling.
    const celestial = galaxy.rgb.mul(galaxy.a).mul(this.galaxyStrength).mul(smoothstep(.28, .48, skyUV.y));
    skyMaterial.colorNode = texture(this.skyTexture, skyUV).rgb.add(celestial);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(850, 32, 16), skyMaterial);
    this.sky.rotation.y = Math.PI * .5;
    this.sky.renderOrder = -100;
    this.group.add(this.sky);
    this.probe = this.makeProbe();

    this.floorTexture = this.makeFloor();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 120),
      // Authored stone tone; burst wash supplies the changing illumination.
      // Hero rocket/stage retain PBR. The full-screen floor does not need an IBL sample per pixel.
      new THREE.MeshBasicMaterial({ map: this.floorTexture, color: '#a7b5c8' }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 4.9, 52);
    this.floor = floor;
    this.group.add(floor);
    const matrix = new THREE.Matrix4();

    // Practical lights establish near/far perspective without one scene light per lamp.
    const lamps = new THREE.InstancedMesh(new THREE.BoxGeometry(.65, .12, 2.5),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(.30, .19, .09) }), 28);
    const housings = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, .42, 3.7),
      new THREE.MeshStandardMaterial({ color: '#171e27', metalness: .42, roughness: .4 }), 28);
    for (let i = 0; i < 28; i++) {
      const z = -170 - Math.floor(i / 2) * 8;
      const x = (i - 14) * 24;
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
        // End each silhouette at the water surface. Extending it below the water
        // hid the reflection band behind an opaque strip on both camera shapes.
        vertices.push(x, y + layer * 2, -180 - layer * 70, x, 4.55, -180 - layer * 70);
        if (i < 64) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 2, i * 2 + 1, i * 2 + 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.setIndex(indices); geo.computeVertexNormals();
      this.shoreline.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: ['#0d1824', '#132131', '#1a2b3d'][layer], transparent: true, opacity: .46, depthWrite: false })));
    }
    const lights = new THREE.InstancedMesh(new THREE.SphereGeometry(.48, 8, 6),
      new THREE.MeshBasicMaterial({ color: '#edac64', toneMapped: false }), 24);
    const lightTint = new THREE.Color();
    for (let i = 0; i < 24; i++) {
      const x = (i - 11.5) * 26 + (rand() - .5) * 10;
      const z = -174 - rand() * 45;
      matrix.makeTranslation(x, 6 + rand() * 2.1, z);
      matrix.scale(new THREE.Vector3(.65 + rand() * .7, .7 + rand() * .7, 1));
      lights.setMatrixAt(i, matrix);
      lightTint.setRGB(.30 + rand() * .22, .17 + rand() * .12, .07 + rand() * .05);
      lights.setColorAt(i, lightTint);
    }
    this.shoreline.add(lights);
    this.washTexture = this.makeWash();
    this.washMaterial.map = this.washTexture;
    this.wash = new THREE.Mesh(new THREE.PlaneGeometry(125, 27), this.washMaterial);
    this.wash.rotation.x = -Math.PI / 2;
    this.wash.position.set(0, 4.96, 7);
    this.group.add(this.wash);
  }

  setTerrace(group: THREE.Group) {
    this.terrace = group; group.name = 'Blender stone terrace';
    group.scale.set(3.2, 1, 2.2); group.position.set(0, 5.05, 7);
    const materials = new Set<THREE.MeshStandardMaterial>();
    group.traverse(o => { if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial) materials.add(o.material); });
    for (const material of materials) {
      const authoredStone = Boolean(material.map);
      material.color.multiplyScalar(authoredStone ? .32 : .28);
      material.roughness = authoredStone ? .48 : .85;
      material.envMapIntensity = .35;
    }
    this.floor.visible = true;
    this.group.add(group);
  }
  setSky(image: HTMLImageElement) {
    // Preserve texture allocation when authored scenery finishes loading.
    const canvas = this.skyTexture.image as HTMLCanvasElement;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.drawImage(this.celestialArt.stars, 0, 0, canvas.width, canvas.height);
    this.skyTexture.needsUpdate = true;
    this.authoredSky.value = 1;
    this.shoreline.visible = false;
  }
  setRiver(group: THREE.Group) { this.river.setAuthored(group); }
  riverDiagnostics() { return this.river.diagnostics(); }
  setPortraitHorizon(phone: boolean, waterline: number, aspect: number) {
    this.skyWaterline.value = Math.max(.08, waterline);
    // Crop the panorama on phones instead of squeezing distant hills horizontally.
    this.skyCrop.value = Math.min(1.35, Math.max(.26, aspect / 2));
    // Keep the land close to each water plane's far edge. A near shore at
    // desktop scale covers the reflected water and reads as a black band.
    const height = phone ? .12 : .55;
    this.shoreline.scale.y = height;
    this.shoreline.position.y = 4.65 * (1 - height);
    this.shoreline.position.z = phone ? 0 : -420;
    for (let i = 0; i < 3; i++) this.shoreline.children[i].visible = !phone || i === 0;
    this.river.resize(phone);
  }
  update(sim: Simulation, visible: boolean, motionAllowed = true) {
    this.group.visible = visible;
    this.skyTime.value = sim.quality === 'low' || !motionAllowed || this.reducedSkyMotion?.matches ? 0 : sim.time;
    this.galaxyStrength.value = (sim.quality === 'ultra' ? .78 : sim.quality === 'standard' ? .62 : .38) * (sim.reducedFlashes ? .72 : 1);
    this.river.update(sim, visible, motionAllowed);
    if (this.terrace) this.terrace.visible = visible;
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
      haze.addColorStop(0, `rgba(101,130,155,${.032 + rand() * .038})`);
      haze.addColorStop(1, 'rgba(101,130,155,0)');
      c.fillStyle = haze; c.fillRect(-rx, -rx, rx * 2, rx * 2); c.restore();
    }
    c.drawImage(this.celestialArt.stars, 0, 0, canvas.width, canvas.height);
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
      image.data[i] = 27 + grain; image.data[i + 1] = 35 + grain;
      image.data[i + 2] = 47 + grain; image.data[i + 3] = 255;
    }
    c.putImageData(image, 0, 0);
    c.fillStyle = '#080c13'; c.fillRect(0, 0, 512, 3); c.fillRect(0, 0, 3, 512);
    c.fillStyle = '#ffffff05'; c.fillRect(3, 3, 509, 1);
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(45, 12); t.anisotropy = 4;
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
    this.river.dispose();
    this.skyTexture.dispose(); this.galaxyTexture.dispose(); this.probe.dispose(); this.washTexture.dispose(); this.floorTexture.dispose();
    this.celestialArt.stars.width = this.celestialArt.stars.height = 1;
    this.celestialArt.dust.width = this.celestialArt.dust.height = 1;
  }
}
