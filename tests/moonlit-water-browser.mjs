import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { inspectStage, openPanel, settingsTab } from './stage-helpers.mjs';

const base = process.env.WATER_URL || 'http://127.0.0.1:4173/';
const out = process.argv[2] || 'test-results/moonlit-water';
const seed = 20260916;
const viewports = [[320, 480], [375, 667], [393, 851], [768, 1024], [844, 390], [1280, 800], [1920, 1080]];
const labels = { webgpu: 'WebGPU', webgl: 'WebGL 2', canvas: 'Canvas 2D · compatibility' };
const report = {
  base, seed,
  method: 'Installed Chrome on this PC; native WebGPU adapter and native WebGL driver checked separately; Canvas 2D compatibility. Viewports and touch are emulated. Physical phones, GPU completion timing and thermal endurance are not qualified.',
  checks: [], errors: [], expectedFailures: [], failed: null,
};
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let page;
const snap = () => page.evaluate(() => window.__firecrackersQA.snapshot());
const render = () => page.evaluate(() => window.__firecrackersQA.render());
const advance = seconds => page.evaluate(seconds => window.__firecrackersQA.advance(seconds), seconds);
const pass = (name, details = {}) => { report.checks.push({ name, ...details }); console.log('PASS', name); };

function inspectWater(state, backend, quality, visible = true) {
  const waves = quality === 'ultra' ? 4 : quality === 'standard' ? 2 : 0;
  assert.equal(state.backend, labels[backend], 'The requested backend must remain active');
  assert.equal(state.quality, quality);
  assert.equal(state.waterVisible, visible);
  assert.equal(state.waterWaveCount, waves);
  assert.equal(state.riverWaterWaveCount, waves);
  assert.equal(state.waterPhase, state.riverWaterPhase, 'Surface and boat sampling must share one phase');
  assert.ok(Number.isFinite(state.waterPhase));
  assert.ok(state.waterDisplacementBound <= .510001);
  assert.equal(state.riverContactCapacity, 21);
  assert.equal(state.riverReflectionCapacity, 80);
  assert.ok(state.riverWaterContactInstances >= 0 && state.riverWaterContactInstances <= 21);
  assert.ok(state.riverReflectionFragments >= 0 && state.riverReflectionFragments <= 80);
  assert.equal(state.riverHullSamples.length, 3);
  for (const hull of state.riverHullSamples) {
    for (const value of Object.values(hull)) assert.ok(Number.isFinite(value), 'Hull diagnostics must be finite');
    assert.ok(Math.abs(hull.height) <= .510001);
    assert.ok(Math.abs(hull.pitch) < .2 && Math.abs(hull.roll) < .2, 'Calm water keeps the hull stable');
    assert.ok(Math.abs(hull.centerDeviation) <= .510001);
  }
  if (backend !== 'canvas') {
    assert.equal(state.riverReflectionProxyDraws, 4);
    assert.equal(state.riverReflectionProxyBoats, 3);
    assert.ok(state.riverReflectionProxyShelters >= 0 && state.riverReflectionProxyShelters <= 3);
    assert.ok(state.riverReflectionProxyHomes >= 0 && state.riverReflectionProxyHomes <= 12);
    assert.ok(state.riverReflectionProxyLamps >= 0 && state.riverReflectionProxyLamps <= 10);
    assert.ok(Number.isFinite(state.riverReflectionProxyChecksum));
    assert.equal(state.reflectionParticleBatchCapacity, 12);
    assert.ok(state.reflectionParticleBatches >= 0 && state.reflectionCulledParticleBatches >= 0);
    assert.ok(state.reflectionParticleBatches + state.reflectionCulledParticleBatches <= 12);
  }
  const planar = backend !== 'canvas' && quality !== 'low' && visible;
  assert.equal(state.reflectionAllocated, planar);
  assert.equal(state.reflectionTargets, planar ? 1 : 0);
  if (planar) {
    const cap = quality === 'ultra' ? 512 : 256;
    assert.ok(state.reflectionWidth > 0 && state.reflectionHeight > 0);
    assert.ok(Math.max(state.reflectionWidth, state.reflectionHeight) <= cap);
    const portraitWater = state.waterFarZ === -180;
    const expectedHz = quality === 'ultra' ? (portraitWater ? 15 : 20) : (portraitWater ? 10 : 15);
    assert.equal(state.reflectionHz, expectedHz, 'Selected mirror cadence follows the explicit portrait budget');
    assert.equal(state.reflectionMode, 'planar');
    assert.equal(state.reflectionClipCoordinateSystem, backend);
    assert.ok(state.reflectionCameraY < state.reflectionPlaneY, 'Reflection camera lies below the mean water plane');
    assert.ok(state.reflectionCropTop >= 0 && state.reflectionCropBottom <= 1);
    assert.ok(state.reflectionCropHeight > 0 && state.reflectionCropHeight <= 1);
    assert.ok(Math.abs(state.reflectionCropBottom - state.reflectionCropTop - state.reflectionCropHeight) < 1e-10);
  } else {
    assert.equal(state.reflectionWidth, 0); assert.equal(state.reflectionHeight, 0); assert.equal(state.reflectionHz, 0);
  }
  return {
    backend: state.backend, quality, phase: state.waterPhase, waves,
    dimensions: [state.reflectionWidth, state.reflectionHeight], reflectionHz: state.reflectionHz,
    hulls: state.riverHullSamples,
  };
}

