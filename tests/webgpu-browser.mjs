import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { chooseFamily } from './stage-helpers.mjs';

// Opt-in hardware qualification: no SwiftShader flags and no silently accepted WebGL fallback.
const base = process.env.WEBGPU_URL || 'http://127.0.0.1:4180/';
const out = process.argv[2] || 'test-results/webgpu';
await mkdir(out, { recursive: true });
const report = { url: base, errors: [], checks: [], adapter: null, screenshots: [] };
const browser = await chromium.launch({ channel: 'chrome', headless: false });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
  await page.addInitScript(() => {
    if (!navigator.gpu) return;
    const original = GPUAdapter.prototype.requestDevice;
    GPUAdapter.prototype.requestDevice = async function (...args) {
      window.__testedAdapter = { vendor: this.info.vendor, architecture: this.info.architecture, fallback: this.info.isFallbackAdapter };
      const device = await original.apply(this, args);
      device.addEventListener('uncapturederror', e => console.error('GPU validation: ' + e.error.message));
      return device;
    };
  });
  await page.goto(new URL('?backend=webgpu&qa=1', base).href);
  await page.waitForFunction(() => window.__firecrackersQA && Object.values(window.__firecrackersQA.snapshot().authoredAssetStates || {}).every(s => s === 'active'));
  assert.equal(await page.locator('main').getAttribute('data-backend'), 'WebGPU');
  report.adapter = await page.evaluate(() => window.__testedAdapter);
  assert.equal(report.adapter.fallback, false, 'Hardware evidence must not use a fallback adapter');
  report.checks.push('All six assets activate on hardware WebGPU at default Ultra');
  await page.getByRole('button', { name: 'Launch selected firework', exact: true }).click();
  await page.waitForFunction(() => window.__firecrackersQA.snapshot().bursts > 0, null, { timeout: 30000 });
  assert.equal(await page.locator('main').getAttribute('data-backend'), 'WebGPU');
  report.checks.push('Real-time Willow launch stays on WebGPU through burst');
  await page.evaluate(() => window.__firecrackersQA.freeze(true));
  await page.evaluate(() => window.__firecrackersQA.advance(35));
  for (const name of ['Gold Willow', 'Sapphire Saturn', 'Opal Supernova']) {
    await chooseFamily(page, name);
    await page.getByRole('button', { name: 'Launch selected firework', exact: true }).click();
    await page.evaluate(() => window.__firecrackersQA.advance(4.5));
    await page.screenshot({ path: `${out}/${name.replaceAll(' ', '-')}.png` });
    report.screenshots.push(`${name.replaceAll(' ', '-')}.png`);
    await page.evaluate(() => window.__firecrackersQA.advance(40));
    assert.equal(await page.locator('main').getAttribute('data-backend'), 'WebGPU');
    report.checks.push(`${name}: deterministic rendered burst and cleanup`);
  }
  await page.evaluate(() => { window.__firecrackersQA.freeze(false); window.__firecrackersQA.injectOverloadSamples(3, 400); });
  await page.getByRole('button', { name: 'Launch selected firework', exact: true }).click();
  const id = await page.evaluate(() => window.__firecrackersQA.snapshot().committedId);
  await page.waitForFunction(() => window.__firecrackersQA.snapshot().backend === 'WebGL 2');
  const recovered = await page.evaluate(() => window.__firecrackersQA.snapshot());
  assert.equal(recovered.quality, 'ultra');
  assert.equal(recovered.committedId, id);
  report.checks.push('WebGPU overload retains active rocket and Ultra through WebGL recovery');
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
