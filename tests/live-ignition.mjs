import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const base = process.env.AUDIT_URL || 'https://firecrackers-a93nle.v2.appdeploy.ai/';
const output = process.env.AUDIT_OUTPUT || 'ignition-evidence';
const expectedVersion = JSON.parse(await readFile('public/release.json', 'utf8')).version;
if (typeof expectedVersion !== 'string') throw new Error('Build the expected release before auditing.');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
const results = [];
const cases = [
  { name: 'desktop-default', viewport: { width: 1280, height: 800 }, touch: false, webgl: false, low: false },
  { name: 'mobile-default', viewport: { width: 393, height: 852 }, touch: true, webgl: false, low: false },
  { name: 'mobile-webgl-low', viewport: { width: 393, height: 852 }, touch: true, webgl: true, low: true },
];
for (const spec of cases) {
  const context = await browser.newContext({ viewport: spec.viewport, isMobile: spec.touch, hasTouch: spec.touch, deviceScaleFactor: spec.touch ? 2 : 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const result = { name: spec.name, url: base, expectedVersion, errors: [], warnings: [], timeline: [], passed: false };
  page.on('pageerror', error => result.errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') result.errors.push(message.text());
    if (message.type() === 'warning' && result.warnings.length < 20) result.warnings.push(message.text());
  });
  const read = () => page.locator('main').evaluate(element => ({ ...element.dataset, className: element.className, text: element.innerText.slice(-1600), canvas: !!document.querySelector('.scene-host canvas'), renderer: document.querySelector('.scene-host')?.getAttribute('data-backend') }));
  const activate = locator => spec.touch ? locator.tap() : locator.click();
  const revealControls = async () => {
    if (await page.locator('main').evaluate(element => element.classList.contains('controls-hidden'))) {
      // A phone has no hover-to-wake. Exercise the real first-tap reveal guardrail.
      const before = Number((await read()).launched);
      if (spec.touch) await page.touchscreen.tap(spec.viewport.width / 2, 100);
      else await page.mouse.click(spec.viewport.width / 2, 100);
      await page.waitForFunction(() => !document.querySelector('main')?.classList.contains('controls-hidden'));
      if (Number((await read()).launched) !== before) throw new Error('Revealing manual controls launched an extra rocket.');
    }
  };
  const capture = async name => {
    const state = await read();
    result.timeline.push({ step: name, state });
    console.log(JSON.stringify({ case: spec.name, step: name, state }));
    await page.screenshot({ path: `${output}/${spec.name}-${name}.png`, timeout: 20000 });
    return state;
  };
  try {
    const url = new URL(base);
    if (spec.webgl) url.searchParams.set('backend', 'webgl');
    result.url = url.href;
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    result.title = await page.title();
    if (result.title !== 'Firecrackers') throw new Error(`Unexpected page identity: ${result.title}`);
    await page.waitForSelector('main[data-ready="true"]', { timeout: 60000 });
    const intro = page.getByRole('button', { name: 'Skip introduction', exact: true });
    if (await intro.isVisible()) await activate(intro);
    const loaded = await capture('loaded');
    if (loaded.version !== expectedVersion) throw new Error(`Wrong published build: expected ${expectedVersion}, found ${loaded.version}`);
    if (!loaded.canvas) throw new Error('The scene renderer did not mount a canvas.');
    if (spec.low) {
      await activate(page.getByRole('button', { name: 'Open settings', exact: true }));
      await page.getByLabel('Graphics quality', { exact: true }).selectOption('low');
      await activate(page.getByRole('button', { name: 'Close panel', exact: true }));
    }
    await activate(page.getByRole('button', { name: 'Light once', exact: true }));
    await capture('ignited');
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(1000);
      const state = await read();
      result.timeline.push({ step: `after-${i + 1}s`, state });
      console.log(JSON.stringify({ case: spec.name, step: `after-${i + 1}s`, state }));
      if (Number(state.bursts) > 0) break;
    }
    const after = await capture('burst');
    if (Number(after.bursts) < 1) throw new Error('Light once produced no real-time burst within 12 seconds.');
    await revealControls();
    await activate(page.getByRole('button', { name: 'Gold Willow', exact: true }));
    const hold = page.getByRole('button', { name: 'Hold to light selected firework', exact: true });
    await hold.waitFor({ state: 'visible' });
    const rect = await hold.boundingBox();
    if (!rect) throw new Error('Ignition control has no visible hit target.');
    if (spec.touch) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }] });
      await page.waitForTimeout(1100);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1100);
      await page.mouse.up();
    }
    await capture('held');
    await page.waitForFunction(previous => Number(document.querySelector('main')?.dataset.bursts) > previous, Number(after.bursts), { timeout: 20000 });
    await capture('second-burst');
    await revealControls();
    await activate(page.getByRole('button', { name: 'Festival', exact: true }));
    const beforeAuto = Number((await read()).bursts);
    await page.waitForFunction(previous => Number(document.querySelector('main')?.dataset.bursts) > previous, beforeAuto, { timeout: 20000 });
    await capture('festival');
    result.passed = result.errors.length === 0;
  } catch (error) {
    result.failure = String(error);
    await capture('failure').catch(() => {});
  } finally {
    console.log(JSON.stringify({ result }));
    results.push(result);
    await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
    await context.close();
  }
}
await browser.close();
if (results.some(result => !result.passed)) process.exitCode = 1;
