import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type WaterfrontAssets = {
  smoke: ImageData;
  paper: HTMLImageElement;
  normal: THREE.Texture;
  flame: THREE.Texture;
  rocket: THREE.Group;
  terrace: THREE.Group;
};
export const WATERFRONT_ASSET_NAMES = ['smoke', 'paper', 'normal', 'flame', 'rocket', 'terrace'] as const;
export type WaterfrontAssetName = typeof WATERFRONT_ASSET_NAMES[number];
const ASSET_LOAD_DEADLINE_MS = 60_000;

const url = (name: string) => `${import.meta.env.BASE_URL}art/${name}`;
async function image(name: string) {
  const img = new Image(); img.src = url(name); await img.decode(); return img;
}
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/** Report each decoded enhancement independently; a slow or missing file never holds up the rest. */
export async function loadWaterfrontAssets(
  onLoaded: (name: WaterfrontAssetName, asset: WaterfrontAssets[WaterfrontAssetName]) => void,
  onFailed: (name: WaterfrontAssetName, error: string) => void,
): Promise<void> {
  const loader = new GLTFLoader();
  const textureLoader = new THREE.TextureLoader();
  const tasks: { name: WaterfrontAssetName; load: () => Promise<WaterfrontAssets[WaterfrontAssetName]> }[] = [
    { name: 'smoke', load: async () => {
      const img = await image('smoke-density-light.png');
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Smoke atlas canvas context was unavailable');
      ctx.translate(0, canvas.height); ctx.scale(1, -1); ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } },
    { name: 'paper', load: () => image('paper-color.png') },
    { name: 'normal', load: async () => {
      const t = await textureLoader.loadAsync(url('water-normal.png'));
      t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
    } },
    { name: 'flame', load: async () => {
      const t = await textureLoader.loadAsync(url('ignition-flame.png'));
      t.colorSpace = THREE.SRGBColorSpace; return t;
    } },
    { name: 'rocket', load: async () => (await loader.loadAsync(url('rocket.glb'))).scene },
    { name: 'terrace', load: async () => (await loader.loadAsync(url('terrace-v004.glb'))).scene },
  ];
  await Promise.all(tasks.map(({ name, load }) => new Promise<void>(resolve => {
    let settled = false;
    const deadline = setTimeout(() => {
      settled = true;
      onFailed(name, `Loading exceeded ${ASSET_LOAD_DEADLINE_MS / 1000} seconds`);
      resolve();
    }, ASSET_LOAD_DEADLINE_MS);
    Promise.resolve().then(load).then(asset => {
      if (settled) { disposeWaterfrontAsset(name, asset); return; }
      settled = true; clearTimeout(deadline);
      try { onLoaded(name, asset); }
      catch (error) { disposeWaterfrontAsset(name, asset); onFailed(name, errorMessage(error)); }
      resolve();
    }, error => {
      if (settled) return;
      settled = true; clearTimeout(deadline);
      onFailed(name, errorMessage(error));
      resolve();
    });
  })));
}

export function disposeWaterfrontAsset(name: WaterfrontAssetName, asset: WaterfrontAssets[WaterfrontAssetName]) {
  if (name === 'rocket' || name === 'terrace') disposeAssetGroup(asset as THREE.Group);
  else if (name === 'normal' || name === 'flame') (asset as THREE.Texture).dispose();
}

export function disposeAssetGroup(group?: THREE.Group) {
  group?.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); for (const m of Array.isArray(o.material) ? o.material : [o.material]) { for (const value of Object.values(m)) if (value instanceof THREE.Texture) value.dispose(); m.dispose(); } } });
}
