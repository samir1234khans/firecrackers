import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { qualifyGalacticSky } from './galactic-checks.mjs';
const base = process.env.GALACTIC_URL || 'http://127.0.0.1:4173/';
const output = path.resolve(process.argv[2] || 'test-results/galactic-interaction');
await mkdir(output, { recursive: true });
const catalog = await readFile(new URL('../src/engine/catalog.ts', import.meta.url), 'utf8');
const expectedVersion = catalog.match(/CONFIG_VERSION\s*=\s*'([^']+)'/)[1];
const report = { url: base, expectedVersion, method: 'Headless software WebGL and Canvas; real DOM mouse/CDP touch, controlled visibility and QA shared time; no hardware/mobile performance claim', checks: [], errors: [], failed: null };
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
try {
  for (const project of [{ name: 'desktop-webgl', width: 1280, height: 800, backend: 'webgl', touch: false },
    { name: 'portrait-webgl', width: 393, height: 851, backend: 'webgl', touch: true },
    { name: 'portrait-canvas', width: 393, height: 851, backend: 'canvas', touch: true }]) {
    const context = await browser.newContext({ viewport: { width: project.width, height: project.height }, hasTouch: project.touch, isMobile: project.touch, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(`${project.name}: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') report.errors.push(`${project.name}: ${message.text()}`); });
    const url = new URL(base); url.search = `backend=${project.backend}&qa=1&seed=20260916`;
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('main')?.dataset.ready === 'true' && window.__firecrackersQA, undefined, { timeout: 90000 });
    assert.equal(await page.locator('main').getAttribute('data-version'), expectedVersion);
    assert.equal((await page.evaluate(() => window.__firecrackersQA.snapshot())).backend, project.backend === 'webgl' ? 'WebGL 2' : 'Canvas 2D · compatibility');
    await qualifyGalacticSky(page, project.name, (name, details) => { report.checks.push({ name, ...details }); console.log('PASS', name); },
      phase => page.screenshot({ path: path.join(output, `${project.name}-${phase}.png`) }), { touch: project.touch });
    await context.close();
  }
  assert.deepEqual(report.errors, []);
} catch (error) { report.failed = error.stack || String(error); process.exitCode = 1; console.error(report.failed); }
finally { report.finishedAt = new Date().toISOString(); await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); await browser.close(); }
