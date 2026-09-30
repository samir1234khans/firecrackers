import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.ASSET_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));
let releaseShells;
const shellsHeld = new Promise(resolve => { releaseShells = resolve; });

try {
  await context.route('**/art/paper-color.png', async route => { await shellsHeld; await route.continue(); });
  await context.route('**/art/rocket.glb', async route => { await shellsHeld; await route.continue(); });
  await context.route('**/art/terrace-v004.glb', route => route.abort());
  await context.route('**/art/waterfront-night-v005.webp', route => route.abort());
  await page.goto(new URL('?backend=webgl&qa=1', base).href, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('main[data-ready="true"]', { timeout: 60000 });
  await page.evaluate(() => window.__firecrackersQA.freeze(true));
  await page.getByRole('button', { name: 'Launch selected firework', exact: true }).click();
  assert.ok((await page.evaluate(() => window.__firecrackersQA.snapshot())).committedId,
    'The rocket should already be in flight while shell assets remain held');

  await page.waitForFunction(() => {
    const state = window.__firecrackersQA.snapshot().authoredAssetStates;
    return state.smoke === 'active' && state.normal === 'active' && state.flame === 'active' && state.terrace === 'failed' && state.sky === 'failed';
  }, undefined, { timeout: 30000 });
  let snapshot = await page.evaluate(() => window.__firecrackersQA.snapshot());
  assert.equal(snapshot.authoredAssetStates.paper, 'loading');
  assert.equal(snapshot.authoredAssetStates.rocket, 'loading');
  assert.ok(snapshot.authoredAssetErrors.terrace, 'The failed asset needs an exact diagnostic reason');
  assert.ok(snapshot.authoredAssetErrors.sky, 'Missing authored scenery must retain the procedural sky');
  assert.ok(snapshot.authoredAssets.includes('smoke'), 'Ready assets must not wait for the failed terrace');

  releaseShells();
  await page.waitForFunction(() => {
    const state = window.__firecrackersQA.snapshot().authoredAssetStates;
    return state.paper === 'ready' && state.rocket === 'ready';
  }, undefined, { timeout: 30000 });
  snapshot = await page.evaluate(() => window.__firecrackersQA.snapshot());
  assert.ok(snapshot.committedId, 'The committed body should still be in flight');
  assert.equal(snapshot.authoredAssetStates.paper, 'ready');
  assert.equal(snapshot.authoredAssetStates.rocket, 'ready');

  await page.evaluate(() => window.__firecrackersQA.advance(35));
  await page.waitForFunction(() => {
    const state = window.__firecrackersQA.snapshot().authoredAssetStates;
    return state.paper === 'active' && state.rocket === 'active';
  }, undefined, { timeout: 30000 });
  snapshot = await page.evaluate(() => window.__firecrackersQA.snapshot());
  assert.equal(snapshot.authoredAssetStates.terrace, 'failed');
  assert.equal(snapshot.authoredAssetStates.smoke, 'active');
  assert.deepEqual(pageErrors, []);
  console.log('PASS independent assets activate during flight; shell assets wait for body clearance; failed terrace keeps a procedural fallback');
} finally {
  releaseShells();
  await browser.close();
}
