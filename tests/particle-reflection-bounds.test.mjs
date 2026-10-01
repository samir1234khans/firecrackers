import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import { ParticleReflectionBounds, TRAIL_CAP_EXTENSION } from '../.test-build/graphics/ParticleReflectionBounds.js';

test('segment bounds include shader soft-cap extension as well as billboard width', () => {
  const bounds = new ParticleReflectionBounds();
  bounds.includeSegment(0, 10, -20, 100, 30, -80, 2);
  assert.equal(TRAIL_CAP_EXTENSION, .07);
  assert.deepEqual(bounds.box.min.toArray(), [-9, 6.6, -86.2]);
  assert.deepEqual(bounds.box.max.toArray(), [109, 33.4, -13.8]);
});

test('world bounds contain complete differently oriented head billboards and trail endpoints', () => {
  const bounds = new ParticleReflectionBounds();
  assert.equal(bounds.box.isEmpty(), true);
  bounds.include(-8, 24, -15, 4);
  bounds.include(21, 50, 6, 2);
  assert.deepEqual(bounds.box.min.toArray(), [-12, 20, -19]);
  assert.deepEqual(bounds.box.max.toArray(), [23, 52, 8]);
  for (const point of [[-12, 24, -15], [-8, 20, -15], [-8, 24, -19], [23, 50, 6], [21, 52, 6], [21, 50, 8]]) {
    assert.equal(bounds.box.containsPoint(new THREE.Vector3(...point)), true);
  }
  const storage = bounds.box;
  bounds.reset(); assert.equal(bounds.box, storage); assert.equal(bounds.box.isEmpty(), true);
  bounds.include(1, 2, 3, 1); assert.deepEqual(bounds.box.min.toArray(), [0, 1, 2]);
});

for (const coordinateSystem of [THREE.WebGPUCoordinateSystem, THREE.WebGLCoordinateSystem]) {
  test(`conservative bounds retain visible segments and reject an off-camera batch (${coordinateSystem})`, () => {
    const camera = new THREE.PerspectiveCamera(42, 1.6, 1, 500);
    camera.coordinateSystem = coordinateSystem; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse), coordinateSystem);
    const visible = new ParticleReflectionBounds(); visible.include(0, 0, -40, 2); visible.include(3, 4, -60, 2);
    const hidden = new ParticleReflectionBounds(); hidden.include(200, 100, -40, 2);
    assert.equal(frustum.intersectsBox(visible.box), true); assert.equal(frustum.intersectsBox(hidden.box), false);
    // A segment with one visible endpoint must survive even if its other end is
    // outside; intersecting the conservative whole batch never drops that trace.
    hidden.include(0, 0, -40, 2); assert.equal(frustum.intersectsBox(hidden.box), true);
  });
}
