import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { inspectCapturedVideo } from './captured-media-helpers.mjs';
const base = process.env.STAGE_URL || 'http://127.0.0.1:4173/';
const out = process.argv[2] || 'test-results/capture-continuity';
await mkdir(out, { recursive: true });
const report = { base, method: 'Real scene/UI capture with bounded deterministic render stepping and independent FFmpeg decode; not a real-time frame-rate benchmark', hardwareQualified: false, physicalDevice: false, cases: [] };
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
try {
  for (const backend of ['webgl', 'canvas']) for (const [width, height] of [[1280, 800], [393, 851]]) for (const fallback of [false, true]) {
    const name = `${backend}-${width}x${height}-${fallback ? 'timed' : 'manual'}`;
    const result = { name, errors: [] }; report.cases.push(result);
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 500, isMobile: width < 500, serviceWorkers: 'block' });
    await context.addInitScript(({ fallback }) => {
      localStorage.setItem('firecrackers.preferences.v1', JSON.stringify({ version: 4, onboarded: true, quality: 'low', adaptiveResolution: false, reducedFlashes: true, reducedMotion: true, sound: false }));
      if (fallback && window.CanvasCaptureMediaStreamTrack) Object.defineProperty(CanvasCaptureMediaStreamTrack.prototype, 'requestFrame', { configurable: true, value: undefined });
    }, { fallback });
    const page = await context.newPage();
    page.on('pageerror', error => result.errors.push(error.message));
    try {
      await page.goto(`${base}?backend=${backend}&qa=1&seed=731`);
      await page.waitForSelector('main[data-ready="true"][data-presented="true"]', { timeout: 90000 });
      await page.evaluate(() => window.__firecrackersQA.freeze(true));
      const expected = backend === 'webgl' ? 'WebGL 2' : 'Canvas 2D · compatibility';
      assert.equal(await page.evaluate(() => window.__firecrackersQA.snapshot().backend), expected);
      await page.locator('[data-family-icon="multicolor-peony"]').click();
      for (let i = 0; i < 48; i++) {
        if (await page.evaluate(() => window.__firecrackersQA.snapshot().bursts > 0)) break;
        await page.evaluate(() => window.__firecrackersQA.advance(.25));
      }
      assert.ok(await page.evaluate(() => window.__firecrackersQA.snapshot().bursts > 0));
      await page.getByRole('button', { name: 'Capture this night', exact: true }).click();
      await page.getByRole('button', { name: 'Record clip', exact: true }).click();
      await page.waitForFunction(() => window.__firecrackersQA.snapshot().capture.recording);
      // Each step uses the same presented() -> SceneCapture.frame path as a real render.
      // Dwell lets the software runner encode; it does not change application show pace.
      for (let i = 0; i < 12; i++) {
        await page.evaluate(() => window.__firecrackersQA.advance(.12));
        await page.waitForTimeout(100);
      }
      await page.getByRole('button', { name: 'Stop recording clip', exact: true }).click();
      const video = page.getByRole('region', { name: 'Capture preview' }).getByLabel('Captured fireworks clip');
      await video.waitFor();
      result.media = await inspectCapturedVideo(video, `${out}/${name}`);
      const filename = `${out}/${name}.${result.media.mime.includes('mp4') ? 'mp4' : 'webm'}`;
      const streams = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-of', 'json', filename], { encoding: 'utf8', timeout: 30000 })).streams;
      const track = streams.find(stream => stream.codec_type === 'video');
      const hashes = execFileSync('ffmpeg', ['-v', 'error', '-i', filename, '-map', '0:v:0', '-an', '-f', 'framemd5', '-'], { encoding: 'utf8', timeout: 30000 });
      const frames = hashes.split('\n').filter(line => line && !line.startsWith('#'));
      result.frames = Number(track?.nb_read_frames || 0);
      result.distinctFrames = new Set(frames.map(line => line.slice(line.lastIndexOf(',') + 1).trim())).size;
      assert.ok(result.frames >= 3 && result.distinctFrames >= 3, `Expected changing recorded video, got ${result.frames} frames / ${result.distinctFrames} distinct`);
      assert.ok(result.media.frame.litPixels > 50, 'actual scene pixels are present');
      assert.ok(!streams.some(stream => stream.codec_type === 'audio'), 'a silent capture does not unexpectedly include audio');
      assert.equal(await page.evaluate(() => window.__firecrackersQA.snapshot().capture.recording), false);
      assert.equal(await page.evaluate(() => window.__firecrackersQA.snapshot().backend), expected);
      assert.deepEqual(result.errors, []); result.pass = true;
      console.log('PASS', name, result.frames, result.distinctFrames);
    } catch (error) {
      result.pass = false; result.failure = error.stack; process.exitCode = 1;
      await page.screenshot({ path: `${out}/${name}-FAILED.png` }).catch(() => {});
      console.error('FAIL', name, error.message);
    } finally { await context.close(); }
  }
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); await browser.close();
}
