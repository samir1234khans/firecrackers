import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { openPanel, settingsTab } from './stage-helpers.mjs';
import { installWaterTimingProbe, validateWaterTimingProbe, sampleWaterTiming } from './moonlit-water-probe.mjs';

// Run by itself. Sampling observes the normal app animation loop; it never
// repeatedly invokes QA.render() on a frozen scene during a measurement.
const baseline = process.env.WATER_BASELINE_URL || 'https://firecrackers.mainandmany.com/';
const candidate = process.env.WATER_URL || 'http://127.0.0.1:4173/';
const out = process.argv[2] || 'test-results/moonlit-water-performance';
const seed = 20260916;
const repeatCount = Number(process.env.WATER_PERFORMANCE_REPEATS || 2);
assert.ok(Number.isInteger(repeatCount) && repeatCount >= 2 && repeatCount <= 6, 'Use two to six complete counterbalanced repetitions');
const backends = process.env.WATER_PERFORMANCE_BACKENDS?.split(',') || ['webgpu', 'webgl', 'canvas'];
const viewports = [[393, 851], [1280, 800]].filter(([width]) => !process.env.WATER_PERFORMANCE_WIDTH || width === Number(process.env.WATER_PERFORMANCE_WIDTH));
const expected = { webgpu: 'WebGPU', webgl: 'WebGL 2', canvas: 'Canvas 2D · compatibility' };
const idleMilliseconds = 3000, launchMilliseconds = 7500, warmupMilliseconds = 1500;
const analyzeOnly = process.env.WATER_PERFORMANCE_ANALYZE === '1';
const warmParticleDrawing = process.env.WATER_PERFORMANCE_WARM_LAUNCH === '1';
const report = {
  baseline, candidate, seed, browser: null,
  method: 'Installed headless Chrome, sequential counterbalanced AB/BA pairs, the recorded number of complete repetitions at each backend and viewport. All authored assets are active before reset and realtime idle warmup. Service workers are blocked. CDP Runtime closure scopes bind a private test-only scalar reader to the existing renderer metrics and Simulation, symmetrically for both sources; Debugger is never enabled and no app/public API is changed. Full QA snapshot verifies bindings before and after sampling. Each interval preallocates 8192 numeric records and materializes objects afterward, avoiding full diagnostic graphs on every rAF. Sampling observes realtime requestAnimationFrame and app submitMs, retaining CPU samples only when the renderer frame counter advances. Measurement never drives a frozen QA render loop.',
  limits: 'rAF cadence and CPU submission are recorded separately; neither is completed GPU time. Phone-sized viewports are emulated on this PC. Physical-phone performance and thermal endurance are unqualified. Scalar observer overhead is measured; this does not prove older collections were entirely caused by QA diagnostics. Legacy failed full-snapshot reports remain separate retained evidence; percentile methods and performance assertions are unchanged.',
  settings: { quality: 'ultra', reducedFlashes: true, reducedMotion: false, sound: false, haptics: false, placement: .5, idleMilliseconds, launchMilliseconds, warmupMilliseconds, repeats: repeatCount, warmParticleDrawing },
  runs: [], comparisons: [], errors: [], failed: null,
};
await mkdir(out, { recursive: true });
const browser = analyzeOnly ? null : await chromium.launch({ channel: 'chrome', headless: true });
report.browser = browser ? await browser.version() : null;
let page;

