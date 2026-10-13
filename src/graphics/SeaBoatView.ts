import * as THREE from 'three/webgpu';
import type { SeaAudienceSession } from './SeaAudienceSession.js';
import { WATER_Y } from './WaterWaves.js';
/** Optional camera presentation only. No orbit, roll, navigation or launch-physics mutation. */
export class SeaBoatView {
  private selected: number | null = null;
  private blend = 0;
  private previous = 0;
  private returning = false;
  get active() { return this.selected !== null || this.returning; }
  reset() { this.selected=null; this.returning=false; this.blend=0; }
  private readonly target = new THREE.Vector3();
  private readonly destination = new THREE.Vector3();
  private readonly eye = new THREE.Vector3();
  private readonly offset = new THREE.Vector3();
  private readonly look = new THREE.Matrix4();
  private readonly orientation = new THREE.Quaternion();
  private readonly startPosition = new THREE.Vector3();
  private readonly startOrientation = new THREE.Quaternion();
  private readonly lastPosition = new THREE.Vector3();
  private readonly lastOrientation = new THREE.Quaternion();
  apply(camera: THREE.PerspectiveCamera, session: SeaAudienceSession, reduced: boolean, paused: boolean) {
    const now = session.clock.time, dt = this.previous ? Math.max(0,Math.min(.1,now - this.previous)) : 0; this.previous = now;
    if (session.focus !== this.selected) {
      const switching = this.selected !== null && session.focus !== null;
      this.startPosition.copy(switching ? this.lastPosition : camera.position);
      this.startOrientation.copy(switching ? this.lastOrientation : camera.quaternion);
      this.selected = session.focus;
      this.returning = false;
      if (this.selected !== null) {
        this.blend = 0;
        const boat = session.poses[this.selected];
        // Hold this world-side viewing direction; the boat may turn beneath the camera.
        this.offset.set(Math.cos(boat.yaw) * .38 + Math.sin(boat.yaw) * .92, 0, -Math.sin(boat.yaw) * .38 + Math.cos(boat.yaw) * .92).normalize();
        this.target.set(boat.x, WATER_Y + boat.length / 6, boat.z);
      } else { this.blend = 0; this.returning=true; this.startPosition.copy(this.lastPosition);this.startOrientation.copy(this.lastOrientation); }
    }
    if (this.selected === null) {
      if(this.returning){this.eye.copy(camera.position);this.orientation.copy(camera.quaternion);this.blend=reduced?1:paused?this.blend:Math.min(1,this.blend+dt/1.2);const ease=this.blend*this.blend*(3-2*this.blend);camera.position.copy(this.startPosition).lerp(this.eye,ease);camera.quaternion.copy(this.startOrientation).slerp(this.orientation,ease);camera.updateMatrixWorld(true);this.returning=this.blend<1;}
      return;
    }
    const boat = session.poses[this.selected], water = session.floats[this.selected].height;
    this.destination.set(boat.x, WATER_Y + water + boat.length / 6 * .80, boat.z);
    const smooth = reduced ? 1 : paused ? 0 : 1 - Math.exp(-dt * 2.4);
    this.target.lerp(this.destination, smooth);
    this.blend = reduced ? 1 : paused ? this.blend : Math.min(1, this.blend + dt / 1.2);
    const ease = this.blend * this.blend * (3 - 2 * this.blend);
    const distance = Math.max(boat.length * 1.15, boat.length / (2 * Math.tan(camera.fov * Math.PI / 360) * .78 * camera.aspect));
    this.eye.copy(this.target).addScaledVector(this.offset, distance);
    // A low broadside view sees beneath the longboat canopy. Vertical framing
    // follows hull size rather than portrait-dependent viewing distance.
    this.eye.y += boat.length * (this.selected === 1 ? .035 : .23);
    this.look.lookAt(this.eye, this.target, camera.up); this.orientation.setFromRotationMatrix(this.look);
    camera.position.copy(this.startPosition).lerp(this.eye, ease); camera.quaternion.copy(this.startOrientation).slerp(this.orientation, ease);
    this.lastPosition.copy(camera.position); this.lastOrientation.copy(camera.quaternion);
    camera.updateMatrixWorld(true);
  }
}
