import type { Quality } from './catalog.js';
export type BurstSource = { x: number; y: number; z: number; age: number; r: number; g: number; b: number; strength: number };
/** One preallocated strongest-source selection shared by the waterfront and smoke. */
export class BurstLightFrame {
    readonly sources: BurstSource[] = Array.from({ length: 4 }, () => ({ x: 0, y: 0, z: 0, age: 0, r: 0, g: 0, b: 0, strength: 0 }));
    readonly energies = new Float32Array(4);
    count = 0;
    update(lights: readonly BurstSource[], quality: Quality, reducedFlashes: boolean) {
        const capacity = quality === 'ultra' ? 4 : quality === 'standard' ? 2 : 1;
        this.count = 0; this.energies.fill(0);
        for (const light of lights) {
            const energy = light.strength * Math.exp(-light.age * 1.55) * (reducedFlashes ? .72 : 1);
            if (energy < .0002) continue;
            for (let i = 0; i < capacity; i++) if (energy > this.energies[i]) {
                for (let j = capacity - 1; j > i; j--) { Object.assign(this.sources[j], this.sources[j - 1]); this.energies[j] = this.energies[j - 1]; }
                Object.assign(this.sources[i], light); this.energies[i] = energy; this.count = Math.min(capacity, this.count + 1); break;
            }
        }
    }
    /** World-space illumination, independent of camera and theme. */
    sample(x: number, y: number, z: number, radius: number, out: Float32Array, count = this.count) {
        out.fill(0);
        for (let i = 0; i < Math.min(count, this.count); i++) {
            const l = this.sources[i], d = Math.hypot(l.x - x, l.y - y, l.z - z);
            const e = this.energies[i] / (1 + (d / radius) ** 2);
            out[0] += l.r * e; out[1] += l.g * e; out[2] += l.b * e;
        }
    }
}
