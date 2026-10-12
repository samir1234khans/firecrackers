import * as THREE from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SimplifyModifier } from 'three/addons/modifiers/SimplifyModifier.js';
import { SEA_FLEET } from './SeaFleetState.js';
import { PASSENGERS_BY_BOAT } from './SeaPassengers.js';

export type SeaBoatModel = { root: THREE.Group; hull: THREE.Group; people: THREE.Group[]; heads: THREE.Group[]; rowingArms: THREE.Group[]; oars: THREE.Group[]; lamps: THREE.Object3D[]; canopy?: THREE.Object3D };

/** Original reusable details; native masters are reproduced by build_spark_sea_v001.py.
 * The CC0 canoe meshes are adopted separately after the existing waterfront loads.
 */
export class SeaBoatModels {
  private readonly levels: { boat: number; mesh: THREE.Mesh; original: THREE.BufferGeometry; low: THREE.BufferGeometry }[] = [];
  setDetail(focus: number | null) { for (const level of this.levels) level.mesh.geometry = level.boat === focus ? level.original : level.low; }
  readonly geometries = new Set<THREE.BufferGeometry>();
  readonly materials = new Set<THREE.Material>();
  private readonly timber = this.material('#58412b', .88, '#111b26');
  private readonly rim = this.material('#907251', .75, '#14212c');
  private readonly blue = this.material('#294a58', .83, '#142333');
  private readonly cloth = this.material('#84714f', .98, '#111823');
  private readonly clothes = [this.material('#506d79', .98, '#23343d'), this.material('#695548', .97, '#191e26'), this.material('#52666c', .98, '#101b25')];
  private readonly lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.15, .69, .29), toneMapped: false });
  private readonly hullGeometry = this.makeHull();
  private readonly box = this.geometry(new THREE.BoxGeometry(1, 1, 1));
  private readonly sphere = this.geometry(new THREE.SphereGeometry(1, 8, 6));
  private readonly cylinder = this.geometry(new THREE.CylinderGeometry(1, 1, 1, 8));
  constructor() { this.materials.add(this.lamp); }
  private material(color: string, roughness: number, emissive: string) {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, emissive, emissiveIntensity: .38, envMapIntensity: .30 });
    this.materials.add(material); return material;
  }
  private geometry<T extends THREE.BufferGeometry>(geometry: T): T { this.geometries.add(geometry); return geometry; }
  private part(parent: THREE.Object3D, name: string, geometry: THREE.BufferGeometry, material: THREE.Material, scale: [number, number, number], position: [number, number, number]) {
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name; mesh.scale.set(...scale); mesh.position.set(...position); mesh.layers.disable(3); parent.add(mesh); return mesh;
  }
  private makeHull() {
    // Three nested open rings: no solid box covering the passengers or interior.
    const positions: number[] = [], indices: number[] = [];
    const segments = 24;
    for (let ring = 0; ring < 3; ring++) for (let i = 0; i < segments; i++) {
      const angle = i / segments * Math.PI * 2;
      const long = ring === 1 ? 2.48 : ring === 2 ? 2.89 : 3;
      const beam = ring === 1 ? .49 : ring === 2 ? .81 : .92;
      positions.push(Math.cos(angle) * long, ring === 1 ? -.45 : ring === 2 ? .17 : .22, Math.sin(angle) * beam * (.70 + Math.abs(Math.sin(angle)) * .30));
    }
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      indices.push(i, next, i + segments, next, next + segments, i + segments,
        i, i + segments * 2, next, next, i + segments * 2, next + segments * 2);
    }
    for (let i = 1; i < segments - 1; i++) indices.push(segments, segments + i, segments + i + 1);
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    return this.geometry(geometry);
  }
  build(index: number): SeaBoatModel {
    const config = SEA_FLEET[index], root = new THREE.Group(), hull = new THREE.Group();
    root.name = config.name; hull.name = 'Hull at true waterline'; root.add(hull);
    const paint = index === 5 ? this.material('#b4b6a0', .84, '#121d25') : index === 7 ? this.material('#865543', .92, '#121d25') : index === 8 ? this.blue : index === 9 ? this.rim : index === 3 ? this.blue : this.timber;
    const profile = new THREE.Group(); profile.name = 'Optional original Blender hull profile'; hull.add(profile);
    if (index === 9) {
      for (const side of [-1, 1]) this.part(profile, 'Original catamaran separate timber hull', this.hullGeometry, this.timber, [1, .75, .33], [0, -.05, side * .60]);
      this.part(hull, 'Twin hull connecting deck', this.box, paint, [3.9, .10, 1.65], [-.3, .16, 0]);
    } else {
      let geometry = this.hullGeometry;
      if (index === 2 || index >= 5) {
        geometry = this.geometry(this.hullGeometry.clone()); const vertices = geometry.getAttribute('position');
        for (let v = 0; v < vertices.count; v++) {
          let x = vertices.getX(v), y = vertices.getY(v), z = vertices.getZ(v);
          if (index === 5 || index === 8) x = Math.max(index === 5 ? -2.65 : -2.50, x);
          if (index === 2 || index === 5) z *= 1 + .09 * x / 3;
          if (index === 6) { z *= 1.05; if (y < 0) y *= .78; }
          if (index === 7) z *= .95 - .05 * Math.abs(x) / 3;
          vertices.setXYZ(v, x, y, z);
        }
        geometry.computeVertexNormals();
      }
      this.part(profile, 'Original open planked hull', geometry, paint, [1, 1, 1], [0, 0, 0]);
    }
    for (let i = 0; i < 5; i++) this.part(hull, `Timber seat ${i}`, this.box, this.rim, [.12, .10, 1.45 - Math.abs(i - 2) * .12], [(i - 2) * .83, .16, 0]);
    this.part(hull, 'Interior foot-contact grating', this.box, this.rim, [4.3, .03, 1.3], [-.15, -.0225, 0]);
    for (const side of [-1, 1]) {
      for (let plank = 0; plank < 3; plank++) this.part(hull, 'Fine longitudinal plank seam', this.box, this.rim, [4.3, .018, .020], [0, -.10 - plank * .10, side * (.77 - plank * .075)]);
    }
    const people: THREE.Group[] = [], heads: THREE.Group[] = [], rowingArms: THREE.Group[] = [], oars: THREE.Group[] = [], lamps: THREE.Object3D[] = [];
    for (let i = 0; i < config.people; i++) {
      const spec = PASSENGERS_BY_BOAT[index][i];
      this.part(hull, `Named seating contact ${spec.id}`, this.box, this.rim, [.42, .10, .40], [spec.x, .16, spec.z]);
      const person = new THREE.Group(); person.name = `Anonymous seated passenger ${i + 1}`;
      person.position.set(spec.x, .22, spec.z);
      root.add(person); people.push(person);
      const head = new THREE.Group(); head.name = 'Anonymous head turn pivot'; head.position.set(.015, .92, 0); person.add(head); heads.push(head);
    }
    let canopy: THREE.Object3D | undefined;
    if (index === 1) {
      const geometry = this.geometry(new THREE.CylinderGeometry(.98, .98, 3.5, 16, 1, true, 0, Math.PI));
      const material = this.cloth.clone(); material.side = THREE.DoubleSide; this.materials.add(material);
      canopy = this.part(root, 'Original woven curved shelter', geometry, material, [1, 1, 1], [-.15, .82, 0]); canopy.rotation.z = Math.PI / 2;
      // Fine longitudinal weave and curved ribs remain original authored geometry.
      const ribGeometry = this.geometry(new THREE.TorusGeometry(.985, .016, 4, 16, Math.PI));
      for (const x of [-1.6, -.8, 0, .8, 1.6]) {
        const rib = this.part(root, 'Bent canopy rib', ribGeometry, this.rim, [1, 1, 1], [x - .15, .82, 0]);
        rib.rotation.y = Math.PI / 2; rib.rotation.z = Math.PI / 2;
      }
      for (const x of [-1.6, -.6, .6, 1.6]) for (const z of [-.85, .85]) this.part(root, 'Canopy timber upright', this.cylinder, this.rim, [.035, 1.05, .035], [x, .59, z]);
    }
    if (index === 3) {
      for (const side of [-1, 1]) this.part(root, 'Cabin side below open window', this.box, this.blue, [2, .62, .08], [-.45, .55, side * .64]);
      for (const x of [-1.38, .47]) for (const z of [-.64, .64]) this.part(root, 'Window frame', this.box, this.rim, [.08, .65, .08], [x, 1.13, z]);
      canopy = this.part(root, 'Cabin timber roof', this.box, this.blue, [2.15, .14, 1.54], [-.45, 1.48, 0]);
    }
    if (index === 2 || index === 8) {
      const net = this.part(root, 'Folded fishing net', this.sphere, this.clothes[0], [.52, .12, .37], [1.25, .30, -.12]); net.rotation.y = .2;
      const rope = this.geometry(new THREE.TorusGeometry(.25, .025, 5, 16));
      this.part(root, 'Coiled rope', rope, this.rim, [1, 1, 1], [.90, .30, .46]).rotation.x = Math.PI / 2;
    }
    if (index === 0 || index === 7) for (const side of [-1, 1]) {
      const oar = new THREE.Group(); oar.name = 'Oar pivot at rowlock'; oar.position.set(index === 7 ? -1.50 : -1.40, .52, side * (index === 7 ? .70 : .78)); root.add(oar); oars.push(oar);
      this.part(oar, 'Timber oar shaft', this.box, this.rim, [.065, .065, 2.30], [0, 0, side * .80]);
      this.part(oar, 'Oar blade', this.box, this.timber, [.24, .06, .48], [0, 0, side * 1.85]);
    }
    if (index === 5 || index === 6 || index === 8 || index === 9) {
      this.part(root, 'Operator tiller and fixed hand contact', this.box, this.rim, [.38, .065, .36], [-1.40, .49, 0]);
      this.part(root, 'Compact outboard motor housing', this.box, this.blue, [.33, .45, .48], [-2.55, .2, 0]);
      this.part(root, 'Outboard shaft meeting the water', this.box, this.rim, [.06, .5, .06], [-2.6, -.15, 0]);
    }
    if (index === 5) {
      const teal = this.material('#315e64', .86, '#101923');
      for (const side of [-1, 1]) this.part(root, 'Faded teal gunwale', this.box, teal, [4.6, .07, .065], [0, .26, side * .78]);
      this.part(root, 'Small open launch helm', this.box, paint, [.34, .55, .45], [-1.25, .45, 0]);
    }
    if (index === 6) {
      const shelters = new THREE.Group(); shelters.name = 'Two short woven shelters with open family space';
      for (const x of [-1.9, 1.9]) {
        const cover = this.part(shelters, 'Short curved woven shelter', this.geometry(new THREE.CylinderGeometry(.93, .93, 1.10, 12, 1, true, 0, Math.PI)), this.cloth, [1, 1, 1], [x, .95, 0]);
        cover.rotation.z = Math.PI / 2;
        for (const side of [-1, 1]) this.part(shelters, 'Canopy post', this.cylinder, this.rim, [.035, 1.28, .035], [x, .72, side * .85]);
      }
      root.add(shelters); canopy = shelters;
    }
    if (index === 7) {
      this.part(root, 'Folded terracotta awning', this.box, this.cloth, [.80, .10, 1.30], [1.6, .3, 0]);
      this.part(root, 'Picnic blanket on bow seat', this.box, this.blue, [.45, .06, .65], [1.8, .2, .15]);
    }
    if (index === 8) for (const x of [.95, 1.7]) this.part(root, 'Wicker work basket', this.cylinder, this.cloth, [.22, .28, .22], [x, .32, -.3]);
    for (let i = 0; i < config.lamps; i++) {
      const anchor = new THREE.Group(); anchor.name = `Warm sheltered practical lamp ${i + 1}`;
      anchor.position.set(config.lamps === 2 ? -1.9 + i * 3.7 : index === 3 ? -.40 : 2.2, index === 1 || index === 6 ? .90 : index === 3 ? .90 : .53, index === 3 ? .47 : .28);
      root.add(anchor); lamps.push(anchor);
      for (const y of [-.14, .14]) this.part(anchor, 'Lantern weather cover', this.box, this.timber, [.19, .03, .19], [0, y, 0]);
      for (const x of [-.085, .085]) for (const z of [-.085, .085]) this.part(anchor, 'Lantern corner frame', this.box, this.rim, [.018, .27, .018], [x, 0, z]);
      this.part(anchor, 'Warm protected glass', this.sphere, this.lamp, [.073, .11, .076], [0, 0, 0]);
    }
    // Batch rigid details by shared material; passenger/oar pivots remain independent.
    for (const group of [hull, ...people, ...oars, ...lamps]) this.batch(group);
    this.batch(root, canopy);
    for (const anchor of lamps) anchor.traverse(object => {
      if (object instanceof THREE.Mesh && object.material === this.lamp) object.layers.enable(3);
    });
    return { root, hull, people, heads, rowingArms, oars, lamps, canopy };
  }
  private batch(root: THREE.Object3D, preserve?: THREE.Object3D) {
    const batches = new Map<THREE.Material, THREE.Mesh[]>();
    for (const child of root.children) {
      if (!(child instanceof THREE.Mesh) || child === preserve || Array.isArray(child.material)) continue;
      const list = batches.get(child.material) ?? []; list.push(child); batches.set(child.material, list);
    }
    for (const [material, meshes] of batches) {
      if (meshes.length < 2) continue;
      const copies = meshes.map(mesh => { mesh.updateMatrix(); const copy = mesh.geometry.clone(); copy.applyMatrix4(mesh.matrix); return copy; });
      const merged = mergeGeometries(copies);
      for (const copy of copies) copy.dispose();
      if (!merged) continue;
      this.geometries.add(merged); const batch = new THREE.Mesh(merged, material); batch.name = 'Batched rigid timber or passenger details'; batch.layers.disable(3);
      for (const mesh of meshes) root.remove(mesh); root.add(batch);
    }
  }
  /** Geometry/material references belong to the existing asset owner; do not dispose them here. */
  adoptOriginalHulls(source: THREE.Group, models: SeaBoatModel[]) {
    let adopted = 0;
    for (let index = 5; index < 10; index++) {
      const root = source.children.find(child => child.name.startsWith(`Sea_${index}_`)); if (!root) continue;
      const profile = models[index].hull.getObjectByName('Optional original Blender hull profile'); if (!profile) continue;
      const meshes: THREE.Mesh[] = []; root.traverse(object => { if (object instanceof THREE.Mesh) meshes.push(object); });
      if (!meshes.length) continue;
      profile.clear(); for (const mesh of meshes) { const copy = mesh.clone(); copy.name = `Blender v002 ${mesh.name}`; copy.layers.disable(3); profile.add(copy); }
      adopted++;
    }
    return adopted;
  }
  /** Geometry/material references belong to the existing asset owner; do not dispose them here. */
  adoptCanoe(source: THREE.Group, models: SeaBoatModel[]) {
    const original = source.getObjectByName('Boat_A'); if (!original) return false;
    let donor: THREE.Object3D | undefined;
    original.traverse(object => {
      if (object instanceof THREE.Mesh && !Array.isArray(object.material) && /baked weathered wood/i.test(object.material.name)) donor = object;
    });
    if (!donor) return false;
    const originalGeometry = (donor as THREE.Mesh).geometry;
    const count = originalGeometry.getAttribute('position').count;
    const low = count > 1000 ? new SimplifyModifier().modify(originalGeometry, Math.floor(count * .60)) : originalGeometry;
    if (low !== originalGeometry) this.geometries.add(low);
    for (const index of [0, 1, 4]) {
      const copy = donor.clone(true), box = new THREE.Box3().setFromObject(copy), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
      copy.traverse(object => {
        if (object instanceof THREE.Mesh && !Array.isArray(object.material)) {
          const material = object.material.clone() as THREE.MeshStandardMaterial;
          material.emissive.set('#2b2118'); material.emissiveIntensity = .28; material.envMapIntensity = .40;
          this.materials.add(material); object.material = material;
          this.levels.push({ boat: index, mesh: object, original: object.geometry, low }); object.geometry = low;
        }
      });
      const holder = new THREE.Group(); holder.name = 'Licensed OuterSpaceSimon CC0 canoe';
      holder.add(copy); copy.position.sub(center); holder.scale.set(6 / Math.max(.01, size.x), .72 / Math.max(.01, size.y), 1.82 / Math.max(.01, size.z));
      holder.position.y = -.12;
      models[index].hull.traverse(object => { if (object instanceof THREE.Mesh && object.material === this.timber) object.visible = false; });
      holder.traverse(object => { if (object instanceof THREE.Mesh) object.layers.disable(3); });
      models[index].hull.add(holder);
    }
    // Retain the original authored reed cover, including its sag, UVs and maps.
    let cover: THREE.Mesh | undefined;
    source.getObjectByName('Boat_C')?.traverse(object => {
      if (object instanceof THREE.Mesh && !Array.isArray(object.material) && /v008 finely woven/i.test(object.material.name)) cover = object;
    });
    if (cover) {
      const copy = cover.clone(), box = new THREE.Box3().setFromObject(copy), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
      const holder = new THREE.Group(); holder.name = 'Preserved original v008 woven cover and UVs';
      copy.position.sub(center); copy.layers.disable(3); holder.add(copy);
      holder.scale.set(3.5 / size.x, .98 / size.y, 1.96 / size.z); holder.position.set(-.15, 1.31, 0);
      if (models[1].canopy) models[1].root.remove(models[1].canopy);
      models[1].root.add(holder); models[1].canopy = holder;
    }
    return true;
  }
  dispose() { for (const geometry of this.geometries) geometry.dispose(); for (const material of this.materials) material.dispose(); }
}
