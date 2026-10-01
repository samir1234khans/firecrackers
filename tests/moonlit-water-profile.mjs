import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { openPanel, settingsTab } from './stage-helpers.mjs';
import { installWaterTimingProbe, validateWaterTimingProbe, sampleWaterTiming } from './moonlit-water-probe.mjs';

// Attribution only. Existing paired performance gates remain independent.
const out = process.argv[2] || 'test-results/moonlit-water-profile';
const origins = {
  baseline: process.env.WATER_BASELINE_URL || 'https://firecrackers.mainandmany.com/',
  candidate: process.env.WATER_URL || 'http://127.0.0.1:4173/',
};
const seed = 20260916;
const profileWidth = Number(process.env.WATER_PROFILE_WIDTH || 393);
const profileHeight = Number(process.env.WATER_PROFILE_HEIGHT || 851);
assert.ok(Number.isInteger(profileWidth) && profileWidth > 0 && Number.isInteger(profileHeight) && profileHeight > 0);
const backends = process.env.WATER_PROFILE_BACKENDS?.split(',') || ['webgpu', 'webgl'];
const categories = 'devtools.timeline,v8,disabled-by-default-devtools.timeline,blink.user_timing';
const report = {
  method: 'Installed native Chrome; sequential production/candidate backends at the recorded viewport. Authored assets active, simulation/RNG reset, 1.5s realtime warmup, 3s idle and two 7.5s realtime Gold Willow launches. Both sources use private CDP Runtime closure-scope scalar probes with a preallocated numeric buffer; full QA snapshot validates simultaneous scalar readings outside measurements. Debugger is never enabled. The inter-launch QA residue advance is outside sampled intervals and explicitly marked in the trace. CDP timeline attribution is diagnostic, not a replacement for untraced paired performance gates.',
  limits: 'CDP trace instrumentation may alter timings. CPU water update includes bounded reflection work and its scheduling; absence of a reflection update does not mean water shading is absent from the main GPU pass. App submission cadence and CPU timings do not measure completed GPU time. Phone viewport is emulated on this PC; physical-phone and thermal endurance are unqualified.',
  categories, seed, viewport: { width: profileWidth, height: profileHeight }, runs: [], errors: [], failed: null,
};
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
report.browser = browser.version();

const percentile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
};
const distribution = values => ({ count: values.length, p50: percentile(values, .5), p95: percentile(values, .95), worst: percentile(values, 1) });
function summarize(frames) {
  const renders = frames.filter(frame => frame.newRender);
  const reflecting = renders.filter(frame => frame.reflectionUpdated);
  const plain = renders.filter(frame => !frame.reflectionUpdated);
  return {
    rafMs: distribution(frames.map(frame => frame.rafMs)),
    appIntervalMs: distribution(renders.filter(frame => frame.appIntervalMs !== null).map(frame => frame.appIntervalMs)),
    cpuSubmitMs: distribution(renders.map(frame => frame.submitMs)),
    waterSubmitMs: distribution(renders.filter(frame => frame.waterSubmitMs !== null).map(frame => frame.waterSubmitMs)),
    reflectingCpuMs: distribution(reflecting.map(frame => frame.submitMs)),
    plainCpuMs: distribution(plain.map(frame => frame.submitMs)),
    observerMs: distribution(frames.map(frame => frame.snapshotMs)),
    reflectedFrames: reflecting.length, renders: renders.length,
  };
}

async function sample(page, workload, duration, targetBurst) {
  const result = await sampleWaterTiming(page, workload, duration, targetBurst, true);
  if (targetBurst !== null) assert.ok(Number.isFinite(result.burstAt), `${workload} must burst`);
  const frames = result.frames.map(frame => ({ ...frame, appIntervalMs: frame.renderedIntervalMs,
    frameId: frame.renderFrames, relativeToBurstMs: result.burstAt === null ? null : frame.t - result.burstAt }));
  return { workload, burstAt: result.burstAt, summary: summarize(frames), frames };
}

