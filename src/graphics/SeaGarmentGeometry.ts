import * as THREE from 'three/webgpu';

/** Soft shoulder/waist cut, rather than an inflated spherical torso. Front is +X. */
export function createSeaGarmentGeometry() {
  const positions: number[] = [], indices: number[] = [], sides = 8;
  const rings = [[-1, .80, .87], [-.45, 1, .96], [.30, .98, 1.05], [.78, .87, 1.08], [1, .60, .66]];
  for (const [y, depth, width] of rings) for (let i = 0; i < sides; i++) {
    const angle = i / sides * Math.PI * 2;
    positions.push(Math.cos(angle) * depth, y, Math.sin(angle) * width);
  }
  for (let ring = 0; ring < rings.length - 1; ring++) for (let i = 0; i < sides; i++) {
    const a = ring * sides + i, b = ring * sides + (i + 1) % sides;
    indices.push(a, a + sides, b, b, a + sides, b + sides);
  }
  for (let i = 1; i < sides - 1; i++) {
    indices.push(0, i, i + 1);
    const top = (rings.length - 1) * sides; indices.push(top, top + i + 1, top + i);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
