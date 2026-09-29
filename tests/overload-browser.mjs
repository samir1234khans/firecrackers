import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { edgeShelf } from './stage-helpers.mjs';

const base = process.env.OVERLOAD_URL || 'http://127.0.0.1:4173/';
const out = process.argv[2] || 'test-results/overload';
await fs.mkdir(out, { recursive: true });
const report = { url: base, checks: [], errors: [], physicalDevice: false, injectedFrameSamples: true };
const pass = name => { report.checks.push(name); console.log('PASS', name); };
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const snap = page => page.evaluate(() => window.__firecrackersQA.snapshot());
const drag = async (page, icon, x, y) => {
  const box = await icon.boundingBox();
  assert.ok(box, 'The firework icon must be visible for a real pointer drag');
  const startX = box.x + box.width / 2, startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(50);
};
const enter = async page => {
  page.on('pageerror', error => report.errors.push(error.message));
  await page.goto(new URL('?backend=webgl&qa=1', base).href, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('main[data-ready="true"]', { timeout: 60000 });
  if (await page.getByRole('button', { name: 'Skip introduction' }).count())
    await page.getByRole('button', { name: 'Skip introduction' }).click();
  assert.match((await snap(page)).backend, /WebGL/);
};
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  await enter(page);
  assert.equal((await snap(page)).quality, 'ultra', 'Ultra remains the default');
  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  await page.getByLabel('Graphics quality', { exact: true }).selectOption('standard');
  await page.getByRole('button', { name: 'Close panel' }).click();
  assert.equal((await snap(page)).quality, 'standard');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('firecrackers.preferences.v1')).quality), 'standard');
  pass('saved non-default quality is active before overload');

  assert.equal(await page.evaluate(() => window.__firecrackersQA.injectOverloadSamples(3, 600)), true);
  await page.getByRole('button', { name: 'Launch selected firework', exact: true }).click();
  const committed = await snap(page);
  assert.ok(committed.committedId > 0);
  assert.equal(committed.selected, 'gold-willow');
  await page.waitForFunction(() => document.querySelector('main')?.dataset.backend?.includes('Canvas'), null, { timeout: 30000 });
  const recovered = await snap(page);
  assert.equal(recovered.qaStallSamplesUsed, 3, 'The recovery must consume all injected active frames');
  assert.equal(recovered.qaStallSamplesRemaining, 0);
  assert.equal(recovered.committedId, committed.committedId, 'The same rocket survives the renderer replacement');
  assert.equal(recovered.selected, committed.selected);
  assert.equal(recovered.quality, 'standard', 'The chosen quality is not rewritten');
  assert.equal(await page.locator('main').getAttribute('data-ready'), 'true');
  assert.equal(recovered.paused, false);
  await page.waitForFunction(frames => window.__firecrackersQA.snapshot().frames >= frames + 8, recovered.frames, { timeout: 15000 });
  await page.waitForFunction(() => window.__firecrackersQA.snapshot().bursts >= 1, null, { timeout: 25000 });
  pass('three forced severe frames recover to Canvas while the same rocket keeps moving and bursts');

  await page.getByRole('button', { name: 'Pause scene', exact: true }).click();
  const paused = await snap(page);
  assert.equal(paused.paused, true);
  await page.waitForTimeout(250);
  assert.equal((await snap(page)).time, paused.time, 'The recovered scene obeys manual pause');
  await page.getByRole('button', { name: 'Resume scene', exact: true }).click();
  assert.equal((await snap(page)).paused, false);
  await page.evaluate(() => { window.__firecrackersQA.freeze(true); window.__firecrackersQA.advance(35); window.__firecrackersQA.freeze(false); });
  pass('manual pause and resume remain functional after recovery');

  const hero = await page.locator('main').evaluate(element => JSON.parse(element.dataset.heroRect));
  const beforeSky = await snap(page);
  await drag(page, edgeShelf(page, 'classics').locator('[data-family-icon="multicolor-peony"]'), hero.x + hero.width * .5, hero.y + hero.height * .3);
  const sky = await snap(page);
  assert.equal(sky.launched, beforeSky.launched + 1);
  assert.equal(sky.bursts, beforeSky.bursts + 1, 'A sky drop is an instant burst');
  assert.equal(sky.selected, 'multicolor-peony');
  await page.screenshot({ path: `${out}/recovered-sky-burst.png` });
  await page.evaluate(() => { window.__firecrackersQA.freeze(true); window.__firecrackersQA.advance(35); window.__firecrackersQA.freeze(false); });
  const beforePad = await snap(page);
  await drag(page, edgeShelf(page, 'grand').locator('[data-family-icon="sapphire-saturn"]'), hero.x + hero.width * .75, hero.y + hero.height * .89);
  const pad = await snap(page);
  assert.equal(pad.phase, 'fuse', 'A terrace drop starts a normal rocket');
  assert.equal(pad.committedFamily, 'Sapphire Saturn');
  assert.ok(pad.placement > .5, `Pad drop should preserve its right-hand coordinate: ${pad.placement}`);
  assert.equal(pad.bursts, beforePad.bursts);
  await page.evaluate(() => window.__firecrackersQA.advance(5));
  assert.ok((await snap(page)).bursts > beforePad.bursts);
  pass('Canvas projection still maps actual sky and terrace pointer drops after recovery');
  await context.close();

  const showContext = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
  const showPage = await showContext.newPage();
  await enter(showPage);
  assert.equal((await snap(showPage)).quality, 'ultra');
  await showPage.getByRole('button', { name: 'Choose show mode' }).click();
  await showPage.getByRole('radio', { name: /Festival/ }).check();
  await showPage.getByRole('button', { name: 'Start show' }).click();
  assert.equal((await snap(showPage)).show, 'festival');
  assert.equal(await showPage.evaluate(() => window.__firecrackersQA.injectOverloadSamples(3, 600)), true);
  await showPage.waitForFunction(() => document.querySelector('main')?.dataset.backend?.includes('Canvas'), null, { timeout: 30000 });
  const recoveredShow = await snap(showPage);
  assert.equal(recoveredShow.qaStallSamplesUsed, 3);
  assert.equal(recoveredShow.show, 'festival', 'The automatic show must survive renderer replacement');
  assert.equal(recoveredShow.quality, 'ultra');
  assert.equal(recoveredShow.paused, false);
  assert.equal(await showPage.locator('main').getAttribute('data-ready'), 'true');
  pass('automatic Festival direction and Ultra quality continue through fallback');
  await showContext.close();
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.failed = error.stack || String(error);
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await fs.writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
}