async function stopTrace(cdp) {
  const complete = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
  await cdp.send('Tracing.end');
  const { stream } = await complete;
  assert.ok(stream, 'CDP trace stream must be available');
  let trace = '';
  for (;;) {
    const response = await cdp.send('IO.read', { handle: stream });
    trace += response.base64Encoded ? Buffer.from(response.data, 'base64').toString('utf8') : response.data;
    if (response.eof) break;
  }
  await cdp.send('IO.close', { handle: stream });
  return trace;
}

function traceAssessment(trace, samples, clockPoint) {
  const events = JSON.parse(trace).traceEvents;
  const threads = events.filter(event => event.ph === 'M' && event.name === 'thread_name')
    .map(event => ({ pid: event.pid, tid: event.tid, name: event.args?.name }));
  const marker = events.find(event => event.name === 'water-profile:launch-2:start' && event.ts);
  const measured = samples.find(sample => sample.workload === 'launch-2');
  if (!marker || !measured) return { eventCount: events.length, threads, markerMissing: true };
  // CDP monotonic microseconds and browser performance.now() are mapped through
  // the user timing mark; phase start precedes the first sampled callback.
  const startMarker = events.find(event => event.name === 'water-profile:clock-sync' && event.ts);
  const offsetUs = startMarker && Number.isFinite(clockPoint) ? startMarker.ts - clockPoint * 1000 : null;
  const intervals = measured.frames.filter(frame => frame.rafMs > 50).map(frame => {
    // raf timestamps start before the render. Current performanceNow also
    // includes that frame's app work, so frame markers are a secondary aid.
    const endUs = offsetUs === null ? null : offsetUs + frame.performanceNow * 1000;
    const startUs = offsetUs === null ? null : offsetUs + (frame.rafNow - frame.rafMs) * 1000;
    const related = endUs === null ? [] : events.filter(event => event.ph === 'X' && event.dur > 1000 && event.ts <= endUs && event.ts + event.dur >= startUs);
    return {
      frame, startUs, endUs,
      longestTasks: related.sort((a, b) => b.dur - a.dur).slice(0, 24).map(event => ({
        name: event.name, cat: event.cat, pid: event.pid, tid: event.tid,
        thread: threads.find(thread => thread.pid === event.pid && thread.tid === event.tid)?.name,
        durationMs: event.dur / 1000, startUs: event.ts,
        args: event.args,
      })),
    };
  });
  return { eventCount: events.length, threads, offsetUs, intervals };
}

