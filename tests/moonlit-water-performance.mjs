import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { openPanel, settingsTab } from './stage-helpers.mjs';

// Run by itself. Sampling observes the normal app animation loop; it never
// repeatedly invokes QA.render() on a frozen scene during a measurement.
const baseline = process.env.WATER_BASELINE_URL || 'https://firecrackers.mainandmany.com/';
const candidate = process.env.WATER_URL || 'http://127.0.0.1:4173/';
const out = process.argv[2] || 'test-results/moonlit-water-performance';
const seed = 20260916;
const backends = process.env.WATER_PERFORMANCE_BACKENDS?.split(',') || ['webgpu', 'webgl', 'canvas'];
const viewports = [[393, 851], [1280, 800]].filter(([width]) => !process.env.WATER_PERFORMANCE_WIDTH || width === Number(process.env.WATER_PERFORMANCE_WIDTH));
const expected = { webgpu: 'WebGPU', webgl: 'WebGL 2', canvas: 'Canvas 2D · compatibility' };
const idleMilliseconds = 3000, launchMilliseconds = 7500, warmupMilliseconds = 1500;
const report = {
  baseline, candidate, seed, browser: null,
  method: 'Installed headless Chrome, sequential counterbalanced AB/BA pairs, two repetitions at each backend and viewport. All authored assets are active before reset and realtime idle warmup. Service workers are blocked. Sampling observes realtime requestAnimationFrame and app submitMs, retaining CPU samples only when the renderer frame counter advances. Measurement never drives a frozen QA render loop.',
  limits: 'rAF cadence and CPU submission are recorded separately; neither is completed GPU time. Phone-sized viewports are emulated on this PC. Physical-phone performance and thermal endurance are unqualified. QA snapshot observer overhead is measured and reported.',
  settings: { quality: 'ultra', reducedFlashes: true, reducedMotion: false, sound: false, haptics: false, placement: .5, idleMilliseconds, launchMilliseconds, warmupMilliseconds, repeats: 2 },
  runs: [], comparisons: [], errors: [], failed: null,
};
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
report.browser = await browser.version();
let page;

const quantile = (values, fraction) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
};
const distribution = values => ({
  count: values.length, p50Ms: quantile(values, .5), p95Ms: quantile(values, .95), worstMs: quantile(values, 1),
  over33Ms: values.filter(value => value > 33).length,
  over50Ms: values.filter(value => value > 50).length,
  over100Ms: values.filter(value => value > 100).length,
});
function summarize(frames) {
  const submitted = frames.filter(frame => frame.newRender);
  return {
    raf: distribution(frames.map(frame => frame.rafMs)),
    cpuSubmission: distribution(submitted.map(frame => frame.submitMs)),
    renderedCadence: distribution(submitted.filter(frame => frame.renderedIntervalMs !== null).map(frame => frame.renderedIntervalMs)),
    qaObserver: distribution(frames.map(frame => frame.snapshotMs)),
    simulationRange: frames.length ? [frames[0].simulationTime, frames.at(-1).simulationTime] : [],
    renderFrameRange: frames.length ? [frames[0].renderFrames, frames.at(-1).renderFrames] : [],
    backendStayed: [...new Set(frames.map(frame => frame.backend))],
    qualities: [...new Set(frames.map(frame => frame.quality))],
  };
}

async function sample(workload, duration, targetBurst) {
  const frames = await page.evaluate(({ duration, targetBurst }) => new Promise(resolve => {
    const frames = []; let start = null, previous = null, previousRenderTime = null, previousRenderFrame = null;
    const tick = now => {
      if (start === null) start = now;
      const snapshotStart = performance.now(), state = window.__firecrackersQA.snapshot();
      const snapshotMs = performance.now() - snapshotStart;
      const newRender = state.frames !== previousRenderFrame;
      if (previous !== null) frames.push({
        t: now - start, rafMs: now - previous, submitMs: state.submitMs,
        newRender, renderedIntervalMs: newRender && previousRenderTime !== null ? now - previousRenderTime : null,
        snapshotMs, renderFrames: state.frames, simulationTime: state.time, bursts: state.bursts,
        backend: state.backend, quality: state.quality, particles: state.particles,
      });
      if (newRender) { previousRenderFrame = state.frames; previousRenderTime = now; }
      previous = now;
      if (now - start < duration) requestAnimationFrame(tick);
      else {
        const burstAt = targetBurst === null ? null : frames.find(frame => frame.bursts >= targetBurst)?.t;
        resolve({ frames, burstAt });
      }
    };
    requestAnimationFrame(tick);
  }), { duration, targetBurst });
  if (targetBurst !== null) assert.ok(Number.isFinite(frames.burstAt), `${workload} must complete its burst`);
  const raw = frames.frames.map(frame => ({ ...frame, relativeToBurstMs: frames.burstAt === null ? null : frame.t - frames.burstAt }));
  const transition = targetBurst === null ? [] : raw.filter(frame => Math.abs(frame.relativeToBurstMs) <= 1200);
  return { workload, elapsedMs: raw.at(-1)?.t, firstBurstMs: frames.burstAt, summary: summarize(raw), transitionSummary: transition.length ? summarize(transition) : null, raw };
}

