import { sampleWater, updateWaterFrame, WATER_Y, WATER_NEAR_Z } from './WaterWaves';
import type { WaterFrame } from './WaterWaves';
import * as THREE from 'three/webgpu';
import type { Simulation } from '../engine/Simulation';
import { randomStream } from '../engine/catalog';

type BoatPlacement = { object: THREE.Object3D; x: number; z: number; scale: number; yaw: number; phase: number; foreground?: boolean;
  sampledHeight?: number; sampledPitch?: number; sampledRoll?: number; contactError?: number };

/** Two quiet fishing boats, a foreground nauka and a sparse distant village. */
export class RiverLife {
  readonly group = new THREE.Group();
  private readonly fallback = new THREE.Group();
  private readonly reflectionProxies = new THREE.Group();
  private readonly reflectionHulls: THREE.InstancedMesh;
  private readonly reflectionShelters: THREE.InstancedMesh;
  private readonly reflectionHomes: THREE.InstancedMesh;
  private readonly reflectionLamps: THREE.InstancedMesh;
  private readonly reflectionProxyMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, toneMapped: false });
  private readonly reflectionProxyGeometries = new Set<THREE.BufferGeometry>();
  private readonly reflectionLocalMatrix = new THREE.Matrix4();
  private readonly reflectionWorldMatrix = new THREE.Matrix4();
  private readonly reflectionHomeMatrices = Array.from({ length: 12 }, () => new THREE.Matrix4());
  private reflectionHomeSource?: THREE.Object3D;
  private fallbackVillageBodies?: THREE.InstancedMesh;
  private village: THREE.Object3D;
  private readonly villageBounds = new THREE.Box3();
  private boats: BoatPlacement[] = [];
  private lamps: THREE.Object3D[] = [];
  private candles: THREE.Object3D[] = [];
  private readonly flames: THREE.InstancedMesh;
  private readonly candleGlows: THREE.Sprite[];
  private readonly glowMaterial: THREE.SpriteMaterial;
  private readonly candleLight = new THREE.PointLight('#ffbe76', 0, 31, 2);
  private readonly fragments: THREE.InstancedMesh;
  private readonly waterContact: THREE.InstancedMesh;
  private readonly reflectionTexture: THREE.CanvasTexture;
  private readonly matrix = new THREE.Matrix4();
  private readonly surfaceRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  private readonly footprintRotation = new THREE.Quaternion();
  private readonly waveRotation = new THREE.Quaternion();
  private readonly surfaceNormal = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly yawRotation = new THREE.Quaternion();
  private readonly planeAxis = new THREE.Vector3(0, 0, 1);
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
  private readonly ownWaterFrame: WaterFrame = { phase: 0, waveCount: 4, farZ: -1000, nearZ: WATER_NEAR_Z, motionAllowed: true };
  private lastWaterFrame = this.ownWaterFrame;
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
      this.boats.push({ object: boat, x: i ? 62 : -48, z: i ? -165 : -115, scale: i ? 3.2 : 3.5, yaw: i ? -.26 : .18, phase: i * 2.3 });
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
    this.boats.push({ object: nauka, x: -76, z: -85, scale: 4.1, yaw: .16, phase: 4.6, foreground: true });
    this.village = this.makeVillage(lamp);
    this.fallback.add(this.village);
    this.disableReflectionMeshes(this.fallback);
    // The blurred, sub-512px planar target needs coherent silhouettes, not a
    // second PBR draw of twenty thousand authored vertices and six material maps.
    // These four instanced draws are reflection-only and share one basic variant.
    this.reflectionProxies.name = 'Bounded reflection-only boat, home and lamp silhouettes';
    this.reflectionProxies.layers.set(3);
    const proxyShelterGeometry = this.makeReflectionShelter();
    const proxyHomeGeometry = this.makeReflectionHome();
    const proxyLampGeometry = new THREE.SphereGeometry(1, 5, 3);
    for (const geometry of [proxyShelterGeometry, proxyHomeGeometry, proxyLampGeometry]) this.reflectionProxyGeometries.add(geometry);
    this.reflectionHulls = new THREE.InstancedMesh(hullGeometry, this.reflectionProxyMaterial, 3);
    this.reflectionShelters = new THREE.InstancedMesh(proxyShelterGeometry, this.reflectionProxyMaterial, 3);
    this.reflectionHomes = new THREE.InstancedMesh(proxyHomeGeometry, this.reflectionProxyMaterial, 12);
    this.reflectionLamps = new THREE.InstancedMesh(proxyLampGeometry, this.reflectionProxyMaterial, 10);
    for (const mesh of [this.reflectionHulls, this.reflectionShelters, this.reflectionHomes, this.reflectionLamps]) {
      mesh.layers.set(3); mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.reflectionProxies.add(mesh);
      for (let i = 0; i < mesh.count; i++) {
        const lampProxy = mesh === this.reflectionLamps;
        const boatProxy = mesh === this.reflectionHulls || mesh === this.reflectionShelters;
        this.color.setRGB(lampProxy ? .26 : boatProxy ? .025 : .016,
          lampProxy ? .13 : boatProxy ? .019 : .022, lampProxy ? .04 : boatProxy ? .014 : .028);
        mesh.setColorAt(i, this.color);
      }
    }
    this.reflectionHulls.name = 'Three reflection hulls at exact buoyant poses';
    this.reflectionShelters.name = 'Bounded reflection shelter silhouettes';
    this.reflectionHomes.name = 'Twelve reflection homes anchored to source house matrices';
    this.reflectionLamps.name = 'Ten reflection lamps at actual moving practical anchors';
    this.group.add(this.reflectionProxies);
    this.configureReflectionHomes();
    this.reflectionTexture = this.makeReflectionTexture();
    const reflectionMaterial = new THREE.MeshBasicMaterial({ map: this.reflectionTexture, color: 0xffffff,
      transparent: true, opacity: .48, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    this.fragments = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), reflectionMaterial, 80);
    this.fragments.name = 'Bounded reflections from actual boat and home lamps';
    this.fragments.count = 0; this.fragments.frustumCulled = false;
    this.group.add(this.fragments);
    // One bounded draw provides an immersed footprint and broken side wavelets.
    // Each strip samples the shared surface, independently of the hull pose.
    // Normal blending preserves darkness instead of adding an artificial halo.
    this.waterContact = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: this.reflectionTexture, color: 0xffffff,
        transparent: true, opacity: .42, depthWrite: false, side: THREE.DoubleSide,
        toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1 }), 21);
    this.waterContact.name = 'Three immersed hull footprints and eighteen broken side wavelets';
    this.waterContact.frustumCulled = false;
    this.group.add(this.waterContact);
    this.flames = new THREE.InstancedMesh(new THREE.ConeGeometry(.08, .28, 5),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(.82, .35, .065), toneMapped: false }), 4);
    this.flames.name = 'Four small steady nauka candle flames'; this.flames.frustumCulled = false;
    this.candleLight.name = 'Single bounded warm nauka light'; this.candleLight.castShadow = false;
    this.candleLight.layers.enable(3);
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
      material.envMapIntensity = material.map ? .20 : .12;
      // The shelter shares physically rough original woven maps. Keep its
      // surface neutral: warmth comes from the actual lantern, not bright tan.
      if (/v008 finely woven/.test(material.name)) {
        material.normalScale.set(.65, .65);
        material.envMapIntensity = .16;
      }
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
    // The village is anchored at the actual far-water edge. A fixed, restrained
    // haze tint keeps architecture readable there without changing boat fog.
    const villageMaterials = new Map<THREE.Material, THREE.Material>();
    village.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const isolateHaze = (original: THREE.Material) => {
        if (!(original instanceof THREE.MeshStandardMaterial) || original.name === 'RiverLife | restrained amber emission') return original;
        let material = villageMaterials.get(original);
        if (!material) {
          // Rope/timber materials are shared with boats in the GLB. Isolate
          // shore treatment while keeping the original texture allocations.
          const clone = original.clone();
          clone.fog = false; clone.color.multiplyScalar(.24); clone.envMapIntensity = .08;
          villageMaterials.set(original, clone); material = clone;
        }
        return material;
      };
      object.material = Array.isArray(object.material) ? object.material.map(isolateHaze) : isolateHaze(object.material);
    });
    this.group.add(source); this.village = village; this.authored = true;
    this.disableReflectionMeshes(source);
    this.boats = [{ object: boatA, x: -48, z: -115, scale: 3.5, yaw: .18, phase: 0 },
      { object: boatB, x: 62, z: -165, scale: 3.2, yaw: -.26, phase: 2.3 },
      { object: boatC, x: -76, z: -85, scale: 4.1, yaw: .16, phase: 4.6, foreground: true }];
    this.candles = candles as THREE.Object3D[];
    this.lamps = [lampA, lampB, ...this.candles, ...windows as THREE.Object3D[]];
    this.configureReflectionHomes(source);
    this.resize(this.phone);
  }

  resize(phone: boolean) {
    this.phone = phone;
    for (const boat of this.boats) {
      boat.object.position.set(phone ? boat.foreground ? -34 : boat.x * .62 : boat.x, WATER_Y, boat.z);
      boat.object.scale.setScalar(phone && boat.foreground ? 3.1 : boat.scale);
      boat.object.rotation.set(0, boat.yaw, 0);
    }
    // Match the bank to the water edge and panorama horizon at each aspect.
    // Village-specific haze prevents the old exponential-fog disappearance.
    this.village.position.set(phone ? 0 : 40, WATER_Y, phone ? -178 : -982);
    this.village.scale.setScalar(phone ? 1.4 : 4.0);
    this.village.rotation.y = -.025;
    this.group.updateMatrixWorld(true);
    this.villageBounds.setFromObject(this.village);
    this.updateReflectionProxies(true);
  }

  private readonly waterSample = { height: 0, slopeX: 0, slopeZ: 0 };
  private readonly hullSamples = Array.from({ length: 4 }, () => ({ height: 0, slopeX: 0, slopeZ: 0 }));
  update(sim: Simulation, visible: boolean, motionAllowed = true, waterFrame?: WaterFrame) {
    this.group.visible = visible;
    const moving = motionAllowed && !sim.reducedMotion && !this.reducedMotion?.matches && sim.quality !== 'low';
    const frame = waterFrame ?? updateWaterFrame(this.ownWaterFrame, sim.waterPhase, sim.quality, this.phone, moving);
    this.lastWaterFrame = frame;
    const time = frame.phase; this.lastTime = time;
    for (const boat of this.boats) {
      const x = boat.object.position.x, z = boat.object.position.z, scale = boat.object.scale.x;
      const halfLength = (boat.foreground ? 4.75 : 2.75) * scale, halfBeam = (boat.foreground ? 1.5 : .875) * scale;
      const alongX = Math.cos(boat.yaw), alongZ = -Math.sin(boat.yaw), acrossX = -alongZ, acrossZ = alongX;
      sampleWater(x + halfLength * alongX, z + halfLength * alongZ, time, this.hullSamples[0], frame);
      sampleWater(x - halfLength * alongX, z - halfLength * alongZ, time, this.hullSamples[1], frame);
      sampleWater(x + halfBeam * acrossX, z + halfBeam * acrossZ, time, this.hullSamples[2], frame);
      sampleWater(x - halfBeam * acrossX, z - halfBeam * acrossZ, time, this.hullSamples[3], frame);
      const height = (this.hullSamples[0].height + this.hullSamples[1].height + this.hullSamples[2].height + this.hullSamples[3].height) * .25;
      // Spatial averaging supplies the covered boat's inertia without lowering
      // its heave, which would leave the hull behind the displaced waterline.
      const alongSlope = (this.hullSamples[0].height - this.hullSamples[1].height) / (halfLength * 2);
      const acrossSlope = (this.hullSamples[2].height - this.hullSamples[3].height) / (halfBeam * 2);
      const steadiness = boat.foreground ? .72 : 1;
      boat.object.position.y = WATER_Y + height;
      // Local X is the hull's longitudinal axis. Euler YXZ keeps yaw fixed:
      // positive local pitch around Z raises the bow, negative X raises port.
      boat.object.rotation.set(-Math.atan(acrossSlope) * steadiness, boat.yaw, Math.atan(alongSlope) * steadiness, 'YXZ');
      boat.sampledHeight = height; boat.sampledPitch = boat.object.rotation.z; boat.sampledRoll = boat.object.rotation.x;
      sampleWater(x, z, time, this.waterSample, frame);
      boat.contactError = Math.abs(height - this.waterSample.height);
    }
    this.reflectionProxies.visible = visible;
    if (!visible) { this.fragments.count = 0; this.waterContact.count = 0; this.flames.count = 0; this.candleLight.intensity = 0; return; }
    this.group.updateMatrixWorld(true);
    this.updateReflectionProxies();
    let contacts = 0;
    for (const boat of this.boats) {
      const scale = boat.object.scale.x;
      const length = (boat.foreground ? 9.5 : 5.5) * scale;
      const beam = (boat.foreground ? 3 : 1.75) * scale;
      const x = boat.object.position.x, z = boat.object.position.z;
      sampleWater(x, z, time, this.waterSample, frame);
      this.point.set(x, WATER_Y + this.waterSample.height + .018, z);
      this.size.set(length * .91, beam * .52, 1);
      this.alignContact(boat.yaw);
      this.matrix.compose(this.point, this.footprintRotation, this.size);
      this.waterContact.setMatrixAt(contacts, this.matrix);
      this.color.setRGB(.0015, .004, .008);
      this.waterContact.setColorAt(contacts++, this.color);
      for (let j = 0; j < 6; j++) {
        const phase = (time * .065 + j * .173 + boat.phase * .043) % 1;
        const spread = .88 + phase * .44;
        // Interrupted strips avoid closed rings and do not imply forward wake.
        const side = j % 2 ? -1 : 1;
        const along = Math.sin(j * 2.399 + boat.phase) * length * .30;
        const across = side * beam * (.46 + phase * .27);
        this.point.set(x + along * Math.cos(boat.yaw) + across * Math.sin(boat.yaw),
          0, z - along * Math.sin(boat.yaw) + across * Math.cos(boat.yaw));
        sampleWater(this.point.x, this.point.z, time, this.waterSample, frame);
        this.point.y = WATER_Y + this.waterSample.height + .025;
        this.alignContact(boat.yaw + Math.sin(j * 1.87 + boat.phase) * .10);
        this.size.set(length * (.14 + (j % 3) * .047) * spread, .17 + phase * .21, 1);
        this.matrix.compose(this.point, this.footprintRotation, this.size);
        this.waterContact.setMatrixAt(contacts, this.matrix);
        const energy = .018 + .18 * (1 - phase) * (.4 + .6 * Math.sin(Math.PI * phase));
        this.color.setRGB(energy * .64, energy * .83, energy);
        this.waterContact.setColorAt(contacts++, this.color);
      }
    }
    this.waterContact.count = contacts; this.waterContact.instanceMatrix.needsUpdate = true;
    if (this.waterContact.instanceColor) this.waterContact.instanceColor.needsUpdate = true;
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
    this.candleLight.intensity = (sim.reducedFlashes ? 10 : 13) * (moving && !sim.reducedFlashes ? 1 + Math.sin(time * 2.1) * .025 : 1);
    const segments = sim.quality === 'low' ? 4 : 8;
    let count = 0;
    for (let i = 0; i < this.lamps.length; i++) {
      this.lamps[i].getWorldPosition(this.point);
      const x = this.point.x, z = this.point.z;
      for (let j = 0; j < segments && count < 80; j++) {
        const distance = j * (i < 6 ? 1.65 : 3.4);
        const ripple = Math.sin(z * .15 + j * 1.37 + time * .65) * Math.sin(j * 2.399 - time * .31 + i);
        this.size.set((i < 6 ? 1.1 : 2.5) * (1 + j * .16) * (.72 + .28 * ripple), .18 + j * .033, 1);
        this.point.set(x + Math.sin(j * 1.6 + time * .42 + i) * (.24 + j * .065), 0, z + .65 + distance);
        sampleWater(this.point.x, this.point.z, time, this.waterSample, frame);
        this.point.y = WATER_Y + this.waterSample.height + .032;
        this.alignContact(0);
        this.matrix.compose(this.point, this.footprintRotation, this.size); this.fragments.setMatrixAt(count, this.matrix);
        const energy = (1 - j / segments) ** 1.45 * (sim.reducedFlashes ? .72 : 1);
        this.color.copy(this.reflectionColor).multiplyScalar(energy); this.fragments.setColorAt(count++, this.color);
      }
    }
    this.fragments.count = count; this.fragments.instanceMatrix.needsUpdate = true;
    if (this.fragments.instanceColor) this.fragments.instanceColor.needsUpdate = true;
  }

  private alignContact(yaw: number) {
    this.surfaceNormal.set(-this.waterSample.slopeX, 1, -this.waterSample.slopeZ).normalize();
    this.waveRotation.setFromUnitVectors(this.up, this.surfaceNormal);
    this.footprintRotation.copy(this.waveRotation).multiply(this.surfaceRotation)
      .multiply(this.yawRotation.setFromAxisAngle(this.planeAxis, yaw));
  }

  private disableReflectionMeshes(root: THREE.Object3D) {
    root.traverse(object => { if (object instanceof THREE.Mesh) object.layers.disable(3); });
  }

  private configureReflectionHomes(source?: THREE.Object3D) {
    if (!source && this.fallbackVillageBodies) {
      this.reflectionHomeSource = this.fallbackVillageBodies;
      this.reflectionHomes.count = this.fallbackVillageBodies.count;
      for (let i = 0; i < this.reflectionHomes.count; i++) this.fallbackVillageBodies.getMatrixAt(i, this.reflectionHomeMatrices[i]);
      return;
    }
    let plaster: THREE.Mesh | undefined;
    source?.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = Array.isArray(object.material) ? object.material[0] : object.material;
      if (material.name === 'RiverLife | quiet weathered plaster') plaster = object;
    });
    if (!(plaster instanceof THREE.Mesh)) { this.reflectionHomes.count = 0; return; }
    // The pinned authored export joins twelve cuboid plaster walls in order,
    // each with 24 face vertices. Preserve each house's child transform and
    // actual local bounds; no guessed village arrangement or per-frame parsing.
    const positions = plaster.geometry.getAttribute('position');
    if (!positions || positions.count !== 12 * 24) { this.reflectionHomes.count = 0; return; }
    this.reflectionHomeSource = plaster; this.reflectionHomes.count = 12;
    for (let house = 0; house < 12; house++) {
      let left = Infinity, bottom = Infinity, far = Infinity, right = -Infinity, top = -Infinity, near = -Infinity;
      for (let vertex = house * 24; vertex < (house + 1) * 24; vertex++) {
        const x = positions.getX(vertex), y = positions.getY(vertex), z = positions.getZ(vertex);
        left = Math.min(left, x); right = Math.max(right, x); bottom = Math.min(bottom, y); top = Math.max(top, y);
        far = Math.min(far, z); near = Math.max(near, z);
      }
      this.reflectionHomeMatrices[house].makeScale(right - left, top - bottom, near - far)
        .setPosition((left + right) * .5, (bottom + top) * .5, (far + near) * .5);
    }
  }

  private updateReflectionProxies(homes = false) {
    let shelters = 0;
    for (let i = 0; i < this.boats.length; i++) {
      const boat = this.boats[i];
      this.reflectionLocalMatrix.makeScale(boat.foreground ? 9.5 / 5.5 : 1, 1, boat.foreground ? 3 / 1.64 : 1.75 / 1.64);
      this.reflectionWorldMatrix.multiplyMatrices(boat.object.matrixWorld, this.reflectionLocalMatrix);
      this.reflectionHulls.setMatrixAt(i, this.reflectionWorldMatrix);
      // Authored small canoes remain open. Only the covered nauka carries a
      // shelter; procedural cabins retain their own fallback silhouettes.
      if (!boat.foreground && this.authored) continue;
      const covered = Boolean(boat.foreground);
      this.reflectionLocalMatrix.makeScale(covered ? this.authored ? 5.3 : 4.2 : 1.55,
        covered ? this.authored ? 1.19 : 1.4 : .66, covered ? this.authored ? 2.46 : 2.8 : 1.08)
        .setPosition(covered ? 0 : -.3, covered ? this.authored ? 1.044 : .48 : .15, 0);
      this.reflectionWorldMatrix.multiplyMatrices(boat.object.matrixWorld, this.reflectionLocalMatrix);
      this.reflectionShelters.setMatrixAt(shelters++, this.reflectionWorldMatrix);
    }
    this.reflectionHulls.count = this.boats.length; this.reflectionShelters.count = shelters;
    this.reflectionHulls.instanceMatrix.needsUpdate = true; this.reflectionShelters.instanceMatrix.needsUpdate = true;
    if (homes && this.reflectionHomeSource) {
      for (let i = 0; i < this.reflectionHomes.count; i++) {
        this.reflectionWorldMatrix.multiplyMatrices(this.reflectionHomeSource.matrixWorld, this.reflectionHomeMatrices[i]);
        this.reflectionHomes.setMatrixAt(i, this.reflectionWorldMatrix);
      }
      this.reflectionHomes.instanceMatrix.needsUpdate = true;
    }
    this.reflectionLamps.count = Math.min(10, this.lamps.length);
    for (let i = 0; i < this.reflectionLamps.count; i++) {
      this.lamps[i].getWorldPosition(this.point);
      const scale = i < 2 ? this.boats[i].object.scale.x : i < 6 ? this.boats[2].object.scale.x : this.village.scale.x;
      this.reflectionLocalMatrix.makeScale((i < 2 ? .05 : i < 6 ? .025 : .30) * scale,
        (i < 2 ? .075 : i < 6 ? .035 : .40) * scale, (i < 6 ? .05 : .025) * scale).setPosition(this.point);
      this.reflectionLamps.setMatrixAt(i, this.reflectionLocalMatrix);
    }
    this.reflectionLamps.instanceMatrix.needsUpdate = true;
  }

  /** Caller owns the vector; use the anchor itself, with no temporary arrays. */
  practicalLightPosition(index: number, out: THREE.Vector3): boolean {
    const anchor = this.lamps[index];
    if (!anchor) return false;
    anchor.getWorldPosition(out); return true;
  }
  get practicalLightCount() { return this.lamps.length; }

  diagnostics(camera: THREE.PerspectiveCamera) {
    this.point.copy(this.village.position).project(camera);
    const riverBankScreen = { x: (this.point.x + 1) / 2, y: (1 - this.point.y) / 2 };
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (let i = 0; i < 8; i++) {
      this.point.set(i & 1 ? this.villageBounds.max.x : this.villageBounds.min.x,
        i & 2 ? this.villageBounds.max.y : this.villageBounds.min.y,
        i & 4 ? this.villageBounds.max.z : this.villageBounds.min.z).project(camera);
      const x = (this.point.x + 1) / 2, y = (1 - this.point.y) / 2;
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    const riverVillageScreenBounds = { left, top, right, bottom };
    let riverContactChecksum = 0, riverReflectionChecksum = 0;
    const contactMatrices = this.waterContact.instanceMatrix.array, reflectionMatrices = this.fragments.instanceMatrix.array;
    for (let i = 0; i < this.waterContact.count * 16; i++) riverContactChecksum += contactMatrices[i] * (1 + i % 17);
    for (let i = 0; i < this.fragments.count * 16; i++) riverReflectionChecksum += reflectionMatrices[i] * (1 + i % 19);
    let riverReflectionProxyChecksum = 0, riverReflectionProxyTriangles = 0;
    for (const mesh of [this.reflectionHulls, this.reflectionShelters, this.reflectionHomes, this.reflectionLamps]) {
      const matrices = mesh.instanceMatrix.array;
      for (let i = 0; i < mesh.count * 16; i++) riverReflectionProxyChecksum += matrices[i] * (1 + i % 23);
      riverReflectionProxyTriangles += (mesh.geometry.index?.count ?? mesh.geometry.getAttribute('position').count) / 3 * mesh.count;
    }

    return { riverBankScreen, riverVillageScreenBounds, riverScenery: this.authored ? 'Blender river-life-v008' : 'procedural river fallback', riverBoats: this.boats.length,
      riverBoatSource: this.authored ? 'Wooden Canoe by OuterSpaceSimon, BlenderKit, CC0' : 'original procedural boats',
      riverPbrTextures: this.authoredTextureCount, riverTextureMemoryEstimateBytes: this.authoredTextureMemoryEstimateBytes,
      riverPbrColorMaps: this.authoredColorMapCount, riverPbrDataMaps: this.authoredDataMapCount,
      riverPbrColorSpacesCorrect: this.authoredColorSpacesCorrect,
      riverLampAnchors: this.lamps.length, riverReflectionFragments: this.fragments.count, riverMotionTime: this.lastTime,
      riverCandleFlames: this.flames.count, riverPointLights: 1,
      riverCandleGlows: this.candleGlows.length,
      riverWaterContactInstances: this.waterContact.count,
      riverWaterPhase: this.lastWaterFrame.phase, riverWaterWaveCount: this.lastWaterFrame.waveCount,
      riverContactChecksum, riverReflectionChecksum, riverHullSampleCount: this.boats.length * 4,
      riverContactCapacity: 21, riverReflectionCapacity: 80,
      riverReflectionProxyBoats: this.reflectionHulls.count, riverReflectionProxyShelters: this.reflectionShelters.count,
      riverReflectionProxyHomes: this.reflectionHomes.count, riverReflectionProxyLamps: this.reflectionLamps.count,
      riverReflectionProxyDraws: 4, riverReflectionProxyTriangles, riverReflectionProxyChecksum,
      riverReflectionProxyVisible: this.reflectionProxies.visible && this.group.visible,
      riverReflectionProxySource: 'bounded silhouettes at actual buoyant hull, house and practical-light anchors',
      riverContactAlignment: 'four hull points and wave-conforming fragments',
      riverHullSamples: this.boats.map(boat => ({ height: boat.sampledHeight ?? 0, pitch: boat.sampledPitch ?? 0,
        roll: boat.sampledRoll ?? 0, centerDeviation: boat.contactError ?? 0 })),
      riverSeatedFigures: this.authored ? 2 : 0,
      riverVillageHomes: this.authored ? 12 : 9,
      riverVillagePosition: { x: this.village.position.x, y: this.village.position.y, z: this.village.position.z },
      riverVillageBounds: {
        min: { x: this.villageBounds.min.x, y: this.villageBounds.min.y, z: this.villageBounds.min.z },
        max: { x: this.villageBounds.max.x, y: this.villageBounds.max.y, z: this.villageBounds.max.z }
      },
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

  private makeReflectionShelter() {
    const positions: number[] = [], indices: number[] = [];
    const segments = 6;
    for (const x of [-.5, .5]) for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI;
      positions.push(x, Math.sin(angle), Math.cos(angle) * .5);
    }
    for (let i = 0; i < segments; i++) {
      const opposite = i + segments + 1;
      indices.push(i, opposite, i + 1, i + 1, opposite, opposite + 1);
    }
    for (let i = 1; i < segments; i++) {
      indices.push(0, i + 1, i, segments + 1, segments + 1 + i, segments + 2 + i);
    }
    indices.push(0, segments, segments + 1, segments, segments * 2 + 1, segments + 1);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setIndex(indices);
    geometry.computeVertexNormals(); return geometry;
  }

  private makeReflectionHome() {
    // A unit wall with a restrained pitched roof, scaled to each actual wall.
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      -.5, -.5, -.5, .5, -.5, -.5, .5, .5, -.5, -.5, .5, -.5,
      -.5, -.5, .5, .5, -.5, .5, .5, .5, .5, -.5, .5, .5,
      0, .75, -.5, 0, .75, .5,
    ], 3));
    geometry.setIndex([
      0, 3, 2, 0, 2, 1, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4,
      0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5, 3, 8, 2, 7, 6, 9,
      3, 7, 9, 3, 9, 8, 2, 8, 9, 2, 9, 6,
    ]); geometry.computeVertexNormals(); return geometry;
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
    this.fallbackVillageBodies = bodies;
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
    this.waterContact.geometry.dispose(); (this.waterContact.material as THREE.Material).dispose();
    this.flames.geometry.dispose(); (this.flames.material as THREE.Material).dispose(); this.candleLight.dispose();
    this.glowMaterial.dispose();
    for (const geometry of this.reflectionProxyGeometries) geometry.dispose();
    this.reflectionProxyMaterial.dispose();
    for (const mesh of [this.reflectionHulls, this.reflectionShelters, this.reflectionHomes, this.reflectionLamps]) mesh.dispose();
  }
}
