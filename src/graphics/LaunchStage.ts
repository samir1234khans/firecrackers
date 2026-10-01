import * as THREE from 'three/webgpu';
import type { Simulation } from '../engine/Simulation';
import type { LaunchPropComposition } from '../engine/LaunchComposition';

/** A low weighted support, subdued metal and cached contact darkening. No halo. */
export class LaunchStage {
  readonly group = new THREE.Group();
  private readonly contactTexture: THREE.CanvasTexture;
  constructor() {
    this.group.name = 'Grounded steel launch support';
    const steel = new THREE.MeshStandardMaterial({ color: '#343b40', roughness: .76, metalness: .48 });
    const brass = new THREE.MeshStandardMaterial({ color: '#81704b', roughness: .65, metalness: .52 });
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.08, .42, 48), steel);
    lower.position.y = -.21;
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(.86, .94, .14, 48), steel);
    plate.position.y = .07;
    const edge = new THREE.Mesh(new THREE.TorusGeometry(.86, .018, 6, 64), brass);
    edge.rotation.x = -Math.PI / 2; edge.position.y = .145;
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(.08, .10, .25, 16, 1, true), brass);
    socket.position.y = .24;
    const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 64;
    const ctx = shadowCanvas.getContext('2d')!, gradient = ctx.createRadialGradient(32,32,8,32,32,31);
    gradient.addColorStop(0,'rgba(0,0,0,.64)'); gradient.addColorStop(.6,'rgba(0,0,0,.35)'); gradient.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0,0,64,64);
    const texture = new THREE.CanvasTexture(shadowCanvas);
    this.contactTexture=texture;
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.7,2.7), new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));
    shadow.rotation.x = -Math.PI/2; shadow.position.y = -.425;
    this.group.add(lower, plate, edge, socket, shadow);
    for (let i=0;i<6;i++) {
      const fixing = new THREE.Mesh(new THREE.CylinderGeometry(.033,.036,.035,6), brass), angle=i/6*Math.PI*2;
      fixing.position.set(Math.sin(angle)*.72,.16,Math.cos(angle)*.72); this.group.add(fixing);
    }
  }
  update(sim: Simulation, visible: boolean, composition?: LaunchPropComposition, padX = sim.committed?.padX ?? sim.placementToX()) {
    this.group.visible = visible;
    const radius = composition?.padRadius ?? 3;
    this.group.scale.set(radius,1,radius);
    this.group.position.set(padX, (composition?.contactY ?? 6.82) - .37, 0);
  }
  dispose() { this.contactTexture.dispose(); }
}
