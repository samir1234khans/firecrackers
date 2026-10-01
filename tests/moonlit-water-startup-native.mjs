import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const out = process.argv[2] || 'test-results/moonlit-water-startup-native';
const origins = {
  candidate: process.env.WATER_URL || 'http://127.0.0.1:4173/',
  baseline: process.env.WATER_BASELINE_URL || 'https://firecrackers.mainandmany.com/',
};
const viewport = { width: 1623, height: 921 }, deviceScaleFactor = 1.375;
const report = { method: 'Fresh installed native Chrome contexts, normal default URL without query/QA, full-page 1623x921 CSS at DPR 1.375. Saved Royal Phoenix, fixed 80% placement and Ultra preferences. DOM MutationObserver records transient startup/recovery surfaces before app execution; real viewport changes exercise initialization. Normal Gold Willow UI launch is observed for 12 seconds through DOM backend/state and rAF callbacks. No app source/API rewrite, QA clock advance, injected slow frames or performance acceptance assertions.',
  limits: 'Native headless Chrome is used unless STARTUP_NATIVE_HEADED=1. Viewport/DPR are browser-emulated, not an actual visible-window/Cua/physical-device equivalence. rAF samples measure browser scheduling, not app CPU submission or completed GPU time. Other desktop browser tabs/system load are uncontrolled.',
  viewport, deviceScaleFactor, runs: [], errors: [], failed: null };
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: process.env.STARTUP_NATIVE_HEADED !== '1' });
report.browser = browser.version();
report.headless = process.env.STARTUP_NATIVE_HEADED !== '1';
const quantile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
};