const quantile = (values, fraction) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
};
const distribution = values => ({
  count: values.length, p50Ms: quantile(values, .5), p95Ms: quantile(values, .95), worstMs: quantile(values, 1),
  p95NearestRankMs: values.length ? [...values].sort((a, b) => a - b)[Math.max(0, Math.ceil(values.length * .95) - 1)] : null,
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
  const frames = await sampleWaterTiming(page, workload, duration, targetBurst);
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
  const timingProbe = await installWaterTimingProbe(page);
  if (warmParticleDrawing) {
    // Asset/pipeline preparation does not exercise Canvas's particle drawing.
    // Warm the same representative effect on BOTH sources, outside sampling;
    // the normal reset below restores their seed and scene before comparison.
    await page.evaluate(() => window.__firecrackersQA.freeze(true));
    await page.locator('[data-family-icon="gold-willow"]').click();
    await page.evaluate(() => window.__firecrackersQA.advance(4));
    await page.evaluate(() => window.__firecrackersQA.freeze(false));
    await page.waitForTimeout(3000);
  }
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
  await validateWaterTimingProbe(page);
  assert.equal(final.backend, expected[backend]); assert.equal(final.quality, 'ultra');
  const finalRelease = await page.evaluate(() => fetch('/release.json').then(response => response.json()));
  assert.equal(finalRelease.sha256, release.sha256, 'Source fingerprint must remain stable throughout each condition');
  const stem = `${source}-${backend}-${width}x${height}-repeat-${repeat}`;
  await writeFile(`${out}/${stem}-frames.json`, JSON.stringify(measurements.map(({ workload, raw }) => ({ workload, frames: raw }))));
  const run = { source, origin, requestedBackend: backend, backend: final.backend, width, height, repeat, positionInPair,
    release, identity, timingProbe, authoredAssetStates: initial.authoredAssetStates || { moon: initial.moon.ready ? 'active' : 'failed' },
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
  assert.ok(Number.isFinite(before) && Number.isFinite(after), 'A cadence comparison requires measured samples from both sources');
  const allowanceMs = Math.max(2, before * .20);
  return { baselineMs: before, candidateMs: after, deltaMs: after - before, allowanceMs, withinAllowance: after - before <= allowanceMs };
}
const observations = [];
async function addRenderedCadenceAssessment(dataset) {
  const rawByRun = new Map();
  for (const run of dataset.runs) rawByRun.set(run, JSON.parse(await readFile(`${out}/${run.rawPath}`, 'utf8')));
  const framesFor = (comparison, source) => dataset.runs
    .filter(run => run.source === source && run.requestedBackend === comparison.backend && run.width === comparison.width && run.height === comparison.height && (comparison.type === 'combined' || run.repeat === comparison.repeat))
    .flatMap(run => rawByRun.get(run).find(measurement => measurement.workload === comparison.workload).frames);
  for (const comparison of dataset.comparisons) {
    const beforeFrames = framesFor(comparison, 'baseline'), afterFrames = framesFor(comparison, 'candidate');
    const before = summarize(beforeFrames), after = summarize(afterFrames);
    const inTransition = frames => frames.filter(frame => frame.relativeToBurstMs !== null && Math.abs(frame.relativeToBurstMs) <= 1200);
    const beforeTransition = summarize(inTransition(beforeFrames)), afterTransition = summarize(inTransition(afterFrames));
    comparison.renderedCadenceP95 = compareP95(before.renderedCadence.p95Ms, after.renderedCadence.p95Ms);
    comparison.renderedCadenceNearestRankP95 = compareP95(before.renderedCadence.p95NearestRankMs, after.renderedCadence.p95NearestRankMs);
    comparison.transitionRenderedCadenceP95 = comparison.workload === 'idle' ? null : compareP95(beforeTransition.renderedCadence.p95Ms, afterTransition.renderedCadence.p95Ms);
    comparison.transitionRenderedCadenceNearestRankP95 = comparison.workload === 'idle' ? null : compareP95(beforeTransition.renderedCadence.p95NearestRankMs, afterTransition.renderedCadence.p95NearestRankMs);
    comparison.transitionRenderedIntervals = comparison.workload === 'idle' ? null : { baseline: beforeTransition.renderedCadence, candidate: afterTransition.renderedCadence };
    comparison.renderedCadenceSummaries = { baseline: before.renderedCadence, candidate: after.renderedCadence };
  }
  const combined = dataset.comparisons.filter(comparison => comparison.type === 'combined');
  for (const comparison of combined) {
    const paired = dataset.comparisons.filter(pair => pair.type === 'paired' && pair.backend === comparison.backend && pair.width === comparison.width && pair.height === comparison.height && pair.workload === comparison.workload);
    comparison.repeatedRenderedCadenceRegression = paired.every(pair => !pair.renderedCadenceP95.withinAllowance);
    comparison.repeatedNewRenderedTransitionOver50 = comparison.workload !== 'idle' && paired.filter(pair => pair.transitionRenderedIntervals.candidate.over50Ms > 0 && pair.transitionRenderedIntervals.baseline.over50Ms === 0).length >= 2;
    comparison.repeatedNewRenderedTransitionOver100 = comparison.workload !== 'idle' && paired.filter(pair => pair.transitionRenderedIntervals.candidate.over100Ms > 0 && pair.transitionRenderedIntervals.baseline.over100Ms === 0).length >= 2;
  }
  dataset.acceptance.repeatableHitchDefinition = 'A new transition over the threshold in at least two paired repetitions, retaining the original two-repeat criterion when extra repetitions are collected';
  dataset.acceptance.primaryMetric = 'App-rendered frame interval, from changes to the existing renderer frame counter; active scene capped at 60fps, idle retains its bounded cadence';
  dataset.acceptance.percentileMethod = 'p95Ms uses sorted[min(N-1,floor(N*.95))]; nearest-rank p95 is also retained as sorted[ceil(N*.95)-1]. Timings remain unrounded.';
  dataset.acceptance.appRenderedCadenceWithinAllowance = combined.every(comparison => comparison.renderedCadenceP95.withinAllowance && (!comparison.transitionRenderedCadenceP95 || comparison.transitionRenderedCadenceP95.withinAllowance));
  dataset.acceptance.appRenderedCadenceNearestRankWithinAllowance = combined.every(comparison => comparison.renderedCadenceNearestRankP95.withinAllowance && (!comparison.transitionRenderedCadenceNearestRankP95 || comparison.transitionRenderedCadenceNearestRankP95.withinAllowance));
  dataset.acceptance.noRepeatedNewRenderedTransitionOver50 = combined.every(comparison => !comparison.repeatedNewRenderedTransitionOver50);
  dataset.acceptance.noRepeatedNewRenderedTransitionOver100 = combined.every(comparison => !comparison.repeatedNewRenderedTransitionOver100);
  dataset.acceptance.observerRafWithinAllowance = dataset.acceptance.rafWithinAllowance;
  const renderedNote = 'App-rendered cadence is the primary frame-interval assessment; observer rAF failures and raw intervals are retained as a separate scheduling assessment. Original rAF assertions remain in the script exit status.';
  if (!dataset.acceptance.note.includes(renderedNote)) dataset.acceptance.note += ` ${renderedNote}`;
}
if (analyzeOnly) {
  const saved = JSON.parse(await readFile(`${out}/report.json`, 'utf8'));
  assert.ok(saved.acceptance && !saved.failed, 'Analyze only an experiment that completed its configured measurements');
  assert.equal(saved.runs.length, saved.comparisons.filter(comparison => comparison.type === 'paired').length * 2 / 3, 'Analyze only a completed paired experiment');
  await addRenderedCadenceAssessment(saved);
  await writeFile(`${out}/report.json`, JSON.stringify(saved, null, 2));
  console.log(JSON.stringify({ runs: saved.runs.length, acceptance: saved.acceptance, failed: saved.failed }));
  if (!saved.acceptance.rafWithinAllowance || !saved.acceptance.appRenderedCadenceWithinAllowance || !saved.acceptance.noRepeatedNewTransitionOver100 || !saved.acceptance.noRepeatedNewRenderedTransitionOver50 || !saved.acceptance.noRepeatedNewRenderedTransitionOver100 || saved.errors.length) process.exitCode = 1;
} else {
try {
  for (const [width, height] of viewports) for (const backend of backends) for (let repeat = 1; repeat <= repeatCount; repeat++) {
    const pair = {};
    const order = repeat % 2 === 1 ? [['baseline', baseline], ['candidate', candidate]] : [['candidate', candidate], ['baseline', baseline]];
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
      repeatedTransitionOver100: workload !== 'idle' && repeats.filter(comparison => comparison.transitionWorst.candidateOver100 > 0 && comparison.transitionWorst.baselineOver100 === 0).length >= 2,
      baselineSummary: before, candidateSummary: after });
  }
  report.acceptance = {
    rafWithinAllowance: report.comparisons.filter(comparison => comparison.type === 'combined').every(comparison => comparison.rafP95.withinAllowance && (!comparison.transitionRafP95 || comparison.transitionRafP95.withinAllowance)),
    noRepeatedNewTransitionOver100: report.comparisons.filter(comparison => comparison.type === 'combined').every(comparison => !comparison.repeatedTransitionOver100),
    runtimeErrors: report.errors.length,
    note: 'The 100 ms repeatable hitch indicator supplements raw 33/50/100 ms interval counts; review the raw burst-relative frames for smaller repeated stalls. CPU submission allowances are reported separately and do not substitute for cadence or completed GPU measurements.',
  };
  await addRenderedCadenceAssessment(report);
  if (!report.acceptance.rafWithinAllowance || !report.acceptance.noRepeatedNewTransitionOver100 || report.errors.length) process.exitCode = 1;
  if (!report.acceptance.appRenderedCadenceWithinAllowance || !report.acceptance.noRepeatedNewRenderedTransitionOver50 || !report.acceptance.noRepeatedNewRenderedTransitionOver100) process.exitCode = 1;
} catch (error) {
  report.failed = error.stack; process.exitCode = 1; console.error(error);
  if (page && !page.isClosed()) await page.screenshot({ path: `${out}/FAILED.png` }).catch(() => {});
} finally {
  await browser.close(); await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify({ runs: report.runs.length, acceptance: report.acceptance, failed: report.failed }));
}
