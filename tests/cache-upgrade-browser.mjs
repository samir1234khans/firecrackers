import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const out = process.argv[2] || 'test-results/cache-upgrade'; await mkdir(out, { recursive: true });
const candidate = resolve('dist'), baseline = process.env.CACHE_BASELINE_BUILD ? resolve(process.env.CACHE_BASELINE_BUILD) : null;
const release = JSON.parse(await readFile(resolve(candidate, 'release.json'), 'utf8'));
const oldRelease = baseline ? JSON.parse(await readFile(resolve(baseline, 'release.json'), 'utf8')) : { version: 'legacy-prompt-fixture', sha256: null };
// Original minimal fixture for the previous prompt-mode lifecycle. Local release
// qualification also runs this harness against the exact production CI artifact.
const fixtureHtml = `<!doctype html><title>Legacy Firecrackers cache fixture</title><main data-version="legacy-prompt-fixture">Legacy prompt-mode app</main><script>
navigator.serviceWorker.register('/sw.js').then(r=>{window.addEventListener('focus',()=>r.update());});
</script>`;
const fixtureWorker = `self.addEventListener('install',e=>e.waitUntil(caches.open('firecrackers-fixture-old').then(c=>c.add('/'))));
self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(caches.open('firecrackers-fixture-old').then(c=>c.match('/')).then(r=>r||fetch(e.request)));});
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting();});`;
let serving = 'baseline';
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.flac': 'audio/flac', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    res.setHeader('Cache-Control', 'no-store');
    if (serving === 'baseline' && !baseline && (pathname === '/' || pathname === '/sw.js')) { res.setHeader('Content-Type', pathname === '/' ? mime['.html'] : mime['.js']); res.end(pathname === '/' ? fixtureHtml : fixtureWorker); return; }
    const root = serving === 'baseline' ? baseline : candidate;
    if (!root) { res.writeHead(404).end(); return; }
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream'); res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}/`, url = `${origin}?qa=1&backend=canvas&seed=42`;
const browser = await chromium.launch(process.env.CACHE_NATIVE === '1' ? { channel: 'chrome', headless: true } : { headless: true });
const report = { at: new Date().toISOString(), baseline: oldRelease, candidate: release, checks: [], errors: [], failed: null };
const context = await browser.newContext({ viewport: { width: 393, height: 851 } });
const deadline = setTimeout(() => void browser.close(), 5 * 60 * 1000);
async function loaded(page, version, real = true) { await page.waitForSelector(`main[data-version="${version}"]${real ? '[data-ready="true"][data-presented="true"]' : ''}`, { timeout: 90000 }); }
try {
  const pages = [await context.newPage(), await context.newPage()]; const navigations = new Map();
  for (const p of pages) {
    console.log('Prepare baseline tab', pages.indexOf(p));
    navigations.set(p, 0); p.on('framenavigated', f => { if (f === p.mainFrame()) navigations.set(p, navigations.get(p) + 1); }); p.on('pageerror', e => report.errors.push(e.message));
    await p.goto(origin); await loaded(p, oldRelease.version, Boolean(baseline)); await p.evaluate(() => localStorage.setItem('firecrackers.preferences.v1', JSON.stringify({ version: 3, onboarded: true, quality: 'standard', family: 'sapphire-saturn', sound: false })));
    await p.goto(url); await loaded(p, oldRelease.version, Boolean(baseline)); await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await loaded(p, oldRelease.version, Boolean(baseline)); await p.waitForFunction(() => navigator.serviceWorker.controller);
    if (baseline) assert.equal(await p.evaluate(() => window.__firecrackersQA.snapshot().selected), 'sapphire-saturn', 'Baseline preference fixture loaded before upgrade');
  }
  await pages[0].evaluate(async () => {
    for (const name of ['firecrackers-art-v2', 'firecrackers-audio-v2', 'firecrackers-music-v1', 'unrelated-app-cache']) { const c = await caches.open(name); await c.put('/cache-test', new Response('retained fixture')); }
  });
  console.log('Request online upgrade'); serving = 'candidate'; const before = pages.map(p => navigations.get(p));
  // Normal old-client update checks; no unregister, storage wipe, app update click,
  // or test-issued SKIP_WAITING message is used for the upgrade.
  await pages[0].evaluate(() => window.dispatchEvent(new Event('focus')));
  for (const p of pages) await loaded(p, release.version);
  for (const p of pages) {
    const snapshot = await p.evaluate(() => window.__firecrackersQA.snapshot()); assert.equal(snapshot.audioEnabled, false); assert.equal(snapshot.selected, 'sapphire-saturn');
    assert.equal(await p.locator('[data-family-icon]').count(), 13);
    assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('firecrackers.preferences.v1')).version), 4);
  }
  const cacheKeys = await pages[0].evaluate(() => caches.keys());
  assert.ok(cacheKeys.includes('unrelated-app-cache'));
  assert.ok(cacheKeys.every(k => !k.startsWith('firecrackers-') || k.endsWith('-' + release.version)));
  report.checks.push('Both controlled legacy tabs upgrade automatically; obsolete app caches removed; unrelated cache, thirteen effects, preferences and sound consent retained'); report.cacheKeys = cacheKeys;
  const stable = pages.map(p => navigations.get(p)); await pages[0].waitForTimeout(3000); assert.deepEqual(pages.map(p => navigations.get(p)), stable, 'No reload loop');
  assert.ok(stable.every((n, i) => n - before[i] <= 3), 'Bounded upgrade navigation'); report.upgradeNavigations = stable.map((n, i) => n - before[i]);
  await context.setOffline(true); await pages[0].reload(); await loaded(pages[0], release.version); assert.equal(await pages[0].evaluate(() => window.__firecrackersQA.snapshot().audioEnabled), false); await context.setOffline(false);
  report.checks.push('Current app reloads offline without replaying sound consent');
  // Verify a rollback to the previous prompt worker can activate while the new
  // auto-update client is open, rather than being stranded in waiting state.
  serving = 'baseline'; await pages[0].evaluate(() => window.dispatchEvent(new Event('focus'))); await loaded(pages[0], oldRelease.version, Boolean(baseline)); report.checks.push('Explicit rollback to the prior prompt-mode worker activates without manual cache clearing');
  for (const p of pages) await loaded(p, oldRelease.version, Boolean(baseline));
  serving = 'candidate'; await pages[0].evaluate(() => window.dispatchEvent(new Event('focus')));
  for (const p of pages) await loaded(p, release.version);
  const redeployed = pages.map(p => navigations.get(p)); await pages[0].waitForTimeout(2000); assert.deepEqual(pages.map(p => navigations.get(p)), redeployed);
  report.checks.push('Redeploying the same candidate after rollback upgrades all tabs again without a reload loop');
  await context.close();
  serving = 'candidate'; const fresh = await browser.newPage(); let freshNavigations = 0; fresh.on('framenavigated', f => { if (f === fresh.mainFrame()) freshNavigations++; });
  await fresh.goto(url); await loaded(fresh, release.version); await fresh.evaluate(() => navigator.serviceWorker.ready); await fresh.waitForTimeout(2000); assert.equal(freshNavigations, 1); await fresh.close(); report.checks.push('Fresh installation has no automatic reload');
  assert.deepEqual(report.errors, []); console.log(report.checks);
} catch (e) { report.failed = e.stack; report.pages = []; for (const p of context.pages()) report.pages.push(await p.evaluate(async () => ({ version: document.querySelector('main')?.dataset.version, ready: document.querySelector('main')?.dataset.ready, registrations: (await navigator.serviceWorker.getRegistrations()).map(r => ({ active: r.active?.state, installing: r.installing?.state, waiting: r.waiting?.state })), text: document.body.innerText.slice(0, 500) })).catch(() => null)); process.exitCode = 1; console.error(e); }
finally { clearTimeout(deadline); await browser.close(); server.closeAllConnections(); await new Promise(r => server.close(r)); await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); }
