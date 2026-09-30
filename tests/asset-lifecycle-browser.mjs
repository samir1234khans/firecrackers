import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.ASSET_URL || 'http://127.0.0.1:4173/';
const output = path.resolve(process.argv[2] || 'test-results/asset-lifecycle');
await mkdir(output, { recursive: true });
const report = { url: base, method: 'Headless Chromium / software WebGL 2; controlled decode and navigation timing',
  checks: [], consoleErrors: [], pageErrors: [], blobRequests: [], failed: null };
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
const page = await context.newPage();
page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
page.on('pageerror', error => report.pageErrors.push(error.message));
page.on('request', request => { if (request.url().startsWith('blob:')) report.blobRequests.push(request.url()); });
await page.addInitScript(() => {
  const state = window.__assetLifecycle = { pending: 0, blockedBlobFetches: 0, injectedFailures: 0, closedLargeBitmaps: 0,
    failedBlobURL: '', failedBlobRevoked: false };
  const params = new URLSearchParams(location.search);
  const nativeFetch = window.fetch.bind(window), nativeBitmap = window.createImageBitmap.bind(window);
  window.fetch = (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    if (url?.startsWith('blob:')) {
      state.blockedBlobFetches++;
      return Promise.reject(new TypeError('Controlled interruption of redundant embedded-image fetch'));
    }
    return nativeFetch(...args);
  };
  window.createImageBitmap = async (...args) => {
    const source = args[0];
    if (source instanceof Blob && source.size > 1_000_000) {
      if (params.has('holdDecode')) {
        state.pending++;
        await new Promise(() => {}); // Navigation destroys this deliberately held old scene.
      }
      if (params.has('failDecode') && state.injectedFailures === 0) {
        state.injectedFailures++;
        throw new DOMException('Controlled corrupt embedded image', 'InvalidStateError');
      }
    }
    return nativeBitmap(...args);
  };
  const close = ImageBitmap.prototype.close;
  ImageBitmap.prototype.close = function () {
    if (this.width === 2048 && this.height === 2048) state.closedLargeBitmaps++;
    return close.call(this);
  };
  if (params.has('legacyImages')) {
    // r180 selects native ImageLoader on Safari <17. Keep the actual Chromium
    // GPU capabilities intact while choosing precisely that glTF decoder path.
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 Version/16.6 Safari/605.1.15', configurable: true,
    });
    const createURL = URL.createObjectURL.bind(URL), revokeURL = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = source => {
      if (params.has('failDecode') && source.size > 1_000_000 && state.injectedFailures === 0) {
        state.injectedFailures++;
        state.failedBlobURL = createURL(new Blob(['controlled corrupt embedded image'], { type: source.type }));
        return state.failedBlobURL;
      }
      return createURL(source);
    };
    URL.revokeObjectURL = url => {
      if (url === state.failedBlobURL) state.failedBlobRevoked = true;
      return revokeURL(url);
    };
  }
});
const snapshot = () => page.evaluate(() => window.__firecrackersQA.snapshot());
async function enter(extra = '') {
  await page.goto(new URL(`?backend=webgl&qa=1${extra}`, base).href, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('main[data-ready="true"]', { timeout: 60000 });
}
async function active() {
  await page.waitForFunction(() => {
    const states = window.__firecrackersQA.snapshot().authoredAssetStates;
    return states && Object.keys(states).length === 8 && Object.values(states).every(state => state === 'active');
  },
    undefined, { timeout: 60000 });
}
const pass = (name, details = {}) => { report.checks.push({ name, ...details }); console.log('PASS', name); };
function assertRiverMaps(frame) {
  assert.equal(frame.riverPbrTextures, 6);
  assert.equal(frame.riverPbrColorMaps, 2);
  assert.equal(frame.riverPbrDataMaps, 4);
  assert.equal(frame.riverPbrColorSpacesCorrect, true);
}
try {
  await enter(); await active();
  let frame = await snapshot();
  assertRiverMaps(frame);
  assert.equal(frame.riverBoatSource, 'Wooden Canoe by OuterSpaceSimon, BlenderKit, CC0');
  assert.equal(await page.evaluate(() => window.__assetLifecycle.blockedBlobFetches), 0);
  pass('All eight enhancements and six shared PBR maps load without a second embedded-image fetch');

  await enter('&holdDecode=1');
  await page.waitForFunction(() => window.__assetLifecycle.pending === 3, undefined, { timeout: 60000 });
  frame = await snapshot(); assert.equal(frame.authoredAssetStates.river, 'loading');
  assert.equal(frame.riverScenery, 'procedural river fallback');
  await enter(); await active();
  frame = await snapshot(); assertRiverMaps(frame);
  pass('Navigating while all three large maps are decoding leaves the next scene intact without aborted blob requests');

  await enter('&failDecode=1');
  await page.waitForFunction(() => {
    const states = window.__firecrackersQA.snapshot().authoredAssetStates;
    return states.river === 'failed' && Object.entries(states).filter(([name]) => name !== 'river').every(([, state]) => state === 'active');
  }, undefined, { timeout: 60000 });
  frame = await snapshot();
  assert.match(frame.authoredAssetErrors.river, /Embedded image.*could not be decoded.*Controlled corrupt embedded image/);
  assert.equal(frame.riverScenery, 'procedural river fallback'); assert.equal(frame.riverPbrTextures, 0);
  assert.equal(frame.riverBoats, 3); assert.equal(frame.riverLampAnchors, 10);
  const lifecycle = await page.evaluate(() => window.__assetLifecycle);
  assert.equal(lifecycle.injectedFailures, 1); assert.equal(lifecycle.closedLargeBitmaps, 2);
  pass('One failed embedded map rejects the whole river enhancement and closes the other two decoded 2K maps', { lifecycle });
  assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.pageErrors, []); assert.deepEqual(report.blobRequests, []);
  pass('Strict console and page-error gates remain clear');

  await enter('&legacyImages=1'); await active();
  frame = await snapshot();
  assertRiverMaps(frame);
  assert.ok(report.blobRequests.length > 0, 'The legacy path must use actual native image requests');
  assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.pageErrors, []);
  pass('Native legacy ImageLoader retains all eight enhancements and six correctly configured PBR maps');

  await enter('&legacyImages=1&failDecode=1');
  await page.waitForFunction(() => {
    const states = window.__firecrackersQA.snapshot().authoredAssetStates;
    return states.river === 'failed' && Object.entries(states).filter(([name]) => name !== 'river').every(([, state]) => state === 'active');
  }, undefined, { timeout: 60000 });
  frame = await snapshot();
  assert.match(frame.authoredAssetErrors.river, /Image.*could not be decoded/);
  assert.equal(frame.riverScenery, 'procedural river fallback'); assert.equal(frame.riverPbrTextures, 0);
  assert.equal(frame.riverBoats, 3); assert.equal(frame.riverLampAnchors, 10);
  const legacy = await page.evaluate(() => window.__assetLifecycle);
  assert.equal(await page.evaluate(() => typeof ImageBitmap), 'function');
  assert.equal(legacy.injectedFailures, 1); assert.equal(legacy.failedBlobRevoked, true);
  pass('A corrupted legacy map rejects the whole enhancement and releases its failed object URL', { lifecycle: legacy });
  assert.deepEqual(report.consoleErrors, [`THREE.GLTFLoader: Couldn't load texture ${legacy.failedBlobURL}`]);
  assert.deepEqual(report.pageErrors, []);
  pass('Legacy failure emits exactly its controlled native diagnostic without unexpected errors');
} catch (error) {
  report.failed = error.stack || String(error); process.exitCode = 1; console.error(report.failed);
} finally {
  await browser.close();
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
}
