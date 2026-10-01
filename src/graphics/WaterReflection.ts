import type { MoonFrame } from './MoonComposition';
import { WATER_Y, WATER_NEAR_Z, WATER_WAVES, WATER_MAX_DISPLACEMENT, WATER_FAR_FADE_MAX, WATER_FAR_FADE_FRACTION, WATER_NEAR_FADE_MAX, WATER_NEAR_FADE_FRACTION } from './WaterWaves.js';
import type { WaterFrame } from './WaterWaves.js';
import { PlanarReflection } from './PlanarReflection.js';
import * as THREE from 'three/webgpu';
import { Fn, If, Loop, cameraPosition, cameraProjectionMatrix, cameraViewMatrix, float, int, modelWorldMatrix, positionLocal, positionWorld, reflect, smoothstep, texture, uniform, uniformArray, varying, vec2, vec3, vec4 } from 'three/tsl';
import type { Simulation } from '../engine/Simulation';
import type { Quality } from '../engine/catalog';

type OrientPass = (camera: THREE.PerspectiveCamera, reflecting?: boolean) => void;
const BURST_LIGHT_CAPACITY = 4;

/** Shared displaced height field and one explicitly scheduled planar pass.
 * Fresnel and crossing normals adapt Three.js r180 WaterMesh (MIT, copyright
 * Three.js authors). Clock, lighting, quality and resources remain app owned.
 * https://github.com/mrdoob/three.js/blob/r180/examples/jsm/objects/WaterMesh.js
 */
