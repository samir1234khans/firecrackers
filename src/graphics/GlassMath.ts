/** CSS-pixel contracts for a bounded optical layer. Semantic controls remain DOM. */
export type GlassSurface = { x: number; y: number; width: number; height: number; radius?: number; id?: string };
export const GLASS_LIMITS = Object.freeze({ surfaces: 4, ior: 1.45, edgePixels: 6, centrePixels: 1, scatterTaps: 5 });
export function boundGlassSurfaces(surfaces: readonly GlassSurface[], width: number, height: number): GlassSurface[] {
  return surfaces.filter(rect => Number.isFinite(rect.x + rect.y + rect.width + rect.height) && rect.width > 0 && rect.height > 0 &&
    rect.x < width && rect.y < height && rect.x + rect.width > 0 && rect.y + rect.height > 0).slice(0, GLASS_LIMITS.surfaces).map(rect => ({
      ...rect, radius: Math.max(0, Math.min(rect.radius ?? 24, rect.width / 2, rect.height / 2)),
    }));
}
/** Signed distance to the same rounded rectangle used by the GPU shader. */
export function glassDistance(x: number, y: number, surface: Readonly<GlassSurface>) {
  const radius = Math.max(0, Math.min(surface.radius ?? 24, surface.width / 2, surface.height / 2));
  const qx = Math.abs(x - surface.x - surface.width / 2) - surface.width / 2 + radius;
  const qy = Math.abs(y - surface.y - surface.height / 2) - surface.height / 2 + radius;
  return Math.hypot(Math.max(0, qx), Math.max(0, qy)) + Math.min(Math.max(qx, qy), 0) - radius;
}
