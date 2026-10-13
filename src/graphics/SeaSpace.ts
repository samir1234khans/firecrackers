import type { SeaPose } from './SeaFleetState.js';
export type SeaPoint = { x: number; y: number; z: number };
export type SeaFloating = { height: number; roll: number; pitch: number };
/** Exact YXZ hull transform. Geometry is stretched; passenger anatomy is uniformly scaled. */
export function boatToWorld(local: SeaPoint, pose: SeaPose, floating: SeaFloating, waterY: number, out: SeaPoint) {
  const sx = pose.length / 6, sz = pose.beam / 1.84;
  const x = local.x * sx, y = local.y * sx, z = local.z * sz;
  const cp = Math.cos(floating.pitch), sp = Math.sin(floating.pitch);
  const cr = Math.cos(floating.roll), sr = Math.sin(floating.roll);
  const cy = Math.cos(pose.yaw), sy = Math.sin(pose.yaw);
  const a = cp * x - sp * y, b = sp * x + cp * y, c = sr * b + cr * z;
  out.x = pose.x + cy * a + sy * c;
  out.y = waterY + floating.height + cr * b - sr * z;
  out.z = pose.z - sy * a + cy * c;
  return out;
}
export function worldToBoat(world: SeaPoint, pose: SeaPose, floating: SeaFloating, waterY: number, out: SeaPoint) {
  const x = world.x - pose.x, y = world.y - waterY - floating.height, z = world.z - pose.z;
  const cy = Math.cos(pose.yaw), sy = Math.sin(pose.yaw);
  const cr = Math.cos(floating.roll), sr = Math.sin(floating.roll);
  const cp = Math.cos(floating.pitch), sp = Math.sin(floating.pitch);
  const a = cy * x - sy * z, c = sy * x + cy * z, b = cr * y + sr * c;
  out.x = (cp * a + sp * b) / (pose.length / 6);
  out.y = (-sp * a + cp * b) / (pose.length / 6);
  out.z = (-sr * y + cr * c) / (pose.beam / 1.84);
  return out;
}
export const wrapSeaAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
