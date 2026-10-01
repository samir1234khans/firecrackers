import * as THREE from 'three/webgpu';

/** Mirror-camera and oblique-plane construction adapted from Three.js r180
 * ReflectorNode (MIT, copyright Three.js authors). The application owns the
 * clock, pass scheduling and target; no automatic reflector render is used.
 * https://github.com/mrdoob/three.js/blob/r180/src/nodes/utils/ReflectorNode.js
 */
export class PlanarReflection {
  readonly camera = new THREE.PerspectiveCamera();
  readonly textureMatrix = new THREE.Matrix4();
  private readonly viewProjection = new THREE.Matrix4();
  private readonly inverseProjection = new THREE.Matrix4();
  private readonly normal = new THREE.Vector3(0, 1, 0);
  private readonly point = new THREE.Vector3();
  private readonly direction = new THREE.Vector3();
  private readonly look = new THREE.Vector3();
  private readonly rotation = new THREE.Matrix4();
  private readonly plane = new THREE.Plane();
  private readonly clip = new THREE.Vector4();
  private readonly corner = new THREE.Vector4();
  private readonly bias = new THREE.Matrix4().set(
    .5, 0, 0, .5,
    0, .5, 0, .5,
    0, 0, 1, 0,
    0, 0, 0, 1,
  );

  update(source: THREE.PerspectiveCamera, waterY: number, coordinateSystem: typeof THREE.WebGLCoordinateSystem | typeof THREE.WebGPUCoordinateSystem) {
    source.updateMatrixWorld();
    const camera = this.camera;
    camera.copy(source);
    camera.coordinateSystem = coordinateSystem;
    // A first warm-up may precede the renderer's main-camera convention update.
    if (source.coordinateSystem !== coordinateSystem) camera.updateProjectionMatrix();
    camera.position.setFromMatrixPosition(source.matrixWorld);
    camera.position.y = 2 * waterY - camera.position.y;
    source.getWorldDirection(this.direction);
    this.direction.reflect(this.normal);
    this.look.copy(camera.position).add(this.direction);
    this.rotation.extractRotation(source.matrixWorld);
    camera.up.set(0, 1, 0).applyMatrix4(this.rotation).reflect(this.normal);
    camera.lookAt(this.look);
    camera.updateMatrixWorld();
    camera.layers.set(3);
    camera.layers.enable(4);

    // Projection UV is derived from the undistorted mean surface, before the
    // clipping change. Sampling TSL handles each backend's render-target Y flip.
    this.viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.textureMatrix.multiplyMatrices(this.bias, this.viewProjection);

    this.point.set(0, waterY, 0);
    this.plane.setFromNormalAndCoplanarPoint(this.normal, this.point).applyMatrix4(camera.matrixWorldInverse);
    this.clip.set(this.plane.normal.x, this.plane.normal.y, this.plane.normal.z, this.plane.constant);
    this.inverseProjection.copy(camera.projectionMatrix).invert();
    this.corner.set(Math.sign(this.clip.x), Math.sign(this.clip.y), 1, 1).applyMatrix4(this.inverseProjection);
    const denominator = this.clip.dot(this.corner);
    if (Math.abs(denominator) > 1e-8) {
      // OpenGL's clip interval is [-w,w], WebGPU's is [0,w]. Preserve the far
      // plane in each convention rather than halving OpenGL's depth interval.
      this.clip.multiplyScalar((coordinateSystem === THREE.WebGPUCoordinateSystem ? 1 : 2) / denominator);
      const p = camera.projectionMatrix.elements;
      p[2] = this.clip.x; p[6] = this.clip.y;
      p[10] = this.clip.z + (coordinateSystem === THREE.WebGPUCoordinateSystem ? 0 : 1);
      p[14] = this.clip.w;
    }
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    return camera;
  }
}
