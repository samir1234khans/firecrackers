import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

// Real UI input is the default. Frozen/advanced scenes are only labeled visual checkpoints.
const output = path.resolve(process.argv[2] || '/tmp/firecrackers-video-flow');
const base = process.env.VIDEO_FLOW_URL || 'http://127.0.0.1:4173/';
const only = process.env.VIDEO_FLOW_PROJECT || '';
await mkdir(output, { recursive: true });
let server, browser;
const build = (await readFile('src/engine/catalog.ts', 'utf8')).match(/CONFIG_VERSION\s*=\s*'([^']+)'/)[1];
const report = { url: base, build, browser: 'Chromium / software WebGL 2', checks: [], consoleErrors: [], expectedHostOfflineErrors: [], failedRequests: [], warnings: [], screenshots: [], failed: null };
const cases = [];
const record = (name, details = {}) => { report.checks.push({ name, result: 'passed', ...details }); console.log('PASS', name, JSON.stringify(details)); };
const shot = async (page, name) => { await page.screenshot({ path: path.join(output, `${name}.png`) }); report.screenshots.push(`${name}.png`); };
const qa = async (page, action, value) => page.evaluate(({ action, value }) => {
  const q = window.__firecrackersQA;
  if (action === 'snapshot') return q.snapshot();
  q[action](value);
}, { action, value });
const advance = async (page, seconds) => {
  await qa(page, 'advance', seconds);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => { window.__firecrackersQA.render(); resolve(); })));
};
async function enter(page, suffix = '?backend=webgl&qa=1') {
  await page.goto(new URL(suffix, base).href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('main')?.dataset.ready === 'true' && Boolean(window.__firecrackersQA), undefined, { timeout: 90000 });
  if (await page.locator('main').getAttribute('data-overlay') === 'help') await page.getByRole('button', { name: 'Skip introduction', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('main')?.dataset.overlay === 'none');
}
async function waitBurst(page, number) {
  await page.waitForFunction(n => Number(document.querySelector('main')?.dataset.bursts) >= n, number, { timeout: 90000 });
}
async function layout(page, label) {
  const result = await page.evaluate(() => {
    const launch = document.querySelector('.flow-launch').getBoundingClientRect();
    const header = document.querySelector('.flow-command').getBoundingClientRect();
    const deck = document.querySelector('.flow-deck-wrap').getBoundingClientRect();
    const cards = [...document.querySelectorAll('.flow-family')].map(e => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, x: r.x, right: r.right }; });
    return { w: innerWidth, h: innerHeight, overflow: document.documentElement.scrollWidth > innerWidth, launch: { w: launch.width, h: launch.height, bottom: launch.bottom }, freeSky: deck.top - header.bottom, cards };
  });
  assert.equal(result.overflow, false);
  assert.ok(result.launch.h >= 44 && result.launch.w >= 120);
  assert.ok(result.launch.bottom <= result.h && result.freeSky > 90, JSON.stringify(result));
  for (const card of result.cards) assert.ok(card.w >= 44 && card.h >= 44 && card.x >= 0 && card.right <= result.w, JSON.stringify(result));
  record(`${label}: no overflow, reachable launch, five usable styles`, result);
}

