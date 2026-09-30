import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chooseFamily } from './stage-helpers.mjs';

// Opt-in installed-Chrome hardware capture. Phone-sized viewports are emulation,
// and requestAnimationFrame cadence is neither GPU timing nor endurance evidence.
const base = process.env.CINEMATIC_URL || 'http://127.0.0.1:4180/';
const prefix = process.env.CINEMATIC_PREFIX || 'candidate';
const output = path.resolve(process.argv[2] || `test-results/cinematic-${prefix}`);
const seed = 20260916;
const families = [
    { name: 'Gold Willow', id: 'gold-willow', phases: [['early', 3.5], ['peak', 4.9], ['late', 8.5]] },
    { name: 'Sapphire Saturn', id: 'sapphire-saturn', phases: [['early', 3.5], ['peak', 4.9], ['late', 7.2]] },
    { name: 'Opal Supernova', id: 'opal-supernova', phases: [['early', 3.5], ['peak', 7.8], ['late', 11.5]] },
];
const devices = [
    { name: 'desktop', width: 1280, height: 800, mobile: false },
    { name: 'portrait', width: 393, height: 851, mobile: true },
].filter(v => !process.env.CINEMATIC_PROJECT || process.env.CINEMATIC_PROJECT.includes(v.name));
const backends = (process.env.CINEMATIC_BACKENDS || 'webgpu,webgl').split(',');
const profileMs = Number(process.env.CINEMATIC_PROFILE_MS || 12000);
const report = {
    url: base, prefix, seed, startedAt: new Date().toISOString(),
    method: 'Installed Chrome headed, hardware rendering, no software GPU flags. Independent seeded first launch per family. Deterministic 60 Hz phase stepping for captures.',
    limitations: 'Portrait is Chrome viewport/touch emulation on this PC, not a physical phone. Short rAF cadence includes browser scheduling and CPU submission; it is not GPU timing, FPS guarantee, thermal endurance, or 15-minute Festival qualification.',
    errors: [], warnings: [], builds: [], projects: [], failed: null,
};
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: false });
report.browserVersion = browser.version();
let current;
async function snapshot(page) { return page.evaluate(() => window.__firecrackersQA.snapshot()); }
async function advance(page, seconds) {
    await page.evaluate(value => window.__firecrackersQA.advance(value), seconds);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => { window.__firecrackersQA.render(); resolve(); })));
}
async function resetFrozen(page) {
    await page.evaluate(() => window.__firecrackersQA.freeze(true));
    await page.getByRole('button', { name: 'Open settings', exact: true }).click();
    await page.getByRole('button', { name: 'Reset this sky', exact: true }).click();
    await page.getByRole('button', { name: 'Reset sky and preferences', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('main')?.dataset.overlay === 'none');
    assert.equal((await snapshot(page)).time, 0, 'Capture world clock must begin at zero independently of asset download time');
}
async function enter(page, backend, label) {
    const url = new URL(base);
    url.searchParams.set('backend', backend); url.searchParams.set('qa', '1'); url.searchParams.set('seed', String(seed));
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('main')?.dataset.ready === 'true' && Boolean(window.__firecrackersQA), undefined, { timeout: 90000 });
    await page.waitForFunction(() => Object.values(window.__firecrackersQA.snapshot().authoredAssetStates || {}).every(s => s === 'active'), undefined, { timeout: 90000 });
    assert.equal(await page.locator('main').getAttribute('data-overlay'), 'none');
    const actual = await page.locator('main').getAttribute('data-backend');
    assert.equal(actual, backend === 'webgpu' ? 'WebGPU' : 'WebGL 2', `${label}: requested backend must actually be active`);
    const hardware = await page.evaluate(() => {
        const canvas = document.querySelector('.scene-host canvas');
        let gl = null; try { gl = canvas.getContext('webgl2'); } catch { /* WebGPU canvas cannot yield WebGL. */ }
        const ext = gl?.getExtension('WEBGL_debug_renderer_info');
        return { adapter: window.__testedAdapter || null, webgl: ext ? { vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL), renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) } : null };
    });
    if (backend === 'webgpu') assert.equal(hardware.adapter?.fallback, false, 'Require a hardware WebGPU adapter');
    if (backend === 'webgl') {
        assert.ok(hardware.webgl, 'Require WebGL adapter evidence');
        assert.doesNotMatch(hardware.webgl.renderer, /SwiftShader|llvmpipe|software/i, 'Require hardware WebGL');
    }
    const release = await page.evaluate(async () => {
        const response = await fetch('/release.json', { cache: 'no-store' });
        const { version, sha256, formatVersion } = await response.json();
        return { version, sha256, formatVersion };
    });
    assert.equal(await page.locator('main').getAttribute('data-version'), release.version);
    if (!report.builds.some(b => b.sha256 === release.sha256)) report.builds.push(release);
    return { actual, hardware, release };
}
try {
    for (const device of devices) for (const backend of backends) {
        const label = `${device.name}-${backend}`;
        const project = { label, viewport: { width: device.width, height: device.height }, deviceScaleFactor: 1, requestedBackend: backend, captures: [], realtime: null };
        report.projects.push(project);
        const context = await browser.newContext({ viewport: project.viewport, deviceScaleFactor: 1, isMobile: device.mobile, hasTouch: device.mobile, serviceWorkers: 'block' });
        const page = current = await context.newPage();
        page.on('pageerror', e => report.errors.push(`${label}: ${e.message}`));
        page.on('console', m => {
            if (m.type() === 'error') report.errors.push(`${label}: ${m.text()}`);
            if (m.type() === 'warning') report.warnings.push(`${label}: ${m.text()}`);
        });
        await page.addInitScript(() => {
            if (!navigator.gpu) return;
            const original = GPUAdapter.prototype.requestDevice;
            GPUAdapter.prototype.requestDevice = async function (...args) {
                window.__testedAdapter = { vendor: this.info.vendor, architecture: this.info.architecture, device: this.info.device, description: this.info.description, fallback: this.info.isFallbackAdapter };
                const device = await original.apply(this, args);
                device.addEventListener('uncapturederror', e => console.error(`GPU validation: ${e.error.message}`));
                return device;
            };
        });
        Object.assign(project, await enter(page, backend, label));
        await resetFrozen(page);
        const idleFile = `${prefix}-${label}-idle.png`;
        await page.screenshot({ path: path.join(output, idleFile) });
        project.captures.push({ family: 'idle', file: idleFile, snapshot: await snapshot(page) });
        for (const family of families) {
            Object.assign(project, await enter(page, backend, label));
            await resetFrozen(page);
            await chooseFamily(page, family.name);
            const initial = await snapshot(page);
            assert.equal(initial.quality, 'ultra', 'Use identical default Ultra quality for comparison');
            await page.getByRole('button', { name: 'Launch selected firework', exact: true }).click();
            let prior = 0;
            for (const [phase, elapsed] of family.phases) {
                await advance(page, elapsed - prior); prior = elapsed;
                assert.equal((await snapshot(page)).backend, project.actual, 'Deterministic capture must retain requested backend');
                const file = `${prefix}-${label}-${family.id}-${phase}.png`;
                await page.screenshot({ path: path.join(output, file) });
                project.captures.push({ family: family.name, phase, elapsedAfterPress: elapsed, file, snapshot: await snapshot(page) });
            }
            await advance(page, 40);
            const done = await snapshot(page);
            assert.equal(done.active, 0); assert.equal(done.particles, 0); assert.equal(done.carriers, 0);
        }
        await enter(page, backend, label);
        await resetFrozen(page);
        await chooseFamily(page, 'Gold Willow');
        await page.evaluate(() => {
            window.__rafProfile = { deltas: [], last: null, running: true, startFrames: window.__firecrackersQA.snapshot().frames };
            window.__firecrackersQA.freeze(false);
            const sample = stamp => {
                const profile = window.__rafProfile;
                if (!profile.running) return;
                if (profile.last !== null) profile.deltas.push(stamp - profile.last);
                profile.last = stamp;
                requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
        });
        await page.getByRole('button', { name: 'Launch selected firework', exact: true }).click();
        await page.waitForTimeout(profileMs);
        project.realtime = await page.evaluate(() => {
            const profile = window.__rafProfile; profile.running = false;
            const values = profile.deltas.sort((a, b) => a - b), n = values.length;
            const snapshot = window.__firecrackersQA.snapshot(), durationMs = values.reduce((a, b) => a + b, 0);
            return { durationMs, samples: n, p50RafMs: values[Math.floor(n * .5)], p95RafMs: values[Math.floor(n * .95)], maxRafMs: values[n - 1], rendererFrameDelta: snapshot.frames - profile.startFrames, averageRendererSubmissionsPerSecond: (snapshot.frames - profile.startFrames) * 1000 / durationMs, snapshot };
        });
        assert.equal(project.realtime.snapshot.backend, project.actual, 'Real-time launch must retain requested backend');
        assert.ok(project.realtime.snapshot.bursts > 0, 'Profile must include actual launch and burst');
        console.log('PASS', label, JSON.stringify({ backend: project.actual, hardware: project.hardware, captures: project.captures.length, realtime: project.realtime }));
        await context.close(); current = null;
    }
    assert.deepEqual(report.errors, [], 'No browser or GPU validation errors');
} catch (error) {
    report.failed = error.stack || String(error); process.exitCode = 1; console.error(report.failed);
    await current?.screenshot({ path: path.join(output, `${prefix}-FAILED.png`) }).catch(() => {});
} finally {
    report.finishedAt = new Date().toISOString();
    await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    await browser.close();
}
