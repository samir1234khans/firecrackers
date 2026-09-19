import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Hash the delivered upgrade modules at build time, not a hand-written status string.
// Other unchanged platform modules are outside this fingerprint's declared scope.
const paths = [
  'src/App.tsx', 'src/engine/FusePath.ts', 'src/engine/Renderer.ts',
  'src/engine/Simulation.ts', 'src/engine/VisibleFrame.ts', 'src/engine/catalog.ts',
  'src/engine/useWorld.ts', 'src/graphics/LaunchStage.ts',
  'src/graphics/NightEnvironment.ts', 'src/graphics/OpaqueDepth.ts',
  'src/graphics/ParticleScene.ts', 'src/graphics/RocketProp.ts', 'src/graphics/textures.ts',
  'src/styles/completion.css', 'src/styles/hud-v3-art.css', 'src/styles/hud-v3.css',
  'src/ui/CinematicHUD.tsx', 'src/ui/Dialog.tsx', 'src/ui/FireworkGlyph.tsx',
  'src/ui/PanelNav.tsx', 'src/ui/PresentationSettings.tsx',
].sort();
const modules = [];
for (const path of paths) {
  const text = (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
  modules.push({ path, sha256: createHash('sha256').update(text).digest('hex') });
}
const catalog = await readFile('src/engine/catalog.ts', 'utf8');
const version = catalog.match(/CONFIG_VERSION\s*=\s*'([^']+)'/)?.[1];
if (!version) throw new Error('Missing release version in the catalog.');
const sha256 = createHash('sha256').update(JSON.stringify(modules)).digest('hex');
const receipt = { formatVersion: 1, version, scope: 'delivered-upgrade-modules', sha256, modules };
await mkdir('public', { recursive: true });
await writeFile('public/release.json', JSON.stringify(receipt, null, 2) + '\n');
console.log(`Release ${version}: ${modules.length} upgrade modules, SHA-256 ${sha256}`);