try {
  for (const backend of backends) for (const source of ['baseline', 'candidate']) {
    const page = await browser.newPage({ viewport: report.viewport, serviceWorkers: 'block', reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => localStorage.setItem('firecrackers.preferences.v1', JSON.stringify({ version: 2,
      family: 'gold-willow', quality: 'ultra', reducedMotion: false, reducedFlashes: true,
      sound: false, volume: .45, haptics: false, ambience: false, onboarded: true,
      preset: 'festival', placement: .5, placementMode: 'fixed' })));
    const url = new URL(origins[source]);
    url.searchParams.set('qa', '1'); url.searchParams.set('seed', String(seed)); url.searchParams.set('backend', backend);
    await page.goto(url.href);
    await page.waitForSelector('main[data-ready="true"][data-presented="true"]', { timeout: 90000 });
    await page.waitForFunction(() => {
      const state = window.__firecrackersQA?.snapshot();
      return state?.moon?.ready && Object.keys(state.authoredAssetStates || {}).length >= 9 && Object.values(state.authoredAssetStates).every(value => value === 'active');
    }, undefined, { timeout: 90000 });
    const identity = await page.evaluate(async backend => {
      if (backend === 'webgpu') {
        const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        return adapter ? { vendor: adapter.info.vendor, architecture: adapter.info.architecture, fallback: adapter.info.isFallbackAdapter } : null;
      }
      const canvas = [...document.querySelectorAll('main canvas')].find(canvas => canvas.getContext('webgl2'));
      const gl = canvas?.getContext('webgl2'), extension = gl?.getExtension('WEBGL_debug_renderer_info');
      return { driver: extension ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : '' };
    }, backend);
    if (backend === 'webgpu') { assert.ok(identity); assert.equal(identity.fallback, false); }
    else { assert.ok(identity.driver); assert.ok(!/swiftshader|llvmpipe|software|microsoft basic render/i.test(identity.driver)); }
    const timingProbe = await installWaterTimingProbe(page);
    const release = await page.evaluate(() => fetch('/release.json').then(response => response.json()));
    await page.evaluate(() => window.__firecrackersQA.freeze(true));
    await openPanel(page, 'settings'); await settingsTab(page, 'Device');
    await page.getByRole('button', { name: 'Reset this sky', exact: true }).click();
    await page.getByRole('button', { name: 'Reset sky and preferences', exact: true }).click();
    await page.evaluate(() => window.__firecrackersQA.freeze(false));
    await page.waitForTimeout(1500);
    const before = await page.evaluate(() => window.__firecrackersQA.snapshot());
    assert.equal(before.backend, backend === 'webgpu' ? 'WebGPU' : 'WebGL 2');
    assert.equal(before.quality, 'ultra'); assert.equal(before.paused, false);
    if (source === 'candidate') assert.ok(Number.isFinite(before.waterSubmitMs), 'Candidate CPU water diagnostic must be exposed');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Tracing.start', { categories, transferMode: 'ReturnAsStream' });
    const clockPoint = await page.evaluate(() => {
      const performanceNow = performance.now();
      performance.mark('water-profile:clock-sync', { detail: { performanceNow } });
      return performanceNow;
    });
    const samples = [await sample(page, 'idle', 3000, null)];
    for (let launch = 1; launch <= 2; launch++) {
      if (launch === 2) {
        await page.evaluate(() => {
          performance.mark('water-profile:unmeasured-residue-advance:start');
          window.__firecrackersQA.advance(30);
          performance.mark('water-profile:unmeasured-residue-advance:end');
        });
        await page.waitForTimeout(500);
      }
      const previous = await page.evaluate(() => window.__firecrackersQA.snapshot().bursts);
      await page.locator('[data-family-icon="gold-willow"]').click();
      samples.push(await sample(page, `launch-${launch}`, 7500, previous + 1));
    }
    const trace = await stopTrace(cdp);
    await validateWaterTimingProbe(page);
    const finalRelease = await page.evaluate(() => fetch('/release.json').then(response => response.json()));
    assert.equal(finalRelease.sha256, release.sha256, 'Source must remain stable during profiling');
    const stem = `${source}-${backend}-${profileWidth}x${profileHeight}`;
    await writeFile(`${out}/${stem}-trace.json`, trace);
    await writeFile(`${out}/${stem}-frames.json`, JSON.stringify(samples));
    const assessment = traceAssessment(trace, samples, clockPoint);
    await writeFile(`${out}/${stem}-trace-summary.json`, JSON.stringify(assessment, null, 2));
    const run = { source, origin: origins[source], backend, identity, timingProbe, release, errors,
      tracePath: `${stem}-trace.json`, rawPath: `${stem}-frames.json`, assessmentPath: `${stem}-trace-summary.json`,
      measurements: samples.map(({ frames, ...summary }) => summary), traceEvents: assessment.eventCount,
    };
    report.runs.push(run); report.errors.push(...errors.map(message => ({ source, backend, message })));
    await page.close();
    console.log(JSON.stringify({ source, backend, fingerprint: release.sha256,
      samples: run.measurements, traceEvents: assessment.eventCount, traceClockMapped: assessment.offsetUs !== null, errors }));
  }
} catch (error) {
  report.failed = error.stack || String(error); process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
}
if (report.errors.length) process.exitCode = 1;
