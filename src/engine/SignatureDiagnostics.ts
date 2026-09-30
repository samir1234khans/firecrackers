import type { Pool } from './Pool.js';
/** Only called by diagnostics/QA, never the simulation or render loop. */
export function signatureEnvelope(pool: Pool, project: (x: number, y: number, z: number) => { x: number; y: number }) {
  const groups = [10, 11, 12].map(family => ({ family, count: 0, left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }));
  for (let i = 0; i < pool.count; i++) {
    if (pool.family[i] < 10 || pool.age[i] < 0 || pool.gain[i] < .02) continue;
    const g = groups[pool.family[i] - 10], p = project(pool.x[i], pool.y[i], pool.z[i]);
    g.count++; g.left = Math.min(g.left, p.x); g.top = Math.min(g.top, p.y);
    g.right = Math.max(g.right, p.x); g.bottom = Math.max(g.bottom, p.y);
  }
  return groups.filter(g => g.count);
}
