/** Fit a preallocated plane grid to the visible water trapezoid. Quadratic
 * depth spacing spends vertices on nearby swells instead of offscreen water.
 * Row order and plane-local Z remain compatible with PlaneGeometry normals.
 */
export function fitWaterSurfaceGrid(positions: Float32Array, columns: number, rows: number,
  farZ: number, nearZ: number, centerZ: number, xScale: number, nearHalfWidth: number, farHalfWidth: number) {
  if (positions.length !== (columns + 1) * (rows + 1) * 3 || columns < 1 || rows < 1 ||
      ![farZ, nearZ, centerZ, xScale, nearHalfWidth, farHalfWidth].every(Number.isFinite) ||
      farZ >= nearZ || xScale <= 0 || nearHalfWidth <= 0 || farHalfWidth <= 0) throw new RangeError('Invalid water grid');
  for (let row = 0; row <= rows; row++) {
    const depth = (1 - row / rows) ** 2;
    const z = nearZ + (farZ - nearZ) * depth;
    const halfWidth = nearHalfWidth + (farHalfWidth - nearHalfWidth) * depth;
    for (let column = 0; column <= columns; column++) {
      const offset = (row * (columns + 1) + column) * 3;
      positions[offset] = (column / columns * 2 - 1) * halfWidth / xScale;
      positions[offset + 1] = centerZ - z;
      positions[offset + 2] = 0;
    }
  }
}
