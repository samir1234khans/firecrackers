/** One virtual fuse path for geometry, moving ember, sparks and smoke. */
export const ROCKET_SCALE = [3.8, 3.4, 3.8] as const;
export const FUSE_POINTS = [[2.05, .85, .14], [1.78, 1.22, .12], [1.08, 1.10, .1], [.52, 1.7, 0]] as const;
function point(t: number): [number, number, number] {
  const u = 1 - t;
  return [0, 1, 2].map(axis => u ** 3 * FUSE_POINTS[0][axis] + 3 * u * u * t * FUSE_POINTS[1][axis]
    + 3 * u * t * t * FUSE_POINTS[2][axis] + t ** 3 * FUSE_POINTS[3][axis]) as [number, number, number];
}
const lengths = new Float32Array(129);
let previous = point(0);
for (let i = 1; i <= 128; i++) {
  const next = point(i / 128);
  lengths[i] = lengths[i - 1] + Math.hypot(next[0] - previous[0], next[1] - previous[1], next[2] - previous[2]);
  previous = next;
}
export function fusePointAt(progress: number): [number, number, number] {
  const target = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0)) * lengths[128];
  let lo = 0, hi = 128;
  while (lo + 1 < hi) { const mid = (lo + hi) >> 1; if (lengths[mid] <= target) lo = mid; else hi = mid; }
  const fraction = (target - lengths[lo]) / Math.max(1e-8, lengths[hi] - lengths[lo]);
  return point((lo + fraction) / 128);
}
