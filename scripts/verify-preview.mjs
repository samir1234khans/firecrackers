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
assert.deepEqual(actual, expected, 'Deployed upgrade modules differ from the reviewed source');
