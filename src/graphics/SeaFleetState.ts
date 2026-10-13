/** Spark-only, renderer-independent fleet. Coordinates are persistent across aspect changes. */
export const SEA_WAVE_GAINS = [1.5, 1.35, 1.1, 1] as const;
export const SEA_FLEET = [
  { id: 'canoe', name: 'Open rowing canoe', u: -.67, v: .11, length: 23, beam: 5.2, speed: .10, phase: -.7, people: 3, lamps: 1, band: 'near', children: 1 },
  { id: 'longboat', name: 'Covered wooden longboat', u: .67, v: .16, length: 23, beam: 7, speed: .08, phase: 3.1, people: 5, lamps: 2, band: 'near', children: 2 },
  { id: 'skiff', name: 'Working fishing skiff', u: -.62, v: .67, length: 18, beam: 5.6, speed: .13, phase: 1.8, people: 2, lamps: 1, band: 'middle', children: 0 },
  { id: 'cabin', name: 'Small timber cabin boat', u: .63, v: .72, length: 18, beam: 5.5, speed: .14, phase: 4.6, people: 2, lamps: 1, band: 'middle', children: 1 },
  { id: 'dinghy', name: 'Distant wooden dinghy', u: -.83, v: .94, length: 8, beam: 2.3, speed: .08, phase: 5.7, people: 1, lamps: 1, band: 'far', children: 0 },
  { id: 'family-launch', name: 'Open family launch', u: -.67, v: .40, length: 21, beam: 7.2, speed: .12, phase: 2.6, people: 5, lamps: 2, band: 'near', children: 2 },
  { id: 'family-ferry', name: 'Split-canopy family ferry', u: .68, v: .44, length: 24, beam: 8, speed: .09, phase: -.35, people: 6, lamps: 2, band: 'near', children: 3 },
  { id: 'picnic-rowboat', name: 'Picnic rowboat', u: -.29, v: .86, length: 9, beam: 3, speed: .10, phase: 2.2, people: 3, lamps: 1, band: 'far', children: 1 },
  { id: 'coastal-workboat', name: 'Coastal workboat', u: .21, v: .95, length: 10, beam: 3.2, speed: .12, phase: 4.0, people: 2, lamps: 1, band: 'far', children: 0 },
  { id: 'leisure-catamaran', name: 'Small leisure catamaran', u: .79, v: .89, length: 11, beam: 5, speed: .10, phase: 1.2, people: 4, lamps: 1, band: 'far', children: 2 },
] as const;
export const SEA_NEAR_BOATS = [0, 1, 5, 6] as const;
export type SeaPose = { x: number; z: number; yaw: number; length: number; beam: number; speed: number; row: number };
export class SeaClock {
  time = 0;
  private previous = NaN;
  update(clock: number, moving: boolean) {
    const dt = Number.isFinite(this.previous) && clock >= this.previous ? Math.min(.25, clock - this.previous) : 0;
    this.previous = clock;
    if (moving) this.time += dt;
    return moving ? dt : 0;
  }
}
export function createSeaPose(): SeaPose { return { x: 0, z: 0, yaw: 0, length: 1, beam: 1, speed: 0, row: 0 }; }

/** Analytic smooth routes: independently phased meanders, never per-frame random walks.
 * A bounded lateral corridor allows indefinite continuous travel without respawn.
 * The small depth excursion supplies real perspective change without crossing lanes.
 */
export function sampleSeaRoute(index: number, time: number, phone: boolean, out: SeaPose) {
  const boat = SEA_FLEET[index], width = phone ? 46 : 165, span = phone ? 144 : 670;
  const length = boat.length * (phone ? 1 : 1.5);
  const lateral = boat.band === 'far' ? .028 : .115, depth = boat.band === 'far' ? .010 : .040;
  const radiusX = width * lateral, radiusZ = span * depth;
  // One route parameter independent of layout: resizing changes projection, never phase.
  // Bend-limited speed keeps even the smallest phone corridor below six degrees/s.
  // Independent rates plus a bounded, slow current avoid synchronized closed loops.
  const rate = Math.min(boat.speed * boat.length / (46 * lateral), .087 * Math.min(Math.min(46 * lateral, 144 * depth) / Math.max(46 * lateral, 144 * depth), Math.min(165 * lateral, 670 * depth) / Math.max(165 * lateral, 670 * depth))) * (1 - index * .023);
  const rowing = index === 0 || index === 7;
  const stroke = rowing ? .003 * Math.sin(time * 1.55 + boat.phase) : 0;
  const drift = .045 * Math.sin(time * .007 + index * 1.71);
  const theta = time * rate + boat.phase + drift + stroke;
  const velocity = rate + .045 * .007 * Math.cos(time * .007 + index * 1.71) + (rowing ? .003 * 1.55 * Math.cos(time * 1.55 + boat.phase) : 0);
  const x = boat.u + lateral * Math.sin(theta);
  const v = boat.v + depth * Math.cos(theta);
  const dx = radiusX * Math.cos(theta) * velocity;
  const dz = radiusZ * Math.sin(theta) * velocity;
  // At a route's lateral extrema, the depth velocity supplies a broad smooth turn.
  // No stateful integration means clocks at 30/60/120 Hz yield exactly one pose.
  out.x = x * width; out.z = -25 - v * span;
  out.yaw = Math.atan2(-dz, dx);
  out.length = length; out.beam = boat.beam * (phone ? 1 : 1.5);
  out.row = Math.sin(time * 1.55 + boat.phase);
  out.speed = Math.hypot(dx, dz);
  return out;
}

export const SEA_WAKE_CAPACITY = 384;
export type WakeMark = { x: number; z: number; yaw: number; width: number; born: number; life: number; boat: number; power: number };
/** World-space history with no frame allocations, no emission while paused, no catch-up. */
export class SeaWakePool {
  readonly marks: WakeMark[] = Array.from({ length: SEA_WAKE_CAPACITY }, () => ({ x: 0, z: 0, yaw: 0, width: 0, born: -100, life: 8, boat: 0, power: 0 }));
  private next = 0;
  private readonly last = new Float64Array(SEA_FLEET.length).fill(-Infinity);
  emit(index: number, time: number, pose: Readonly<SeaPose>) {
    if (time < this.last[index]) { this.reset(); }
    if (time - this.last[index] < .28 || pose.speed < .025) return;
    this.last[index] = time;
    const mark = this.marks[this.next]; this.next = (this.next + 1) % SEA_WAKE_CAPACITY;
    mark.x = pose.x - Math.cos(pose.yaw) * pose.length * .42;
    mark.z = pose.z + Math.sin(pose.yaw) * pose.length * .42;
    mark.yaw = pose.yaw; mark.width = pose.beam * .58; mark.born = time;
    mark.life = index === 0 ? 6 : index === 4 ? 7 : 9; mark.boat = index;
    mark.power = Math.min(1, pose.speed / (pose.length * .10)) * (index === 0 ? .5 + pose.row * .25 : .7);
  }
  reset() { for (const mark of this.marks) mark.born = -100; this.last.fill(-Infinity); this.next = 0; }
  active(time: number) { return this.marks.reduce((n, mark) => n + Number(time >= mark.born && time - mark.born < mark.life), 0); }
}
