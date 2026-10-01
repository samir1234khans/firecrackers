import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import { PlanarReflection } from '../.test-build/graphics/PlanarReflection.js';

const waterY = 4.65;
const close = (a, b, label, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${label}: ${a} versus ${b}`);
function sourceCamera(coordinateSystem, aspect = 1.6) {
  const camera = new THREE.PerspectiveCamera(42, aspect, 1, 1500);
  camera.coordinateSystem = coordinateSystem;
  camera.position.set(8, 31, 175);
  camera.lookAt(-5, 46, -100);
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return camera;
}
function clipPoint(point, camera) {
  return new THREE.Vector4(point.x, point.y, point.z, 1)
    .applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
}
for (const [name, coordinateSystem] of [['WebGPU', THREE.WebGPUCoordinateSystem], ['WebGL', THREE.WebGLCoordinateSystem]]) {
  test(`${name}: mirror preserves the mean-plane screen position and source camera`, () => {
    for (const aspect of [.47, 1, 1.6, 2.16]) {
      const source = sourceCamera(coordinateSystem, aspect);
      const before = source.toJSON();
      const mirror = new PlanarReflection();
      const camera = mirror.update(source, waterY, coordinateSystem);
      close(camera.position.y, waterY * 2 - source.position.y, 'camera height');
      close(camera.position.x, source.position.x, 'camera x'); close(camera.position.z, source.position.z, 'camera z');
      assert.equal(camera.coordinateSystem, coordinateSystem);
      assert.equal(camera.layers.mask, (1 << 3) | (1 << 4));
      for (const [x, z] of [[0, -30], [-34, -85], [62, -165], [70, -900]]) {
        const point = new THREE.Vector3(x, waterY, z);
        const original = point.clone().project(source);
        const projected = new THREE.Vector4(x, waterY, z, 1).applyMatrix4(mirror.textureMatrix);
        // Mirroring the up vector preserves a proper camera rotation by
        // reversing its horizontal handedness (r180 uses screenUV.flipX()).
        // Projective sampling performs that reversal in world coordinates.
        close(projected.x / projected.w, (1 - original.x) / 2, 'projective x');
        close(projected.y / projected.w, (original.y + 1) / 2, 'projective y');
      }
      assert.deepEqual(source.toJSON(), before);
      const identity = camera.projectionMatrix.clone().multiply(camera.projectionMatrixInverse).elements;
      for (let i = 0; i < 16; i++) close(identity[i], i % 5 === 0 ? 1 : 0, `inverse ${i}`);
    }
  });
  test(`${name}: oblique near plane clips underwater geometry and retains above-water sources`, () => {
    const mirror = new PlanarReflection();
    const camera = mirror.update(sourceCamera(coordinateSystem), waterY, coordinateSystem);
    for (const z of [-35, -165, -350]) {
      const above = clipPoint(new THREE.Vector3(0, waterY + 2, z), camera);
      const plane = clipPoint(new THREE.Vector3(0, waterY, z), camera);
      const below = clipPoint(new THREE.Vector3(0, waterY - 2, z), camera);
      const clipNear = p => coordinateSystem === THREE.WebGPUCoordinateSystem ? p.z : p.z + p.w;
      assert.ok(clipNear(above) > 0, 'above-water source retained');
      assert.ok(clipNear(below) < 0, 'underwater source clipped');
      close(clipNear(plane), 0, 'mean water lies on oblique clip plane', 1e-8);
    }
  });
}
test('warm-up uses the requested backend convention before the main renderer updates its camera', () => {
  const source = sourceCamera(THREE.WebGLCoordinateSystem);
  const before = source.toJSON();
  const mirror = new PlanarReflection();
  const camera = mirror.update(source, waterY, THREE.WebGPUCoordinateSystem);
  assert.equal(camera.coordinateSystem, THREE.WebGPUCoordinateSystem);
  assert.deepEqual(source.toJSON(), before);
  const onPlane = clipPoint(new THREE.Vector3(0, waterY, -85), camera);
  close(onPlane.z, 0, 'WebGPU zero near plane', 1e-8);
});
