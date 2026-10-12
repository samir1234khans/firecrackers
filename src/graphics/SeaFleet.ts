import * as THREE from 'three/webgpu';
import { SeaBoatModels } from './SeaBoatModels.js';
import { SEA_FLEET, SEA_WAKE_CAPACITY, SeaWakePool } from './SeaFleetState.js';
import { SeaAudienceSession } from './SeaAudienceSession.js';
import { SeaPassengerRig } from './SeaPassengerRig.js';
import { SEA_PASSENGERS } from './SeaPassengers.js';
import { loadSeaHullAsset, disposeSeaHullAsset } from './SeaHullAsset.js';
import { sampleWater, WATER_Y } from './WaterWaves.js';
import type { WaterFrame } from './WaterWaves.js';
import type { Simulation } from '../engine/Simulation.js';

/** Decorative Spark fleet: one scene clock, one bounded surface pool, no React state. */
export class SeaFleet {
  readonly group = new THREE.Group();
  private readonly factory = new SeaBoatModels();
  private readonly boats = SEA_FLEET.map((_, index) => this.factory.build(index));
  private session = new SeaAudienceSession();
  private readonly passengers = new SeaPassengerRig(this.boats);
  private readonly wakes = new SeaWakePool();
  private readonly surface: THREE.InstancedMesh;
  private readonly reflectionHulls: THREE.InstancedMesh;
  private readonly reflectionCabins: THREE.InstancedMesh;
  private readonly glow: THREE.InstancedMesh;
  private readonly lights = [new THREE.PointLight('#ffd09a', 28, 24, 2), new THREE.PointLight('#ffc58a', 32, 30, 2)];
  private readonly texture: THREE.CanvasTexture;
  private readonly matrix = new THREE.Matrix4();
  private readonly point = new THREE.Vector3();
  private readonly scale = new THREE.Vector3();
  private readonly rotation = new THREE.Quaternion();
  private readonly color = new THREE.Color();
  private readonly normal = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly plane = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  private readonly yaw = new THREE.Quaternion();
  private readonly planeAxis = new THREE.Vector3(0, 0, 1);
  private readonly surfaceSample = { height: 0, slopeX: 0, slopeZ: 0 };
  private readonly pitches = new Float64Array(SEA_FLEET.length);
  private readonly rolls = new Float64Array(SEA_FLEET.length);
  private readonly heights = new Float64Array(SEA_FLEET.length);
  private time = 0;
  private phone = false;
  private adopted = false;
  private disposed = false;
  private activeSurface = 0;
  private readonly hullRequest = new AbortController();
  private hullAsset?: THREE.Group;
  private originalHulls = 0;
  private lastVisualFrame = -1;
  private lastVisualFocus: number | null | undefined;
  private lastVisualPhone = false;
  private lastVisualMoving = false;
  private lastVisualVisible = false;
  private lastVisualWaves = -1;
  constructor() {
    this.group.name = 'Spark ten-boat sea and living audience';
    for (const boat of this.boats) this.group.add(boat.root);
    this.group.add(this.passengers.group);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
    const context = canvas.getContext('2d')!, gradient = context.createRadialGradient(16, 16, 1, 16, 16, 16);
    gradient.addColorStop(0, '#ffffffff'); gradient.addColorStop(.30, '#ffffff99'); gradient.addColorStop(1, '#ffffff00');
    context.fillStyle = gradient; context.fillRect(0, 0, 32, 32); this.texture = new THREE.CanvasTexture(canvas);
    this.surface = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.texture, color: 0xffffff, transparent: true, opacity: .36, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }), 1024);
    this.surface.name = 'Finite world-space wakes, oar contact, footprints and lamp fragments'; this.surface.frustumCulled = false; this.surface.count = 0;
    this.group.add(this.surface);
    const proxy = new THREE.MeshBasicMaterial({ color: '#2a2520', toneMapped: false, fog: true });
    this.reflectionHulls = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 6), proxy, SEA_FLEET.length);
    this.reflectionCabins = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), proxy, 4);
    for (const mesh of [this.reflectionHulls, this.reflectionCabins]) { mesh.layers.set(3); mesh.frustumCulled = false; this.group.add(mesh); }
    this.glow = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.texture, color: '#ffbc77', transparent: true, opacity: .21, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }), 13);
    this.glow.name = 'Source-attached warm practical glows'; this.glow.frustumCulled = false; this.group.add(this.glow);
    this.lights.forEach(light => { light.castShadow = false; light.layers.enable(3); this.group.add(light); });
    void loadSeaHullAsset(this.hullRequest.signal).then(source => {
      if (this.disposed) { disposeSeaHullAsset(source); return; }
      this.hullAsset = source; this.originalHulls = this.factory.adoptOriginalHulls(source, this.boats);
    }).catch(() => { /* Complete procedural alternatives remain attached to the live session. */ });
  }
  adopt(source: THREE.Group) { if (!this.adopted) this.adopted = this.factory.adoptCanoe(source, this.boats); }
  setSession(session: SeaAudienceSession) { this.session = session; }
  resize(phone: boolean) { this.phone = phone; }
  update(sim: Simulation, frame: Readonly<WaterFrame>, visible: boolean) {
    if (this.disposed) return;
    this.group.visible = visible;
    const moving = visible && frame.motionAllowed && !sim.reducedMotion;
    const dt = this.session.advance(sim.time, moving, this.phone, frame);
    this.time = this.session.clock.time;
    // Slow hulls and small surface marks share the rig's pose rate. The water shader
    // and fixed-step audience keep their own clocks; repeated high-refresh frames
    // need not rebuild hundreds of unchanged contact/reflection matrices.
    const visualFrame = Math.floor(this.time * (this.session.focus === null ? 30 : 60) + 1e-8);
    if (visualFrame === this.lastVisualFrame && this.session.focus === this.lastVisualFocus &&
      this.phone === this.lastVisualPhone && moving === this.lastVisualMoving && visible === this.lastVisualVisible && frame.waveCount === this.lastVisualWaves) return;
    this.lastVisualFrame = visualFrame; this.lastVisualFocus = this.session.focus;
    this.lastVisualPhone = this.phone; this.lastVisualMoving = moving; this.lastVisualVisible = visible; this.lastVisualWaves = frame.waveCount;
    this.factory.setDetail(this.session.focus);
    this.activeSurface = 0; let lamps = 0, shelters = 0;
    for (let i = 0; i < this.boats.length; i++) {
      const boat = this.boats[i], pose = this.session.poses[i];
      const alongX = Math.cos(pose.yaw), alongZ = -Math.sin(pose.yaw), half = pose.length * .42;
      const floating = this.session.floats[i];
      const height = floating.height, pitch = floating.targetPitch;
      this.heights[i] = height; this.pitches[i] = floating.pitch; this.rolls[i] = floating.roll;
      boat.root.position.set(pose.x, WATER_Y + height, pose.z); boat.root.scale.set(pose.length / 6, pose.length / 6, pose.beam / 1.84);
      boat.root.rotation.set(this.rolls[i], pose.yaw, this.pitches[i], 'YXZ');
      boat.root.visible = visible;
      for (let oar = 0; oar < boat.oars.length; oar++) {
        const side = oar === 0 ? -1 : 1;
        boat.oars[oar].rotation.y = moving ? pose.row * .34 * side : .08 * side;
        boat.oars[oar].rotation.x = side * (moving ? Math.max(0, Math.cos(this.time * 1.55 + SEA_FLEET[i].phase)) * .17 : .03);
      }
      boat.root.updateMatrixWorld(true);
      // Reflection proxies carry the same complete hull transform, including buoyancy.
      this.matrix.makeScale(3, .34, .85); this.matrix.setPosition(0, -.12, 0); this.matrix.premultiply(boat.root.matrixWorld);
      this.reflectionHulls.setMatrixAt(i, this.matrix);
      if (boat.canopy) {
        this.matrix.makeScale(i === 1 ? 3.6 : 2.15, i === 1 ? 1.05 : 1.25, i === 1 ? 1.84 : 1.4).setPosition(i === 1 ? -.15 : -.45, .92, 0);
        this.matrix.premultiply(boat.root.matrixWorld); this.reflectionCabins.setMatrixAt(shelters++, this.matrix);
      }
      this.mark(pose.x, pose.z, pose.yaw, pose.length * .84, pose.beam * .43, .014, '#030b12', frame);
      if (dt > 0) this.wakes.emit(i, this.time, pose);
      for (let lamp = 0; lamp < boat.lamps.length; lamp++) {
        boat.lamps[lamp].getWorldPosition(this.point);
        const lampX = this.point.x, lampZ = this.point.z;
        this.matrix.makeScale(pose.length * .065, pose.length * .065, 1).setPosition(this.point); this.glow.setMatrixAt(lamps++, this.matrix);
        if (i < 2 && lamp === 0) { this.lights[i].position.copy(this.point); this.lights[i].intensity = visible ? (i === 0 ? 85 : 110) : 0; }
        for (let fragment = 0; fragment < 7; fragment++) {
          const ripple = Math.sin(this.time * .63 + fragment * 2.39 + i);
          this.mark(lampX + ripple * .28, lampZ + .7 + fragment * 1.25, .0,
            .48 + fragment * .17, .15 + fragment * .03, .05 + (1 - fragment / 7) * .30, '#b77b36', frame);
        }
      }
      if ((i === 0 || i === 7) && moving && Math.cos(this.time * 1.55 + SEA_FLEET[i].phase) < -.12) {
        for (const side of [-1, 1]) this.mark(pose.x - alongX * pose.length * .14 - alongZ * pose.beam * side,
          pose.z - alongZ * pose.length * .14 + alongX * pose.beam * side, pose.yaw, .8, .3, .28, '#64889d', frame);
      }
      if (moving && SEA_FLEET[i].band !== 'far' && pitch > .014) {
        this.mark(pose.x + alongX * half, pose.z + alongZ * half, pose.yaw, .6, pose.beam * .38, .22, '#7f9cac', frame);
      }
    }
    this.passengers.render(this.boats, this.session);
    for (const mark of this.wakes.marks) {
      const age = this.time - mark.born; if (age < 0 || age >= mark.life) continue;
      const fade = (1 - age / mark.life) ** 2 * mark.power;
      for (const side of [-1, 1]) {
        const spread = mark.width * (.38 + age * .12);
        this.mark(mark.x + Math.sin(mark.yaw) * spread * side, mark.z + Math.cos(mark.yaw) * spread * side,
          mark.yaw + side * .34, .7 + age * .22, .16 + age * .035, fade * .21, '#7a9eae', frame);
      }
    }
    this.surface.count = this.activeSurface; this.surface.instanceMatrix.needsUpdate = true;
    if (this.surface.instanceColor) this.surface.instanceColor.needsUpdate = true;
    this.glow.count = lamps; this.glow.instanceMatrix.needsUpdate = true;
    this.reflectionHulls.instanceMatrix.needsUpdate = true; this.reflectionCabins.count = shelters; this.reflectionCabins.instanceMatrix.needsUpdate = true;
  }
  private mark(x: number, z: number, yaw: number, length: number, width: number, energy: number, color: string, frame: Readonly<WaterFrame>) {
    if (this.activeSurface >= this.surface.instanceMatrix.count) return;
    const sample = sampleWater(x, z, frame.phase, this.surfaceSample, frame);
    this.point.set(x, WATER_Y + sample.height + .025, z); this.scale.set(length, width, 1);
    this.normal.set(-sample.slopeX, 1, -sample.slopeZ).normalize();
    this.rotation.setFromUnitVectors(this.up, this.normal).multiply(this.plane).multiply(this.yaw.setFromAxisAngle(this.planeAxis, yaw));
    this.matrix.compose(this.point, this.rotation, this.scale); this.surface.setMatrixAt(this.activeSurface, this.matrix);
    this.color.set(color).multiplyScalar(energy); this.surface.setColorAt(this.activeSurface++, this.color);
  }
  diagnostics(camera?: THREE.PerspectiveCamera) {
    let triangles = 0, draws = 0;
    for (const boat of this.boats) boat.root.traverseVisible(object => {
      if (object instanceof THREE.Mesh) { triangles += (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3; draws++; }
    });
    const rig = this.passengers.diagnostics();
    return { seaFleet: 'spark-ten-boat-audience-v002', riverBoats: SEA_FLEET.length, riverLampAnchors: 13, riverSeatedFigures: SEA_PASSENGERS.length, seaFleetTime: this.time,
      seaOriginalBlenderHulls: this.originalHulls,
      seaCanoeSource: this.adopted ? 'OuterSpaceSimon CC0 original geometry and maps' : 'original procedural fallback',
      seaWakeCount: this.wakes.active(this.time), seaWakeCapacity: SEA_WAKE_CAPACITY, seaSurfaceCount: this.surface.count,
      seaPointLights: 2, seaVisualPoseHz: this.session.focus === null ? 30 : 60, seaFleetTriangles: triangles + rig.triangles, seaFleetDraws: draws + rig.draws, seaPassengerContacts: rig.contacts, riverPointLights: 2,
      riverMotionTime: this.time, riverHullSampleCount: SEA_FLEET.length * 4, riverCandleGlows: 13, riverCandleFlames: 0,
      riverWaterContactInstances: this.surface.count, riverContactCapacity: this.surface.instanceMatrix.count,
      riverReflectionProxyBoats: SEA_FLEET.length, riverReflectionProxyShelters: 3,
      riverHullSamples: this.session.poses.map((_, i) => ({ height: this.heights[i], pitch: this.pitches[i], roll: this.rolls[i], centerDeviation: 0 })),
      riverPositions: this.boats.map(boat => ({ x: boat.root.position.x, y: boat.root.position.y, z: boat.root.position.z })),
      ...this.session.diagnostics(),
      seaPositions: this.session.poses.map((pose, i) => {
        this.point.copy(this.boats[i].root.position); if (camera) this.point.project(camera);
        return { id: SEA_FLEET[i].id, x: pose.x, z: pose.z, yaw: pose.yaw, pitch: this.pitches[i], roll: this.rolls[i],
          screenX: camera ? (this.point.x + 1) / 2 : 0, screenY: camera ? (1 - this.point.y) / 2 : 0, length: pose.length };
      }) };
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.hullRequest.abort(); this.passengers.dispose(); this.factory.dispose(); this.texture.dispose();
    if (this.hullAsset) disposeSeaHullAsset(this.hullAsset);
    for (const mesh of [this.surface, this.glow, this.reflectionHulls, this.reflectionCabins]) { mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); mesh.dispose(); }
    for (const light of this.lights) light.dispose(); this.group.clear(); this.wakes.reset();
  }
}
