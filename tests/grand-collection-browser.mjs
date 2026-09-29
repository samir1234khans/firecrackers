import { chooseFamily, inspectStage, inspectPicker, openPicker } from './stage-helpers.mjs';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve(process.argv[2] || '/tmp/firecrackers-grand');
const base = process.env.GRAND_URL || 'http://127.0.0.1:4173/';
const only = process.env.GRAND_PROJECT || '';
const build = (await readFile('src/engine/catalog.ts', 'utf8')).match(/CONFIG_VERSION\s*=\s*'([^']+)'/)[1];
const names = ['Aurora Crown', 'Ruby Dahlia', 'Sapphire Saturn', 'Phoenix Palm', 'Opal Supernova'];
const ids = ['aurora-crown', 'ruby-dahlia', 'sapphire-saturn', 'phoenix-palm', 'opal-supernova'];
const report = { url: base, build, source: process.env.GITHUB_SHA || 'local', checks: [], errors: [], warnings: [], screenshots: [], failed: null };
await mkdir(output, { recursive: true });
const record = (name, data = {}) => { report.checks.push({ name, passed: true, ...data }); console.log('PASS', name, JSON.stringify(data)); };
const shot = async (page, name) => { await page.screenshot({ path: path.join(output, `${name}.png`) }); report.screenshots.push(`${name}.png`); };
const snapshot = page => page.evaluate(() => window.__firecrackersQA.snapshot());
const freeze = (page, value) => page.evaluate(v => window.__firecrackersQA.freeze(v), value);
const advance = async (page, seconds) => {
    await page.evaluate(value => window.__firecrackersQA.advance(value), seconds);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => { window.__firecrackersQA.render(); resolve(); })));
};
async function enter(page, backend = 'webgl') {
    await page.goto(new URL(`?backend=${backend}&qa=1`, base).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('main')?.dataset.ready === 'true' && Boolean(window.__firecrackersQA), undefined, { timeout: 90000 });
    if (await page.locator('main').getAttribute('data-overlay') === 'help') await page.getByRole('button', { name: 'Skip introduction', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('main')?.dataset.overlay === 'none');
    assert.equal(await page.locator('main').getAttribute('data-version'), build);
    assert.match(await page.title(), /Firecrackers/);
    assert.equal(await page.locator('.scene-host canvas').count(), 1);
}
async function layout(page, label) { const data = await inspectStage(page); await inspectPicker(page); record(label + ': six edge groups, clear hero, reachable picker and launch', data); }
let browser, current;
try {
    browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    for (const device of [{ name: 'desktop', width: 1280, height: 800, mobile: false }, { name: 'mobile', width: 393, height: 851, mobile: true }].filter(v => !only || only.includes(v.name))) {
        for (const backend of ['webgl', 'canvas']) {
            const label = `${device.name}-${backend}`;
            const context = await browser.newContext({ viewport: { width: device.width, height: device.height }, deviceScaleFactor: 1, hasTouch: device.mobile, isMobile: device.mobile });
            current = await context.newPage(); const page = current;
            page.on('pageerror', e => report.errors.push(`${label}: ${e.message}`));
            page.on('console', m => { if (m.type() === 'error') report.errors.push(`${label}: ${m.text()}`); else if (m.type() === 'warning') report.warnings.push(`${label}: ${m.text()}`); });
            await enter(page, backend);
            assert.match(await page.locator('main').getAttribute('data-backend'), backend === 'canvas' ? /Canvas/ : /WebGL/);
            await chooseFamily(page, names[0]);
            assert.equal((await snapshot(page)).selected, ids[0]);
            await layout(page, `${label}: grand collection visible and launch reachable`);
            await shot(page, `${label}-collection`);
            const launch = page.getByRole('button', { name: 'Launch selected firework', exact: true });
            // Exercise real user input and wall-clock completion, not just the diagnostic adapter.
            if (device.mobile) await launch.tap(); else await launch.click();
            await launch.dispatchEvent('click');
            await chooseFamily(page, names[1]);
            const committed = await snapshot(page);
            assert.equal(committed.committedFamily, names[0]); assert.equal(committed.active, 1);
            assert.equal(committed.selected, ids[1]);
            await page.waitForFunction(() => Number(document.querySelector('main').dataset.bursts) >= 1, undefined, { timeout: 90000 });
            await page.waitForFunction(() => !document.querySelector('.flow-launch').disabled, undefined, { timeout: 15000 });
            assert.equal((await snapshot(page)).launched, 1);
            record(`${label}: real launch, duplicate guard and unchanged committed family`);
            await freeze(page, true);
            for (let i = 0; i < names.length; i++) {
                await advance(page, 30);
                await chooseFamily(page, names[i]);
                const before = (await snapshot(page)).bursts;
                await launch.click();
                await advance(page, i === 4 ? 7.8 : i === 3 ? 5.4 : 4.9);
                const active = await snapshot(page);
                assert.ok(active.bursts > before && active.particles > 80, JSON.stringify(active));
                await shot(page, `${label}-${ids[i]}-peak`);
                await advance(page, 1.4);
                await shot(page, `${label}-${ids[i]}-fall`);
                await advance(page, 30);
                const done = await snapshot(page);
                assert.equal(done.bursts - before, i === 4 ? 8 : 1);
                assert.equal(done.particles, 0); assert.equal(done.carriers, 0); assert.equal(done.active, 0);
                assert.equal(await launch.isEnabled(), true);
                record(`${label}: ${names[i]} complete and cleaned`, { bursts: done.bursts - before, peakParticles: active.particles, method: 'actual renderer, deterministic phase stepping; not FPS evidence' });
            }
            // Seven delayed Opal children must pause with their parent show, not escape as timers.
            await launch.click(); await advance(page, 3.5);
            const pending = await snapshot(page); assert.ok(pending.carriers > 0);
            await page.getByRole('button', { name: 'Pause scene', exact: true }).first().click();
            const paused = await snapshot(page); await freeze(page, false); await page.waitForTimeout(550);
            assert.equal((await snapshot(page)).time, paused.time);
            await page.getByRole('button', { name: 'Open settings' }).click();
            await page.getByRole('button', { name: 'Close panel' }).click();
            assert.equal(await page.locator('main').getAttribute('data-paused'), 'true');
            await freeze(page, true); await page.getByRole('button', { name: 'Resume scene', exact: true }).first().click();
            await advance(page, 30); assert.equal((await snapshot(page)).bursts, pending.bursts + pending.carriers);
            record(`${label}: composite pause and settings preserve pending children`);
            await chooseFamily(page, 'Gold Willow');
            await openPicker(page); await page.getByRole('button', { name: 'Grand collection', exact: false }).click();
            assert.equal((await snapshot(page)).selected, 'gold-willow', 'Browsing tabs does not commit a selection');
            await page.getByRole('button', { name: 'Close panel' }).click();
            await page.locator('body').click({ position: { x: 10, y: 160 } });
            for (const [i, key] of ['6', '7', '8', '9', '0'].entries()) { await page.keyboard.press(key); assert.equal((await snapshot(page)).selected, ids[i]); }
            await page.keyboard.press('1'); assert.equal((await snapshot(page)).selected, 'gold-willow');
            await page.keyboard.press('8');
            await enter(page, backend); assert.equal((await snapshot(page)).selected, ids[2]);
            await openPicker(page);
            assert.equal(await page.getByRole('button', { name: names[2], exact: true }).getAttribute('aria-pressed'), 'true');
            await page.getByRole('button', { name: 'Close panel' }).click();
            record(`${label}: noncommitting collection browsing, ten keyboard shortcuts and saved new family`);
            if (device.mobile && backend === 'canvas') {
                for (const [w, h] of [[375,667],[320,568],[320,480],[844,390],[640,360]]) {
                    await page.setViewportSize({ width: w, height: h }); await layout(page, `${w}x${h}: grand collection layout`);
                    await shot(page, `grand-${w}x${h}`);
                }
            }
            await context.close(); current = null;
        }
    }
    assert.deepEqual(report.errors, []);
    record('No unexpected application errors in the expanded collection');
} catch (error) {
    report.failed = error.stack || String(error); console.error(report.failed); process.exitCode = 1;
    if (current) { await shot(current, 'FAILED').catch(() => {}); await writeFile(path.join(output, 'FAILED.html'), await current.content()).catch(() => {}); }
} finally {
    await browser?.close(); await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
}
