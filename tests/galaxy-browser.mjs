import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chooseFamily } from './stage-helpers.mjs';
import { qualifyGalacticSky } from './galactic-checks.mjs';

// Opt-in installed-Chrome hardware qualification; portrait viewports are emulation.
// This checks behavior and captures appearance, not GPU timing or phone endurance.
const base = process.env.GALAXY_URL || 'http://127.0.0.1:4183/';
const output = path.resolve(process.argv[2] || 'test-results/galaxy');
const catalog = await readFile(new URL('../src/engine/catalog.ts', import.meta.url), 'utf8');
const expectedVersion = catalog.match(/CONFIG_VERSION\s*=\s*'([^']+)'/)[1];
const expectedAssetCount = 8;
const seed = 20260916;
const report = { url: base, expectedVersion, expectedAssetCount, seed, startedAt: new Date().toISOString(),
  method: 'Installed Chrome headed; no software GPU flags. Hardware WebGPU and WebGL are asserted separately. Independent seeded captures use deterministic 60 Hz stepping.',
  limitations: 'Portrait is viewport/touch emulation on this PC. No physical-phone, thermal, completed-GPU-frame timing or long-duration performance claim.',
  projects: [], checks: [], errors: [], expectedRequestFailures: [], idleObservations: [], failed: null };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: false });