try {
  if (!process.env.VIDEO_FLOW_URL) {
    server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'inherit' });
    for (let i = 0; i < 40; i++) {
      try { if ((await fetch(base)).ok) break; } catch { /* Wait for the local build server. */ }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const viewports = [
    { name: 'desktop', width: 1280, height: 800, mobile: false },
    { name: 'mobile', width: 375, height: 667, mobile: true },
  ].filter(v => !only || only.includes(v.name));
  for (const v of viewports) {
    const context = await browser.newContext({ viewport: { width: v.width, height: v.height }, hasTouch: v.mobile, isMobile: v.mobile, deviceScaleFactor: 1, recordVideo: { dir: path.join(output, 'videos'), size: { width: v.width, height: v.height } } });
    const page = await context.newPage(); cases.push(page);
    let deliberatelyOffline = false;
    const expectedHostOffline = url => {
      try { const u = new URL(url); return (u.hostname === 'v2.appdeploy.ai' && u.pathname === '/shared/js/overlay.js') || (u.hostname === 'api-v2.appdeploy.ai' && ['/app/firecrackers-a93nle/_warmup', '/p'].includes(u.pathname)); } catch { return false; }
    };
    page.on('requestfailed', request => report.failedRequests.push({url: request.url(), error: request.failure()?.errorText, deliberatelyOffline}));
    page.on('pageerror', e => report.consoleErrors.push(`${v.name}: ${e.message}`));
    page.on('console', m => {
      if (m.type() === 'error') {
        const item = `${v.name}: ${m.text()} [${m.location().url || 'unknown location'}]`;
        if (deliberatelyOffline && m.text().includes('ERR_INTERNET_DISCONNECTED') && expectedHostOffline(m.location().url)) report.expectedHostOfflineErrors.push(item);
        else report.consoleErrors.push(item);
      } else if (m.type() === 'warning') report.warnings.push(`${v.name}: ${m.text()}`);
    });
    await enter(page);
    assert.ok((await page.title()).includes('Firecrackers'));
    assert.equal(await page.locator('main').getAttribute('data-version'), report.build);
    assert.ok(await page.locator('.scene-host canvas').count() === 1);
    record(`${v.name}: correct build, meaningful UI and actual canvas`);
    await layout(page, v.name);
    await shot(page, `${v.name}-01-ready`);
    const launch = page.getByRole('button', { name: 'Launch selected firework', exact: true });
    if (v.mobile) await launch.tap(); else await launch.click();
    await page.waitForFunction(() => document.querySelector('main')?.dataset.launchBlock === 'busy');
    assert.equal(await launch.isDisabled(), true);
    // An immediate second pointer action must not add another rocket.
    await launch.dispatchEvent('click');
    await page.getByRole('button', { name: 'Multicolor Peony', exact: true }).click();
    const committed = await qa(page, 'snapshot');
    assert.equal(committed.committedFamily, 'Gold Willow');
    assert.equal(committed.selected, 'multicolor-peony');
    assert.equal(committed.active, 1);
    record(`${v.name}: real launch, duplicate guard and immutable active family`);
    await waitBurst(page, 1);
    await page.waitForFunction(() => !document.querySelector('.flow-launch').disabled, undefined, { timeout: 15000 });
    assert.equal(await page.locator('main').evaluate(e => e.classList.contains('controls-hidden')), false);
    const after = await qa(page, 'snapshot');
    assert.equal(after.launched, 1); assert.equal(after.stagedRockets, 1); assert.equal(after.airborneRockets, 0);
    await shot(page, `${v.name}-02-after-real-burst`);
    record(`${v.name}: visible burst after real-time input and ready-again state`, { launched: after.launched, bursts: after.bursts });
    if (v.mobile) await launch.tap(); else await launch.click();
    await waitBurst(page, 2);
    record(`${v.name}: second selected family launches after first burst`);

    // Exact phase captures prove geometry ownership without pretending they measure FPS.
    await enter(page); await qa(page, 'freeze', true);
    await page.getByRole('button', { name: 'Chrysanthemum', exact: true }).click();
    await launch.click(); await advance(page, .15);
    let frame = await qa(page, 'snapshot');
    assert.equal(frame.stagedRockets, 1); assert.equal(frame.airborneRockets, 0);
    await shot(page, `${v.name}-03-fuse-frozen`);
    await advance(page, .80); frame = await qa(page, 'snapshot');
    assert.equal(frame.stagedRockets, 0); assert.equal(frame.airborneRockets, 1); assert.equal(frame.visibleRocketBodies, 1);
    await shot(page, `${v.name}-04-powered-flight-frozen`);
    await advance(page, 1.3); frame = await qa(page, 'snapshot');
    assert.equal(frame.stagedRockets, 0); assert.equal(frame.airborneRockets, 1); assert.equal(frame.visibleRocketBodies, 0);
    assert.ok(frame.shellScreen.y > 0 && frame.shellScreen.y < v.height);
    await shot(page, `${v.name}-05-coast-frozen`);
    await advance(page, 1.4); frame = await qa(page, 'snapshot');
    assert.ok(frame.bursts > 0); assert.equal(frame.stagedRockets, 1);
    await shot(page, `${v.name}-06-burst-frozen`);
    record(`${v.name}: no duplicate staged rocket; continuous body-to-shell handoff and burst`, { method: 'labeled deterministic rendered checkpoints, not performance evidence' });

    for (const [index, name] of ['Gold Willow', 'Multicolor Peony', 'Chrysanthemum', 'Silver Crossette Crackle', 'Grand Finale'].entries()) {
      await advance(page, 24);
      await page.getByRole('button', { name, exact: true }).click();
      const count = (await qa(page, 'snapshot')).bursts;
      await launch.click(); await advance(page, index === 4 ? 5.1 : 3.8);
      assert.ok((await qa(page, 'snapshot')).bursts > count);
      await shot(page, `${v.name}-family-${index + 1}`);
    }
    record(`${v.name}: all five families produce rendered effects`);
    await advance(page, 24); await launch.click(); await advance(page, .95);
    await page.getByRole('button', { name: 'Pause scene', exact: true }).first().click();
    const stopped = await qa(page, 'snapshot'); await qa(page, 'freeze', false);
    await page.waitForTimeout(700);
    assert.equal((await qa(page, 'snapshot')).time, stopped.time);
    assert.equal(await launch.isDisabled(), true);
    await page.getByRole('button', { name: 'Open settings' }).click();
    await page.getByRole('button', { name: 'Close panel' }).click();
    assert.equal(await page.locator('main').getAttribute('data-paused'), 'true');
    await page.getByRole('button', { name: 'Resume scene', exact: true }).first().click();
    await waitBurst(page, stopped.bursts + 1);
    record(`${v.name}: pause freezes exact state, settings preserves pause, same rocket resumes`);

    await qa(page, 'freeze', true); await advance(page, 24);
    await page.getByRole('button', { name: 'Festival', exact: true }).click(); await advance(page, 1);
    assert.equal((await qa(page, 'snapshot')).show, 'festival');
    await page.getByRole('button', { name: 'Gold Willow', exact: true }).click();
    assert.equal((await qa(page, 'snapshot')).show, null); await advance(page, 8);
    assert.equal(await launch.isEnabled(), true);
    record(`${v.name}: auto show and manual takeover preserve committed effects`);

    await page.getByRole('button', { name: 'Open settings' }).click();
    await page.getByLabel('Graphics quality', { exact: true }).selectOption('low');
    await shot(page, `${v.name}-settings`);
    await page.getByRole('button', { name: 'Close panel' }).click();
    await enter(page);
    await page.getByRole('button', { name: 'Open settings' }).click();
    assert.equal(await page.getByLabel('Graphics quality', { exact: true }).inputValue(), 'low');
    assert.equal(await page.getByLabel('Sound', { exact: true }).isChecked(), false);
    const resetAction = page.getByRole('button', { name: 'Reset this sky' });
    await resetAction.scrollIntoViewIfNeeded();
    assert.ok(await resetAction.evaluate(element => {
      const r = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    }), 'Reset action must be reachable with host preview toolbar present');
    await shot(page, `${v.name}-settings-reset-reachable`);
    await resetAction.click();
    await page.getByRole('button', { name: 'Keep my sky' }).click();
    assert.equal(await page.getByLabel('Graphics quality', { exact: true }).inputValue(), 'low');
    await page.getByRole('button', { name: 'Close panel' }).click();
    record(`${v.name}: graphics persistence, silent reload and reset cancellation`);

    if (v.mobile) {
      await page.setViewportSize({ width: 360, height: 640 }); await layout(page, 'mobile360'); await shot(page, 'mobile360-ready');
      await page.setViewportSize({ width: 393, height: 760 }); await layout(page, 'mobile393'); await shot(page, 'mobile393-ready');
      await page.setViewportSize({ width: 844, height: 390 }); await layout(page, 'landscape'); await shot(page, 'landscape-ready');
      await page.getByRole('button', { name: 'Open settings' }).click();
      await page.getByLabel('Graphics quality', { exact: true }).selectOption('standard');
      await page.getByRole('button', { name: 'Close panel' }).click();
      record('short landscape: settings and return remain reachable');
    } else {
      // The production service worker, not a mocked cache, must support a cold offline reload.
      await page.evaluate(async () => { await navigator.serviceWorker.ready; });
      deliberatelyOffline = true;
      await context.setOffline(true); await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelector('main')?.dataset.ready === 'true', undefined, { timeout: 60000 });
      assert.ok(await page.locator('.flow-launch').isEnabled());
      await context.setOffline(false); deliberatelyOffline = false;
      record('desktop: production offline package cold reload');
    }

    await enter(page, '?backend=webgl&qa=1&display=transparent&show=festival&protect=1&fps=30');
    await qa(page, 'freeze', true); await advance(page, 4);
    assert.equal(await page.locator('main').getAttribute('data-display'), 'transparent');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Open settings' }).click();
    await page.getByRole('button', { name: 'Return to interactive sky' }).click();
    await page.getByRole('button', { name: 'Close panel' }).click();
    assert.equal(await page.locator('main').getAttribute('data-display'), 'interactive');
    record(`${v.name}: protected transparent display returns to manual controls`);
    await context.close(); cases.splice(cases.indexOf(page), 1);
  }
  assert.deepEqual(report.consoleErrors, []);
  record('No unexpected page, framework or console errors; separately recorded host-only offline requests');
} catch (error) {
  report.failed = error.stack || String(error);
  for (const [i, page] of cases.entries()) {
    try { await shot(page, `FAILURE-${i}`); await writeFile(path.join(output, `FAILURE-${i}.html`), await page.content()); } catch { /* Preserve original failure. */ }
  }
  console.error(report.failed);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill();
  await writeFile(path.join(output, 'browser-report.json'), JSON.stringify(report, null, 2));
}
