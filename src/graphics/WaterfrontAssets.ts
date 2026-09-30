import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type WaterfrontAssets = {
  smoke: ImageData;
  paper: HTMLImageElement;
  normal: THREE.Texture;
  flame: THREE.Texture;
  rocket: THREE.Group;
  terrace: THREE.Group;
  sky: HTMLImageElement;
  river: THREE.Group;
};
export const WATERFRONT_ASSET_NAMES = ['smoke', 'paper', 'normal', 'flame', 'rocket', 'terrace', 'sky', 'river'] as const;
export type WaterfrontAssetName = typeof WATERFRONT_ASSET_NAMES[number];
const ASSET_LOAD_DEADLINE_MS = 60_000;

const url = (name: string) => `${import.meta.env.BASE_URL}art/${name}`;

/** Embedded images are already local bytes; avoid a second, navigation-abortable blob URL fetch. */
function decodeEmbeddedImages(loader: GLTFLoader) {
  loader.register(parser => {
    const loadImageSource = parser.loadImageSource.bind(parser);
    const sources = new Map<number, Promise<THREE.Texture>>();
    const decoded = new Set<THREE.Texture>();
    let failure: string | undefined;
    parser.loadImageSource = (index, imageLoader) => {
      const source = parser.json.images?.[index];
      if (source?.bufferView === undefined || !(imageLoader instanceof THREE.ImageBitmapLoader)) {
        return loadImageSource(index, imageLoader).then(texture => {
          decoded.add(texture); return texture;
        }).catch(error => {
          failure = `Image ${index} could not be decoded: ${errorMessage(error)}`;
          throw error;
        });
      }
      const existing = sources.get(index);
      if (existing) return existing.then(texture => {
        const clone = texture.clone(); decoded.add(clone); return clone;
      });
      const promise = parser.getDependency('bufferView', source.bufferView).then(async (bytes: ArrayBuffer) => {
        const bitmap = await createImageBitmap(new Blob([bytes], { type: source.mimeType }), {
          premultiplyAlpha: 'none', colorSpaceConversion: 'none',
        });
        const texture = new THREE.Texture(bitmap); texture.needsUpdate = true;
        if (source.extras && typeof source.extras === 'object') Object.assign(texture.userData, source.extras);
        texture.userData.mimeType = source.mimeType;
        decoded.add(texture); return texture;
      }).catch(error => {
        failure = `Embedded image ${index} could not be decoded: ${errorMessage(error)}`;
        throw error;
      });
      sources.set(index, promise); return promise;
    };
    return {
      name: 'FIRECRACKERS_embedded_image_decode',
      afterRoot: async result => {
        // r180 normally turns failed texture promises into null. Reject the
        // enhancement as a whole so missing PBR maps keep the complete fallback.
        if (!failure) return;
        disposeAssetGroup(result.scene);
        const bitmaps = new Set<ImageBitmap>();
        for (const texture of decoded) {
          texture.dispose();
          if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap && texture.image.width > 0) bitmaps.add(texture.image);
        }
        for (const bitmap of bitmaps) bitmap.close();
        throw new Error(failure);
      },
    };
  });
}
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
  const manager = new THREE.LoadingManager();
  // The legacy ImageLoader path only revokes successful object URLs in r180.
  // Release failed embedded sources too, after its native error callback runs.
  manager.onError = source => { if (source.startsWith('blob:')) URL.revokeObjectURL(source); };
  const loader = new GLTFLoader(manager);
  decodeEmbeddedImages(loader);
  const textureLoader = new THREE.TextureLoader();
  const tasks: { name: WaterfrontAssetName; load: () => Promise<WaterfrontAssets[WaterfrontAssetName]> }[] = [
    { name: 'smoke', load: async () => {
      const img = await image('smoke-density-light-v005.png');
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Smoke atlas canvas context was unavailable');
      ctx.translate(0, canvas.height); ctx.scale(1, -1); ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } },
    { name: 'paper', load: () => image('paper-color.png') },
    { name: 'normal', load: async () => {
      const t = await textureLoader.loadAsync(url('water-normal-v005.png'));
      t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
    } },
    { name: 'flame', load: async () => {
      const t = await textureLoader.loadAsync(url('ignition-flame.png'));
      t.colorSpace = THREE.SRGBColorSpace; return t;
    } },
    { name: 'rocket', load: async () => (await loader.loadAsync(url('rocket.glb'))).scene },
    { name: 'terrace', load: async () => (await loader.loadAsync(url('terrace-v008.glb'))).scene },
    { name: 'sky', load: () => image('waterfront-night-v005.webp') },
    { name: 'river', load: async () => (await loader.loadAsync(url('river-life-v008.glb'))).scene },
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
  if (name === 'rocket' || name === 'terrace' || name === 'river') disposeAssetGroup(asset as THREE.Group);
  else if (name === 'normal' || name === 'flame') (asset as THREE.Texture).dispose();
}

export function disposeAssetGroup(group?: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>(), bitmaps = new Set<ImageBitmap>();
  group?.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    geometries.add(o.geometry);
    for (const material of Array.isArray(o.material) ? o.material : [o.material]) materials.add(material);
  });
  for (const material of materials) for (const value of Object.values(material)) {
    if (!(value instanceof THREE.Texture)) continue;
    textures.add(value);
    // GLTFLoader can use ImageBitmap for embedded PBR maps. Texture.dispose()
    // releases GPU storage; the decoded bitmap also needs an explicit close.
    if (typeof ImageBitmap !== 'undefined' && value.image instanceof ImageBitmap) bitmaps.add(value.image);
  }
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
  for (const bitmap of bitmaps) bitmap.close();
}