export class WaterReflection {
  target: THREE.RenderTarget | null = null;
  readonly mesh: THREE.Mesh;
  private readonly planar = new PlanarReflection();
  readonly camera = this.planar.camera;
  private readonly wideSurface = new THREE.PlaneGeometry(1400, 1200, 128, 96);
  private readonly phoneSurface = new THREE.PlaneGeometry(1400, 380, 128, 48);
  private readonly projectedEdge = new THREE.Vector3();
  private readonly farSide = new THREE.Vector3();
  private readonly moonRay = new THREE.Vector3();
  private readonly normalTexture = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
  private readonly shoreTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  private readonly neutralReflection = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  private readonly normalNode = texture(this.normalTexture);
  private readonly shoreNode = texture(this.shoreTexture);
  private readonly reflectionNode = texture(this.neutralReflection);
  private readonly shoreCrop = uniform(1);
  private readonly shoreActive = uniform(0);
  private readonly streaks = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false }), 288);
  private readonly matrix = new THREE.Matrix4();
  private readonly tint = new THREE.Color();
  private readonly phase = uniform(0);
  private readonly waveCount = uniform(4);
  private readonly farZ = uniform(-1000);
  private readonly nearZ = uniform(WATER_NEAR_Z);
  private readonly farFadeWidth = uniform(80);
  private readonly nearFadeWidth = uniform(18);
  private readonly detailTier = uniform(1);
  private readonly strength = uniform(.4);
  private readonly enabled = uniform(0);
  private readonly moonActive = uniform(0);
  private readonly moonDirection = uniform(new THREE.Vector3(.2, .3, -.95).normalize());
  private readonly lightAnchors = Array.from({ length: BURST_LIGHT_CAPACITY }, () => new THREE.Vector4());
  private readonly lightColors = Array.from({ length: BURST_LIGHT_CAPACITY }, () => new THREE.Vector3());
  private readonly burstAnchors = uniformArray(this.lightAnchors);
  private readonly burstColors = uniformArray(this.lightColors);
  private readonly burstCount = uniform(0, 'int');
  private readonly reflectionMatrix = uniform(this.planar.textureMatrix);
  private readonly reflectionTexel = uniform(new THREE.Vector2(1, 1));
  private readonly waterline = uniform(.49);
  private readonly frame: WaterFrame = { phase: 0, waveCount: 4, farZ: -1000, nearZ: WATER_NEAR_Z, motionAllowed: false };
  private last = -Infinity;
  private frames = 0;
  private hz = 0;
  private readonly oldClear = Object.assign(new THREE.Color(), { a: 1 });
  private readonly oldViewport = new THREE.Vector4();
  private readonly oldScissor = new THREE.Vector4();
  private clipCoordinateSystem = 'webgl';
  constructor() {
    // Match the repeating authored sampler before shader compilation. Updating
    // only a TextureNode later does not replace a clamped sampler definition.
    this.normalTexture.wrapS = this.normalTexture.wrapT = THREE.RepeatWrapping;
    this.normalTexture.needsUpdate = true; this.shoreTexture.needsUpdate = true;
    this.neutralReflection.needsUpdate = true;
    this.reflectionNode.updateMatrix = false;
    this.shoreNode.levelNode = float(5);

    const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, fog: false });
    const world = modelWorldMatrix.mul(vec4(positionLocal, 1)).xyz;
    let height = float(0).add(0), slopeX = float(0).add(0), slopeZ = float(0).add(0);
    for (let i = 0; i < WATER_WAVES.length; i++) {
      const wave = WATER_WAVES[i];
      const active = this.waveCount.greaterThan(i).select(1, 0);
      const angle = world.x.mul(wave.x).add(world.z.mul(wave.z)).sub(this.phase.mul(wave.speed)).add(wave.phase);
      const amplitude = active.mul(wave.amplitude), derivative = angle.cos().mul(amplitude);
      height = height.add(angle.sin().mul(amplitude));
      slopeX = slopeX.add(derivative.mul(wave.x)); slopeZ = slopeZ.add(derivative.mul(wave.z));
    }
    // Exact counterpart of sampleWater, including derivatives of both fades.
    const farT = world.z.sub(this.farZ).div(this.farFadeWidth).clamp(0, 1);
    const nearT = this.nearZ.sub(world.z).div(this.nearFadeWidth).clamp(0, 1);
    const farFade = farT.mul(farT).mul(float(3).sub(farT.mul(2)));
    const nearFade = nearT.mul(nearT).mul(float(3).sub(nearT.mul(2)));
    const fade = farFade.mul(nearFade);
    const fadeDerivative = farT.mul(farT.oneMinus()).mul(6).div(this.farFadeWidth).mul(nearFade)
      .sub(nearT.mul(nearT.oneMinus()).mul(6).div(this.nearFadeWidth).mul(farFade));
    const waterSlope = varying(vec2(slopeX.mul(fade), slopeZ.mul(fade).add(height.mul(fadeDerivative))));
    material.positionNode = positionLocal.add(vec3(0, 0, height.mul(fade)));

    const distance = cameraPosition.sub(positionWorld).length();
    const foreground = float(1).sub(smoothstep(100, 620, distance));
    const broadUV = vec2(positionWorld.x.mul(.0031).add(positionWorld.z.mul(.0014)),
      positionWorld.z.mul(.0023).sub(positionWorld.x.mul(.0019))).add(vec2(this.phase.mul(.0007), this.phase.mul(-.0004)));
    const broad = this.normalNode.sample(broadUV).rg.sub(.5);
    const middle = this.normalNode.sample(vec2(positionWorld.z.mul(.0187), positionWorld.x.mul(-.0151))
      .add(vec2(this.phase.mul(-.0019), this.phase.mul(.0011)))).rg.sub(.5);
    const fine = Fn(() => {
      const result = vec2(0).toVar();
      If(this.detailTier.greaterThan(.75), () => {
        result.assign(this.normalNode.sample(positionWorld.xz.mul(.0613).add(vec2(this.phase.mul(.0031), this.phase.mul(-.0023)))).rg.sub(.5));
      });
      return result;
    })();
    const texturedSlope = broad.mul(.080).add(middle.mul(.22).mul(foreground.mul(.55).add(.45)))
      .add(fine.mul(.11).mul(foreground.pow(2)));
    const totalSlope = waterSlope.add(texturedSlope);
    const normal = vec3(totalSlope.x.negate(), 1, totalSlope.y.negate()).normalize();
    const eye = cameraPosition.sub(positionWorld).normalize();
    const fresnel = float(1).sub(normal.dot(eye).max(0)).pow(5).mul(.98).add(.02);
    const skyDirection = reflect(eye.negate(), normal).normalize();

    // Project reflected world directions into the existing sky composition.
    // A coarse mip supplies cloud illumination without mirroring stars or the
    // separately composited moon disc. World normals determine the distortion.
    const skyProjection = cameraProjectionMatrix.mul(cameraViewMatrix.mul(vec4(skyDirection, 0)));
    const skyScreen = skyProjection.xy.div(skyProjection.w.max(.001)).mul(vec2(.5, -.5)).add(.5);
    const skyUV = vec2(skyScreen.x.sub(.5).mul(this.shoreCrop).add(.5),
      skyScreen.y.mul(.872).div(this.waterline.max(.08)).clamp(0, .88).oneMinus());
    const skyTexture = this.shoreNode.sample(skyUV.clamp(.015, .985)).rgb;
    const skyElevation = skyDirection.y.max(0).clamp(0, 1);
    const skyColor = vec3(.010, .022, .037).mul(skyElevation.mul(.5).add(.75))
      .add(skyTexture.mul(this.shoreActive).mul(.32));
    // Low-frequency slope contrasts reveal crossing swell faces throughout the
    // unlit surface. Their wavelengths are geometric, not an aliased albedo grid.
    const broadLight = broad.x.mul(.19).add(broad.y.mul(.12)).add(waterSlope.y.mul(.34)).add(waterSlope.x.mul(.22)).add(.014).clamp(.002, .030);
    const body = vec3(.0025, .0055, .010).add(vec3(.25, .48, .78).mul(broadLight).mul(fresnel.oneMinus().mul(.75).add(.25)));
    const facets = smoothstep(-.08, .13, middle.y.add(broad.x.mul(.45)).add(waterSlope.y.mul(2.6)));
    const skyFacets = smoothstep(.005, .15, middle.y.add(fine.x.mul(.30)).add(broad.y.mul(.65)))
      .pow(2).mul(foreground.mul(.65).add(.20)).mul(vec3(.0035, .007, .012));

    // A rough lobe and a narrower grazing lobe create interrupted lunar facets,
    // rather than a screen-painted strip or a second moon disc.
    const halfVector = this.moonDirection.add(eye).normalize();
    const alignment = normal.dot(halfVector).max(0);
    const lunarLobe = alignment.pow(220).mul(.055).add(alignment.pow(950).mul(.32));
    const lunarPatch = smoothstep(-.018, .030, broad.y.add(broad.x.mul(.50)).add(waterSlope.x.mul(1.4)).add(waterSlope.y.mul(.7)));
    const moon = vec3(.43, .53, .68).mul(lunarLobe).mul(facets.mul(.85).add(.15))
      .mul(lunarPatch.mul(.75).add(.25)).mul(fresnel.sqrt().mul(.6).add(.4)).mul(this.moonActive);

    // Mean-plane projective coordinates preserve actual reflected positions.
    // Shared slopes fragment the image; there is no vertical screen remapping.
    const projected = this.reflectionMatrix.mul(vec4(positionWorld.x, WATER_Y, positionWorld.z, 1));
    const uv = projected.xy.div(projected.w.max(.0001));
    const distortion = totalSlope.mul(.018).mul(foreground.mul(.65).add(.35));
    const reflectionUV = uv.add(distortion);
    const inside = smoothstep(0, .012, reflectionUV.x).mul(smoothstep(0, .012, reflectionUV.y))
      .mul(smoothstep(.988, 1, reflectionUV.x).oneMinus()).mul(smoothstep(.988, 1, reflectionUV.y).oneMinus());
    const reflected = this.reflectionNode.sample(reflectionUV.clamp(.001, .999)).rgb;
    const blurred = this.reflectionNode.sample(reflectionUV.add(this.reflectionTexel.mul(vec2(1.5, .8))).clamp(.001, .999)).rgb
      .add(this.reflectionNode.sample(reflectionUV.sub(this.reflectionTexel.mul(vec2(1.5, .8))).clamp(.001, .999)).rgb);
    const dynamic = reflected.mul(.60).add(blurred.mul(.20)).mul(facets.mul(.72).add(.28))
      .mul(fresnel.mul(.7).add(.30)).mul(this.strength).mul(this.enabled).mul(inside);
    // Bursts are launched in front of the quay: their mathematically correct
    // mirror can fall behind the walking surface. Actual burst anchors still
    // illuminate rough, slightly scattering water. This bounded light response
    // follows world-space distance, direction, hue and lifetime, not a relocated
    // firework image or arbitrary vertical remapping.
    const burstLight = Fn(() => {
      const result = vec3(0).toVar();
      Loop({ start: 0, end: this.burstCount }, ({ i }) => {
        const light = this.burstAnchors.element(int(i));
        const color = this.burstColors.element(int(i));
        const delta = light.xyz.sub(positionWorld);
        const distanceSquared = delta.dot(delta);
        const illumination = normal.dot(delta.div(distanceSquared.sqrt().max(1))).max(0);
        const radius = delta.z.abs().mul(.22).add(delta.y.abs().mul(.75)).add(12);
        const footprint = delta.x.div(radius).pow(2).negate().exp();
        const attenuation = float(1).div(distanceSquared.div(18000).add(1));
        const broken = facets.mul(.86).add(.14).mul(skyFacets.b.mul(20).add(.75));
        result.addAssign(color.mul(light.w).mul(illumination).mul(footprint).mul(attenuation).mul(broken));
      });
      return result.mul(this.strength).mul(.65).clamp(0, this.strength.mul(.18));
    })();
    material.colorNode = body.add(skyColor.mul(fresnel).mul(.64)).add(skyFacets).add(moon).add(dynamic).add(burstLight)
      .mul(smoothstep(this.farZ, this.farZ.add(8), positionWorld.z).mul(.2).add(.8));
    this.mesh = new THREE.Mesh(this.wideSurface, material);
    this.mesh.name = 'Displaced moonlit waterfront'; this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(0, WATER_Y, -400); this.mesh.frustumCulled = false;
    this.streaks.count = 0; this.streaks.frustumCulled = false;
    this.mesh.add(this.streaks); this.streaks.position.z = .025;
  }
  resize(camera: THREE.PerspectiveCamera) {
    const phone = camera.aspect < .72;
    this.mesh.geometry = phone ? this.phoneSurface : this.wideSurface;
    this.mesh.position.z = phone ? 10 : -400;
    this.streaks.position.y = phone ? 410 : 0;
    this.projectedEdge.set(0, WATER_Y, phone ? -180 : -1000).project(camera);
    // Fit the far-plane sides in the actual camera. A fixed 1400-unit surface
    // leaves triangular black corners at desktop's distant water edge.
    this.farSide.set(1, this.projectedEdge.y, .5).unproject(camera);
    const distance = (WATER_Y - camera.position.y) / (this.farSide.y - camera.position.y);
    const farX = camera.position.x + (this.farSide.x - camera.position.x) * distance;
    this.mesh.scale.x = Math.max(1, (Math.abs(farX) + 40) / 700);
    this.streaks.scale.x = 1 / this.mesh.scale.x;
    this.waterline.value = THREE.MathUtils.clamp((1 - this.projectedEdge.y) * .5, 0, 1);
    this.mesh.updateMatrixWorld(true); this.last = -Infinity;
  }
  setNormal(value: THREE.Texture) { this.normalNode.value = value; }
  setShore(value: THREE.Texture) { this.shoreNode.value = value; }
  setMoon(active: boolean) { this.moonActive.value = active ? 1 : 0; }
  setShoreComposition(crop: number, active: number) { this.shoreCrop.value = crop; this.shoreActive.value = active; }
  setFrame(frame: Readonly<WaterFrame>) {
    this.frame.phase = frame.phase; this.frame.waveCount = frame.waveCount;
    this.frame.farZ = frame.farZ; this.frame.nearZ = frame.nearZ; this.frame.motionAllowed = frame.motionAllowed;
    this.phase.value = frame.phase; this.waveCount.value = frame.waveCount;
    this.farZ.value = frame.farZ; this.nearZ.value = frame.nearZ;
    const span = Math.max(1, frame.nearZ - frame.farZ);
    this.farFadeWidth.value = Math.min(WATER_FAR_FADE_MAX, span * WATER_FAR_FADE_FRACTION);
    this.nearFadeWidth.value = Math.min(WATER_NEAR_FADE_MAX, span * WATER_NEAR_FADE_FRACTION);
  }
  setMoonFrame(frame: Readonly<MoonFrame>, width: number, height: number, camera: THREE.PerspectiveCamera) {
    this.moonRay.set(frame.x / Math.max(1, width) * 2 - 1, 1 - frame.y / Math.max(1, height) * 2, .5).unproject(camera);
    this.moonDirection.value.copy(this.moonRay).sub(camera.position).normalize();
    return this.moonDirection.value;
  }
  private releaseTarget() {
    if (this.target) { this.reflectionNode.value = this.neutralReflection; this.target.dispose(); this.target = null; }
    this.enabled.value = 0; this.hz = 0; this.last = -Infinity;
  }
  private ensureTarget(quality: Quality, aspect: number) {
    if (quality === 'low') { this.releaseTarget(); return; }
    const cap = quality === 'ultra' ? 512 : 256;
    this.hz = quality === 'ultra' ? 30 : 15;
    const width = Math.max(1, Math.round(cap * Math.min(1, aspect))), height = Math.max(1, Math.round(cap / Math.max(1, aspect)));
    if (!this.target) {
      this.target = new THREE.RenderTarget(width, height, { type: THREE.HalfFloatType, depthBuffer: true });
      this.target.texture.name = 'Bounded planar waterfront reflection';
      this.reflectionNode.value = this.target.texture;
      // TextureNode's render-target Y convention is fixed at compilation. This
      // happens during preparation/quality changes, never a firework burst.
      (this.mesh.material as THREE.Material).needsUpdate = true; this.last = -Infinity;
    } else if (this.target.width !== width || this.target.height !== height) {
      this.target.setSize(width, height); this.last = -Infinity;
    }
    this.reflectionTexel.value.set(1 / width, 1 / height);
  }
  async warmup(renderer: THREE.WebGPURenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, quality: Quality, orient: OrientPass) {
    this.ensureTarget(quality, camera.aspect); if (!this.target) return;
    this.planar.update(camera, WATER_Y, renderer.coordinateSystem);
    const oldTarget = renderer.getRenderTarget(), oldMRT = renderer.getMRT();
    renderer.getViewport(this.oldViewport); renderer.getScissor(this.oldScissor);
    const oldScissorTest = renderer.getScissorTest();
    try {
      orient(this.camera, true); renderer.setMRT(null); renderer.setRenderTarget(this.target); renderer.setScissorTest(false);
      await renderer.compileAsync(scene, this.camera);
    } finally {
      renderer.setRenderTarget(oldTarget); renderer.setMRT(oldMRT);
      renderer.setViewport(this.oldViewport); renderer.setScissor(this.oldScissor); renderer.setScissorTest(oldScissorTest);
      orient(camera, false);
    }
  }
  update(renderer: THREE.WebGPURenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, sim: Simulation, visible: boolean, _motionAllowed: boolean, orient: OrientPass) {
    this.mesh.visible = visible;
    this.detailTier.value = sim.quality === 'ultra' ? 1 : sim.quality === 'standard' ? .5 : 0;
    this.strength.value = sim.reducedFlashes ? .34 : .62; this.streaks.count = 0;
    // Keep the four strongest current sources without sorting/mutating the
    // simulation or allocating temporary arrays during a composite firework.
    this.burstCount.value = 0;
    for (const anchor of this.lightAnchors) anchor.w = 0;
    for (const light of sim.lights) {
      const energy = Math.exp(-light.age * 1.55) * light.strength;
      if (energy < .0002) continue;
      for (let i = 0; i < BURST_LIGHT_CAPACITY; i++) if (energy > this.lightAnchors[i].w) {
        for (let j = BURST_LIGHT_CAPACITY - 1; j > i; j--) {
          this.lightAnchors[j].copy(this.lightAnchors[j - 1]); this.lightColors[j].copy(this.lightColors[j - 1]);
        }
        this.lightAnchors[i].set(light.x, light.y, light.z, energy); this.lightColors[i].set(light.r, light.g, light.b);
        this.burstCount.value = Math.min(BURST_LIGHT_CAPACITY, this.burstCount.value + 1); break;
      }
    }
    if (visible && sim.quality === 'low') for (const light of sim.lights) for (let j = 0; j < 24; j++) {
      const energy = Math.exp(-light.age * 1.5) * light.strength * (1 - j / 24) * (sim.reducedFlashes ? .22 : .34);
      if (energy < .003 || this.streaks.count >= 288) continue;
      const i = this.streaks.count++, width = (2 + j * .65) * (.5 + .5 * Math.sin(j * 1.3 + this.frame.phase));
      this.matrix.makeScale(width, .22 + j * .015, 1); this.matrix.setPosition(light.x + Math.sin(j + this.frame.phase) * 2, -320 + j * 3, 0);
      this.streaks.setMatrixAt(i, this.matrix); this.tint.setRGB(light.r * energy, light.g * energy, light.b * energy); this.streaks.setColorAt(i, this.tint);
    }
    this.streaks.instanceMatrix.needsUpdate = true; if (this.streaks.instanceColor) this.streaks.instanceColor.needsUpdate = true;
    if (!visible) { this.releaseTarget(); return; }
    this.ensureTarget(sim.quality, camera.aspect); if (!this.target) return;
    if (sim.time >= this.last && sim.time - this.last < 1 / this.hz) return;
    this.last = sim.time;
    this.planar.update(camera, WATER_Y, renderer.coordinateSystem);
    this.clipCoordinateSystem = renderer.coordinateSystem === THREE.WebGPUCoordinateSystem ? 'webgpu' : 'webgl';
    const oldTarget = renderer.getRenderTarget(), oldMRT = renderer.getMRT(), oldAutoClear = renderer.autoClear, alpha = renderer.getClearAlpha();
    renderer.getClearColor(this.oldClear); renderer.getViewport(this.oldViewport); renderer.getScissor(this.oldScissor);
    const oldScissorTest = renderer.getScissorTest();
    try {
      orient(this.camera, true); renderer.setMRT(null); renderer.setRenderTarget(this.target);
      renderer.setViewport(0, 0, this.target.width, this.target.height); renderer.setScissorTest(false);
      renderer.setClearColor(0x000000, 0); renderer.autoClear = true;
      renderer.render(scene, this.camera); this.frames++; this.enabled.value = 1;
    } finally {
      renderer.setRenderTarget(oldTarget); renderer.setMRT(oldMRT); renderer.autoClear = oldAutoClear;
      renderer.setClearColor(this.oldClear, alpha); renderer.setViewport(this.oldViewport); renderer.setScissor(this.oldScissor); renderer.setScissorTest(oldScissorTest);
      orient(camera, false);
    }
  }
  diagnostics() {
    return { reflectionFrames: this.frames, reflectionWidth: this.target?.width ?? 0, reflectionHeight: this.target?.height ?? 0,
      reflectionAllocated: Boolean(this.target), reflectionTargets: this.target ? 1 : 0, reflectionHz: this.hz,
      reflectionMode: this.target ? 'planar' : 'disabled', reflectionCameraY: this.camera.position.y, reflectionPlaneY: WATER_Y,
      reflectionClipCoordinateSystem: this.clipCoordinateSystem, waterline: this.waterline.value,
      waterPhase: this.frame.phase, waterWaveCount: this.frame.waveCount, waterFarZ: this.frame.farZ, waterNearZ: this.frame.nearZ,
      waterDisplacementBound: WATER_MAX_DISPLACEMENT, waterMotionAllowed: this.frame.motionAllowed, waterVisible: this.mesh.visible,
      waterBurstLightCount: this.burstCount.value, waterBurstLightCapacity: BURST_LIGHT_CAPACITY,
      waterBurstLights: this.lightAnchors.slice(0, this.burstCount.value).map((anchor, i) => ({
        x: anchor.x, y: anchor.y, z: anchor.z, energy: anchor.w,
        r: this.lightColors[i].x, g: this.lightColors[i].y, b: this.lightColors[i].z,
      })),
      moonDirection: { x: this.moonDirection.value.x, y: this.moonDirection.value.y, z: this.moonDirection.value.z } };
  }
  dispose() {
    this.target?.dispose(); this.target = null; this.neutralReflection.dispose(); this.normalTexture.dispose(); this.shoreTexture.dispose();
    this.streaks.geometry.dispose(); (this.streaks.material as THREE.Material).dispose(); this.wideSurface.dispose(); this.phoneSurface.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
