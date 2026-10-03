import type { Pool } from './Pool.js';
import { canopyAlpha } from './SmokeCanopy.js';
export const SMOKE_OCCLUDER_CAPACITY = 12;
/** Twelve soft analytic smoke volumes. No render target, allocation per frame,
 * depth readback or dependency on optional bloom. Lower tiers retain the effect. */
export class SmokeOcclusion {
  count = 0;
  private readonly fields = new Float32Array(SMOKE_OCCLUDER_CAPACITY * 5);
  private readonly weights = new Float32Array(SMOKE_OCCLUDER_CAPACITY);
  private cx = 0; private cy = 0; private cz = 240;
  update(p: Pool, cameraX: number, cameraY: number, cameraZ: number): void {
    this.count = 0; this.weights.fill(0); this.cx = cameraX; this.cy = cameraY; this.cz = cameraZ;
    for (let i = 0; i < p.count; i++) {
      if (p.family[i] !== 2 || p.z[i] >= cameraZ - 1) continue;
      const alpha = canopyAlpha(p.age[i], p.life[i], p.gravity[i], 2);
      if (alpha < .002) continue;
      const radius = Math.max(.1, p.size[i] * 1.15);
      const importance = alpha * radius * radius;
      let slot = this.count;
      if (slot >= SMOKE_OCCLUDER_CAPACITY) {
        slot = 0;
        for (let k = 1; k < this.count; k++) if (this.weights[k] < this.weights[slot]) slot = k;
        if (importance <= this.weights[slot]) continue;
      } else this.count++;
      const j = slot * 5;
      this.fields[j] = p.x[i]; this.fields[j+1] = p.y[i]; this.fields[j+2] = p.z[i];
      this.fields[j+3] = radius; this.fields[j+4] = Math.min(.16, alpha * .65);
      this.weights[slot] = importance;
    }
  }
  transmission(x: number, y: number, z: number): number {
    const distanceZ = this.cz - z;
    if (distanceZ <= .01) return 1;
    let opticalDepth = 0;
    for (let i = 0; i < this.count; i++) {
      const j = i * 5, depth = this.fields[j+2] - z;
      if (depth <= 0 || depth >= distanceZ) continue;
      const fraction = depth / distanceZ, radius = this.fields[j+3];
      const dx = (x + (this.cx - x) * fraction - this.fields[j]) / radius;
      if (Math.abs(dx) >= 1) continue;
      const dy = (y + (this.cy - y) * fraction - this.fields[j+1]) / (radius * .8);
      const coverage = Math.max(0, 1 - dx * dx - dy * dy);
      opticalDepth += coverage * coverage * this.fields[j+4] * Math.min(1, depth / 3);
    }
    // Complement the existing depth-bucket compositing without blacking out shells.
    return Math.max(.58, Math.exp(-opticalDepth));
  }
}