function waterPose(state) {
  return {
    phase: state.waterPhase, riverPhase: state.riverWaterPhase, positions: state.riverPositions,
    hulls: state.riverHullSamples, contacts: state.riverContactChecksum, reflections: state.riverReflectionChecksum,
    reflectionProxies: state.riverReflectionProxyChecksum,
  };
}

async function enter(backend, missingNormal = false) {
  page = await browser.newPage({ viewport: { width: 393, height: 851 }, hasTouch: true, serviceWorkers: 'block' });
  page.on('pageerror', error => report.errors.push({ backend, message: error.message }));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    if (missingNormal && /Failed to load resource: net::ERR_FAILED/.test(message.text())) {
      report.expectedFailures.push({ backend, message: message.text() });
    } else report.errors.push({ backend, message: message.text() });
  });
  if (missingNormal) await page.route('**/art/water-normal-v005.png', route => route.abort());
  const url = new URL(base); url.searchParams.set('backend', backend); url.searchParams.set('qa', '1'); url.searchParams.set('seed', String(seed));
  await page.goto(url.href);
  await page.waitForSelector('main[data-ready="true"][data-presented="true"]', { timeout: 90000 });
  await page.waitForFunction(() => window.__firecrackersQA?.snapshot().moon?.ready, undefined, { timeout: 90000 });
  if (backend !== 'canvas') await page.waitForFunction(missingNormal => {
    const states = window.__firecrackersQA.snapshot().authoredAssetStates;
    return states && Object.entries(states).every(([name, state]) => state === (missingNormal && name === 'normal' ? 'failed' : 'active'));
  }, missingNormal, { timeout: 90000 });
  await page.evaluate(() => window.__firecrackersQA.freeze(true));
  await render();
  assert.equal((await snap()).backend, labels[backend]);
}

async function graphics(change) {
  await openPanel(page, 'settings'); await settingsTab(page, 'Graphics');
  await change(); await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await render();
}

