import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.WATER_URL || 'https://firecrackers-moonlit-preview.allygym-api.workers.dev/';
const out = process.argv[2] || 'test-results/moonlit-preview-http';
const expected = JSON.parse(await readFile('dist/release.json', 'utf8'));
const report = { checkedAt: new Date().toISOString(), base, source: process.env.WATER_SOURCE_SHA || 'local', checks: [], errors: [], failed: null };
await mkdir(out, { recursive: true });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
try {
  const files = (await readdir('dist', { recursive: true, withFileTypes: true })).filter(item => item.isFile() && !item.name.startsWith('.'));
  for (const entry of files) {
    const local = path.join(entry.parentPath || entry.path, entry.name);
    const relative = path.relative('dist', local).replaceAll(path.sep, '/');
    const response = await fetch(new URL(relative, base), { signal: AbortSignal.timeout(30000), headers: { 'Cache-Control': 'no-cache' } });
    assert.equal(response.status, 200, relative);
    const actual = Buffer.from(await response.arrayBuffer()), wanted = await readFile(local);
    assert.equal(digest(actual), digest(wanted), relative + ' emitted bytes');
    report.checks.push({ name: relative, status: response.status, bytes: actual.length, sha256: digest(actual) });
    if (relative === 'release.json') {
      const receipt = JSON.parse(actual.toString());
      assert.deepEqual(receipt, expected); report.release = receipt;
    }
  }
  const root = await fetch(base, { signal: AbortSignal.timeout(30000), headers: { 'Cache-Control': 'no-cache' } });
  assert.equal(root.status, 200); assert.equal(digest(Buffer.from(await root.arrayBuffer())), digest(await readFile('dist/index.html')));
  report.checks.push({ name: 'root serves exact candidate index', status: root.status });
  const production = await fetch('https://firecrackers.mainandmany.com/release.json', { signal: AbortSignal.timeout(30000), headers: { 'Cache-Control': 'no-cache' } }).then(response => response.json());
  const productionVersion = process.env.WATER_PRODUCTION_VERSION || '2026-10-01.4';
  const productionFingerprint = process.env.WATER_PRODUCTION_FINGERPRINT || '965c6eaa6ebd5aef2f5922831504a6bbe1c3879e24a26532432af279f5e09d51';
  assert.equal(production.version, productionVersion);
  assert.equal(production.sha256, productionFingerprint);
  report.production = { version: production.version, sha256: production.sha256 };
  report.checks.push({ name: process.env.WATER_PRODUCTION_FINGERPRINT ? 'production matches explicitly selected release' : 'production unchanged', version: production.version, sha256: production.sha256 });
} catch (error) { report.failed = error.stack; process.exitCode = 1; console.error(error); }
await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ base, checks: report.checks.length, version: report.release?.version, fingerprint: report.release?.sha256, failed: report.failed }));
