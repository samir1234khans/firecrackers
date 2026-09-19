import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const url = 'https://firecrackers-a93nle.v2.appdeploy.ai/';
const expected = JSON.parse(await readFile('public/release.json', 'utf8'));
const response = await fetch(new URL('release.json', url), { signal: AbortSignal.timeout(30000), cache: 'no-store' });
assert.equal(response.status, 200, 'Public release receipt is unavailable');
const actual = await response.json();
const result = {
  checkedAt: new Date().toISOString(), url, version: actual.version,
  expectedSha256: expected.sha256, actualSha256: actual.sha256,
  source: process.env.GITHUB_SHA || 'local',
  matches: expected.sha256 === actual.sha256,
  mismatchedModules: expected.modules.filter(item => !actual.modules?.some(other => other.path === item.path && other.sha256 === item.sha256)).map(item => item.path),
};
await mkdir('test-results', { recursive: true });
await writeFile('test-results/deployed-source-parity.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (!result.matches) {
  // Inspect only public assets actually referenced by the public entry page.
  // Keep a mismatch a failure; never silently update expected hashes.
  const html = await (await fetch(url, { signal: AbortSignal.timeout(30000) })).text();
  const assets = [...html.matchAll(/<script[^>]+src=["']([^"']+\.js)["']/g)].map(match => new URL(match[1], url));
  for (const asset of assets.slice(0, 3)) {
    assert.equal(asset.origin, new URL(url).origin);
    const source = await (await fetch(asset, { signal: AbortSignal.timeout(30000) })).text();
    console.log('PUBLIC ENTRY ASSET', asset.href);
    console.log('DATA ATTRIBUTES', [...new Set(source.match(/data-[a-zA-Z0-9_-]+/g) || [])].slice(0, 40));
    for (const marker of ['Settings sections', 'sheet-heading', 'hud-mode-rail']) {
      const at = source.indexOf(marker);
      if (at >= 0) console.log('TRANSFORM CONTEXT', marker, source.slice(Math.max(0, at - 250), at + 1100));
    }
  }
}
assert.deepEqual(actual, expected, 'Deployed upgrade modules differ from the reviewed source');
