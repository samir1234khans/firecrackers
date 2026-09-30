import { MOON_X } from './MoonComposition';
import { WATER_WAVES } from './WaterWaves';
import * as THREE from 'three/webgpu';
import { float, positionWorld, screenUV, sin, smoothstep, texture, uniform, vec2, vec3 } from 'three/tsl';
import type { Simulation } from '../engine/Simulation';

/** Selective screen-space waterfront reflection, throttled and composition-aware. Layer 1 contains effects only. */
export class WaterReflection {
  readonly target = new THREE.RenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: true });
  readonly camera = new THREE.PerspectiveCamera();
  readonly mesh: THREE.Mesh;
  private readonly wideSurface = new THREE.PlaneGeometry(1400, 1200);
  private readonly phoneSurface = new THREE.PlaneGeometry(1400, 380);
  private readonly projectedEdge = new THREE.Vector3();
  private readonly normalTexture = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
  private readonly shoreTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  private readonly normalNode = texture(this.normalTexture);
  private readonly shoreNode = texture(this.shoreTexture);
  private readonly shoreCrop = uniform(1);
  private readonly shoreActive = uniform(0);
  private readonly streaks = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false }), 288);
  private readonly matrix = new THREE.Matrix4();
  private readonly tint = new THREE.Color();
  private readonly time = uniform(0);
  private readonly strength = uniform(.4);
  private readonly enabled = uniform(1);
  private readonly moonActive = uniform(0);
  private readonly waterline = uniform(.49);
  private last = -Infinity;
  private frames = 0;
  private readonly oldClear = Object.assign(new THREE.Color(), { a: 1 });
  constructor() {
    this.target.texture.name = 'Selective firework reflection';
    const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
    const depth = screenUV.y.sub(this.waterline).div(float(1).sub(this.waterline)).clamp(0, 1);
    const reflectedY = depth.oneMinus().mul(.62).add(.08);
    const uv = vec2(screenUV.x, reflectedY);
    const band = smoothstep(this.waterline.add(.015), this.waterline.add(.085), screenUV.y);
    const wave = sin(positionWorld.z.mul(1.7).add(positionWorld.x.mul(.23)).add(this.time.mul(1.2)));
    const detail = sin(positionWorld.z.mul(7.1).sub(this.time.mul(.8)).add(positionWorld.x.mul(.51)));
    const normal = this.normalNode.sample(positionWorld.xz.mul(.028).add(vec2(this.time.mul(.006), this.time.mul(.002)))).rg.sub(.5);
    let slopeX = float(0).add(0), slopeZ = float(0).add(0);
    for (const w of WATER_WAVES) {
      const phase = positionWorld.x.mul(w.x).add(positionWorld.z.mul(w.z)).sub(this.time.mul(w.speed)).add(w.phase);
      const slope = phase.cos().mul(w.amplitude);
      slopeX = slopeX.add(slope.mul(w.x)); slopeZ = slopeZ.add(slope.mul(w.z));
    }
    const swell = vec2(slopeX, slopeZ).mul(3.5);
    const distance = depth.mul(.65).add(.35);
    const offset = vec2(wave.mul(.008).add(detail.mul(.003)), detail.mul(.003)).add(normal.mul(.016)).add(swell).mul(distance);
    const center = texture(this.target.texture, uv.add(offset)).rgb;
    const blurWidth = depth.mul(.010).add(.003);
    const blur = texture(this.target.texture, uv.add(offset).add(vec2(blurWidth, .006))).rgb.add(texture(this.target.texture, uv.add(offset).sub(vec2(blurWidth, .006))).rgb);
    const glints = sin(positionWorld.z.mul(5.3).add(positionWorld.x.mul(.37)).add(this.time.mul(.72))).mul(.5).add(.5);
    const fragments = smoothstep(.23, .77, glints.add(normal.x.mul(.52)).add(wave.mul(detail).mul(.20))).mul(.88).add(.045);
    // Keep unlit water quiet; high-frequency sinusoidal albedo aliases into
    // regular rings at the horizon. Normals distort actual reflected light instead.
    const broadNormal = this.normalNode.sample(positionWorld.xz.mul(.005).add(vec2(this.time.mul(.001), this.time.mul(.0004)))).rg.sub(.5);
    const broadShade = broadNormal.x.mul(.030).add(broadNormal.y.mul(.025));
    const surface = vec3(.006, .012, .020).add(broadShade.mul(vec3(.25, .55, 1))).add(normal.y.mul(.001));
    // Mirror the narrow original shoreline light band. No static fireworks are baked into it.
    const shoreUV = vec2(screenUV.x.add(offset.x.mul(1.5)).sub(.5).mul(this.shoreCrop).add(.5), float(.139).add(normal.y.mul(.012)).add(wave.mul(.002)));
    const shore = this.shoreNode.sample(shoreUV).rgb;
    const reflectedSky = this.shoreNode.sample(vec2(shoreUV.x, float(.139).add(depth.mul(.43)).add(normal.y.mul(.03)))).rgb;
    const crossNormal = this.normalNode.sample(vec2(positionWorld.z.mul(.014), positionWorld.x.mul(.011)).add(vec2(this.time.mul(-.0018), this.time.mul(.001)))).rg.sub(.5);
    const crest = smoothstep(.025, .15, normal.y.add(crossNormal.x.mul(.55)).add(broadNormal.y.mul(.4)));
    // Broad cool sky glints across crossing ripples, strongest in the foreground.
    // Texture mip filtering keeps the far water quiet instead of aliasing a grid.
    const skyGlints = crest.pow(3).mul(depth.pow(.65)).mul(vec3(.013, .021, .029));
    const microGlints = normal.x.mul(normal.y).abs().mul(vec3(.012, .018, .025)).add(skyGlints);
    const warm = shore.r.sub(shore.b.mul(1.1)).max(0);
    const shoreGlints = shore.mul(warm.mul(3).clamp(0, 1)).mul(this.shoreActive).mul(depth.oneMinus().pow(1.8)).mul(fragments).mul(.8);
    // Crossing filtered normals break the reflection into irregular wave facets.
    // Broadens toward the viewer; never a white painted stripe or mirrored disc.
    const pathWidth = depth.mul(.075).add(.008);
    const pathX = screenUV.x.sub(MOON_X).add(normal.x.mul(.016)).add(broadNormal.x.mul(.025)).div(pathWidth);
    const path = pathX.mul(pathX).mul(-2.2).exp();
    const facets = smoothstep(.01, .13, normal.y.add(crossNormal.x.mul(.65)).add(slopeZ.mul(8)));
    const grazing = depth.oneMinus().pow(5).mul(.72).add(.08);
    const moonlight = vec3(.40, .48, .58).mul(path).mul(facets.pow(1.5).mul(.82).add(.018)).mul(grazing.add(depth.mul(.35))).mul(band).mul(this.moonActive).mul(.52);
    material.colorNode = surface.max(0).add(moonlight).add(microGlints).add(reflectedSky.mul(this.shoreActive).mul(.34)).add(shoreGlints).add(center.mul(.60).add(blur.mul(.20)).mul(fragments).mul(this.strength).mul(this.enabled).mul(band).mul(depth.mul(.25).add(.75)));
    this.mesh = new THREE.Mesh(this.wideSurface, material);
    this.mesh.name = 'Dark rippled waterfront'; this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(0, 4.65, -400);
    // TSL creates the sampler before authored assets arrive. Match the eventual
    // repeating normal map now: changing only a TextureNode value later can
    // retain clamp sampling, turning large world UVs into angular edge colors.
    // The panorama needs its own clamped placeholder and sampler.
    this.normalTexture.wrapS = this.normalTexture.wrapT = THREE.RepeatWrapping;
    this.normalTexture.needsUpdate = true; this.shoreTexture.needsUpdate = true;
    this.streaks.count = 0; this.streaks.frustumCulled = false;
    this.mesh.add(this.streaks); this.streaks.position.z = .025;
  }
  /** Keep the visible water behind the burst on portrait phones. Measure its edge in the actual camera. */
  resize(camera: THREE.PerspectiveCamera) {
    const phone = camera.aspect < .72;
    this.mesh.geometry = phone ? this.phoneSurface : this.wideSurface;
    this.mesh.position.z = phone ? 10 : -400;
    // Low-quality streaks retain their world position when the water plane shortens.
    this.streaks.position.y = phone ? 410 : 0;
    this.projectedEdge.set(0, 4.65, phone ? -180 : -1000).project(camera);
    this.waterline.value = THREE.MathUtils.clamp((1 - this.projectedEdge.y) * .5, 0, 1);
    this.mesh.updateMatrixWorld(true);
  }
  setNormal(value: THREE.Texture) { this.normalNode.value = value; }
  setShore(value: THREE.Texture) { this.shoreNode.value = value; }
  setMoon(active: boolean) { this.moonActive.value = active ? 1 : 0; }
  setShoreComposition(crop: number, active: number) { this.shoreCrop.value = crop; this.shoreActive.value = active; }
  update(renderer: THREE.WebGPURenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, sim: Simulation, visible: boolean, motionAllowed: boolean, orient: (camera: THREE.PerspectiveCamera) => void) {
    this.mesh.visible = visible;
    this.time.value = motionAllowed && sim.quality !== "low" ? sim.time * sim.wind : 0;
    this.strength.value = sim.reducedFlashes ? .38 : .64;
    this.enabled.value = sim.quality === 'low' ? 0 : 1;
    this.streaks.count = 0;
    if (visible && sim.quality === 'low') for (const light of sim.lights) for (let j = 0; j < 24; j++) {
      const energy = Math.exp(-light.age * 1.5) * light.strength * (1 - j / 24) * (sim.reducedFlashes ? .22 : .34);
      if (energy < .003) continue;
      const i = this.streaks.count++, width = (2 + j * .65) * (.5 + .5 * Math.sin(j * 1.3 + sim.time * sim.wind));
      this.matrix.makeScale(width, .22 + j * .015, 1); this.matrix.setPosition(light.x + Math.sin(j + sim.time) * 2, -320 + j * 3, 0);
      this.streaks.setMatrixAt(i, this.matrix); this.tint.setRGB(light.r * energy, light.g * energy, light.b * energy); this.streaks.setColorAt(i, this.tint);
    }
    this.streaks.instanceMatrix.needsUpdate = true; if (this.streaks.instanceColor) this.streaks.instanceColor.needsUpdate = true;
    if (!visible || sim.quality === 'low') return;
    const cap = sim.quality === 'ultra' ? 512 : 256, hz = sim.quality === 'ultra' ? 30 : 15;
    const aspect = camera.aspect, w = Math.max(1, Math.round(cap * Math.min(1, aspect))), h = Math.max(1, Math.round(cap / Math.max(1, aspect)));
    const resized = this.target.width !== w || this.target.height !== h;
    if (resized) { this.target.setSize(w, h); this.last = -Infinity; }
    if (sim.time >= this.last && sim.time - this.last < 1 / hz) return;
    this.last = sim.time; this.frames++;
    this.camera.copy(camera);
    this.camera.layers.set(1); this.camera.updateMatrixWorld();
    const oldTarget = renderer.getRenderTarget(), alpha = renderer.getClearAlpha();
    renderer.getClearColor(this.oldClear);
    try {
      orient(this.camera); renderer.setRenderTarget(this.target); renderer.setClearColor(0x000000, 0);
      renderer.render(scene, this.camera);
    } finally {
      renderer.setRenderTarget(oldTarget); renderer.setClearColor(this.oldClear, alpha); orient(camera);
    }
  }
  diagnostics() { return { reflectionFrames: this.frames, reflectionWidth: this.target.width, reflectionHeight: this.target.height, waterline: this.waterline.value }; }
  dispose() { this.target.dispose(); this.normalTexture.dispose(); this.shoreTexture.dispose(); this.streaks.geometry.dispose(); (this.streaks.material as THREE.Material).dispose(); this.wideSurface.dispose(); this.phoneSurface.dispose(); (this.mesh.material as THREE.Material).dispose(); }
}