try {
  for (const backend of ['webgpu', 'webgl', 'canvas']) {
    await enter(backend);
    if (backend === 'webgpu') {
      const adapter = await page.evaluate(async () => {
        const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        return adapter ? { vendor: adapter.info.vendor, architecture: adapter.info.architecture, fallback: adapter.info.isFallbackAdapter } : null;
      });
      assert.ok(adapter); assert.equal(adapter.fallback, false); pass('Native WebGPU adapter', adapter);
    }
    if (backend === 'webgl') {
      const driver = await page.evaluate(() => {
        const canvas = [...document.querySelectorAll('main canvas')].find(canvas => canvas.getContext('webgl2'));
        const gl = canvas?.getContext('webgl2'), extension = gl?.getExtension('WEBGL_debug_renderer_info');
        return extension ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : '';
      });
      assert.ok(driver, 'Native WebGL driver must be inspectable');
      assert.ok(!/swiftshader|llvmpipe|software|microsoft basic render/i.test(driver), driver);
      pass('Native WebGL driver', { driver });
    }
    report.checks.push({ name: `${backend}: source fingerprint`, release: await page.evaluate(() => fetch('/release.json').then(response => response.json())) });
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height }); await inspectStage(page); await advance(.1);
      const state = await snap();
      const details = inspectWater(state, backend, 'ultra');
      assert.equal(state.waterNearZ, -14.75);
      assert.ok([-1000, -180].includes(state.waterFarZ));
      await page.screenshot({ path: `${out}/${backend}-${width}x${height}.png` });
      pass(`${backend}/${width}x${height}: shared surface, hull contact and bounded reflections`, details);
    }
    await page.setViewportSize({ width: 1280, height: 800 }); await inspectStage(page); await advance(.1);
    await page.getByRole('button', { name: 'Pause scene', exact: true }).click(); await render();
    const paused = await snap();
    assert.equal(paused.paused, true);
    assert.ok(Number.isFinite(paused.riverContactChecksum)); assert.ok(Number.isFinite(paused.riverReflectionChecksum));
    await page.evaluate(() => window.__firecrackersQA.freeze(false)); await page.waitForTimeout(350);
    const held = await snap();
    assert.equal(held.time, paused.time); assert.deepEqual(waterPose(held), waterPose(paused));
    await page.evaluate(() => window.__firecrackersQA.freeze(true));
    await page.getByRole('button', { name: 'Resume scene', exact: true }).click(); await advance(.5);
    assert.ok((await snap()).waterPhase > paused.waterPhase);
    pass(`${backend}: pause freezes wave, boat, contact and reflected fragment transforms`);
    // Match the existing galactic CI's controlled visibility method, adding
    // checks for the new displaced surface and its complete contact state.
    // This exercises app lifecycle ownership, not OS background endurance.
    await page.evaluate(() => {
      window.__firecrackersQA.freeze(false);
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(100); const hidden = await snap();
    await page.waitForTimeout(350); const stillHidden = await snap();
    assert.equal(stillHidden.paused, true); assert.equal(stillHidden.time, hidden.time);
    assert.equal(stillHidden.frames, hidden.frames); assert.deepEqual(waterPose(stillHidden), waterPose(hidden));
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(100); const returned = await snap();
    assert.equal(returned.paused, true); assert.equal(returned.time, hidden.time);
    assert.deepEqual(waterPose(returned), waterPose(hidden));
    await page.evaluate(() => window.__firecrackersQA.freeze(true));
    await page.getByRole('button', { name: 'Resume scene', exact: true }).click(); await advance(.2);
    assert.ok((await snap()).waterPhase > hidden.waterPhase);
    pass(`${backend}: controlled hidden-page transition holds water and requires explicit resume`, {
      method: 'document.hidden override plus visibilitychange, matching existing galactic CI; not OS background endurance',
    });
    for (const quality of ['standard', 'low', 'ultra']) {
      await graphics(() => page.getByLabel('Graphics quality', { exact: true }).selectOption(quality)); await advance(.1);
      pass(`${backend}: ${quality} water tier`, inspectWater(await snap(), backend, quality));
    }
    await graphics(() => page.getByRole('checkbox', { name: 'Reduced interface motion', exact: true }).check());
    await advance(.1); const staticState = await snap();
    assert.equal(staticState.reducedMotion, true); assert.equal(staticState.waterMotionAllowed, false); assert.equal(staticState.waterPhase, 0);
    await advance(3); assert.deepEqual(waterPose(await snap()), waterPose(staticState));
    pass(`${backend}: reduced motion uses a stable shared water pose`);
    await graphics(() => page.getByRole('checkbox', { name: 'Reduced flashes', exact: true }).uncheck());
    assert.equal((await snap()).reducedFlashes, false); assert.equal((await snap()).waterPhase, 0);
    await graphics(() => page.getByRole('checkbox', { name: 'Reduced flashes', exact: true }).check());
    assert.equal((await snap()).reducedFlashes, true); assert.equal((await snap()).waterPhase, 0);
    pass(`${backend}: reduced flashes remains independent of water motion`);
    await openPanel(page, 'settings'); await settingsTab(page, 'Display');
    await page.getByLabel('Canvas output', { exact: true }).selectOption('transparent');
    await page.getByRole('button', { name: 'Close panel', exact: true }).click(); await render();
    inspectWater(await snap(), backend, 'ultra', false);
    pass(`${backend}: transparent output removes waterfront and its reflection allocation`);
    await page.close();
  }
  for (const backend of ['webgpu', 'webgl']) {
    await enter(backend, true);
    assert.equal((await snap()).authoredAssetStates.normal, 'failed');
    inspectWater(await snap(), backend, 'ultra');
    await page.locator('[data-family-icon="gold-willow"]').click(); await advance(1);
    const state = await snap(); assert.equal(state.launched, 1); assert.equal(state.backend, labels[backend]);
    inspectWater(state, backend, 'ultra');
    pass(`${backend}: missing normal texture preserves playable water and launch`);
    await page.close();
  }
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.failed = error.stack; process.exitCode = 1; console.error(error);
  if (page && !page.isClosed()) await page.screenshot({ path: `${out}/FAILED.png` }).catch(() => {});
} finally {
  await browser.close(); await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
}
console.log(`${report.checks.length} moonlit-water browser checks passed`);
