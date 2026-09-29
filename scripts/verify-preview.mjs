import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const url = 'https://firecrackers-a93nle.v2.appdeploy.ai/';
const expected = JSON.parse(await readFile('public/release.json', 'utf8'));
const response = await fetch(new URL('release.json', url), { signal: AbortSignal.timeout(30000), cache: 'no-store' });
assert.equal(response.status, 200, 'Public release receipt is unavailable');
const actual = await response.json();
const comparable = receipt => ({
  formatVersion: receipt.formatVersion, version: receipt.version, scope: receipt.scope,
  normalization: receipt.normalization, sha256: receipt.sha256,
  modules: receipt.modules.map(({ path, sha256 }) => ({ path, sha256 })),
});
const result = {
  checkedAt: new Date().toISOString(), url, version: actual.version,
  expectedSha256: expected.sha256, actualSha256: actual.sha256,
  source: process.env.GITHUB_SHA || 'local', matches: expected.sha256 === actual.sha256,
  scope: expected.scope, normalization: expected.normalization,
  mismatchedModules: expected.modules.filter(item => !actual.modules.some(other => other.path === item.path && other.sha256 === item.sha256)).map(item => item.path),
  hostDiagnosticAttributes: actual.modules.reduce((sum, item) => sum + item.removedHostAttributes, 0),
  rawByteDifferences: expected.modules.filter(item => !actual.modules.some(other => other.path === item.path && other.rawSha256 === item.rawSha256)).map(item => item.path),
};
await mkdir('test-results', { recursive: true });
await writeFile('test-results/deployed-source-parity.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
assert.equal(actual.formatVersion, 2);
const computed = createHash('sha256').update(JSON.stringify(comparable(actual).modules)).digest('hex');
assert.equal(computed, actual.sha256, 'Public receipt aggregate is inconsistent');
assert.deepEqual(comparable(actual), comparable(expected), 'Deployed application source differs after excluding only static host labels');
for (const item of expected.modules.filter(item => !item.path.endsWith('.tsx'))) {
  assert.equal(actual.modules.find(other => other.path === item.path)?.rawSha256, item.rawSha256, `Non-JSX source drift: ${item.path}`);
}
