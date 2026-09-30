import * as THREE from 'three/webgpu';
import type { Simulation } from '../engine/Simulation';
import { randomStream } from '../engine/catalog';

const WATER_Y = 4.65;
type BoatPlacement = { object: THREE.Object3D; x: number; z: number; scale: number; yaw: number; phase: number; foreground?: boolean };

/** Two quiet fishing boats, a foreground nauka and a sparse distant village. */
export class RiverLife {
  readonly group = new THREE.Group();
  private readonly fallback = new THREE.Group();
  private village: THREE.Object3D;
  private boats: BoatPlacement[] = [];
  private lamps: THREE.Object3D[] = [];
  private candles: THREE.Object3D[] = [];
  private readonly flames: THREE.InstancedMesh;
  private readonly candleGlows: THREE.Sprite[];
  private readonly glowMaterial: THREE.SpriteMaterial;
  private readonly candleLight = new THREE.PointLight('#ffbe76', 0, 31, 2);
  private readonly fragments: THREE.InstancedMesh;
  private readonly reflectionTexture: THREE.CanvasTexture;
  private readonly matrix = new THREE.Matrix4();
  private readonly surfaceRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  private readonly point = new THREE.Vector3();
  private readonly candleCenter = new THREE.Vector3();
  private readonly size = new THREE.Vector3();
  private readonly color = new THREE.Color();
  private readonly reflectionColor = new THREE.Color(.28, .135, .042);
  private readonly reducedMotion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  private phone = false;
  private authored = false;
  private authoredTextureCount = 0;
  private authoredTextureMemoryEstimateBytes = 0;
  private authoredColorMapCount = 0;
  private authoredDataMapCount = 0;
  private authoredColorSpacesCorrect = true;
  private lastTime = 0;
  private readonly fallbackGeometries = new Set<THREE.BufferGeometry>();
  private readonly fallbackMaterials = new Set<THREE.Material>();