report.browserVersion = browser.version();
let current;
const snap = page => page.evaluate(() => window.__firecrackersQA.snapshot());
const check = (name, details = {}) => { report.checks.push({ name, ...details }); console.log('PASS', name); };
function instrument(page, label, missingAsset = null) {
  page.on('pageerror', error => report.errors.push(`${label}: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    if (missingAsset && /Failed to load resource: net::ERR_FAILED/.test(message.text()) &&
        message.location().url.includes(missingAsset)) return;
    report.errors.push(`${label}: ${message.text()}`);
  });
  page.on('requestfailed', request => {
    if (missingAsset && request.url().includes(missingAsset))
      report.expectedRequestFailures.push({ url: request.url(), reason: request.failure()?.errorText });
  });
}
async function adapterProbe(page) {
  await page.addInitScript(() => {
    if (!navigator.gpu) return;
    const original = GPUAdapter.prototype.requestDevice;
    GPUAdapter.prototype.requestDevice = async function (...args) {
      window.__testedAdapter = { vendor: this.info.vendor, architecture: this.info.architecture,
        device: this.info.device, description: this.info.description, fallback: this.info.isFallbackAdapter };
      const device = await original.apply(this, args);
      device.addEventListener('uncapturederror', event => console.error(`GPU validation: ${event.error.message}`));
      return device;
    };
  });
}
async function enter(page, backend, extra = {}) {
  const url = new URL(base);
  Object.entries({ backend, qa: '1', seed: String(seed), ...extra }).forEach(([key, value]) => url.searchParams.set(key, value));
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('main')?.dataset.ready === 'true' && window.__firecrackersQA,
    undefined, { timeout: 90000 });
  const expected = backend === 'webgpu' ? 'WebGPU' : backend === 'webgl' ? 'WebGL 2' : 'Canvas 2D · compatibility';
  assert.equal((await snap(page)).backend, expected, 'The requested renderer must actually be active');
  assert.equal(await page.locator('main').getAttribute('data-version'), expectedVersion);
  return expected;
}
async function activeAssets(page) {
  await page.waitForFunction(expected => {
    const states = window.__firecrackersQA.snapshot().authoredAssetStates;
    return states && Object.keys(states).length === expected && Object.values(states).every(state => state === 'active');
  }, expectedAssetCount, { timeout: 90000 });
}
async function resetFrozen(page) {
  await page.evaluate(() => window.__firecrackersQA.freeze(true));
  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  await page.getByRole('button', { name: 'Reset this sky', exact: true }).click();
  await page.getByRole('button', { name: 'Reset sky and preferences', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('main').dataset.overlay === 'none');
  assert.equal((await snap(page)).time, 0);
}
async function advance(page, seconds) {
  await page.evaluate(value => window.__firecrackersQA.advance(value), seconds);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => { window.__firecrackersQA.render(); resolve(); })));
}
async function capture(page, project, phase) {
  const file = `${project.label}-${phase}.png`;
  await page.screenshot({ path: path.join(output, file) });
  project.captures.push({ phase, file, snapshot: await snap(page) });
}
async function riverDetail(page, project) {
  const file = `${project.label}-river-detail.png`, { width, height } = project.viewport;
  const clip = { x: 0, y: Math.floor(height * .43), width, height: Math.floor(height * .48) };
  await page.screenshot({ path: path.join(output, file), clip });
  project.captures.push({ phase: 'river-detail', file, clip, snapshot: await snap(page) });
}
async function settledLayout(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    return new Promise((resolve, reject) => {
      let frame, previous, stable = 0;
      const deadline = setTimeout(() => { cancelAnimationFrame(frame); reject(new Error('Viewport/control layout did not settle')); }, 5000);
      const measure = () => {
        const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
        const state = { viewport: { width: innerWidth, height: innerHeight, scale: visualViewport?.scale || 1 },
          scene: rect(document.querySelector('.scene-host')), groups: [...document.querySelectorAll('[data-edge]')].map(element => ({ name: element.dataset.edge, ...rect(element) })) };
        const serialized = JSON.stringify(state);
        stable = serialized === previous ? stable + 1 : 0; previous = serialized;
        if (stable >= 6) { clearTimeout(deadline); resolve(state); }
        else frame = requestAnimationFrame(measure);
      };
      frame = requestAnimationFrame(measure);
    });
  });
}
async function layoutObservation(page) {
  return page.evaluate(() => {
    const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
    return { visibility: document.visibilityState, fontStatus: document.fonts.status,
      activeElement: document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName,
      viewport: { width: innerWidth, height: innerHeight, scale: visualViewport?.scale || 1 }, scene: rect(document.querySelector('.scene-host')),
      groups: [...document.querySelectorAll('[data-edge]')].map(element => ({ name: element.dataset.edge, ...rect(element) })) };
  });
}
async function pauseAndIdle(page, label) {
  assert.ok((await snap(page)).particles > 0, 'Pause should be checked during a visible burst');
  await page.getByRole('button', { name: 'Pause scene', exact: true }).click();
  await page.evaluate(() => window.__firecrackersQA.freeze(false));
  await page.waitForTimeout(250);
  const paused = await snap(page);
  await page.waitForTimeout(650);
  const later = await snap(page);
  assert.equal(paused.paused, true); assert.equal(later.time, paused.time);
  assert.equal(later.frames, paused.frames, 'A paused scene must not keep rendering the animated sky');
  assert.equal(later.particles, paused.particles);
  assert.equal(later.riverMotionTime, paused.riverMotionTime, 'Boat movement uses the same paused world clock');
  assert.deepEqual(later.riverPositions, paused.riverPositions, 'Boats must not continue moving while paused');
  check(`${label}: pause holds the world clock, particles and render count`, { time: later.time, frames: later.frames });
  await page.evaluate(() => window.__firecrackersQA.freeze(true));
  await page.getByRole('button', { name: 'Resume scene', exact: true }).click();
  await advance(page, 40);
  const drained = await snap(page);
  assert.equal(drained.active, 0); assert.equal(drained.particles, 0); assert.equal(drained.smoke, 0); assert.equal(drained.carriers, 0);
  await page.evaluate(() => window.__firecrackersQA.freeze(false));
  await page.waitForTimeout(250);
  await settledLayout(page);
  const idle = await snap(page);
  const layoutBefore = await layoutObservation(page);
  await page.waitForTimeout(750);
  const idleLater = await snap(page);
  const layoutAfter = await layoutObservation(page);
  report.idleObservations.push({ label, idle, idleLater, layoutBefore, layoutAfter, frameDelta: idleLater.frames - idle.frames });
  const frameDelta = idleLater.frames - idle.frames;
  assert.ok(frameDelta > 0 && frameDelta <= 18,
    `An idle Ultra sky must use its bounded 20 Hz ambient cadence: ${JSON.stringify({ label, frameDelta, time: idle.time, laterTime: idleLater.time, paused: idle.paused, laterPaused: idleLater.paused, backend: idle.backend, laterBackend: idleLater.backend })}`);
  assert.equal(idleLater.quality, 'ultra');
  check(`${label}: complete effect cleanup and bounded ambient idle rendering`, { frameDelta });
}
try {
  for (const device of [{ name: 'desktop', width: 1280, height: 800, mobile: false, backends: ['webgpu', 'webgl'] },
    { name: 'portrait', width: 393, height: 851, mobile: true, backends: ['webgpu', 'webgl'] },
    { name: 'landscape', width: 844, height: 390, mobile: true, backends: ['webgpu'] }]) for (const backend of device.backends) {
    const project = { label: `${device.name}-${backend}`, viewport: { width: device.width, height: device.height },
      requestedBackend: backend, captures: [] };
    report.projects.push(project);
    const context = await browser.newContext({ viewport: project.viewport, deviceScaleFactor: 1,
      isMobile: device.mobile, hasTouch: device.mobile, serviceWorkers: 'block' });
    const page = current = await context.newPage(); instrument(page, project.label); await adapterProbe(page);
    project.actualBackend = await enter(page, backend); await activeAssets(page);
    project.release = await page.evaluate(async () => {
      const response = await fetch('/release.json', { cache: 'no-store' });
      const { version, sha256, formatVersion } = await response.json();
      return { version, sha256, formatVersion };
    });
    assert.equal(project.release.version, expectedVersion);
    project.hardware = await page.evaluate(() => {
      const canvas = document.querySelector('.scene-host canvas');
      let gl; try { gl = canvas.getContext('webgl2'); } catch { /* A WebGPU canvas cannot supply WebGL. */ }
      const extension = gl?.getExtension('WEBGL_debug_renderer_info');
      return { adapter: window.__testedAdapter || null, webgl: extension ?
        { vendor: gl.getParameter(extension.UNMASKED_VENDOR_WEBGL), renderer: gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) } : null };
    });
    if (backend === 'webgpu') assert.equal(project.hardware.adapter?.fallback, false, 'Require hardware WebGPU');
    else { assert.ok(project.hardware.webgl); assert.doesNotMatch(project.hardware.webgl.renderer, /SwiftShader|llvmpipe|software/i); }
    const initial = await snap(page); assert.equal(initial.quality, 'ultra');
    assert.equal(initial.riverScenery, 'Blender river-life-v007');
    assert.match(initial.riverBoatSource, /Wooden Canoe by OuterSpaceSimon.*CC0/);
    assert.equal(initial.riverBoats, 3); assert.equal(initial.riverLampAnchors, 10);
    assert.ok(initial.riverReflectionFragments <= 80);
    assert.ok(initial.riverPbrTextures > 0, 'The authored river must activate real PBR texture maps');
    assert.ok(initial.riverPbrColorMaps > 0 && initial.riverPbrDataMaps > 0, 'Require both albedo and material data maps');
    assert.equal(initial.riverPbrColorSpacesCorrect, true, 'PBR albedo is sRGB; normal/roughness/metallic maps remain linear data');
    assert.ok(initial.riverTextureMemoryEstimateBytes > 0, 'Record decoded texture storage rather than only compressed download size');
    project.riverResources = { source: initial.riverBoatSource, textureCount: initial.riverPbrTextures,
      colorMaps: initial.riverPbrColorMaps, dataMaps: initial.riverPbrDataMaps,
      estimatedDecodedTextureBytes: initial.riverTextureMemoryEstimateBytes,
      estimateMethod: 'Unique loaded RGBA8 maps plus full mip chain; not measured GPU allocation' };
    await page.getByRole('button', { name: 'Open settings', exact: true }).click();
    assert.equal(await page.getByRole('checkbox', { name: 'Reduced flashes', exact: true }).isChecked(), true);
    await page.getByRole('button', { name: 'Close panel', exact: true }).click();
    check(`${project.label}: all eight assets, default Ultra and reduced flashes on actual hardware`);
    if (backend === 'webgpu' && device.name !== 'landscape')
      await qualifyGalacticSky(page, project.label, check, phase => capture(page, project, phase), { touch: device.mobile });
    await resetFrozen(page); await capture(page, project, 'idle'); await riverDetail(page, project);
    await chooseFamily(page, 'Gold Willow');
    await page.getByRole('button', { name: 'Launch selected firework', exact: true }).click();
    await advance(page, 4.9); await capture(page, project, 'willow-peak');
    await pauseAndIdle(page, project.label);
    await resetFrozen(page); await chooseFamily(page, 'Sapphire Saturn');
    await page.getByRole('button', { name: 'Launch selected firework', exact: true }).click();
    await advance(page, 4.9); await capture(page, project, 'saturn-peak');
    assert.equal((await snap(page)).backend, project.actualBackend);
    await resetFrozen(page); await chooseFamily(page, 'Opal Supernova');
    await page.getByRole('button', { name: 'Launch selected firework', exact: true }).click();
    await advance(page, 7.8); await capture(page, project, 'supernova-peak');
    assert.equal((await snap(page)).backend, project.actualBackend);
    await advance(page, 40);
    const supernovaDone = await snap(page);
    assert.equal(supernovaDone.active, 0); assert.equal(supernovaDone.particles, 0);
    assert.equal(supernovaDone.smoke, 0); assert.equal(supernovaDone.carriers, 0);
    check(`${project.label}: Supernova traveling children and residue completely clean up`);
    check(`${project.label}: seeded Willow, Saturn and Supernova captures retain the requested renderer`);
    if (device.name === 'desktop' && backend === 'webgl') {
      await page.getByRole('button', { name: 'Open settings', exact: true }).click();
      await page.getByLabel('Graphics quality', { exact: true }).selectOption('standard');
      await page.getByRole('button', { name: 'Close panel', exact: true }).click();
      await enter(page, backend); await activeAssets(page);
      assert.equal((await snap(page)).quality, 'standard');
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('firecrackers.preferences.v1')));
      assert.equal(saved.quality, 'standard'); assert.equal(saved.reducedFlashes, true);
      check('Saved Standard quality and reduced-flash preference survive the new sky and reload');
    }
    if (device.name === 'portrait' && backend === 'webgl') {
      await context.route('**/art/waterfront-night-v005.webp', route => route.abort());
      const fallback = current = await context.newPage(); instrument(fallback, 'missing-sky', 'waterfront-night-v005.webp');
      await enter(fallback, 'webgl');
      await fallback.waitForFunction(() => window.__firecrackersQA.snapshot().authoredAssetStates.sky === 'failed');
      await fallback.evaluate(() => window.__firecrackersQA.freeze(true));
      await fallback.getByRole('button', { name: 'Launch selected firework', exact: true }).click();
      await advance(fallback, 5);
      const state = await snap(fallback); assert.ok(state.bursts > 0); assert.ok(state.authoredAssetErrors.sky);
      assert.equal(state.backend, 'WebGL 2'); assert.equal(state.quality, 'ultra');
      await fallback.screenshot({ path: path.join(output, 'portrait-webgl-missing-sky.png') });
      check('Missing authored sky retains a playable original procedural/celestial fallback', { error: state.authoredAssetErrors.sky });
      await context.unroute('**/art/waterfront-night-v005.webp');
      await context.route('**/art/river-life-v007.glb', route => route.abort());
      const riverFallback = current = await context.newPage(); instrument(riverFallback, 'missing-river', 'river-life-v007.glb');
      await enter(riverFallback, 'webgl');
      await riverFallback.waitForFunction(() => {
        const states = window.__firecrackersQA.snapshot().authoredAssetStates;
        return states.river === 'failed' && states.sky === 'active';
      });
      await riverFallback.evaluate(() => window.__firecrackersQA.freeze(true));
      await riverFallback.getByRole('button', { name: 'Launch selected firework', exact: true }).click();
      await advance(riverFallback, 5);
      const riverState = await snap(riverFallback);
      assert.ok(riverState.bursts > 0); assert.ok(riverState.authoredAssetErrors.river);
      assert.equal(riverState.backend, 'WebGL 2'); assert.equal(riverState.quality, 'ultra');
      assert.equal(riverState.riverScenery, 'procedural river fallback');
      assert.equal(riverState.riverBoats, 3); assert.equal(riverState.riverLampAnchors, 10);
      assert.ok(riverState.riverReflectionFragments <= 80);
      await riverFallback.screenshot({ path: path.join(output, 'portrait-webgl-missing-river.png') });
      check('Missing authored river retains three boats including the candlelit nauka, bounded reflections and a playable WebGL fallback', { error: riverState.authoredAssetErrors.river });
    }
    await context.close(); current = null;
  }
  const context = await browser.newContext({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true,
    reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = current = await context.newPage(); instrument(page, 'canvas');
  const project = { label: 'portrait-canvas', viewport: { width: 393, height: 851 }, requestedBackend: 'canvas', captures: [] };
  report.projects.push(project); project.actualBackend = await enter(page, 'canvas');
  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  assert.equal(await page.getByRole('checkbox', { name: 'Reduced interface motion', exact: true }).isChecked(), true);
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  check('OS reduced-motion preference initializes the existing comfort control');
  await resetFrozen(page); await capture(page, project, 'idle');
  const canvasRiver = await snap(page);
  assert.equal(canvasRiver.riverBoats, 3); assert.equal(canvasRiver.riverLampAnchors, 10);
  assert.equal(canvasRiver.riverMotionTime, 0, 'OS reduced motion keeps the Canvas river static');
  check('Canvas retains three boats and ten lamp anchors under the static reduced-motion preference');
  await page.getByRole('button', { name: 'Launch selected firework', exact: true }).click();
  await advance(page, 4.9); await capture(page, project, 'willow-peak');
  assert.ok((await snap(page)).bursts > 0);
  check('Canvas portrait fallback retains the celestial scene and functional fireworks');
  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  await page.getByLabel('Graphics quality', { exact: true }).selectOption('low');
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.evaluate(() => window.__firecrackersQA.render());
  const lowRiver = await snap(page);
  assert.equal(lowRiver.quality, 'low'); assert.equal(lowRiver.riverMotionTime, 0);
  assert.equal(lowRiver.riverReflectionFragments, 40, 'Low quality bounds the ten lamp anchors to forty fragments');
  check('Explicit Low quality preserves the boats and caps Canvas river reflections at forty fragments');
  await enter(page, 'canvas', { display: 'transparent' });
  await page.evaluate(() => window.__firecrackersQA.freeze(true));
  assert.equal(await page.locator('main').getAttribute('data-display'), 'transparent');
  const skyAlpha = await page.locator('.scene-host canvas').evaluate(canvas => {
    const context = canvas.getContext('2d');
    return [[.1, .1], [.5, .1], [.9, .1], [.25, .35], [.75, .35], [.1, .8], [.9, .8]].map(([x, y]) =>
      context.getImageData(Math.floor(canvas.width * x), Math.floor(canvas.height * y), 1, 1).data[3]);
  });
  assert.deepEqual(skyAlpha, [0, 0, 0, 0, 0, 0, 0], 'Transparent output must exclude sky and river art');
  await page.screenshot({ path: path.join(output, 'portrait-canvas-transparent.png'), omitBackground: true });
  check('Transparent Canvas presentation excludes the celestial sky', { alphaSamples: skyAlpha });
  await context.close(); current = null;
  assert.deepEqual(report.errors, [], 'No application or GPU validation errors');
} catch (error) {
  report.failed = error.stack || String(error); process.exitCode = 1; console.error(report.failed);
  await current?.screenshot({ path: path.join(output, 'FAILED.png') }).catch(() => {});
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