try {
  for (const scenario of ['natural', 'resize-during-startup']) for (const source of ['candidate', 'baseline']) {
    const context = await browser.newContext({ viewport, deviceScaleFactor, serviceWorkers: 'block', reducedMotion: 'no-preference' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push({ type: 'pageerror', text: error.message }));
    page.on('console', message => { if (message.type() === 'error') errors.push({ type: 'console', text: message.text() }); });
    await page.addInitScript(() => {
      localStorage.setItem('firecrackers.preferences.v1', JSON.stringify({ version: 2, family: 'royal-phoenix', quality: 'ultra',
        sound: false, volume: .45, haptics: false, ambience: false, reducedMotion: false, reducedFlashes: true,
        onboarded: true, preset: 'festival', placement: .8, placementMode: 'fixed' }));
      const audit = window.__nativeStartupAudit = { transitions: [], alerts: [], resizes: [], frames: [], frameDone: false };
      let previous = '';
      const observe = () => {
        const main = document.querySelector('main'), startup = document.querySelector('.startup-screen');
        const snapshot = { ready: main?.dataset.ready, presented: main?.dataset.presented, preparing: main?.dataset.preparing,
          backend: main?.dataset.backend, paused: main?.dataset.paused, phase: main?.dataset.phase,
          startupPhase: startup?.dataset.startupPhase, startupTransition: startup?.dataset.startupTransition,
          startupDetail: startup?.querySelector('.startup-detail')?.textContent,
          alert: document.querySelector('.recovery')?.textContent,
          statuses: [...document.querySelectorAll('[role="status"]')].map(node => node.textContent),
        };
        const value = JSON.stringify(snapshot);
        if (value !== previous && audit.transitions.length < 2000) { audit.transitions.push({ t: performance.now(), ...snapshot }); previous = value; }
      };
      const observer = new MutationObserver(records => {
        for (const record of records) for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          const alerts = node.matches('.recovery') ? [node] : [...node.querySelectorAll('.recovery')];
          for (const alert of alerts) audit.alerts.push({ t: performance.now(), text: alert.textContent });
        }
        observe();
      });
      observer.observe(document, { subtree: true, childList: true, characterData: true, attributes: true,
        attributeFilter: ['data-ready', 'data-presented', 'data-preparing', 'data-backend', 'data-paused', 'data-phase', 'data-startup-phase', 'data-startup-transition'] });
      addEventListener('resize', () => audit.resizes.push({ t: performance.now(), width: innerWidth, height: innerHeight,
        ready: document.querySelector('main')?.dataset.ready, startupPhase: document.querySelector('.startup-screen')?.dataset.startupPhase }));
      audit.startFrameObservation = duration => {
        const capacity = 8192, columns = 5, values = new Float64Array(capacity * columns);
        let count = 0, start = null, previousTime = null;
        audit.frameDone = false;
        const tick = now => {
          if (start === null) start = now;
          const main = document.querySelector('main');
          const backend = main?.dataset.backend === 'WebGPU' ? 2 : main?.dataset.backend === 'WebGL 2' ? 1 : /Canvas/.test(main?.dataset.backend || '') ? 0 : -1;
          if (previousTime !== null && count < capacity) {
            const offset = count++ * columns;
            values[offset] = now - start; values[offset + 1] = now - previousTime;
            values[offset + 2] = backend; values[offset + 3] = Number(main?.dataset.bursts || 0); values[offset + 4] = Number(main?.dataset.launched || 0);
          }
          previousTime = now;
          if (now - start < duration && count < capacity) requestAnimationFrame(tick);
          else {
            const names = ['Canvas 2D compatibility', 'WebGL 2', 'WebGPU'];
            audit.frames = Array.from({ length: count }, (_, i) => ({ t: values[i * columns], rafMs: values[i * columns + 1],
              backend: names[values[i * columns + 2]] || 'Recovering / starting', bursts: values[i * columns + 3], launched: values[i * columns + 4] }));
            audit.frameDone = true; observe();
          }
        };
        requestAnimationFrame(tick);
      };
    });
    const url = new URL(origins[source]); url.search = ''; url.hash = '';
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    const initialRelease = await page.evaluate(() => fetch('/release.json').then(response => response.json()));
    const resizeSteps = [];
    if (scenario === 'resize-during-startup') {
      await page.waitForSelector('main', { timeout: 90000 });
      for (let i = 0; i < 12; i++) {
        const before = await page.evaluate(() => ({ t: performance.now(), ready: document.querySelector('main')?.dataset.ready,
          backend: document.querySelector('main')?.dataset.backend, startupPhase: document.querySelector('.startup-screen')?.dataset.startupPhase }));
        resizeSteps.push(before);
        await page.setViewportSize({ width: viewport.width + (i % 2 ? 1 : -1), height: viewport.height + (i % 2 ? 1 : -1) });
        await page.waitForTimeout(20);
      }
      await page.setViewportSize(viewport);
    }
    await page.waitForSelector('main[data-ready="true"][data-presented="true"]', { timeout: 90000 });
    const beforeLaunch = await page.evaluate(() => ({ backend: document.querySelector('main').dataset.backend,
      selected: document.querySelector('[data-family-icon][aria-pressed="true"]')?.dataset.familyIcon,
      position: document.querySelector('[aria-label="Next rocket position"]')?.getAttribute('aria-valuenow'),
      dpr: devicePixelRatio, qa: Boolean(window.__firecrackersQA),
      canvas: [...document.querySelectorAll('.scene-host canvas')].map(canvas => ({ width: canvas.width, height: canvas.height, cssWidth: canvas.clientWidth, cssHeight: canvas.clientHeight })),
    }));
    assert.equal(beforeLaunch.qa, false); assert.equal(beforeLaunch.selected, 'royal-phoenix'); assert.equal(beforeLaunch.position, '80');
    assert.equal(beforeLaunch.dpr, deviceScaleFactor);
    const expectedBuffer = { width: Math.floor(viewport.width * deviceScaleFactor), height: Math.floor(viewport.height * deviceScaleFactor) };
    for (const canvas of beforeLaunch.canvas) {
      assert.equal(canvas.cssWidth, viewport.width); assert.equal(canvas.cssHeight, viewport.height);
      assert.equal(canvas.width, expectedBuffer.width); assert.equal(canvas.height, expectedBuffer.height);
    }
    const native = await page.evaluate(async () => {
      const adapter = await navigator.gpu?.requestAdapter({ powerPreference: 'high-performance' });
      return adapter ? { vendor: adapter.info.vendor, architecture: adapter.info.architecture, fallback: adapter.info.isFallbackAdapter } : null;
    });
    if (beforeLaunch.backend === 'WebGPU') { assert.ok(native); assert.equal(native.fallback, false); }
    await page.screenshot({ path: `${out}/${source}-${scenario}-ready.png` });
    await page.evaluate(() => window.__nativeStartupAudit.startFrameObservation(12000));
    await page.locator('[data-family-icon="gold-willow"]').click();
    await page.waitForFunction(() => window.__nativeStartupAudit.frameDone, undefined, { timeout: 25000 });
    const observed = await page.evaluate(() => ({ ...window.__nativeStartupAudit, startFrameObservation: undefined,
      final: { ...document.querySelector('main').dataset }, canvas: [...document.querySelectorAll('.scene-host canvas')].map(canvas => ({ width: canvas.width, height: canvas.height })) }));
    for (const canvas of observed.canvas) {
      assert.equal(canvas.width, expectedBuffer.width); assert.equal(canvas.height, expectedBuffer.height);
    }
    const release = await page.evaluate(() => fetch('/release.json').then(response => response.json()));
    assert.equal(release.sha256, initialRelease.sha256, 'Candidate must remain held throughout the normal-startup condition');
    const burstAt = observed.frames.find(frame => frame.bursts > 0)?.t;
    assert.ok(Number.isFinite(burstAt), 'Normal Gold Willow UI launch must reach its burst');
    const cadence = observed.frames.map(frame => frame.rafMs);
    const run = { source, scenario, url: url.href, release, beforeLaunch, native, resizeSteps, observed, errors,
      launch: { firstBurstMs: burstAt, rafP95Ms: quantile(cadence, .95), rafWorstMs: quantile(cadence, 1),
        backends: [...new Set(observed.frames.map(frame => frame.backend))], finalBackend: observed.final.backend,
        fallback: beforeLaunch.backend !== observed.final.backend, over100Count: cadence.filter(ms => ms >= 100).length },
    };
    report.runs.push(run); report.errors.push(...errors.map(error => ({ source, scenario, ...error })));
    await page.screenshot({ path: `${out}/${source}-${scenario}-after-launch.png` });
    await context.close();
    await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ source, scenario, fingerprint: release.sha256, startupAlerts: observed.alerts,
      resizeBeforeReady: resizeSteps.filter(step => step.ready !== 'true').length, beforeLaunch, launch: run.launch, errors }));
  }
} catch (error) {
  report.failed = error.stack || String(error); process.exitCode = 1; console.error(report.failed);
} finally {
  await browser.close(); await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
}
if (report.errors.length || report.runs.some(run => run.observed.alerts.length || run.launch.fallback)) process.exitCode = 1;