async function runCondition(source, origin, backend, width, height, repeat, positionInPair) {
  const errors = [];
  page = await browser.newPage({ viewport: { width, height }, serviceWorkers: 'block', reducedMotion: 'no-preference' });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    localStorage.setItem('firecrackers.preferences.v1', JSON.stringify({ version: 2, family: 'gold-willow', quality: 'ultra',
      reducedMotion: false, reducedFlashes: true, sound: false, volume: .45, haptics: false, ambience: false,
      onboarded: true, preset: 'festival', placement: .5, placementMode: 'fixed' }));
  });
  const url = new URL(origin); url.searchParams.set('qa', '1'); url.searchParams.set('seed', String(seed)); url.searchParams.set('backend', backend);
  await page.goto(url.href);
  await page.waitForSelector('main[data-ready="true"][data-presented="true"]', { timeout: 90000 });
  await page.waitForFunction(() => window.__firecrackersQA?.snapshot().moon?.ready, undefined, { timeout: 90000 });
  if (backend !== 'canvas') await page.waitForFunction(() => {
    const states = window.__firecrackersQA.snapshot().authoredAssetStates;
    return states && Object.keys(states).length >= 9 && Object.values(states).every(state => state === 'active');
  }, undefined, { timeout: 90000 });
  const release = await page.evaluate(() => fetch('/release.json').then(response => response.json()));
  const identity = await page.evaluate(async backend => {
    if (backend === 'webgpu') {
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
      return adapter ? { vendor: adapter.info.vendor, architecture: adapter.info.architecture, fallback: adapter.info.isFallbackAdapter } : null;
    }
    if (backend === 'webgl') {
      const canvas = [...document.querySelectorAll('main canvas')].find(canvas => canvas.getContext('webgl2'));
      const gl = canvas?.getContext('webgl2'), extension = gl?.getExtension('WEBGL_debug_renderer_info');
      return { driver: extension ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : '' };
    }
    return { implementation: 'Canvas 2D compatibility' };
  }, backend);
  if (backend === 'webgpu') { assert.ok(identity); assert.equal(identity.fallback, false); }
  if (backend === 'webgl') { assert.ok(identity.driver); assert.ok(!/swiftshader|llvmpipe|software|microsoft basic render/i.test(identity.driver), identity.driver); }
  // Reset through the normal UI after assets and pipeline preparation, bringing
  // the simulation/RNG to the same state independently of network startup time.
  await page.evaluate(() => window.__firecrackersQA.freeze(true));
  await openPanel(page, 'settings'); await settingsTab(page, 'Device');
  await page.getByRole('button', { name: 'Reset this sky', exact: true }).click();
  await page.getByRole('button', { name: 'Reset sky and preferences', exact: true }).click();
  await page.evaluate(() => window.__firecrackersQA.freeze(false));
  await page.waitForTimeout(warmupMilliseconds);
  const initial = await page.evaluate(() => window.__firecrackersQA.snapshot());
  assert.equal(initial.backend, expected[backend]); assert.equal(initial.quality, 'ultra');
  assert.equal(initial.reducedMotion, false); assert.equal(initial.reducedFlashes, true); assert.equal(initial.paused, false);
  const measurements = [await sample('idle', idleMilliseconds, null)];
  for (let launch = 1; launch <= 2; launch++) {
    if (launch === 2) {
      // Skip the completed residue between launches, then let normal realtime
      // rendering settle. No measurement includes this bounded QA advance.
      await page.evaluate(() => window.__firecrackersQA.advance(30));
      await page.waitForTimeout(500);
    }
    const previousBursts = await page.evaluate(() => window.__firecrackersQA.snapshot().bursts);
    await page.locator('[data-family-icon="gold-willow"]').click();
    measurements.push(await sample(`launch-${launch}`, launchMilliseconds, previousBursts + 1));
  }
  const final = await page.evaluate(() => window.__firecrackersQA.snapshot());
  assert.equal(final.backend, expected[backend]); assert.equal(final.quality, 'ultra');
  const stem = `${source}-${backend}-${width}x${height}-repeat-${repeat}`;
  await writeFile(`${out}/${stem}-frames.json`, JSON.stringify(measurements.map(({ workload, raw }) => ({ workload, frames: raw }))));
  const run = { source, origin, requestedBackend: backend, backend: final.backend, width, height, repeat, positionInPair,
    release, identity, authoredAssetStates: initial.authoredAssetStates || { moon: initial.moon.ready ? 'active' : 'failed' },
    settings: { quality: initial.quality, reducedFlashes: initial.reducedFlashes, reducedMotion: initial.reducedMotion },
    initialTime: initial.time, initialSkyCadence: initial.skyAmbientCadence,
    rawPath: `${stem}-frames.json`, measurements: measurements.map(({ raw, ...measurement }) => measurement), errors };
  report.runs.push(run);
  report.errors.push(...errors.map(message => ({ source, backend, width, height, repeat, message })));
  console.log(JSON.stringify({ source, backend: final.backend, viewport: `${width}x${height}`, repeat,
    fingerprint: release.sha256, summaries: run.measurements.map(measurement => ({ workload: measurement.workload, rafP95: measurement.summary.raf.p95Ms, cpuP95: measurement.summary.cpuSubmission.p95Ms, transitionWorst: measurement.transitionSummary?.raf.worstMs })) }));
  await page.close();
  return { run, measurements };
}

