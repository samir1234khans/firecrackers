import { WORLD_CAPABILITIES } from './SceneCapabilities';
import type { SceneCapabilities } from './SceneCapabilities';
import { burstLightEnergy } from '../engine/BurstLighting.js';
import * as THREE from 'three/webgpu';
import type { SeaAudienceSession } from './SeaAudienceSession';
import { Fn, If, cos, float, positionWorld, screenUV, sin, smoothstep, texture, uniform, vec2, vec3 } from 'three/tsl';
import { randomStream } from '../engine/catalog';
import type { Simulation } from '../engine/Simulation';
import { makeGalaxySky } from './GalaxySky';
import { updateMoonFrame } from './MoonComposition';
import type { MoonFrame, MoonObstacle, MoonMotion } from './MoonComposition';
import { RiverLife } from './RiverLife';
import { SEA_WAVE_GAINS } from './SeaFleetState';
import { updateWaterFrame, WATER_NEAR_Z, WaterInteraction } from './WaterWaves';
import type { WaterFrame } from './WaterWaves';
import type { SkyState } from '../engine/SkyState';
import { CELESTIAL_LIMITS, celestialDiagnostics, createCelestialFrame, updateCelestialFrame } from './CelestialScene';
import { ShorelineCity } from './ShorelineCity';

