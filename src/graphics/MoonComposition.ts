/** Fixed art direction, not a real-time astronomical ephemeris. CSS pixels keep
 * the disc circular on every backend and avoid per-launch camera movement. */
export const MOON_X = .78;
export type MoonFrame = { x: number; y: number; radius: number; illumination?: number };
export type MoonObstacle = { x: number; y: number; width: number; height: number };
export type MoonMotion = { time: number; motionAllowed: boolean; obstructions?: readonly MoonObstacle[]; pulseAt?: number };
export const MOON_DRIFT = Object.freeze({ x: 6, y: 4, horizontalPeriod: 32, verticalPeriod: 40, margin: 12, pulseSeconds: .7 });
const EMPTY_OBSTACLES: readonly MoonObstacle[] = [];
const boundedMoon = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
function moonIntersects(x: number, y: number, margin: number, obstacles: readonly MoonObstacle[], paddingX = 0, paddingY = 0) {
  for (const rect of obstacles) if (x + margin + paddingX > rect.x && x - margin - paddingX < rect.x + rect.width &&
    y + margin + paddingY > rect.y && y - margin - paddingY < rect.y + rect.height) return true;
  return false;
}

/** Resolve one disc for the texture, lighting direction, reflection and UI hit
 * target. The optional motion keeps historical routes' fixed composition. */
export function updateMoonFrame(width: number, height: number, horizon: number, out: MoonFrame, motion?: Readonly<MoonMotion>) {
  width = Math.max(1, width); height = Math.max(1, height);
  out.radius = Math.min(30, Math.max(15, Math.min(width, height)*.039));
  const margin = Math.min(out.radius + MOON_DRIFT.margin, Math.min(width, height) / 2);
  const minX = margin, maxX = width - margin, minY = margin, maxY = Math.max(minY, height * Math.min(.85, Math.max(.2, horizon)) - margin);
  const time = motion?.motionAllowed && Number.isFinite(motion.time) ? Math.max(0, motion.time) : 0;
  const baseX = boundedMoon(width * MOON_X, minX, maxX), baseY = boundedMoon(Math.max(out.radius + 24, Math.min(height * horizon * .23, height * .21)), minY, maxY);
  const obstacles = motion?.obstructions ?? EMPTY_OBSTACLES;
  let anchorX = baseX, anchorY = baseY, nearest = Infinity;
  if (moonIntersects(anchorX, anchorY, margin, obstacles, MOON_DRIFT.x, MOON_DRIFT.y)) {
    // A bounded candidate lattice avoids header/portrait/text rectangles without
    // moving outside the sky. Drift clearance is included in each test.
    for (let row = 0; row < 5; row++) for (let column = 0; column < 9; column++) {
      const x = minX + (maxX - minX) * column / 8, y = minY + (maxY - minY) * row / 4;
      if (moonIntersects(x, y, margin, obstacles, MOON_DRIFT.x, MOON_DRIFT.y)) continue;
      const distance = (x - baseX) ** 2 + (y - baseY) ** 2;
      if (distance < nearest) { nearest = distance; anchorX = x; anchorY = y; }
    }
  }
  out.x = boundedMoon(anchorX + (motion?.motionAllowed ? Math.sin(time * Math.PI * 2 / MOON_DRIFT.horizontalPeriod) * MOON_DRIFT.x : 0), minX, maxX);
  out.y = boundedMoon(anchorY + (motion?.motionAllowed ? Math.sin(time * Math.PI * 2 / MOON_DRIFT.verticalPeriod) * MOON_DRIFT.y : 0), minY, maxY);
  const age = motion?.pulseAt === undefined ? -1 : time - motion.pulseAt;
  out.illumination = motion?.motionAllowed && age >= 0 && age < MOON_DRIFT.pulseSeconds ? 1 + Math.sin(age / MOON_DRIFT.pulseSeconds * Math.PI) ** 2 * .18 : 1;
  return out;
}