function compareP95(before, after) {
  const allowanceMs = Math.max(2, before * .20);
  return { baselineMs: before, candidateMs: after, deltaMs: after - before, allowanceMs, withinAllowance: after - before <= allowanceMs };
}
const observations = [];
try {
  for (const [width, height] of viewports) for (const backend of backends) for (const repeat of [1, 2]) {
    const pair = {};
    const order = repeat === 1 ? [['baseline', baseline], ['candidate', candidate]] : [['candidate', candidate], ['baseline', baseline]];
    for (let index = 0; index < order.length; index++) {
      const [source, origin] = order[index];
      pair[source] = await runCondition(source, origin, backend, width, height, repeat, index + 1);
    }
    observations.push({ backend, width, height, repeat, pair });
    for (const workload of ['idle', 'launch-1', 'launch-2']) {
      const before = pair.baseline.measurements.find(measurement => measurement.workload === workload);
      const after = pair.candidate.measurements.find(measurement => measurement.workload === workload);
      report.comparisons.push({ type: 'paired', backend, width, height, repeat, workload,
        rafP95: compareP95(before.summary.raf.p95Ms, after.summary.raf.p95Ms),
        cpuSubmissionP95: compareP95(before.summary.cpuSubmission.p95Ms, after.summary.cpuSubmission.p95Ms),
        transitionRafP95: before.transitionSummary ? compareP95(before.transitionSummary.raf.p95Ms, after.transitionSummary.raf.p95Ms) : null,
        transitionWorst: before.transitionSummary ? { baselineMs: before.transitionSummary.raf.worstMs, candidateMs: after.transitionSummary.raf.worstMs,
          baselineOver50: before.transitionSummary.raf.over50Ms, candidateOver50: after.transitionSummary.raf.over50Ms,
          baselineOver100: before.transitionSummary.raf.over100Ms, candidateOver100: after.transitionSummary.raf.over100Ms } : null });
    }
    await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  }
  for (const [width, height] of viewports) for (const backend of backends) for (const workload of ['idle', 'launch-1', 'launch-2']) {
    const pairs = observations.filter(observation => observation.backend === backend && observation.width === width && observation.height === height);
    const frames = source => pairs.flatMap(observation => observation.pair[source].measurements.find(measurement => measurement.workload === workload).raw);
    const before = summarize(frames('baseline')), after = summarize(frames('candidate'));
    const transition = source => frames(source).filter(frame => frame.relativeToBurstMs !== null && Math.abs(frame.relativeToBurstMs) <= 1200);
    const beforeTransition = summarize(transition('baseline')), afterTransition = summarize(transition('candidate'));
    const repeats = report.comparisons.filter(comparison => comparison.type === 'paired' && comparison.backend === backend && comparison.width === width && comparison.height === height && comparison.workload === workload);
    report.comparisons.push({ type: 'combined', backend, width, height, workload,
      rafP95: compareP95(before.raf.p95Ms, after.raf.p95Ms), cpuSubmissionP95: compareP95(before.cpuSubmission.p95Ms, after.cpuSubmission.p95Ms),
      transitionRafP95: workload === 'idle' ? null : compareP95(beforeTransition.raf.p95Ms, afterTransition.raf.p95Ms),
      repeatedCadenceRegression: repeats.every(comparison => !comparison.rafP95.withinAllowance),
      repeatedTransitionOver100: workload !== 'idle' && repeats.every(comparison => comparison.transitionWorst.candidateOver100 > 0 && comparison.transitionWorst.baselineOver100 === 0),
      baselineSummary: before, candidateSummary: after });
  }
  report.acceptance = {
    rafWithinAllowance: report.comparisons.filter(comparison => comparison.type === 'combined').every(comparison => comparison.rafP95.withinAllowance && (!comparison.transitionRafP95 || comparison.transitionRafP95.withinAllowance)),
    noRepeatedNewTransitionOver100: report.comparisons.filter(comparison => comparison.type === 'combined').every(comparison => !comparison.repeatedTransitionOver100),
    runtimeErrors: report.errors.length,
    note: 'The 100 ms repeatable hitch indicator supplements raw 33/50/100 ms interval counts; review the raw burst-relative frames for smaller repeated stalls. CPU submission allowances are reported separately and do not substitute for cadence or completed GPU measurements.',
  };
  if (!report.acceptance.rafWithinAllowance || !report.acceptance.noRepeatedNewTransitionOver100 || report.errors.length) process.exitCode = 1;
} catch (error) {
  report.failed = error.stack; process.exitCode = 1; console.error(error);
  if (page && !page.isClosed()) await page.screenshot({ path: `${out}/FAILED.png` }).catch(() => {});
} finally {
  await browser.close(); await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify({ runs: report.runs.length, acceptance: report.acceptance, failed: report.failed }));
