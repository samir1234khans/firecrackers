import type { Rocket } from './Simulation.js';
import { ROCKET_SCALE } from './FusePath.js';

/** Shared virtual model attachments; these are not physical firework specifications. */
export const FLIGHT_GRAVITY = 32;
export const REARM_SECONDS = 0.32;
export const MOTOR_LOCAL_Y = 1.57;
export const SHELL_LOCAL_Y = 3.25;

export function flightAxis(r: Pick<Rocket, 'stage' | 'vx' | 'vy' | 'vz'>): [number, number, number] {
    if (r.stage === 'fuse') return [0, 1, 0];
    // Keep attitude stable at the apex rather than normalizing a near-zero velocity.
    const y = Math.max(14, r.vy);
    const length = Math.hypot(r.vx, y, r.vz);
    return [r.vx / length, y / length, r.vz / length];
}

export function rocketPoint(r: Pick<Rocket, 'stage' | 'x' | 'y' | 'z' | 'vx' | 'vy' | 'vz'>, localY: number): [number, number, number] {
    const axis = flightAxis(r), offset = localY * ROCKET_SCALE[1];
    return [r.x + axis[0] * offset, r.y + axis[1] * offset, r.z + axis[2] * offset];
}

export function flightBodyOpacity(age: number, ascent: number): number {
    const t = Math.max(0, Math.min(1, (age / Math.max(.01, ascent) - .16) / .50));
    // The distant paper body gives way continuously to the luminous moving shell.
    return 1 - t * t * (3 - 2 * t);
}
