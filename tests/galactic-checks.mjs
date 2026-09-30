import { selectedLaunch, openPanel } from './stage-helpers.mjs';
import assert from 'node:assert/strict';
import { settingsTab } from './stage-helpers.mjs';

const snapshot = page => page.evaluate(() => window.__firecrackersQA.snapshot());
async function reset(page) {
  await page.evaluate(() => window.__firecrackersQA.freeze(true));
  await openPanel(page, 'settings');
  await settingsTab(page, 'Device');
  await page.getByRole('button', { name: 'Reset this sky', exact: true }).click();
  await page.getByRole('button', { name: 'Reset sky and preferences', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('main').dataset.overlay === 'none');
  assert.equal((await snapshot(page)).time, 0);
}
async function staticIdle(page) {
  await page.waitForTimeout(400);
  const before = await snapshot(page);
  await page.waitForTimeout(650);
  const after = await snapshot(page);
  const environment = await page.evaluate(() => ({ osReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    hidden: document.hidden, visibility: document.visibilityState,
    activeElement: document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName,
    documentFocused: document.hasFocus() }));
  console.log('Comfort idle sample', JSON.stringify({ frameDelta: after.frames - before.frames, before, after, environment }));
  assert.ok(after.frames - before.frames <= 2, 'Comfort idle must remain static');
  assert.equal(after.skyMotionAllowed, false);
  assert.equal(after.skyActiveMeteors, 0);
  assert.equal(after.skyEngagement, 0);
  return { frameDelta: after.frames - before.frames, before, after };
}

/** Real DOM input and shared-clock checks. No QA method changes sky input or phase. */
export async function qualifyGalacticSky(page, label, check, capture = async () => {}, { touch = false } = {}) {
  await reset(page);
  const initial = await snapshot(page);
  assert.equal(initial.skyLayers, 3); assert.equal(initial.skyArtWidth, 2048);
  assert.equal(initial.skyArtHeight, 1024); assert.equal(initial.skyNearStars, 128);
  assert.equal(initial.skyFieldStars, 5200); assert.equal(initial.skyClusterStars, 3400);
  assert.equal(initial.skyMaximumMeteors, 1); assert.equal(initial.skyMaximumParallaxPixels, 3);
  check(`${label}: three bounded 2K celestial layers and immutable resource limits`, { layers: initial.skyLayers });
  const { width, height } = page.viewportSize();
  await page.evaluate(() => window.__firecrackersQA.freeze(false));
  await page.mouse.move(width * .65, height * .16);
  await page.waitForFunction(() => window.__firecrackersQA.snapshot().skyEngagement > .6);
  const engaged = await snapshot(page);
  assert.equal(engaged.launched, 0); assert.equal(engaged.bursts, 0);
  assert.equal(engaged.selected, initial.selected); assert.equal(engaged.placement, initial.placement);
  assert.ok(Math.hypot(engaged.skyNearParallaxX, engaged.skyNearParallaxY) <= 3.00001);
  assert.ok(Math.hypot(engaged.skyNearParallaxX, engaged.skyNearParallaxY) > .1);
  await capture('sky-pointer');
  check(`${label}: blank-sky mouse response is bounded and cannot launch or change selection`, { engagement: engaged.skyEngagement });

  await page.evaluate(() => window.__firecrackersQA.freeze(true));
  await page.waitForTimeout(100);
  const frozen = await snapshot(page);
  await page.mouse.move(width * .4, height * .2);
  await page.waitForTimeout(350);
  const frozenAfter = await snapshot(page);
  assert.equal(frozenAfter.time, frozen.time); assert.equal(frozenAfter.frames, frozen.frames);
  assert.equal(frozenAfter.skyMotionTime, frozen.skyMotionTime);
  assert.equal(frozenAfter.skyNearParallaxX, frozen.skyNearParallaxX);
  assert.equal(frozenAfter.skyNearParallaxY, frozen.skyNearParallaxY);
  check(`${label}: QA freeze holds shared phase, pointer response and render count`);

  await page.evaluate(() => window.__firecrackersQA.freeze(false));
  await page.getByRole('button', { name: 'Controls', exact: true }).hover();
  await page.waitForFunction(() => window.__firecrackersQA.snapshot().skyEngagement < .01);
  assert.equal((await snapshot(page)).launched, 0);
  check(`${label}: hovering a control releases sky interaction without activating it`);
  await openPanel(page, 'settings');
  const panel = await snapshot(page);
  await page.mouse.move(width * .5, height * .16); await page.waitForTimeout(350);
  const panelAfter = await snapshot(page);
  assert.equal(panelAfter.paused, true); assert.equal(panelAfter.time, panel.time);
  assert.equal(panelAfter.frames, panel.frames); assert.equal(panelAfter.skyMotionTime, panel.skyMotionTime);
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  check(`${label}: open panels hold sky phase and frames with the existing overlay pause`);

  await page.mouse.move(width * .55, height * .9); await page.waitForTimeout(1800);
  const idle = await snapshot(page);
  const sampleStart = await page.evaluate(() => performance.now());
  await page.waitForTimeout(800);
  // Software CI can stall the browser across the entire initial interval.
  // Require an actual resumed frame within a bounded timeout, then measure
  // the unchanged cadence cap against the observed browser-clock interval.
  await page.waitForFunction(frames => window.__firecrackersQA.snapshot().frames > frames,
    idle.frames, { polling: 100, timeout: 10000 });
  const idleAfter = await snapshot(page);
  const elapsedMs = await page.evaluate(start => performance.now() - start, sampleStart);
  const frameDelta = idleAfter.frames - idle.frames;
  const cap = idle.backend.startsWith('Canvas') ? 10 : 20;
  assert.ok(frameDelta > 0 && frameDelta <= Math.ceil(cap * elapsedMs / 1000) + 3,
    `Ambient cadence must remain bounded: ${JSON.stringify({ frameDelta, cap, elapsedMs, idle, idleAfter })}`);
  assert.equal(idleAfter.launched, 0); assert.equal(idleAfter.particles, 0);
  check(`${label}: empty sky redraws at its bounded ambient cadence`, { frameDelta, cap, elapsedMs });

  await reset(page);
  await page.evaluate(() => { window.__firecrackersQA.advance(9.7); window.__firecrackersQA.render(); });
  const meteor = await snapshot(page);
  assert.equal(meteor.skyActiveMeteors, 1); assert.ok(meteor.skyMeteorOpacity > 0 && meteor.skyMeteorOpacity <= .0771);
  assert.equal(meteor.launched, 0); assert.equal(meteor.bursts, 0); assert.equal(meteor.particles, 0);
  await capture('sky-meteor');
  await page.evaluate(() => { window.__firecrackersQA.advance(1); window.__firecrackersQA.render(); });
  assert.equal((await snapshot(page)).skyActiveMeteors, 0);
  check(`${label}: one faint deterministic meteor ends without firework or audio events`, { time: meteor.skyMotionTime, opacity: meteor.skyMeteorOpacity });

  await openPanel(page, 'settings');
  await page.getByLabel('Graphics quality', { exact: true }).selectOption('low');
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.evaluate(() => window.__firecrackersQA.freeze(false));
  await page.mouse.move(width * .6, height * .18);
  check(`${label}: explicit Low quality holds a static noninteractive sky`, await staticIdle(page));

  await openPanel(page, 'settings');
  await page.getByLabel('Graphics quality', { exact: true }).selectOption('ultra');
  await page.getByRole('checkbox', { name: 'Reduced interface motion', exact: true }).check();
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  check(`${label}: saved app reduced motion holds static Ultra sky`, await staticIdle(page));
  await openPanel(page, 'settings');
  await page.getByRole('checkbox', { name: 'Reduced interface motion', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // CDP media emulation can precede the page's style/media-query change dispatch.
  // Await the actual OS-query policy and its rendered result before timing idle.
  await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches &&
    window.__firecrackersQA.snapshot().skyState.motionAllowed === false &&
    window.__firecrackersQA.snapshot().skyMotionAllowed === false, undefined, { polling: 100 });
  check(`${label}: live OS reduced-motion changes stop ambient rendering`, await staticIdle(page));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => !matchMedia('(prefers-reduced-motion: reduce)').matches &&
    window.__firecrackersQA.snapshot().skyState.motionAllowed === true, undefined, { polling: 100 });
  await page.mouse.move(width * .5, height * .9);

  if (touch) {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: width * .6, y: height * .16 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: width * .65, y: height * .17 }] });
    await page.waitForFunction(() => window.__firecrackersQA.snapshot().skyEngagement > .5);
    const touched = await snapshot(page); assert.equal(touched.launched, 0); assert.equal(touched.bursts, 0);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForFunction(() => window.__firecrackersQA.snapshot().skyEngagement < .01);
    await session.detach();
    check(`${label}: native touch brush responds and releases without launching`);
  }
  // Existing stage suite separately covers actual captured firework drags/drops.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(150); const hidden = await snapshot(page);
  await page.waitForTimeout(400); const hiddenAfter = await snapshot(page);
  assert.equal(hiddenAfter.paused, true); assert.equal(hiddenAfter.time, hidden.time);
  assert.equal(hiddenAfter.frames, hidden.frames); assert.equal(hiddenAfter.skyMotionTime, hidden.skyMotionTime);
  await page.evaluate(() => {
    delete document.hidden; document.dispatchEvent(new Event('visibilitychange'));
  });
  assert.equal((await snapshot(page)).paused, true, 'Returning preserves explicit resume after backgrounding');
  await page.getByRole('button', { name: 'Resume scene', exact: true }).click();
  check(`${label}: controlled visibility event holds sky and retains explicit resume`, { method: 'document.hidden override and visibilitychange; not OS endurance' });
}
