import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type * as THREE from 'three/webgpu';
/** Optional original hull export. Procedural geometry remains a complete loading/failure alternative. */
export async function loadSeaHullAsset(signal: AbortSignal) {
  const response = await fetch('/scene/sea-boat-hulls-v002.glb', { signal });
  if (!response.ok) throw new Error('Optional sea hulls unavailable');
  const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), '');
  return gltf.scene;
}
export function disposeSeaHullAsset(scene: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  scene.traverse(object => { const mesh = object as THREE.Mesh; if (!mesh.isMesh) return; geometries.add(mesh.geometry); for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material); });
  geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
}
