import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export type WaterfrontAssets = { smoke: ImageData; paper: HTMLImageElement; normal: THREE.Texture; flame: THREE.Texture; rocket: THREE.Group; terrace: THREE.Group };
const url = (name: string) => `${import.meta.env.BASE_URL}art/${name}`;
async function image(name: string) {
  const img = new Image(); img.src = url(name); await img.decode(); return img;
}
/** Each asset has a procedural fallback. Failed enhancement requests never fail the renderer. */
export async function loadWaterfrontAssets(): Promise<Partial<WaterfrontAssets>> {
  const loader = new GLTFLoader(), result: Partial<WaterfrontAssets> = {};
  await Promise.allSettled([
    image('smoke-density-light.png').then(img => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const ctx = c.getContext('2d')!; ctx.translate(0, c.height); ctx.scale(1, -1); ctx.drawImage(img, 0, 0); result.smoke = ctx.getImageData(0, 0, c.width, c.height); }),
    image('paper-color.png').then(img => { result.paper = img; }),
    new THREE.TextureLoader().loadAsync(url('water-normal.png')).then(t => { t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; result.normal = t; }),
    new THREE.TextureLoader().loadAsync(url('ignition-flame.png')).then(t => { t.colorSpace = THREE.SRGBColorSpace; result.flame = t; }),
    loader.loadAsync(url('rocket.glb')).then(g => { result.rocket = g.scene; }),
    loader.loadAsync(url('terrace.glb')).then(g => { result.terrace = g.scene; }),
  ]);
  return result;
}
export function disposeAssetGroup(group?: THREE.Group) {
  group?.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); for (const m of Array.isArray(o.material) ? o.material : [o.material]) { for (const value of Object.values(m)) if (value instanceof THREE.Texture) value.dispose(); m.dispose(); } } });
}
