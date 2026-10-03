/** Bounded virtual-scene illumination. Never changes simulation RNG or exposure. */
export const BURST_LIGHT_CAPACITY = 12;
export const BURST_LIGHT_LIFETIME = 4.5;
export type BurstSource = { x: number; y: number; z: number; age: number; r: number; g: number; b: number; strength: number };

/** A short attack and a long coloured tail avoid an instantaneous full-scene flash. */
export function burstLightEnergy(light: BurstSource, reducedFlashes = false): number {
    if (!Number.isFinite(light.age) || !Number.isFinite(light.strength) || light.age < 0 || light.age >= BURST_LIGHT_LIFETIME) return 0;
    const age = light.age;
    const attack = reducedFlashes ? .08 + .92 * (1 - Math.exp(-age * 6)) : .14 + .86 * (1 - Math.exp(-age * 12));
    const release = Math.min(1, (BURST_LIGHT_LIFETIME - age) / .8);
    return Math.max(0, Math.min(1.6, light.strength)) * attack * Math.exp(-age * .72) * release * (reducedFlashes ? .65 : 1);
}

/** RGB sum, energy-weighted world centre, and energy in a caller-owned seven-value buffer. */
export function gatherBurstLighting(lights: readonly BurstSource[], out: Float32Array, reducedFlashes = false): void {
    out.fill(0);
    for (let i = 0; i < Math.min(BURST_LIGHT_CAPACITY, lights.length); i++) {
        const light = lights[i], energy = burstLightEnergy(light, reducedFlashes);
        if (!energy || !Number.isFinite(light.x) || !Number.isFinite(light.y) || !Number.isFinite(light.z) || !Number.isFinite(light.r) || !Number.isFinite(light.g) || !Number.isFinite(light.b)) continue;
        out[0] += Math.max(0, light.r) * energy;
        out[1] += Math.max(0, light.g) * energy;
        out[2] += Math.max(0, light.b) * energy;
        out[3] += light.x * energy; out[4] += light.y * energy; out[5] += light.z * energy; out[6] += energy;
    }
    if (out[6] > 0) { out[3] /= out[6]; out[4] /= out[6]; out[5] /= out[6]; }
}

/** One common gain preserves hue, unlike clipping R/G/B independently. */
export function limitBurstRadiance(rgb: Float32Array, ceiling: number): void {
    const peak = Math.max(rgb[0], rgb[1], rgb[2], 0);
    const gain = Number.isFinite(ceiling) && ceiling > 0 ? 1 / (1 + peak / ceiling) : 0;
    rgb[0] *= gain; rgb[1] *= gain; rgb[2] *= gain;
}
