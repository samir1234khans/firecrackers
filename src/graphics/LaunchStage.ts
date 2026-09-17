import * as THREE from 'three/webgpu';
import { color, uv } from 'three/tsl';
import type { Simulation } from '../engine/Simulation';

/** Original real-time geometry. Not a pre-rendered background or a physical launcher design. */
export class LaunchStage {
  readonly group = new THREE.Group();
  private readonly ringMaterial = new THREE.MeshBasicMaterial({ color: '#e5b574' });
  private readonly inlayMaterial = new THREE.MeshStandardMaterial({ color: '#977148', metalness: .65, roughness: .32 });
  private readonly washMaterial = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  private readonly contactLight = new THREE.PointLight(0xffbb65, 8, 40, 2);
  private readonly dial: THREE.Mesh;
  constructor() {
    this.group.name = 'Cinematic launch stage';
    const dark = new THREE.MeshStandardMaterial({ color: '#101720', roughness: .28, metalness: .48 });
    const satin = new THREE.MeshStandardMaterial({ color: '#2b3038', roughness: .42, metalness: .64 });
    const profile = [new THREE.Vector2(0, -.65), new THREE.Vector2(19.2, -.65), new THREE.Vector2(19.7, -.3), new THREE.Vector2(19.7, .12), new THREE.Vector2(19.2, .45), new THREE.Vector2(0, .45)];
    const plinth = new THREE.Mesh(new THREE.LatheGeometry(profile, 80), dark);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(14.1, 14.7, .38, 80), satin);
    upper.position.y = .62;
    this.group.add(plinth, upper);
    for (const [radius, y, luminous] of [[19.25,.4,1], [17.9,.46,0], [14.25,.81,1], [11.2,.83,0], [6.5,.84,0]] as const) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, luminous ? .075 : .032, 6, 100), luminous ? this.ringMaterial : this.inlayMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = y;
      this.group.add(ring);
    }
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2, 1.3, 40, 1, true), this.inlayMaterial);
    socket.position.y = 1.42;
    this.group.add(socket);
    this.dial = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.28, 64, 1, 0, Math.PI * 1.6), this.ringMaterial);
    this.dial.rotation.x = -Math.PI / 2;
    this.dial.position.y = .84;
    this.group.add(this.dial);
    // A low-energy contact pool integrates the geometry with the dark floor.
    this.washMaterial.colorNode = color('#b78346');
    this.washMaterial.opacityNode = uv().sub(.5).length().mul(2).oneMinus().clamp(0, 1).pow(3).mul(.17);
    const wash = new THREE.Mesh(new THREE.PlaneGeometry(85, 60), this.washMaterial);
    wash.rotation.x = -Math.PI / 2;
    wash.position.y = -.72;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(115, 96), new THREE.MeshStandardMaterial({ color: '#060b12', metalness: .22, roughness: .60 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -.76;
    this.contactLight.position.set(-1, 5, 6);
    this.group.add(floor, wash, this.contactLight);
  }
  update(sim: Simulation, visible: boolean) {
    this.group.visible = visible;
    this.group.position.set(sim.placementToX(), sim.ground - 9.8, 0);
    const fuse = sim.rockets.find(r => r.stage === 'fuse');
    const contact = sim.holding ? Math.min(1, sim.holdProgress) : fuse ? .75 : 0;
    const rise = sim.rockets.some(r => r.phase === 'thrust') ? .4 : 0;
    this.ringMaterial.color.setRGB(.76 + contact * .34, .43 + contact * .22, .16 + contact * .09);
    this.contactLight.intensity = 8 + contact * 9 + rise * 10;
    // Selection/hold state moves the accent; idle and paused scenes have no decorative rotation.
    this.dial.rotation.z = sim.holding ? -sim.holdProgress * Math.PI * 2 : 0;
  }
}
