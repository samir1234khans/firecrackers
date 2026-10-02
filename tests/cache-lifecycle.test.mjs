import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
const source = (await readFile('assets-source/service-worker/cache-lifecycle.template.js', 'utf8')).replace('__FIRECRACKERS_RELEASE__', 'candidate');
function harness({ active = true, denied = false, navigationWaitsForActivation = false } = {}) {
  const stores = new Map(); let activate; let claims = 0;
  const navigated = [];
  const clients = ['https://example.test/app/', 'https://example.test/app/?display=scene', 'https://example.test/other/', 'https://other.test/app/'].map(url => ({ url, async navigate(target) { navigated.push(target); if (navigationWaitsForActivation) return new Promise(() => {}); if (target.includes('?')) throw Error('Tab closed'); } }));
  const caches = {
    async keys() { if (denied) throw Error('Storage denied'); return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async open(name) {
      if (denied) throw Error('Storage denied');
      if (!stores.has(name)) stores.set(name, new Map());
      return { async match(key) { return stores.get(name).get(key); }, async put(key, value) { stores.get(name).set(key, value); } };
    },
  };
  runInNewContext(source, { URL, Response, caches, self: { registration: { active: active ? {} : null, scope: 'https://example.test/app/' }, addEventListener(_, callback) { activate = callback; }, clients: { async claim() { claims++; }, async matchAll() { return clients; } } } });
  return { stores, navigated, get claims() { return claims; }, async activate() { let pending; activate({ waitUntil(promise) { pending = promise; } }); await pending; } };
}
test('Upgrade deletes only obsolete Firecrackers runtime caches and migrates scoped legacy tabs', async () => {
  const h = harness();
  for (const name of ['firecrackers-art-v2', 'firecrackers-audio-v2', 'firecrackers-music-v1', 'firecrackers-art-candidate', 'firecrackers-music-candidate', 'other-app-data', 'workbox-precache-v2']) h.stores.set(name, new Map());
  await h.activate();
  assert.deepEqual([...h.stores.keys()].sort(), ['firecrackers-art-candidate', 'firecrackers-music-candidate', 'other-app-data', 'workbox-precache-v2']);
  assert.deepEqual(h.navigated, ['https://example.test/app/', 'https://example.test/app/?display=scene']);
  assert.equal(h.claims, 1);
});
test('Fresh installation claims clients without legacy migration navigation', async () => {
  const h = harness({ active: false }); await h.activate();
  assert.equal(h.claims, 1); assert.deepEqual(h.navigated, []);
});
test('Storage denial is nonfatal to activation', async () => {
  const h = harness({ denied: true }); await assert.doesNotReject(h.activate());
});
test('Activation completes when old-tab navigation waits for the replacement worker', { timeout: 1000 }, async () => {
  const h = harness({ navigationWaitsForActivation: true }); await h.activate();
  assert.equal(h.claims, 1); assert.equal(h.navigated.length, 2);
});
