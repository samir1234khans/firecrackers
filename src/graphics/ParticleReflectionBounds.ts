import { Box3 } from 'three/webgpu';

export const TRAIL_CAP_EXTENSION = .07;

/** Conservative world bounds accumulated while the existing instance stream is
 * written. Include the complete billboard/segment width for either camera pose.
 * No second particle scan or per-point vectors are needed for reflection culling.
 */
export class ParticleReflectionBounds {
  readonly box = new Box3();
  reset() { this.box.makeEmpty(); }
  include(x: number, y: number, z: number, radius: number) {
    const min = this.box.min, max = this.box.max;
    min.x = Math.min(min.x, x - radius); max.x = Math.max(max.x, x + radius);
    min.y = Math.min(min.y, y - radius); max.y = Math.max(max.y, y + radius);
    min.z = Math.min(min.z, z - radius); max.z = Math.max(max.z, z + radius);
  }
  includeSegment(ax: number, ay: number, az: number, bx: number, by: number, bz: number, radius: number) {
    const dx = (bx - ax) * TRAIL_CAP_EXTENSION, dy = (by - ay) * TRAIL_CAP_EXTENSION, dz = (bz - az) * TRAIL_CAP_EXTENSION;
    this.include(ax - dx, ay - dy, az - dz, radius);
    this.include(bx + dx, by + dy, bz + dz, radius);
  }
}
