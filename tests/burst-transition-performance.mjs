import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

// Native installed Chrome, with viewport emulation. This is a diagnostic
// comparison, not a cross-device performance threshold for CI.
const base = process.env.BURST_URL || 'http://127.0.0.1:4173/';
const out = process.argv[2] || 'test-results/burst-transition-performance';
const backends = process.env.BURST_BACKENDS?.split(',') || ['webgpu', 'webgl', 'canvas'];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
const summarize = frames => {
  const sorted = frames.map(f => f.ms).sort((a, b) => a - b);
  const percentile = p => Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] * 10) / 10;
  return { frames: frames.length, p50Ms: percentile(.5), p95Ms: percentile(.95), worstMs: percentile(1), over33Ms: sorted.filter(ms => ms > 33).length };
};

await mkdir(out, { recursive: true });
try {
  for (const backend of backends) {
    const page = await browser.newPage({ viewport: { width: 393, height: 851 }, serviceWorkers: 'block' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}?qa=1&seed=20260916&backend=${backend}`);
    await page.waitForSelector('main[data-ready="true"][data-presented="true"]', { timeout: 90000 });
    await page.locator('.startup-ready-note').waitFor({ state: 'hidden' });
    const release = await page.evaluate(() => fetch('/release.json').then(response => response.json()));
    for (let run = 1; run <= 2; run++) {
      if (run === 2) await page.evaluate(() => window.__firecrackersQA.advance(25));
      await page.locator('[data-family-icon="gold-willow"]').click();
      const frames = await page.evaluate(() => new Promise(resolve => {
        const frames = []; let start = 0, previous = 0;
        function sample(now) {
          if (!start) start = now;
          if (previous) frames.push({ t: now - start, ms: now - previous,
            bursts: Number(document.querySelector('main').dataset.bursts || 0) });
          previous = now;
          if (now - start < 7500) requestAnimationFrame(sample);
          else resolve(frames);
        }
        requestAnimationFrame(sample);
      }));
      const burstAt = frames.find(frame => frame.bursts >= run)?.t;
      if (burstAt === undefined) throw new Error(`${backend} run ${run} did not burst`);
      results.push({ backend: (await page.evaluate(() => window.__firecrackersQA.snapshot())).backend,
        requestedBackend: backend, run, family: 'gold-willow', viewport: '393x851 CSS (emulated)', seed: 20260916,
        version: release.version, fingerprint: release.sha256, firstBurstMs: Math.round(burstAt),
        overall: summarize(frames), transition: summarize(frames.filter(frame => Math.abs(frame.t - burstAt) <= 1200)),
        errors });
      console.log(JSON.stringify(results.at(-1)));
    }
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(`${out}/report.json`, JSON.stringify({ base, method: 'Installed Chrome requestAnimationFrame cadence through two live launches per backend; CPU/browser scheduling only, not completed GPU time or physical-phone qualification', results }, null, 2));
}
