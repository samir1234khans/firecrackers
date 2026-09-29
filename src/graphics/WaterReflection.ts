import * as THREE from 'three/webgpu';
import { positionWorld, screenUV, sin, smoothstep, texture, uniform, vec2, vec3 } from 'three/tsl';
import type { Simulation } from '../engine/Simulation';

/** Selective screen-space waterfront reflection, throttled and composition-aware. Layer 1 contains effects only. */
export class WaterReflection {
  readonly target = new THREE.RenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: true });
  readonly camera = new THREE.PerspectiveCamera();
  readonly mesh: THREE.Mesh;
  private readonly normalTexture = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
  private readonly normalNode = texture(this.normalTexture);
  private readonly streaks = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false }), 288);
  private readonly matrix = new THREE.Matrix4();
  private readonly tint = new THREE.Color();
  private readonly time = uniform(0);
  private readonly strength = uniform(.4);
  private readonly enabled = uniform(1);
  private last = -Infinity;
  private frames = 0;
  private readonly oldClear = Object.assign(new THREE.Color(), { a: 1 });
  constructor() {
    this.target.texture.name = 'Selective firework reflection';
    const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
    const reflectedY = screenUV.y.sub(.68).div(.32).oneMinus().mul(.62).add(.08);
    const uv = vec2(screenUV.x, reflectedY);
    const band = smoothstep(.64, .72, screenUV.y);
    const wave = sin(positionWorld.z.mul(1.7).add(positionWorld.x.mul(.23)).add(this.time.mul(1.2)));
    const detail = sin(positionWorld.z.mul(7.1).sub(this.time.mul(.8)).add(positionWorld.x.mul(.51)));
    const normal = this.normalNode.sample(positionWorld.xz.mul(.028).add(vec2(this.time.mul(.006), this.time.mul(.002)))).rg.sub(.5);
    const offset = vec2(wave.mul(.009).add(detail.mul(.003)), detail.mul(.0015)).add(normal.mul(.014));
    const center = texture(this.target.texture, uv.add(offset)).rgb;
    const blur = texture(this.target.texture, uv.add(offset).add(vec2(.004, 0))).rgb.add(texture(this.target.texture, uv.add(offset).sub(vec2(.004, 0))).rgb);
    const fragments = wave.mul(detail).mul(.36).add(.58).clamp(.12, .94);
    material.colorNode = vec3(.009, .019, .030).add(detail.mul(.0003)).add(center.mul(.60).add(blur.mul(.20)).mul(fragments).mul(this.strength).mul(this.enabled).mul(band));
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1200), material);
    this.mesh.name = 'Dark rippled waterfront'; this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(0, 4.65, -400);
    this.normalTexture.needsUpdate = true; this.streaks.count = 0; this.streaks.frustumCulled = false;
    this.mesh.add(this.streaks); this.streaks.position.z = .025;
  }
  setNormal(value: THREE.Texture) { this.normalNode.value = value; }
  update(renderer: THREE.WebGPURenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, sim: Simulation, visible: boolean, orient: (camera: THREE.PerspectiveCamera) => void) {
    this.mesh.visible = visible;
    this.time.value = sim.time * sim.wind;
    this.strength.value = sim.reducedFlashes ? .28 : .42;
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
  diagnostics() { return { reflectionFrames: this.frames, reflectionWidth: this.target.width, reflectionHeight: this.target.height }; }
  dispose() { this.target.dispose(); this.normalTexture.dispose(); this.streaks.geometry.dispose(); (this.streaks.material as THREE.Material).dispose(); this.mesh.geometry.dispose(); (this.mesh.material as THREE.Material).dispose(); }
}