/** Original environment art and light probe, generated locally; no remote textures. */
export class NightEnvironment {
  setSeaSession(session: SeaAudienceSession) { this.river.setSeaSession(session); }
  readonly group = new THREE.Group();
  private readonly shoreline = new THREE.Group();
  private readonly river: RiverLife;
  private readonly city: ShorelineCity | null;
  private framingCamera?: THREE.PerspectiveCamera;
  readonly waterFrame: WaterFrame = { phase: 0, waveCount: 4, farZ: -1000, nearZ: WATER_NEAR_Z, motionAllowed: false };
  private readonly waterInteraction = new WaterInteraction();
  private phone = false;
  private readonly wetEdgeMaterial = new THREE.MeshStandardNodeMaterial({
    color: '#15212b', roughness: .26, metalness: 0, transparent: true,
    opacity: .38, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
  });
  private readonly wetEdge = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 1), this.wetEdgeMaterial);
  readonly probe: THREE.DataTexture;
  private terrace: THREE.Group | null = null;
  private terraceWidth = 250;
  private terraceDepth = 5.3;
  private readonly terraceBounds = new THREE.Box3();
  private readonly projectedTerrace = new THREE.Vector3();
  private readonly floor: THREE.Mesh;
  private readonly sky: THREE.Mesh;
  private readonly invitationExposure = uniform(1);
  readonly skyTexture: THREE.CanvasTexture;
  readonly skyCrop = uniform(1);
  readonly skyWaterline = uniform(.5);
  readonly authoredSky = uniform(0);
  private readonly celestialArt = makeGalaxySky();
  private readonly galaxyTexture = new THREE.CanvasTexture(this.celestialArt.dust);
  private readonly nearStarTexture = new THREE.CanvasTexture(this.celestialArt.nearStars);
  private readonly moonTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
  private readonly moonNode = texture(this.moonTexture);
  private readonly moonCenter = uniform(new THREE.Vector2());
  private readonly moonRadius = uniform(15);
  private readonly moonActive = uniform(0);
  private readonly moonIllumination = uniform(1);
  private readonly moonFrame = { x: 0, y: 0, radius: 15 };
  private moonObstructions: readonly MoonObstacle[] = [];
  private readonly moonMotion: MoonMotion = { time: 0, motionAllowed: false, pulseAt: -Infinity, obstructions: [] };
  private moonPulseAt = -Infinity;
  private starPulseAt = -Infinity;
  private readonly starPulse = uniform(0);
  private readonly starPulsePosition = uniform(new THREE.Vector2());
  startupMoon(): Readonly<MoonFrame> { return this.moonFrame; }
  private readonly skyTime = uniform(0);
  private readonly galaxyStrength = uniform(.55);
  private readonly nearStrength = uniform(.7);
  private readonly celestialCrop = uniform(1);
  private readonly celestialYSpan = uniform(1);
  private readonly celestialYShift = uniform(0);
  private readonly dustOffset = uniform(new THREE.Vector2());
  private readonly nearOffset = uniform(new THREE.Vector2());
  private readonly cssViewport = uniform(new THREE.Vector2(1, 1));
  private readonly pointerPixels = uniform(new THREE.Vector2());
  private readonly engagement = uniform(0);
  private readonly meteorHead = uniform(new THREE.Vector2());
  private readonly meteorTail = uniform(new THREE.Vector2());
  private readonly meteorOpacity = uniform(0);
  private readonly celestialFrame = createCelestialFrame();
  private skyState: Readonly<SkyState> = { time: 0, pointerX: .5, pointerY: .25, engagement: 0, motionAllowed: false };
  private readonly reducedSkyMotion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  private readonly washMaterial = new THREE.MeshBasicMaterial({
    color: '#e7b270', transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  private readonly wash: THREE.Mesh;
  private readonly floorTexture: THREE.CanvasTexture;
  private readonly washTexture: THREE.CanvasTexture;

  private readonly enhanced: boolean;
  constructor(private readonly capabilities: SceneCapabilities = WORLD_CAPABILITIES) {
    this.enhanced = capabilities.enhanced;
    this.river = new RiverLife(capabilities.fleet);
    if (capabilities.fleet) this.waterFrame.gains = SEA_WAVE_GAINS;
    this.city = capabilities.shoreline ? new ShorelineCity() : null;
    if (this.city) this.group.add(this.city.group);
    if (this.city) {
      const fallback = this.river.group.getObjectByName('Fallback clustered far-bank homes'); if (fallback) fallback.visible = false;
      const homes = this.river.group.getObjectByName('Twelve reflection homes anchored to source house matrices'); if (homes) homes.visible = false;
    }
    this.group.name = 'Waterfront terrace and distant shoreline';
    this.shoreline.name = 'Low distant shoreline silhouettes';
    this.group.add(this.shoreline);
    this.group.add(this.river.group);
    this.skyTexture = this.makeSky();
    this.galaxyTexture.colorSpace = THREE.SRGBColorSpace;
    this.galaxyTexture.generateMipmaps = true;
    this.galaxyTexture.name = 'Original curved celestial dust';
    this.nearStarTexture.colorSpace = THREE.SRGBColorSpace;
    this.nearStarTexture.generateMipmaps = true;
    this.nearStarTexture.name = 'Original fine clustered near stars';
    const skyMaterial = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false, fog: false });
    const skyUV = vec2(screenUV.x.sub(.5).mul(this.skyCrop).add(.5), screenUV.y.mul(.872).div(this.skyWaterline).clamp(0, .995).oneMinus());
    const angle = sin(this.skyTime.mul(.022)).mul(.010), cs = cos(angle), sn = sin(angle);
    // Celestial art keeps its own aspect-correct crop. The authored panorama and
    // water horizon retain the established projection, including portrait framing.
    const celestialUV = vec2(screenUV.x.sub(.5).mul(this.celestialCrop).add(.5),
      screenUV.y.mul(this.celestialYSpan).add(this.celestialYShift).oneMinus());
    const p = celestialUV.sub(.5);
    const drift = vec2(sin(this.skyTime.mul(.018)).mul(.005), cos(this.skyTime.mul(.018)).sub(1).mul(.003));
    const galaxyUV = vec2(p.x.mul(cs).sub(p.y.mul(sn)), p.x.mul(sn).add(p.y.mul(cs))).add(.5).add(drift).add(this.dustOffset);
    const galaxy = texture(this.galaxyTexture, galaxyUV);
    // Multiply straight alpha explicitly, with a shared horizon fade; transparent
    // border RGB must never become a luminous rectangle through additive sampling.
    const celestial = galaxy.rgb.mul(galaxy.a).mul(this.galaxyStrength).mul(smoothstep(.28, .48, skyUV.y));
    const nearUV = celestialUV.add(this.nearOffset);
    const near = texture(this.nearStarTexture, nearUV);
    const twinkle = sin(this.skyTime.mul(.27).add(nearUV.x.mul(14)).add(nearUV.y.mul(9))).mul(.025).add(1);
    const pointerDistance = screenUV.mul(this.cssViewport).sub(this.pointerPixels).div(CELESTIAL_LIMITS.responseRadiusPixels);
    // This scalar only lifts pixels already containing stars. It adds no cursor
    // glow, disk, flare or interaction geometry to the empty sky.
    const tapDistance = screenUV.mul(this.cssViewport).sub(this.starPulsePosition).div(72);
    const response = pointerDistance.dot(pointerDistance).oneMinus().max(0).pow(2).mul(this.engagement).mul(.28)
      .add(tapDistance.dot(tapDistance).oneMinus().max(0).pow(2).mul(this.starPulse).mul(.34));
    const nearLight = near.rgb.mul(near.a).mul(this.nearStrength).mul(twinkle.add(response)).mul(smoothstep(.28, .48, skyUV.y));
    const fragment = screenUV.mul(this.cssViewport), direction = this.meteorHead.sub(this.meteorTail);
    const projection = fragment.sub(this.meteorTail).dot(direction).div(direction.dot(direction).max(.0001)).clamp(0, 1);
    const distance = fragment.sub(this.meteorTail.add(direction.mul(projection))).length();
    const meteor = smoothstep(.16, .85, distance).oneMinus().mul(projection.pow(2)).mul(this.meteorOpacity);
    this.moonTexture.colorSpace = THREE.SRGBColorSpace; this.moonTexture.needsUpdate = true;
    // A faint cool atmospheric veil lifts the distant authored mountain band.
    // It never changes its silhouette, crop, horizon, moon or global exposure.
    const haze = this.enhanced ? smoothstep(this.skyWaterline.mul(.70), this.skyWaterline.mul(.87), screenUV.y)
      .mul(smoothstep(this.skyWaterline.mul(.98), this.skyWaterline.mul(1.04), screenUV.y).oneMinus()).mul(.06) : float(0);
    const night = texture(this.skyTexture, skyUV).rgb.add(celestial).add(nearLight).add(vec3(.34, .45, .62).mul(meteor)).add(vec3(.025, .043, .067).mul(haze));
    // Only this small coherent pixel region samples/shades the lunar texture.
    // Avoid a fourth texture sample and exponential at every sky pixel.
    skyMaterial.colorNode = Fn(() => {
      const result = night.toVar();
      const delta = fragment.sub(this.moonCenter).div(this.moonRadius.mul(2 / .95));
      If(delta.x.abs().lessThan(1.3).and(delta.y.abs().lessThan(1.3)).and(this.moonActive.greaterThan(.5)), () => {
        const lunar = this.moonNode.sample(delta.add(.5).clamp(0, 1));
        const inside = smoothstep(.499, .501, delta.x.abs().max(delta.y.abs())).oneMinus();
        const alpha = lunar.a.mul(inside);
        const halo = delta.length().mul(2 / .95).sub(1).max(0).mul(-4.8).exp().mul(.018);
        result.assign(result.add(vec3(.62, .70, .82).mul(halo).mul(this.moonIllumination)).mul(alpha.oneMinus()).add(lunar.rgb.mul(alpha).mul(.90).mul(this.moonIllumination)));
      });
      return result.mul(this.invitationExposure);
    })();
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(850, 32, 16), skyMaterial);
    this.sky.rotation.y = Math.PI * .5;
    this.sky.renderOrder = -100;
    this.group.add(this.sky);
    this.probe = this.makeProbe();

    this.floorTexture = this.makeFloor();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 120),
      // Authored stone tone; burst wash supplies the changing illumination.
      // Hero rocket/stage retain PBR. The full-screen floor does not need an IBL sample per pixel.
      new THREE.MeshBasicMaterial({ map: this.floorTexture, color: this.enhanced ? '#bdb5ab' : '#a7b5c8' }));
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
    // These are bank fixtures. Keep them with the resized shoreline instead of
    // leaving an evenly spaced row suspended over the middle of the river.
    this.shoreline.add(lights, lamps, housings);
    this.shoreline.traverse(object => { if (object instanceof THREE.Mesh) object.layers.enable(3); });
    this.washTexture = this.makeWash();
    this.washMaterial.map = this.washTexture;
    this.wash = new THREE.Mesh(new THREE.PlaneGeometry(125, 27), this.washMaterial);
    this.wash.rotation.x = -Math.PI / 2;
    this.wash.position.set(0, 4.96, 7);
    this.group.add(this.wash);
    // A narrow irregular damp band on the existing coping; no new shore geometry.
    this.wetEdge.name = 'Restrained damp water-facing stone';
    this.wetEdge.rotation.x = -Math.PI / 2;
    this.wetEdgeMaterial.envMapIntensity = .16;
    this.wetEdgeMaterial.opacityNode = Fn(() => {
      const uneven = sin(positionWorld.x.mul(.43)).mul(sin(positionWorld.x.mul(.13))).mul(.12).add(.34);
      return uneven;
    })();
    this.group.add(this.wetEdge);
  }

  setTerrace(group: THREE.Group) {
    this.terrace = group; group.name = 'Blender v008 wet stone quay';
    this.placeTerrace();
    const materials = new Set<THREE.MeshStandardMaterial>();
    group.traverse(o => { if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial) materials.add(o.material); });
    for (const material of materials) {
      const authoredStone = Boolean(material.map);
      material.color.multiplyScalar(authoredStone ? .88 : .8);
      // Preserve baked wet/dry roughness, fine grain and original atlas UVs.
      material.envMapIntensity = authoredStone ? .14 : .12;
      if (material.normalMap) material.normalScale.set(.38, .38);
    }
    this.floor.visible = true;
    this.group.add(group);
  }
  private placeTerrace() {
    if (!this.terrace) return;
    // Continue beyond the frame sides and camera-facing edge; avoid a floating
    // rectangular board. The water-facing coping remains behind the launch prop.
    this.terrace.scale.set(this.terraceWidth / 47, 1.6, this.terraceDepth);
    this.terrace.position.set(0, 5.02, -14.75 + 6.932359 * this.terraceDepth);
    this.terrace.updateMatrixWorld(true);
    this.terraceBounds.setFromObject(this.terrace);
    this.wetEdge.scale.set(this.terraceWidth, 1.15, 1);
    this.wetEdge.position.set(0, this.terraceBounds.max.y + .012, -14.05);
  }
  frameTerrace(camera: THREE.PerspectiveCamera) {
    this.framingCamera = camera;
    this.terraceDepth = camera.aspect < .72 ? 9 : 5.3;
    const distance = Math.max(1, camera.position.z);
    this.terraceWidth = Math.max(220, 2 * distance * Math.tan(camera.fov * Math.PI / 360) * camera.aspect * 1.20);
    this.placeTerrace();
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
  setRiver(group: THREE.Group) {
    this.river.setAuthored(group);
    if (this.city) { const village = group.getObjectByName('Shore_Village'); if (village) village.visible = false; }
  }
  riverDiagnostics(camera: THREE.PerspectiveCamera) {
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    if (this.terrace) for (let i = 0; i < 8; i++) {
      this.projectedTerrace.set(i & 1 ? this.terraceBounds.max.x : this.terraceBounds.min.x,
        i & 2 ? this.terraceBounds.max.y : this.terraceBounds.min.y,
        i & 4 ? this.terraceBounds.max.z : this.terraceBounds.min.z).project(camera);
      const x = (this.projectedTerrace.x + 1) / 2, y = (1 - this.projectedTerrace.y) / 2;
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    return { ...this.river.diagnostics(camera), terraceScreenBounds: this.terrace ? { left, top, right, bottom } : null };
  }
  setMoon(image: HTMLImageElement) {
    const lunar = new THREE.Texture(image); lunar.colorSpace = THREE.SRGBColorSpace; lunar.needsUpdate = true;
    if (this.moonNode.value !== this.moonTexture) this.moonNode.value.dispose();
    this.moonNode.value = lunar; this.moonActive.value = 1;
  }
  setSkyState(state: Readonly<SkyState>) { this.skyState = state; }
  setMoonObstructions(rects: readonly MoonObstacle[]) { this.moonObstructions = rects.slice(0, 16); }
  moonPulse(time: number) { if (!this.capabilities.interactions || !this.skyMotionAllowed()) return false; this.moonPulseAt = time; return true; }
  waterTap(x: number, z: number, time: number) { return this.enhanced && this.waterInteraction.add(x, z, time, this.waterFrame); }
  skyTap(x: number, y: number, time: number) {
    if (!this.capabilities.interactions || !this.skyMotionAllowed()) return false;
    this.starPulseAt = time; this.starPulsePosition.value.set(x, y); return true;
  }
  setInvitationReveal(value: number) {
    if (this.enhanced) this.invitationExposure.value = .88 + .12 * Math.max(0, Math.min(1, value));
  }
  setViewport(width: number, height: number) {
    this.cssViewport.value.set(Math.max(1, width), Math.max(1, height));
    const aspect = Math.max(.1, width / Math.max(1, height));
    const crop = Math.max(.6, Math.min(1.35, aspect / 2));
    this.celestialCrop.value = crop;
    this.celestialYSpan.value = 2 * crop / aspect;
    this.celestialYShift.value = Math.min(0, 1 - this.celestialYSpan.value) * .065;
  }
  skyMotionAllowed() { return this.skyState.motionAllowed && !this.reducedSkyMotion?.matches; }
  skyDiagnostics() {
    return { ...this.city?.diagnostics(), moon: { ...this.moonFrame, illumination: this.moonIllumination.value, ready: this.moonActive.value === 1, source: "NASA LRO / fixed gibbous" }, moonObstructionCount: this.moonObstructions.length,
      waterImpulseCount: this.waterInteraction.activeCount(), waterImpulseMaximum: 4, waterImpulseLifetime: 2.4, skyTapResponse: this.starPulse.value,
      ...celestialDiagnostics(this.celestialFrame), skyHorizon: this.skyWaterline.value,
      skyLayers: 3, skyTextures: 3, skyArtWidth: this.celestialArt.stars.width,
      skyArtHeight: this.celestialArt.stars.height, skyCelestialCrop: this.celestialCrop.value,
      skyFieldStars: this.celestialArt.metadata.fieldStars, skyClusterStars: this.celestialArt.metadata.clusteredStars,
      skyNearStars: this.celestialArt.metadata.nearStars, skyDustSpecks: this.celestialArt.metadata.dustSpecks,
      skyArtRgbaBytes: this.celestialArt.metadata.rgbaBytes, skyTextureBytesWithMipmaps: this.celestialArt.metadata.rgbaWithMipmapsBytes };
  }
  setPortraitHorizon(phone: boolean, waterline: number, aspect: number) {
    this.phone = phone;
    this.skyWaterline.value = Math.max(.08, waterline);
    // Crop the panorama on phones instead of squeezing distant hills horizontally.
    this.skyCrop.value = Math.min(1.35, Math.max(.26, aspect / 2));
    // Keep the land close to each water plane's far edge. A near shore at
    // desktop scale covers the reflected water and reads as a black band.
    const height = phone ? .12 : .55;
    this.shoreline.scale.y = height;
    this.shoreline.position.y = 4.65 * (1 - height);
    this.shoreline.position.z = phone ? 0 : -420;
    for (let i = 0; i < 3; i++) {
      const mountain = this.shoreline.children[i] as THREE.Mesh;
      mountain.visible = this.enhanced || !phone || i === 0;
      if (this.enhanced) (mountain.material as THREE.MeshBasicMaterial).opacity = [.46, .30, .18][i];
    }
    this.river.resize(phone);
    if (this.city && this.framingCamera) {
      this.shoreline.visible = false;
      this.city.frame(this.framingCamera, waterline, aspect * 1000, 1000);
    }
  }
  update(sim: Simulation, visible: boolean, motionAllowed = true) {
    this.group.visible = visible;
    if (sim.time < this.moonPulseAt) this.moonPulseAt = -Infinity;
    if (sim.time < this.starPulseAt) this.starPulseAt = -Infinity;
    updateCelestialFrame(this.celestialFrame, this.skyState, this.cssViewport.value.x, this.cssViewport.value.y,
      visible && sim.quality !== 'low' && motionAllowed && !this.reducedSkyMotion?.matches, sim.reducedFlashes, this.enhanced ? 6 : 3);
    this.moonMotion.time = sim.time;
    this.moonMotion.motionAllowed = visible && motionAllowed && !sim.reducedMotion && !this.reducedSkyMotion?.matches;
    this.moonMotion.obstructions = this.moonObstructions; this.moonMotion.pulseAt = this.moonPulseAt;
    updateMoonFrame(this.cssViewport.value.x, this.cssViewport.value.y, this.skyWaterline.value, this.moonFrame, this.enhanced ? this.moonMotion : undefined);
    this.moonCenter.value.set(this.moonFrame.x, this.moonFrame.y); this.moonRadius.value = this.moonFrame.radius;
    this.moonIllumination.value = (this.moonFrame as MoonFrame).illumination ?? 1;
    const tapAge = sim.time - this.starPulseAt;
    this.starPulse.value = this.skyMotionAllowed() && tapAge >= 0 && tapAge < .7 ? Math.sin(tapAge / .7 * Math.PI) ** 2 : 0;
    const frame = this.celestialFrame;
    this.skyTime.value = frame.time;
    this.galaxyStrength.value = (sim.quality === 'ultra' ? .78 : sim.quality === 'standard' ? .62 : .38) * (sim.reducedFlashes ? .72 : 1);
    this.nearStrength.value = (sim.quality === 'ultra' ? .85 : sim.quality === 'standard' ? .66 : .44) * (sim.reducedFlashes ? .82 : 1);
    this.dustOffset.value.set(-frame.dustX / this.cssViewport.value.x * this.celestialCrop.value,
      frame.dustY / this.cssViewport.value.y * this.celestialYSpan.value);
    this.nearOffset.value.set(-frame.nearX / this.cssViewport.value.x * this.celestialCrop.value,
      frame.nearY / this.cssViewport.value.y * this.celestialYSpan.value);
    this.pointerPixels.value.set(frame.pointerX * this.cssViewport.value.x, frame.pointerY * this.cssViewport.value.y);
    this.engagement.value = frame.engagement;
    this.meteorHead.value.set(frame.meteor.headX, frame.meteor.headY);
    this.meteorTail.value.set(frame.meteor.tailX, frame.meteor.tailY);
    this.meteorOpacity.value = frame.meteor.opacity;
    updateWaterFrame(this.waterFrame, sim.waterPhase, sim.quality, this.phone,
      visible && motionAllowed && !sim.reducedMotion && !this.reducedSkyMotion?.matches);
    this.waterFrame.time = sim.time;
    this.waterInteraction.update(sim.time, this.waterFrame.motionAllowed);
    this.waterFrame.impulses = this.waterInteraction.impulses;
    this.river.update(sim, visible, motionAllowed, this.waterFrame);
    this.wetEdge.visible = visible && Boolean(this.terrace);
    if (this.terrace) this.terrace.visible = visible;
    let energy = 0, r = 0, g = 0, b = 0;
    for (const light of sim.lights) {
      const e = burstLightEnergy(light, sim.reducedFlashes);
      energy += e; r += light.r * e; g += light.g * e; b += light.b * e;
    }
    if (energy > .001) this.washMaterial.color.setRGB(r / energy, g / energy, b / energy);
    this.city?.update(r, g, b, energy, sim.time, motionAllowed && !sim.paused && !sim.reducedMotion && !this.reducedSkyMotion?.matches);
    this.washMaterial.opacity = .32 * energy / (1 + energy);
    this.wetEdgeMaterial.emissive.setRGB(.006 + r * .045 / (1 + energy), .010 + g * .045 / (1 + energy), .016 + b * .045 / (1 + energy));
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
      const grain = rand() * (this.enhanced ? 19 : 4);
      image.data[i] = (this.enhanced ? 32 : 27) + grain; image.data[i + 1] = (this.enhanced ? 30 : 35) + grain;
      image.data[i + 2] = (this.enhanced ? 28 : 47) + grain; image.data[i + 3] = 255;
    }
    c.putImageData(image, 0, 0);
    if (this.enhanced) {
      // Original code-authored weathered stone, with staggered joints and
      // irregular inclusions. It remains a lit 3D surface, not a backplate.
      for (let row = 0; row < 4; row++) {
        const offset = row % 2 ? 64 : 0;
        c.strokeStyle = '#080b10'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, row * 128); c.lineTo(512, row * 128 + 1); c.stroke();
        for (let col = -1; col < 5; col++) {
          const x = offset + col * 128;
          c.beginPath(); c.moveTo(x, row * 128); c.lineTo(x + 2, (row + 1) * 128); c.stroke();
          for (let chip = 0; chip < 16; chip++) {
            c.fillStyle = chip % 3 ? '#02060925' : '#dfbe9122';
            c.fillRect(x + rand() * 120, row * 128 + rand() * 125, 1 + rand() * 4, 1 + rand() * 2);
          }
        }
      }
    }
    c.fillStyle = '#080c13'; c.fillRect(0, 0, 512, 3); c.fillRect(0, 0, 3, 512);
    c.fillStyle = '#ffffff05'; c.fillRect(3, 3, 509, 1);
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(this.enhanced ? 14 : 45, this.enhanced ? 5 : 12); t.anisotropy = 4;
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
    this.city?.dispose();
    this.wetEdge.geometry.dispose(); this.wetEdgeMaterial.dispose();
    this.river.dispose(); this.moonTexture.dispose(); if (this.moonNode.value !== this.moonTexture) this.moonNode.value.dispose();
    this.skyTexture.dispose(); this.galaxyTexture.dispose(); this.nearStarTexture.dispose(); this.probe.dispose(); this.washTexture.dispose(); this.floorTexture.dispose();
    this.celestialArt.stars.width = this.celestialArt.stars.height = 1;
    this.celestialArt.dust.width = this.celestialArt.dust.height = 1;
    this.celestialArt.nearStars.width = this.celestialArt.nearStars.height = 1;
    const panorama = this.skyTexture.image as HTMLCanvasElement;
    panorama.width = panorama.height = 1;
  }
}
