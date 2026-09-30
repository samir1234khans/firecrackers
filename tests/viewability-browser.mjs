import { selectedLaunch, openPanel } from './stage-helpers.mjs';
import { chooseFamily, inspectStage, inspectPicker, openPicker, settingsTab } from './stage-helpers.mjs';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.VIEWABILITY_URL || 'http://127.0.0.1:4173/';
const output = path.resolve(process.argv[2] || '/tmp/firecrackers-viewability');
const version = (await readFile('src/engine/catalog.ts', 'utf8')).match(/CONFIG_VERSION\s*=\s*'([^']+)'/)[1];
await mkdir(output, { recursive: true });
const report = { url, version, browser: 'Chromium / software graphics; no physical-device claim', checks: [], failures: [], screenshots: [] };
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const launch = page => selectedLaunch(page);
async function enter(page, query = '?backend=webgl&qa=1') {
    await page.goto(new URL(query, url).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('main')?.dataset.ready === 'true', undefined, { timeout: 65000 });
    if (await page.locator('main').getAttribute('data-overlay') === 'help') await page.getByRole('button', { name: 'Skip introduction' }).click();
    await page.waitForFunction(() => document.querySelector('main')?.dataset.overlay === 'none');
    assert.equal(await page.locator('main').getAttribute('data-version'), version);
    assert.equal(await page.locator('.scene-host canvas').count(), 1);
}
async function capture(page, name) {
    await page.screenshot({ path: path.join(output, `${name}.png`) });
    report.screenshots.push(`${name}.png`);
}
async function check(name, fn, { width = 375, height = 667, touch = true, expectedFault = false } = {}) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch, serviceWorkers: 'block' });
    const page = await context.newPage(); const errors = [];
    page.setDefaultTimeout(20000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    try {
        const details = await fn(page);
        if (!expectedFault) assert.deepEqual(errors, [], 'Unexpected application errors');
        await capture(page, name);
        report.checks.push({ name, result: 'passed', ...details, ...(expectedFault ? { injectedFaultDiagnostics: errors } : {}) });
    } catch (error) {
        report.failures.push({ name, error: error.stack || String(error), errors });
        await capture(page, `FAILED-${name}`).catch(() => {});
    } finally { await context.close(); }
}
const visibleControls = inspectStage;
try {
    for (const [name, width, height] of [['desktop',1280,800], ['tablet',1024,768], ['portrait',393,851], ['small-phone',320,568], ['short-phone',320,480], ['landscape',844,390], ['narrow-landscape',640,360]]) {
        await check(name, async page => {
            await enter(page); const layout = await visibleControls(page);
            await openPanel(page, 'settings');
            await settingsTab(page, 'Graphics');
            await page.getByLabel('Graphics quality', { exact: true }).selectOption('ultra');
            await page.getByRole('button', { name: 'Close panel' }).click();
            return { layout, renderer: await page.locator('main').getAttribute('data-backend') };
        }, { width, height, touch: width < 1100 });
    }
    await check('canvas-complete-launch', async page => {
        await enter(page, '?backend=canvas&qa=1');
        assert.match(await page.locator('main').getAttribute('data-backend'), /Canvas/);
        await openPanel(page, 'settings');
        await settingsTab(page, 'Device');
        await page.getByText('Graphics details', { exact: true }).click();
        assert.ok(await page.locator('.diagnostics dd').filter({ hasText: 'Canvas' }).isVisible());
        await page.getByRole('button', { name: 'Close panel' }).click();
        await launch(page).tap();
        await page.waitForFunction(() => Number(document.querySelector('main')?.dataset.bursts) >= 1, undefined, { timeout: 20000 });
        await page.waitForFunction(() => document.querySelector('[data-family-icon][aria-pressed="true"]')?.dataset.launchable==='true');
        assert.equal(await page.locator('main').getAttribute('data-launched'), '1');
        await page.getByRole('button', { name: 'Pause scene' }).first().click();
        assert.equal(await launch(page).getAttribute('data-launchable'), 'false');
        await openPanel(page, 'settings');
        await page.getByRole('button', { name: 'Close panel' }).click();
        assert.equal(await page.locator('main').getAttribute('data-paused'), 'true');
        await page.getByRole('button', { name: 'Resume scene' }).first().click();
        return { realUserInput: true, launched: 1, bursts: 1, pausePreserved: true };
    });
    await check('canvas-five-effects', async page => {
        await enter(page, '?backend=canvas&qa=1');
        await page.evaluate(() => window.__firecrackersQA.freeze(true));
        for (const family of ['Gold Willow','Multicolor Peony','Chrysanthemum','Silver Crossette Crackle','Grand Finale']) {
            await page.evaluate(() => window.__firecrackersQA.advance(25));
            await chooseFamily(page, family);
            const before = await page.evaluate(() => window.__firecrackersQA.snapshot().bursts);
            await launch(page).click();
            await page.evaluate(() => window.__firecrackersQA.advance(5.3));
            assert.ok((await page.evaluate(() => window.__firecrackersQA.snapshot().bursts)) > before);
            await capture(page, `canvas-${family.toLowerCase().replaceAll(' ', '-')}`);
        }
        return { families: 5, method: 'same seeded simulation; deterministic rendered phase captures' };
    }, {width:1280,height:800,touch:false});
    await check('gpu-unavailable', async page => {
        await page.addInitScript(() => {
            const get = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(type, ...args) { return /webgl|webgpu/.test(type) ? null : get.call(this,type,...args); };
            Object.defineProperty(navigator, 'gpu', {value: undefined, configurable: true});
        });
        await enter(page, '?qa=1');
        assert.match(await page.locator('main').getAttribute('data-backend'), /Canvas/);
        await launch(page).tap();
        await page.waitForFunction(() => Number(document.querySelector('main')?.dataset.bursts) >= 1, undefined, {timeout:20000});
        return { recoveredWithoutReload: true, fallback: 'Canvas', realBurst: true };
    }, {expectedFault:true});
    await check('gpu-module-unavailable', async page => {
        await page.route('**/assets/Renderer-*.js', route => route.abort());
        await enter(page, '?qa=1');
        assert.match(await page.locator('main').getAttribute('data-backend'), /Canvas/);
        assert.equal(await launch(page).isEnabled(), true);
        return { recoveredWithoutReload: true };
    }, {expectedFault:true});
    await check('context-loss-recovery', async page => {
        await enter(page);
        const lost = await page.evaluate(() => {
            const gl = document.querySelector('.scene-host canvas').getContext('webgl2');
            const extension = gl?.getExtension('WEBGL_lose_context');
            if (!extension) return false; extension.loseContext(); return true;
        });
        assert.equal(lost, true, 'The context-loss test must exercise a real WebGL context');
        await page.getByRole('link', {name:'Use compatibility graphics',exact:true}).waitFor();
        await page.getByRole('link', {name:'Use compatibility graphics',exact:true}).click();
        await page.waitForFunction(() => document.querySelector('main')?.dataset.ready === 'true');
        if (await page.locator('main').getAttribute('data-overlay') === 'help') await page.getByRole('button',{name:'Skip introduction'}).click();
        assert.match(await page.locator('main').getAttribute('data-backend'), /Canvas/);
        await launch(page).tap();
        await page.waitForFunction(() => Number(document.querySelector('main')?.dataset.bursts) >= 1, undefined, {timeout:20000});
        return { actualContextLost: true, playableAfterRecovery: true };
    }, {expectedFault:true});
    await check('blocked-entry-keeps-visible-page', async page => {
        await page.route('**/assets/main-*.js', route => route.abort());
        await page.goto(url, {waitUntil:'domcontentloaded'});
        await page.getByText(/The app could not finish loading/).waitFor();
        assert.ok(await page.getByRole('link',{name:'Reload website'}).isVisible());
        assert.ok(await page.getByRole('link',{name:'Open compatibility mode'}).isVisible());
        return { readableShell: true, reloadAction: true };
    }, {expectedFault:true});
    await check('react-error-keeps-recovery-page', async page => {
        await page.addInitScript(() => { window.matchMedia = () => { throw new Error('Injected preference capability failure'); }; });
        await page.goto(url,{waitUntil:'domcontentloaded'});
        await page.getByRole('heading',{name:'Sky interrupted',exact:true}).waitFor();
        assert.ok(await page.getByRole('button',{name:'Reload website'}).isVisible());
        return { readableRecovery: true };
    }, {expectedFault:true});
    await check('default-backend-launch', async page => {
        await enter(page,'?qa=1');
        await launch(page).tap();
        await page.waitForFunction(() => Number(document.querySelector('main')?.dataset.bursts) >= 1, undefined, {timeout:25000});
        return { renderer: await page.locator('main').getAttribute('data-backend'), realBurst: true };
    });
} finally {
    await browser.close();
    await writeFile(path.join(output,'viewability-report.json'),JSON.stringify(report,null,2));
}
console.log(JSON.stringify({passed:report.checks.length,failed:report.failures.length,failures:report.failures},null,2));
if (report.failures.length) process.exitCode=1;
