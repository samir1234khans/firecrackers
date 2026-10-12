import * as THREE from 'three/webgpu';
import { SEA_PASSENGERS, type PassengerSpec } from './SeaPassengers.js';
import type { SeaAudienceSession } from './SeaAudienceSession.js';
import type { SeaBoatModel } from './SeaBoatModels.js';
import { clamp } from '../engine/catalog.js';
import { createSeaGarmentGeometry } from './SeaGarmentGeometry.js';

type Batch = { mesh: THREE.InstancedMesh; used: number };
type Actor = { spec: PassengerSpec; seat: THREE.Group; body: THREE.Group; head: THREE.Group; eyes: THREE.Group };
export type ArmSolution = { elbow: THREE.Vector3; hand: THREE.Vector3 };
/** Two-link reach: retains segment lengths and never hyperextends. */
export function solveSeaArm(shoulder: THREE.Vector3, requested: THREE.Vector3, side: number, out: ArmSolution,
  direction = new THREE.Vector3(), bend = new THREE.Vector3()) {
  const upper = .30, fore = .28;
  direction.subVectors(requested, shoulder); const distance = clamp(direction.length(), .06, upper + fore - .005);
  direction.normalize(); out.hand.copy(shoulder).addScaledVector(direction, distance);
  bend.set(0, -.5, side); bend.addScaledVector(direction, -bend.dot(direction));
  if (bend.lengthSq() < .001) bend.set(0, 0, side); bend.normalize();
  const along = (upper * upper - fore * fore + distance * distance) / (2 * distance);
  const offset = Math.sqrt(Math.max(0, upper * upper - along * along));
  out.elbow.copy(shoulder).addScaledVector(direction, along).addScaledVector(bend, offset);
  return out;
}
/** Rigid articulated anatomical meshes, batched across the fleet. No mesh per limb draw call. */
export class SeaPassengerRig {
  readonly group = new THREE.Group();
  private readonly actors: Actor[];
  private readonly batches = new Map<string, Batch>();
  private readonly geometries = new Set<THREE.BufferGeometry>();
  private readonly materials = new Set<THREE.Material>();
  private readonly matrix = new THREE.Matrix4();
  private readonly localMatrix = new THREE.Matrix4();
  private readonly position = new THREE.Vector3();
  private readonly size = new THREE.Vector3();
  private readonly rotation = new THREE.Quaternion();
  private readonly identity = new THREE.Quaternion();
  private readonly colors = new Map<string, THREE.Color>();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly forward = new THREE.Vector3(1, 0, 0);
  private readonly shoulder = new THREE.Vector3();
  private readonly requested = new THREE.Vector3();
  private readonly rest = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private readonly scratch = new THREE.Vector3();
  private readonly direction = new THREE.Vector3();
  private readonly bend = new THREE.Vector3();
  private readonly solution: ArmSolution = { elbow: new THREE.Vector3(), hand: new THREE.Vector3() };
  private readonly actualLook = new THREE.Vector3();
  private readonly targetLook = new THREE.Vector3();
  private readonly optical = new THREE.Quaternion();
  private readonly eyeEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly contact: { person: number; gazeError: number; upper: number; fore: number; footY: number; oarGripError: number; pointingError: number; clapPalmGap: number }[] = [];
  private readonly leftHand = new THREE.Vector3();
  private readonly lowSphere = new THREE.SphereGeometry(1, 4, 3);
  private readonly closeSphere = new THREE.SphereGeometry(1, 12, 8);
  private lastFrame = -1;
  private lastFocus: number | null | undefined;
  private closeActor = false;
  constructor(boats: SeaBoatModel[]) {
    this.group.name = 'Thirty-three anonymous articulated passengers, shared mesh batches';
    const sphere = this.lowSphere, small = new THREE.SphereGeometry(1, 4, 3);
    const cylinder = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true), box = new THREE.BoxGeometry(1, 1, 1), garment = createSeaGarmentGeometry();
    const skin = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .88, envMapIntensity: .60 });
    const cloth = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .97, envMapIntensity: .42 });
    const dark = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85, envMapIntensity: .5 });
    for (const geometry of [sphere, small, cylinder, box, garment]) this.geometries.add(geometry);
    this.geometries.add(this.closeSphere);
    for (const material of [skin, cloth, dark]) this.materials.add(material);
    for (const [key, geometry, material, capacity] of [
      ['skin', sphere, skin, 260], ['cloth', sphere, cloth, 220], ['sleeve', cylinder, cloth, 300],
      ['hand', small, skin, 260], ['detail', small, dark, 300], ['boot', box, dark, 300],
      ['garment', garment, cloth, 40],
      ['close-skin', this.closeSphere, skin, 260], ['close-cloth', this.closeSphere, cloth, 220],
    ] as const) {
      const mesh = new THREE.InstancedMesh(geometry, material, capacity);
      // Establish the color attribute before pipeline warmup, including initially
      // empty close-up batches. Late attributes otherwise leave a white variant.
      mesh.setColorAt(0, new THREE.Color(0xffffff));
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.instanceColor!.setUsage(THREE.DynamicDrawUsage);
      mesh.name = `Passenger ${key} batch`; mesh.frustumCulled = false; mesh.layers.disable(3); mesh.count = 0;
      this.batches.set(key, { mesh, used: 0 }); this.group.add(mesh);
    }
    this.actors = SEA_PASSENGERS.map(spec => {
      const seat = boats[spec.boat].people[spec.seat], body = new THREE.Group(), head = boats[spec.boat].heads[spec.seat], eyes = new THREE.Group();
      body.name = 'Spine and shoulders'; head.name = 'Neck, head and gaze'; eyes.name = 'Eye-first attention';
      // The anchors already belong to the hull. Mesh matrices are emitted into the shared batches.
      seat.remove(head); seat.add(body); body.add(head); head.add(eyes);
      head.position.set(.012, .94, 0); eyes.position.set(.105, .03, 0);
      return { spec, seat, body, head, eyes };
    });
  }
  private part(key: string, parent: THREE.Matrix4, x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, rotation = this.identity) {
    const batch = this.batches.get(this.closeActor && (key === 'skin' || key === 'cloth') ? `close-${key}` : key)!;
    if (batch.used >= batch.mesh.instanceMatrix.count) return;
    this.position.set(x, y, z); this.size.set(sx, sy, sz);
    this.localMatrix.compose(this.position, rotation, this.size); this.matrix.multiplyMatrices(parent, this.localMatrix);
    let tint = this.colors.get(color);
    if (!tint) { tint = new THREE.Color(color); this.colors.set(color, tint); }
    batch.mesh.setMatrixAt(batch.used, this.matrix); batch.mesh.setColorAt(batch.used++, tint);
  }
  private link(key: string, parent: THREE.Matrix4, a: THREE.Vector3, b: THREE.Vector3, radius: number, color: string) {
    this.direction.subVectors(b, a); const length = this.direction.length();
    this.rotation.setFromUnitVectors(this.up, this.direction.normalize());
    this.position.addVectors(a, b).multiplyScalar(.5);
    this.part(key, parent, this.position.x, this.position.y, this.position.z, radius, length, radius, color, this.rotation);
  }
  render(boats: SeaBoatModel[], session: SeaAudienceSession) {
    // The director remains fixed at 60 Hz; wide-view silhouettes need 30 Hz mesh poses.
    // Close-ups retain 60 Hz. Reframing/rest changes always refresh immediately.
    const frame = Math.floor(session.clock.time * (session.focus === null ? 30 : 60) + 1e-8);
    if (frame === this.lastFrame && session.focus === this.lastFocus && session.moving) return;
    this.lastFrame = frame; this.lastFocus = session.focus;
    for (const batch of this.batches.values()) batch.used = 0;
    this.contact.length = 0;
    const time = session.clock.time;
    for (let index = 0; index < this.actors.length; index++) {
      const { spec, seat, body, head, eyes } = this.actors[index], state = session.audience.poses[index];
      this.closeActor = spec.boat === session.focus;
      const boat = boats[spec.boat], pose = session.poses[spec.boat], floating = session.floats[spec.boat];
      seat.position.set(spec.x, .22, spec.z);
      seat.scale.set(spec.size, spec.size, spec.size * (pose.length / 6) / (pose.beam / 1.84));
      const row = spec.rower && session.moving ? pose.row : 0;
      const lean = state.performance === 'delighted-lean' ? state.gesture * .08 : 0;
      body.rotation.set(-floating.roll * .60, spec.facing + state.bodyYaw,
        -floating.pitch * .60 + row * .045 + lean + (spec.age === 'older' ? -.035 : 0), 'YXZ');
      head.rotation.set(0, state.headYaw, state.headPitch, 'YXZ');
      eyes.rotation.set(0, state.eyeYaw, state.eyePitch, 'YXZ');
      seat.updateWorldMatrix(true, true);
      const matrix = body.matrixWorld;
      // Pelvis and feet remain attached to the seat while the upper body compensates swells.
      this.part('cloth', seat.matrixWorld, .03, .10, 0, .19, .115, .155, spec.trousers);
      this.part('garment', matrix, 0, .49, 0, .145, spec.age === 'child' ? .25 : .28, spec.age === 'child' ? .158 : .19, spec.cloth);
      this.part('cloth', matrix, -.018, .68, 0, .13, .055, .19, spec.cloth);
      this.clothing(spec, matrix, seat.matrixWorld);
      this.part('skin', matrix, .006, .79, 0, .061, .087, .061, spec.skin);
      // Face planes, nose, ears, hairline and a small mouth are readable in the optional close-up.
      this.part('skin', head.matrixWorld, 0, .025, 0, .122, spec.age === 'child' ? .166 : .16, .116, spec.skin);
      this.part('hand', head.matrixWorld, .112, .014, 0, .026, .035, .025, spec.skin);
      for (const side of [-1, 1]) this.part('hand', head.matrixWorld, 0, .022, side * .111, .035, .043, .022, spec.skin);
      const hair = spec.age === 'older' ? '#a19b8e' : '#302b2a';
      this.part('detail', head.matrixWorld, -.027, .137, 0, .116, .046, .113, hair);
      if (this.closeActor) this.part('detail', head.matrixWorld, -.089, .074, 0, .048, .090, .108, hair);
      const blink = session.moving && Math.sin(time * .79 + spec.id * 2.73) > .996 ? .2 : 1;
      for (const side of [-1, 1]) {
        this.part('hand', head.matrixWorld, .110, .054, side * .050, .008, .012 * blink, .019, '#c9c1ac');
        this.part('detail', eyes.matrixWorld, .008, .025, side * .049, .009, .009 * blink, .009, '#242329');
        this.part('detail', head.matrixWorld, .102, .085, side * .051, .012, .009, .027, hair);
      }
      this.part('detail', head.matrixWorld, .103, -.045, 0, .010, .007 + state.smile * .008, .031 + state.smile * .012, '#694f43');
      if (state.target >= 0 && !['share', 'recover'].includes(state.stage)) {
        const target = session.audience.feed.targets.find(event => event.id === state.target);
        if (target) {
          this.eyeEuler.set(0, state.eyeYaw, state.eyePitch, 'YXZ'); this.optical.setFromEuler(this.eyeEuler);
          head.getWorldQuaternion(this.rotation); this.rotation.multiply(this.optical);
          this.actualLook.copy(this.forward).applyQuaternion(this.rotation).normalize();
          head.getWorldPosition(this.target); this.targetLook.set(target.x, target.y, target.z).sub(this.target).normalize();
          state.gazeError = this.actualLook.angleTo(this.targetLook);
        }
      }
      let upper = .30, fore = .28, oarGripError = 0, pointingError = 0, clapPalmGap = 0;
      for (const side of [-1, 1]) {
        this.shoulder.set(0, .69, side * .19); this.rest.set(.25, .27, side * .15); this.requested.copy(this.rest);
        const gesture = state.gesture;
        if (state.stage === 'share' && !spec.operator) this.requested.set(.30, .44 + Math.sin(time * 2 + spec.id) * .025, side * .18);
        else if (state.performance === 'clap') this.requested.set(.34, .57, side * (.031 + (1 - state.clap) * .16)).lerp(this.rest, 1 - clamp(gesture / Math.max(.01, state.intensity), 0, 1));
        else if (state.performance === 'raised-arm') this.requested.set(.17, 1.12, side * .28).lerp(this.rest, 1 - gesture);
        else if (state.performance === 'point' && side === 1 && state.target >= 0) {
          const target = session.audience.feed.targets.find(event => event.id === state.target);
          if (target) {
            this.target.set(target.x, target.y, target.z); body.worldToLocal(this.target);
            this.scratch.subVectors(this.target, this.shoulder).normalize();
            this.requested.copy(this.shoulder).addScaledVector(this.scratch, .53).lerp(this.rest, 1 - gesture);
          }
        }
        if (spec.operator && !spec.rower) {
          this.target.set(spec.x + .25, .49, spec.z + side * .15); boat.root.localToWorld(this.target); body.worldToLocal(this.target); this.requested.copy(this.target);
        }
        if (spec.rower && boat.oars.length) {
          const oar = boat.oars[side < 0 ? 0 : 1];
          this.target.set(0, 0, side < 0 ? .30 : -.30); oar.localToWorld(this.target); body.worldToLocal(this.target);
          this.requested.copy(this.target);
        }
        solveSeaArm(this.shoulder, this.requested, side, this.solution, this.direction, this.bend);
        if (spec.rower) oarGripError = Math.max(oarGripError, this.requested.distanceTo(this.solution.hand));
        if (side === -1) this.leftHand.copy(this.solution.hand);
        else if (state.performance === 'clap') clapPalmGap = this.leftHand.distanceTo(this.solution.hand) - .08;
        upper = this.shoulder.distanceTo(this.solution.elbow); fore = this.solution.elbow.distanceTo(this.solution.hand);
        this.link('sleeve', matrix, this.shoulder, this.solution.elbow, .061, spec.cloth);
        this.link('sleeve', matrix, this.solution.elbow, this.solution.hand, .048, spec.cloth);
        if (this.closeActor) {
          this.scratch.copy(this.solution.elbow).lerp(this.solution.hand, .83);
          this.target.copy(this.solution.elbow).lerp(this.solution.hand, .94);
          this.link('sleeve', matrix, this.scratch, this.target, .053, spec.trim);
        }
        this.part('hand', matrix, this.solution.hand.x, this.solution.hand.y, this.solution.hand.z, .057, .036, .04, spec.skin);
        if (state.performance === 'point' && side === 1 && gesture > .1) {
          const burst = session.audience.feed.targets.find(event => event.id === state.target);
          if (burst) { this.target.set(burst.x, burst.y, burst.z); body.worldToLocal(this.target); this.scratch.subVectors(this.target, this.solution.hand).normalize(); }
          else this.scratch.subVectors(this.solution.hand, this.solution.elbow).normalize();
          this.target.copy(this.solution.hand).addScaledVector(this.scratch, .095);
          pointingError = this.target.clone().sub(this.solution.hand).normalize().angleTo(this.scratch);
          this.link('hand', matrix, this.solution.hand, this.target, .015, spec.skin);
        }
        // Seated legs use the seat frame, never the reacting spine frame.
        this.shoulder.set(.04, .12, side * .09); this.requested.set(.30, .08, side * .09);
        this.link('sleeve', seat.matrixWorld, this.shoulder, this.requested, .078, spec.trousers);
        this.shoulder.copy(this.requested); this.requested.set(.31, -.18, side * .09);
        this.link('sleeve', seat.matrixWorld, this.shoulder, this.requested, .060, spec.trousers);
        this.part('boot', seat.matrixWorld, .355, -.185, side * .09, .16, .065, .095, spec.shoes);
        if (this.closeActor) this.part('boot', seat.matrixWorld, .355, -.2225, side * .09, .17, .01, .10, '#1f2428');
        if (spec.age === 'child') this.part('boot', boat.root.matrixWorld, spec.x + .25, .22 - .2275 * spec.size - .025, spec.z + side * .06, .34, .05, .14, '#726049');
      }
      this.contact.push({ person: spec.id, gazeError: state.gazeError, upper, fore, footY: .22 - .2275 * spec.size, oarGripError, pointingError, clapPalmGap });
    }
    for (const batch of this.batches.values()) {
      batch.mesh.count = batch.used;
      if (!batch.used) continue;
      batch.mesh.instanceMatrix.clearUpdateRanges();
      batch.mesh.instanceMatrix.addUpdateRange(0, batch.used * 16);
      batch.mesh.instanceMatrix.needsUpdate = true;
      if (batch.mesh.instanceColor) {
        batch.mesh.instanceColor.clearUpdateRanges();
        batch.mesh.instanceColor.addUpdateRange(0, batch.used * 3);
        batch.mesh.instanceColor.needsUpdate = true;
      }
    }
  }
  private clothing(spec: PassengerSpec, torso: THREE.Matrix4, seat: THREE.Matrix4) {
    // Larger cuts read at sea distance. Small construction details are selected-family only.
    if (spec.outfit === 'waistcoat') for (const side of [-1, 1]) {
      this.part('boot', torso, .136, .47, side * .088, .036, .43, .15, spec.layer);
      if (this.closeActor) this.part('boot', torso, .159, .43, side * .105, .015, .022, .083, spec.trim);
    }
    if (spec.outfit === 'tunic') {
      this.part('cloth', seat, .13, .19, 0, .235, .085, .18, spec.cloth);
      if (this.closeActor) for (const side of [-1, 1]) this.part('boot', seat, .18, .255, side * .10, .21, .009, .012, spec.trim);
    }
    if (spec.outfit === 'pullover' || spec.stripe) {
      this.part('boot', torso, .149, .49, 0, .017, spec.stripe ? .052 : .025, .28, spec.trim);
      if (spec.stripe) this.part('boot', torso, .145, .38, 0, .016, .042, .26, spec.layer);
    }
    if (!this.closeActor) return;
    // Collar folds, front placket, three buttons and a hem use existing shared batches.
    for (const side of [-1, 1]) {
      this.rotation.setFromAxisAngle(this.forward, side * .32);
      this.part('boot', torso, .098, .735, side * .057, .083, .040, .078, spec.trim, this.rotation);
    }
    if (spec.outfit !== 'pullover') {
      this.part('boot', torso, .151, .52, 0, .017, .32, .022, spec.trim);
      for (const y of [.64, .55, .46]) this.part('detail', torso, .165, y, 0, .009, .011, .011, '#c9b897');
    }
    this.part('boot', torso, .139, .255, 0, .013, .017, .255, spec.layer);
  }
  diagnostics() {
    let triangles = 0, draws = 0;
    for (const { mesh } of this.batches.values()) { triangles += mesh.count * (mesh.geometry.index?.count ?? 0) / 3; if (mesh.count) draws++; }
    return { triangles, draws, contacts: this.contact };
  }
  dispose() {
    for (const { mesh } of this.batches.values()) mesh.dispose();
    for (const geometry of this.geometries) geometry.dispose(); for (const material of this.materials) material.dispose();
    this.group.clear();
  }
}