  constructor() {
    this.group.name = 'Quiet river boats, distant homes and practical reflections';
    this.fallback.name = 'Independent procedural river fallback';
    this.group.add(this.fallback);
    const hull = new THREE.MeshStandardMaterial({ color: '#10202c', roughness: .84, metalness: .05, envMapIntensity: .18 });
    const wood = new THREE.MeshStandardMaterial({ color: '#382e24', roughness: .88, envMapIntensity: .12 });
    const roof = new THREE.MeshStandardMaterial({ color: '#192532', roughness: .92, envMapIntensity: .12 });
    const lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(.38, .20, .075), toneMapped: false });
    this.fallbackMaterials.add(hull); this.fallbackMaterials.add(wood); this.fallbackMaterials.add(roof); this.fallbackMaterials.add(lamp);
    const hullGeometry = this.makeHull(), cabinGeometry = new THREE.BoxGeometry(1.55, .66, 1.08);
    const roofGeometry = new THREE.BoxGeometry(1.9, .10, 1.30), bulbGeometry = new THREE.SphereGeometry(.085, 6, 4);
    for (const geometry of [hullGeometry, cabinGeometry, roofGeometry, bulbGeometry]) this.fallbackGeometries.add(geometry);
    for (let i = 0; i < 2; i++) {
      const boat = new THREE.Group(); boat.name = `Fallback fishing boat ${i + 1}`;
      const body = new THREE.Mesh(hullGeometry, hull);
      const cabin = new THREE.Mesh(cabinGeometry, wood); cabin.position.set(-.3, .46, 0);
      const canopy = new THREE.Mesh(roofGeometry, roof); canopy.position.set(-.3, .86, 0); canopy.rotation.z = i ? -.06 : .04;
      const bulb = new THREE.Mesh(bulbGeometry, lamp); bulb.position.set(.60, .82, .52);
      boat.add(body, cabin, canopy, bulb); this.fallback.add(boat); this.lamps.push(bulb);
      this.boats.push({ object: boat, x: i ? 62 : -48, z: i ? -165 : -105, scale: i ? 3.2 : 3.8, yaw: i ? -.26 : .18, phase: i * 2.3 });
    }
    const nauka = new THREE.Group(); nauka.name = 'Fallback wooden nauka with four candle lanterns';
    const naukaHull = new THREE.Mesh(hullGeometry, hull); naukaHull.scale.set(1.72, 1, 1.65);
    const cloth = new THREE.MeshStandardMaterial({ color: '#292621', roughness: .94, side: THREE.DoubleSide, envMapIntensity: .12 });
    const canopyGeometry = new THREE.CylinderGeometry(1.4, 1.4, 4.2, 12, 1, true, 0, Math.PI);
    this.fallbackGeometries.add(canopyGeometry); this.fallbackMaterials.add(cloth);
    const archedCanopy = new THREE.Mesh(canopyGeometry, cloth); archedCanopy.rotation.z = Math.PI / 2; archedCanopy.position.y = .48;
    nauka.add(naukaHull, archedCanopy);
    for (let i = 0; i < 4; i++) {
      const anchor = new THREE.Object3D(); anchor.name = `Fallback nauka candle ${i + 1}`;
      anchor.position.set(i < 2 ? -3.1 : 3.1, 1.0, (i % 2 ? 1 : -1) * (i < 2 ? 1.04 : .76));
      nauka.add(anchor); this.candles.push(anchor); this.lamps.push(anchor);
    }
    this.fallback.add(nauka);
    this.boats.push({ object: nauka, x: -85, z: -65, scale: 5.5, yaw: .10, phase: 4.6, foreground: true });
    this.village = this.makeVillage(lamp);
    this.fallback.add(this.village);
    this.reflectionTexture = this.makeReflectionTexture();
    const reflectionMaterial = new THREE.MeshBasicMaterial({ map: this.reflectionTexture, color: 0xffffff,
      transparent: true, opacity: .48, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    this.fragments = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), reflectionMaterial, 80);
    this.fragments.name = 'Bounded reflections from actual boat and home lamps';
    this.fragments.count = 0; this.fragments.frustumCulled = false;
    this.group.add(this.fragments);
    this.flames = new THREE.InstancedMesh(new THREE.ConeGeometry(.08, .28, 5),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(.82, .35, .065), toneMapped: false }), 4);
    this.flames.name = 'Four small steady nauka candle flames'; this.flames.frustumCulled = false;
    this.candleLight.name = 'Single bounded warm nauka light'; this.candleLight.castShadow = false;
    this.group.add(this.flames, this.candleLight);
    this.glowMaterial = new THREE.SpriteMaterial({ map: this.reflectionTexture, color: new THREE.Color(.62, .28, .070),
      transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.candleGlows = Array.from({ length: 4 }, (_, i) => {
      const sprite = new THREE.Sprite(this.glowMaterial); sprite.name = `Soft nauka lantern glow ${i + 1}`;
      sprite.scale.set(1.8, 1.8, 1); this.group.add(sprite); return sprite;
    });
    this.resize(false);
  }

  setAuthored(source: THREE.Group) {
    const boatA = source.getObjectByName('Boat_A'), boatB = source.getObjectByName('Boat_B');
    const boatC = source.getObjectByName('Boat_C'), village = source.getObjectByName('Shore_Village');
    if (!boatA || !boatB || !boatC || !village) throw new Error('River scenery was missing its named boat or village roots.');
    const lampA = source.getObjectByName('Boat_A_Lamp'), lampB = source.getObjectByName('Boat_B_Lamp');
    const windows = [1, 2, 3, 4].map(i => source.getObjectByName(`Shore_Village_Warm_Lamp_${String(i).padStart(2, '0')}`));
    const candles = [1, 2, 3, 4].map(i => source.getObjectByName(`Boat_C_Candle_${String(i).padStart(2, '0')}`));
    if (!lampA || !lampB || windows.some(window => !window) || candles.some(candle => !candle)) throw new Error('River scenery was missing its practical light anchors.');
    // Preserve the licensed canoe's PBR maps and base color. Its grain and wear
    // need actual lighting, rather than the old flat timber color multiplier.
    const materials = new Set<THREE.MeshStandardMaterial>();
    const textures = new Set<THREE.Texture>();
    const colorMaps = new Set<THREE.Texture>(), dataMaps = new Set<THREE.Texture>();
    source.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;
        materials.add(material);
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
        for (const value of [material.map, material.emissiveMap]) if (value) colorMaps.add(value);
        for (const value of [material.normalMap, material.roughnessMap, material.metalnessMap, material.aoMap]) if (value) dataMaps.add(value);
      }
    });
    for (const material of materials) {
      material.envMapIntensity = material.map ? .25 : .12;
      if (!material.map && /timber|rope|fittings/.test(material.name)) material.color.multiplyScalar(.57);
      if (material.name === 'RiverLife | restrained amber emission') {
          // Solid architecture retains distance fog, while tiny steady practical
          // lights remain visible enough to explain their water reflections.
          material.fog = false;
          this.reflectionColor.copy(material.emissive).multiplyScalar(material.emissiveIntensity * .58);
      }
    }
    this.authoredTextureCount = textures.size;
    this.authoredColorMapCount = colorMaps.size; this.authoredDataMapCount = dataMaps.size;
    this.authoredColorSpacesCorrect = [...colorMaps].every(map => map.colorSpace === THREE.SRGBColorSpace) &&
      [...dataMaps].every(map => map.colorSpace === THREE.NoColorSpace);
    this.authoredTextureMemoryEstimateBytes = 0;
    for (const texture of textures) {
      const image = texture.image;
      // Decoded RGBA8 plus the full mip chain, shared maps counted only once.
      // This is a storage estimate, not measured browser/GPU allocation.
      if (image?.width && image?.height) this.authoredTextureMemoryEstimateBytes += Math.ceil(image.width * image.height * 4 * (texture.generateMipmaps ? 4 / 3 : 1));
    }
    this.fallback.visible = false;
    this.group.add(source); this.village = village; this.authored = true;
    this.boats = [{ object: boatA, x: -48, z: -105, scale: 3.8, yaw: .18, phase: 0 },
      { object: boatB, x: 62, z: -165, scale: 3.2, yaw: -.26, phase: 2.3 },
      { object: boatC, x: -85, z: -65, scale: 5.5, yaw: .10, phase: 4.6, foreground: true }];
    this.candles = candles as THREE.Object3D[];
    this.lamps = [lampA, lampB, ...this.candles, ...windows as THREE.Object3D[]];
    this.resize(this.phone);
  }

  resize(phone: boolean) {
    this.phone = phone;
    for (const boat of this.boats) {
      boat.object.position.set(phone ? boat.foreground ? -36 : boat.x * .62 : boat.x, WATER_Y, boat.z);
      boat.object.scale.setScalar(phone && boat.foreground ? 3.5 : boat.scale);
      boat.object.rotation.set(0, boat.yaw, 0);
    }
    // The phone water plane ends at z=-180; desktop ends at z=-1000.
    // Homes belong to that far bank, with a different scale rather than a
    // foreground row of boxes. Their local terrain and roof variation remains.
    this.village.position.set(phone ? 0 : 96, WATER_Y, phone ? -178 : -970);
    this.village.scale.setScalar(phone ? 1.4 : 3.1);
    this.village.rotation.y = -.025;
    this.group.updateMatrixWorld(true);
  }

  update(sim: Simulation, visible: boolean, motionAllowed = true) {
    this.group.visible = visible;
    const moving = motionAllowed && !this.reducedMotion?.matches && sim.quality !== 'low';
    const time = moving ? sim.time : 0; this.lastTime = time;
    for (const boat of this.boats) {
      boat.object.position.y = WATER_Y + Math.sin(time * .62 * sim.wind + boat.phase) * .065;
      boat.object.rotation.x = Math.sin(time * .47 * sim.wind + boat.phase) * .012;
    }
    if (!visible) { this.fragments.count = 0; this.flames.count = 0; this.candleLight.intensity = 0; return; }
    this.group.updateMatrixWorld(true);
    this.candleCenter.set(0, 0, 0);
    for (let i = 0; i < this.candles.length; i++) {
      this.candles[i].getWorldPosition(this.point); this.candleCenter.add(this.point);
      const flicker = moving && !sim.reducedFlashes ? 1 + Math.sin(time * 2.1 + i * 1.7) * .027 : 1;
      this.size.set(2.8, 2.8 * flicker, 2.8); this.point.y += .16;
      this.matrix.makeScale(this.size.x, this.size.y, this.size.z); this.matrix.setPosition(this.point);
      this.flames.setMatrixAt(i, this.matrix);
      this.candleGlows[i].position.copy(this.point);
    }
    this.flames.count = this.candles.length; this.flames.instanceMatrix.needsUpdate = true;
    if (this.candles.length) this.candleCenter.multiplyScalar(1 / this.candles.length);
    this.candleLight.position.copy(this.candleCenter);
    this.candleLight.intensity = (sim.reducedFlashes ? 12 : 16) * (moving && !sim.reducedFlashes ? 1 + Math.sin(time * 2.1) * .025 : 1);
    const segments = sim.quality === 'low' ? 4 : 8;
    let count = 0;
    for (let i = 0; i < this.lamps.length; i++) {
      this.lamps[i].getWorldPosition(this.point);
      const x = this.point.x, z = this.point.z;
      for (let j = 0; j < segments && count < 80; j++) {
        const distance = j * (i < 6 ? 1.65 : 3.4);
        const ripple = Math.sin(z * .15 + j * 1.37 + time * .65 * sim.wind);
        this.size.set((i < 6 ? 1.1 : 2.5) * (1 + j * .16) * (.66 + .34 * ripple), .28 + j * .045, 1);
        this.point.set(x + Math.sin(j * 1.6 + time * .42 * sim.wind) * (.24 + j * .04), WATER_Y + .025, z + .65 + distance);
        this.matrix.compose(this.point, this.surfaceRotation, this.size); this.fragments.setMatrixAt(count, this.matrix);
        const energy = (1 - j / segments) ** 1.45 * (sim.reducedFlashes ? .72 : 1);
        this.color.copy(this.reflectionColor).multiplyScalar(energy); this.fragments.setColorAt(count++, this.color);
      }
    }
    this.fragments.count = count; this.fragments.instanceMatrix.needsUpdate = true;
    if (this.fragments.instanceColor) this.fragments.instanceColor.needsUpdate = true;
  }

  diagnostics() {
    return { riverScenery: this.authored ? 'Blender river-life-v007' : 'procedural river fallback', riverBoats: this.boats.length,
      riverBoatSource: this.authored ? 'Wooden Canoe by OuterSpaceSimon, BlenderKit, CC0' : 'original procedural boats',
      riverPbrTextures: this.authoredTextureCount, riverTextureMemoryEstimateBytes: this.authoredTextureMemoryEstimateBytes,
      riverPbrColorMaps: this.authoredColorMapCount, riverPbrDataMaps: this.authoredDataMapCount,
      riverPbrColorSpacesCorrect: this.authoredColorSpacesCorrect,
      riverLampAnchors: this.lamps.length, riverReflectionFragments: this.fragments.count, riverMotionTime: this.lastTime,
      riverCandleFlames: this.flames.count, riverPointLights: 1,
      riverCandleGlows: this.candleGlows.length,
      riverPositions: this.boats.map(boat => ({ x: boat.object.position.x, y: boat.object.position.y, z: boat.object.position.z })) };
  }

  private makeHull() {
    const ring: [number, number][] = [[-2.75, 0], [-2.03, -.82], [1.85, -.82], [2.75, 0], [1.85, .82], [-2.03, .82]];
    const positions: number[] = [], indices: number[] = [];
    for (const [x, z] of ring) positions.push(x, .14, z);
    for (const [x, z] of ring) positions.push(x * .78, -.42, z * .50);
    for (let i = 0; i < 6; i++) { const next = (i + 1) % 6; indices.push(i, next, i + 6, next, next + 6, i + 6); }
    for (let i = 1; i < 5; i++) indices.push(0, i + 1, i, 6, i + 6, i + 7);
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
  }

  private makeVillage(lamp: THREE.Material) {
    const group = new THREE.Group(); group.name = 'Fallback clustered far-bank homes';
    const rand = randomStream(6302026), centers = [-37, -31, -25, -12, -7, 1, 18, 24, 35];
    const wall = new THREE.MeshStandardMaterial({ color: '#17212b', roughness: .94, envMapIntensity: .10 });
    const roof = new THREE.MeshStandardMaterial({ color: '#202027', roughness: .96, envMapIntensity: .10 });
    this.fallbackMaterials.add(wall); this.fallbackMaterials.add(roof);
    const bodyGeometry = new THREE.BoxGeometry(1, 1, 1), roofGeometry = new THREE.ConeGeometry(.80, .70, 4);
    const windowGeometry = new THREE.PlaneGeometry(.32, .40);
    for (const geometry of [bodyGeometry, roofGeometry, windowGeometry]) this.fallbackGeometries.add(geometry);
    const bodies = new THREE.InstancedMesh(bodyGeometry, wall, centers.length), roofs = new THREE.InstancedMesh(roofGeometry, roof, centers.length);
    const matrix = new THREE.Matrix4(), tint = new THREE.Color();
    for (let i = 0; i < centers.length; i++) {
      const height = 1.7 + rand() * 2.3, width = 2.1 + rand() * 2.0, depth = 2.2 + rand() * 2.3, z = (rand() - .5) * 5;
      matrix.makeScale(width, height, depth); matrix.setPosition(centers[i], height / 2, z); bodies.setMatrixAt(i, matrix);
      tint.setRGB(.58 + rand() * .24, .62 + rand() * .23, .68 + rand() * .22); bodies.setColorAt(i, tint);
      matrix.makeRotationY(Math.PI / 4); matrix.scale(new THREE.Vector3(width * .90, 1.35, depth * .90)); matrix.setPosition(centers[i], height + .42, z);
      roofs.setMatrixAt(i, matrix);
      if ([0, 3, 5, 7].includes(i)) {
        const window = new THREE.Mesh(windowGeometry, lamp); window.position.set(centers[i] - width * .14, height * .53, z + depth / 2 + .015);
        group.add(window); this.lamps.push(window);
      }
    }
    group.add(bodies, roofs); return group;
  }

  private makeReflectionTexture() {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
    const c = canvas.getContext('2d')!, gradient = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(.4, '#ffffff88'); gradient.addColorStop(1, '#ffffff00');
    c.fillStyle = gradient; c.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }

  dispose() {
    for (const geometry of this.fallbackGeometries) geometry.dispose();
    for (const material of this.fallbackMaterials) material.dispose();
    this.reflectionTexture.dispose(); this.fragments.geometry.dispose(); (this.fragments.material as THREE.Material).dispose();
    this.flames.geometry.dispose(); (this.flames.material as THREE.Material).dispose(); this.candleLight.dispose();
    this.glowMaterial.dispose();
  }
}
