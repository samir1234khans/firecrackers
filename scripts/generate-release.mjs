import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
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

/** Enumerate, do not maintain a list that quietly omits new feature directories.
 * Generated release.json excludes itself. Tests/evidence are not shipped client code. */
export async function fingerprintEntries(root = '.') {
  const { join } = await import('node:path');
  const paths = [];
  async function walk(directory) {
    let entries;
    try { entries = await readdir(join(root, directory), {withFileTypes:true}); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of entries) {
      const path = `${directory}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`Fingerprint refuses symlink: ${path}`);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && path !== 'public/release.json') paths.push(path);
    }
  }
  await walk('src'); await walk('public');
  for (const path of ['index.html','package.json','package-lock.json','vite.config.ts','postcss.config.cjs',
    'tsconfig.json','tsconfig.engine.json','wrangler.jsonc','scripts/generate-release.mjs',
    'scripts/generate-icons.mjs','scripts/generate-notices.mjs','scripts/service-worker-template.js','assets-source/service-worker/cache-lifecycle.template.js']) {
    try { await readFile(join(root,path)); paths.push(path); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const hash = value => createHash('sha256').update(value).digest('hex');
  const modules = [];
  for (const path of [...new Set(paths)].sort()) {
    const bytes = await readFile(join(root,path));
    const isText = /\.(?:[cm]?[jt]sx?|css|html|jsonc?|svg|txt|webmanifest)$/.test(path);
    const source = isText ? bytes.toString('utf8').replaceAll('\r\n','\n') : bytes;
    const normalized = isText ? canonicalSource(path,source) : {text:source,removedHostAttributes:0};
    modules.push({path,sha256:hash(normalized.text),rawSha256:hash(source),removedHostAttributes:normalized.removedHostAttributes});
  }
  return modules;
}

export async function generateRelease() {
  const hash = value => createHash('sha256').update(value).digest('hex');
  const catalog = await readFile('src/engine/catalog.ts', 'utf8');
  const version = catalog.match(/CONFIG_VERSION\s*=\s*'([^']+)'/)?.[1];
  if (!version) throw new Error('Missing release version in the catalog.');
  const lifecycle = await readFile('assets-source/service-worker/cache-lifecycle.template.js','utf8');
  await mkdir('public',{recursive:true});
  await writeFile('public/cache-lifecycle.js',lifecycle.replace('__FIRECRACKERS_RELEASE__',version));
  const modules = await fingerprintEntries();
  const sha256 = hash(JSON.stringify(modules.map(({ path, sha256 }) => ({ path, sha256 }))));
  const receipt = {
    formatVersion: 3, version, scope: 'all-client-source-build-inputs-and-public-assets',
    normalization: 'typescript-5.9.2-printer-static-appdeploy-source-id-only', sha256, modules,
  };
  await mkdir('public', { recursive: true });
  await writeFile('public/release.json', JSON.stringify(receipt, null, 2) + '\n');
  console.log(`Release ${version}: ${modules.length} client source/config/asset entries, SHA-256 ${sha256}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await generateRelease();
