import type { SimEvent } from '../engine/Simulation.js';
import { FAMILIES } from '../engine/catalog.js';
export type SeaBurstTarget = { id: number; time: number; x: number; y: number; z: number; family: number; strength: number; expires: number };
/** Read-only fan-out from the native drain. Does not own or drain simulation events. */
export class SeaBurstFeed {
  readonly targets: SeaBurstTarget[] = [];
  private sequence = 0;
  epoch = 0;
  ingest(events: readonly SimEvent[], now: number) {
    this.expire(now);
    for (const event of events) {
      if (event.type !== 'burst' || event.id <= this.sequence || !Number.isFinite(event.x + event.y + event.z + event.time + event.strength)) continue;
      this.sequence = event.id;
      if (event.time < now - .5 || event.strength < .04) continue;
      if (this.targets.length === 32) this.targets.shift();
      this.targets.push({ id: event.id, time: event.time, x: event.x, y: event.y, z: event.z,
        family: event.family, strength: event.strength, expires: event.time + Math.min(4.8, (FAMILIES[event.family]?.life ?? 3) * .68) });
    }
  }
  expire(now: number) {
    for (let i = this.targets.length - 1; i >= 0; i--) if (this.targets[i].expires <= now) this.targets.splice(i, 1);
  }
  reset() { this.targets.length = 0; this.sequence = 0; this.epoch++; }
}
