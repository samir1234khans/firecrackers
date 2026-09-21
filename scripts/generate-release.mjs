import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// The host inserts static data-appdeploy-source-id attributes before the build.
// Preserve those runtime labels. Ignore only that metadata when fingerprinting JSX.
export function canonicalSource(path, text) {
  const source = text.replaceAll('\r\n', '\n');
  if (!path.endsWith('.tsx')) return { text: source, removedHostAttributes: 0 };
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (file.parseDiagnostics.length) throw new Error(`Cannot fingerprint invalid TSX: ${path}`);
  let removedHostAttributes = 0;
  const output = ts.transform(file, [context => {
    const visit = node => {
      if (ts.isJsxAttributes(node)) {
        const properties = node.properties.filter(property => {
          if (!ts.isJsxAttribute(property) || property.name.getText(file) !== 'data-appdeploy-source-id') return true;
          if (!property.initializer || !ts.isStringLiteral(property.initializer) || !/^src_[a-f0-9]{32}$/.test(property.initializer.text)) {
            throw new Error(`Unexpected host metadata expression in ${path}`);
          }
          removedHostAttributes++;
          return false;
        });
        return ts.visitEachChild(context.factory.updateJsxAttributes(node, properties), visit, context);
      }
      if (ts.isStringLiteral(node)) return context.factory.createStringLiteral(node.text);
      return ts.visitEachChild(node, visit, context);
    };
    return root => ts.visitNode(root, visit);
  }]);
  try {
    return { text: ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: false }).printFile(output.transformed[0]), removedHostAttributes };
  } finally { output.dispose(); }
}

export async function generateRelease() {
  const paths = [
    'src/App.tsx', 'src/engine/FusePath.ts', 'src/engine/LaunchGeometry.ts', 'src/engine/Renderer.ts',
    'src/engine/Simulation.ts', 'src/engine/VisibleFrame.ts', 'src/engine/catalog.ts',
    'src/engine/useWorld.ts', 'src/platform/usePlatform.ts', 'src/graphics/LaunchStage.ts',
    'src/graphics/NightEnvironment.ts', 'src/graphics/OpaqueDepth.ts',
    'src/graphics/ParticleScene.ts', 'src/graphics/RocketProp.ts', 'src/graphics/textures.ts',
    'src/styles/completion.css', 'src/styles/flow.css', 'src/styles/hud-v3-art.css', 'src/styles/hud-v3.css',
    'src/ui/CinematicHUD.tsx', 'src/ui/Dialog.tsx', 'src/ui/FireworkGlyph.tsx',
    'src/ui/PanelNav.tsx', 'src/ui/PresentationSettings.tsx',
  ].sort();
  const hash = value => createHash('sha256').update(value).digest('hex');
  const modules = [];
  for (const path of paths) {
    const source = (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
    const normalized = canonicalSource(path, source);
    modules.push({ path, sha256: hash(normalized.text), rawSha256: hash(source), removedHostAttributes: normalized.removedHostAttributes });
  }
  const catalog = await readFile('src/engine/catalog.ts', 'utf8');
  const version = catalog.match(/CONFIG_VERSION\s*=\s*'([^']+)'/)?.[1];
  if (!version) throw new Error('Missing release version in the catalog.');
  const sha256 = hash(JSON.stringify(modules.map(({ path, sha256 }) => ({ path, sha256 }))));
  const receipt = {
    formatVersion: 2, version, scope: 'delivered-upgrade-modules',
    normalization: 'typescript-5.9.2-printer-static-appdeploy-source-id-only', sha256, modules,
  };
  await mkdir('public', { recursive: true });
  await writeFile('public/release.json', JSON.stringify(receipt, null, 2) + '\n');
  console.log(`Release ${version}: ${modules.length} normalized upgrade modules, SHA-256 ${sha256}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await generateRelease();
