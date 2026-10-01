import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { openPanel, settingsTab } from './stage-helpers.mjs';

const base = process.env.WATER_URL || 'http://127.0.0.1:4173/';
const phase = process.env.CAPTURE_PHASE || 'after';
const out = path.resolve(process.argv[2] || 'test-results/moonlit-captures');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { base, phase, seed: 20260916, method: 'Installed Chrome; fixed logical times and seed; emulated viewports', projects: [], errors: [] };
try {
  for (const [width, height] of [[393, 851], [768, 1024], [1280, 800]]) {
    const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto(`${base}?backend=webgpu&qa=1&seed=20260916`);
    await page.waitForSelector('main[data-ready="true"][data-presented="true"]', { timeout: 90000 });
    await page.waitForFunction(() => Object.values(window.__firecrackersQA.snapshot().authoredAssetStates || {}).length >= 9 &&
      Object.values(window.__firecrackersQA.snapshot().authoredAssetStates).every(state => state === 'active'), undefined, { timeout: 90000 });
    await page.evaluate(() => window.__firecrackersQA.freeze(true));
    const release = await page.evaluate(() => fetch('/release.json').then(response => response.json()));
    for (const [family, seconds] of [['idle', 8], ['gold-willow', 4.9], ['sapphire-saturn', 4.9], ['opal-supernova', 5.6], ['imperial-crown', 5.4]]) {
      await openPanel(page, 'settings');
      await settingsTab(page, 'Device');
      await page.getByRole('button', { name: 'Reset this sky', exact: true }).click();
      await page.getByRole('button', { name: 'Reset sky and preferences', exact: true }).click();
      if (family !== 'idle') await page.locator(`[data-family-icon="${family}"]`).click();
      await page.mouse.move(width / 2, 30);
      await page.evaluate(seconds => { window.__firecrackersQA.advance(seconds); window.__firecrackersQA.render(); }, seconds);
      const snapshot = await page.evaluate(() => window.__firecrackersQA.snapshot());
      const file = `${phase}-${width}x${height}-${family}.png`;
      await page.screenshot({ path: path.join(out, file) });
      report.projects.push({ width, height, family, seconds, file, release: { version: release.version, sha256: release.sha256 }, snapshot });
      console.log('CAPTURE', phase, width, height, family, snapshot.backend);
    }
    await context.close();
  }
  if (report.errors.length) throw new Error(report.errors.join('\n'));
} catch (error) { report.failed = error.stack; throw error; }
finally { await writeFile(path.join(out, `${phase}.json`), JSON.stringify(report, null, 2)); await browser.close(); }
