import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { openPicker, settingsTab } from './stage-helpers.mjs';

// Rendered browser acceptance checks. No source-style snapshots or hardware claims.
const base = process.env.PANEL_URL || 'http://127.0.0.1:4173/';
const output = path.resolve(process.argv[2] || 'test-results/transparent-panels');
const catalog = await readFile(new URL('../src/engine/catalog.ts', import.meta.url), 'utf8');
const expectedVersion = catalog.match(/CONFIG_VERSION\s*=\s*'([^']+)'/)[1];
let releaseText;
try {
  releaseText = await readFile(new URL('../public/release.json', import.meta.url), 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  // CI downloads the compiled build, including its exact release inventory.
  releaseText = await readFile(new URL('../dist/release.json', import.meta.url), 'utf8');
}
const expectedRelease = JSON.parse(releaseText);
const selectedCases = process.env.PANEL_CASES?.split(',').map(value => value.trim()).filter(Boolean);
const viewports = [
  { name: '320x480', width: 320, height: 480 },
  { name: '375x667', width: 375, height: 667 },
  { name: '393x851', width: 393, height: 851 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '844x390', width: 844, height: 390 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: 'zoom-200-reflow', width: 640, height: 400, deviceScaleFactor: 2,
    method: '1280x800 screen at 640x400 CSS pixels / DPR2; 200% browser-zoom reflow equivalent, not pinch scaling' },
  { name: 'text-200', width: 375, height: 667, largeText: true,
    method: 'Every rendered panel text element uses twice its measured computed font size and line height' },
];
const report = { url: base, expectedVersion, expectedFingerprint:expectedRelease.sha256, expectedSourceCount:expectedRelease.modules.length,
  startedAt: new Date().toISOString(),
  selectedCases: selectedCases || 'all',
  dragOrigin: process.env.PANEL_DRAG_ORIGIN || 'row-center',
  method: 'Bundled Chromium headless, software WebGL/Canvas. Real native dialogs and DOM input; viewport/touch emulation.',
  limitations: 'No installed-Chrome hardware, physical phone, OS accessibility setting or endurance claim. Zoom method is explicitly emulated.',
  checks: [], failures: [], screenshots: [], errors: [], expectedFaults: [], browserClosed: false };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: [
  '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
] });
report.browserVersion = browser.version();
const snap = page => page.evaluate(() => window.__firecrackersQA.snapshot());
const record = (name, details = {}) => { report.checks.push({ name, ...details }); console.log('PASS', name); };
const close = page => page.getByRole('button', { name: 'Close panel', exact: true });
const settings = page => page.getByRole('button', { name: 'Open settings', exact: true });
async function capture(page, name) {
  const file = `${name}.png`;
  await page.screenshot({ path: path.join(output, file) }); report.screenshots.push(file);
}
async function enter(page, backend = 'canvas', extra = {}) {
  const url = new URL(base);
  Object.entries({ backend, qa: '1', seed: '20260916', ...extra }).forEach(([key, value]) => url.searchParams.set(key, value));
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('main')?.dataset.ready === 'true' && window.__firecrackersQA,
    undefined, { timeout: 65000 });
  assert.equal(await page.locator('main').getAttribute('data-version'), expectedVersion);
  assert.equal(await page.locator('main').getAttribute('data-overlay'), 'none');
  assert.equal(await page.locator('.scene-host canvas').count(), 1);
  assert.match((await snap(page)).backend, backend === 'canvas' ? /^Canvas/ : /^WebGL 2$/);
  await page.evaluate(() => window.__firecrackersQA.freeze(true));
}
async function enlargeText(page) {
  await page.getByRole('dialog').evaluate(dialog => {
    const nodes = [...dialog.querySelectorAll('*')].filter(node => node instanceof HTMLElement);
    const measurements = nodes.map(node => ({ node, font: parseFloat(getComputedStyle(node).fontSize),
      line: parseFloat(getComputedStyle(node).lineHeight) }));
    for (const { node, font, line } of measurements) {
      if (node.dataset.panelTestFont) continue;
      node.dataset.panelTestFont = String(font);
      node.style.fontSize = `${font * 2}px`;
      if (Number.isFinite(line)) node.style.lineHeight = `${line * 2}px`;
    }
  });
}
async function inspectPanel(page, variant, spec, name) {
  if (spec.largeText) await enlargeText(page);
  const dialog = page.getByRole('dialog');
  assert.equal(await dialog.count(), 1);
  const geometry = await dialog.evaluate(element => {
    const rect = element.getBoundingClientRect(), body = element.querySelector('.panel-body'), header = element.querySelector('.panel-header');
    const style = getComputedStyle(element), backdrop = getComputedStyle(element, '::backdrop');
    const box = node => { const r = node.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom }; };
    const scrollables = [element, ...element.querySelectorAll('*')].filter(node => {
      const s = getComputedStyle(node); return /auto|scroll/.test(s.overflowY) && node.scrollHeight > node.clientHeight + 1;
    }).map(node => node.className);
    return { box:box(element), body:box(body), header:box(header), open:element.open,
      modal:element.matches(':modal'), variant:element.dataset.panel, className:element.className,
      view:{ width:innerWidth,height:innerHeight }, background:style.backgroundColor, backdrop:backdrop.backgroundColor,
      border:style.borderTopWidth, blur:style.backdropFilter, scrollables,
      bodyScrollHeight:body.scrollHeight,bodyClientHeight:body.clientHeight,
      overflow:document.documentElement.scrollWidth > innerWidth + 1 };
  });
  assert.equal(geometry.open, true); assert.equal(geometry.modal, true, 'The browser must own the modal top layer');
  assert.equal(geometry.variant, variant); assert.match(geometry.className, /edge-panel/);
  assert.equal(geometry.overflow, false, `${name}: page horizontal overflow`);
  const { box:r, view:v } = geometry, compact = v.width <= 767 || v.height <= 540;
  assert.ok(r.x >= 8 && r.right <= v.width - 8 + .5 && r.y >= 8 && r.bottom <= v.height - 8 + .5,
    `${name}: panel must stay inside safe viewport gutters: ${JSON.stringify(geometry)}`);
  assert.ok(r.width <= 360.5, `${name}: width cap ${r.width}`);
  assert.ok(r.height <= v.height * (compact ? .60 : .78) + .5, `${name}: height cap ${r.height}`);
  if (compact) assert.ok(Math.abs(r.bottom - (v.height - 8)) <= 1, `${name}: compact bottom anchor`);
  else {
    assert.ok(r.width >= 320 && r.width <= 360, `${name}: desktop panel width`);
    const left = ['help','show','picker','position'].includes(variant);
    assert.ok(Math.abs(left ? r.x - 12 : r.right - (v.width - 12)) <= 1, `${name}: authored edge anchor`);
    assert.ok(Math.abs(r.y + r.height / 2 - v.height / 2) <= 1, `${name}: desktop vertical center`);
  }
  const alpha = color => color.startsWith('rgba') ? Number(color.match(/,\s*([\d.]+)\)$/)?.[1]) : 1;
  assert.ok(alpha(geometry.background) > 0 && alpha(geometry.background) <= .8, `${name}: transparent panel material`);
  assert.ok(alpha(geometry.backdrop) <= .2, `${name}: quiet backdrop`);
  assert.equal(geometry.border, '0px'); assert.equal(geometry.blur, 'none');
  assert.ok(geometry.body.y >= geometry.header.bottom - .5, `${name}: header is outside the body scroll`);
  assert.ok(geometry.scrollables.every(value => value.includes('panel-body')), `${name}: only panel body may scroll`);
  // Reach every rendered action through the actual scroll container and test its effective target.
  const targets = dialog.locator('button, a[href], select, input:not([type="hidden"]), summary');
  const minimum = v.width <= 1023 ? 48 : 44;
  let targetCount = 0;
  for (const target of await targets.all()) {
    if (!await target.isVisible()) continue;
    const scrollTarget = await target.evaluate(element => element.matches('input[type="radio"]')) ? target.locator('..') : target;
    await scrollTarget.scrollIntoViewIfNeeded();
    const hit = await target.evaluate(element => {
      const effective = element.matches('input[type="radio"]') ? element.closest('label') : element;
      const r = effective.getBoundingClientRect(), point = document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return { name:element.getAttribute('aria-label') || element.textContent.trim() || element.getAttribute('type'),
        width:r.width,height:r.height,x:r.x,y:r.y,right:r.right,bottom:r.bottom,
        disabled:Boolean(element.disabled), hit:effective.contains(point),
        inBody:effective.closest('.panel-body') !== null, body:effective.closest('.panel-body')?.getBoundingClientRect().toJSON() };
    });
    assert.ok(hit.width >= minimum - .01 && hit.height >= minimum - .01, `${name}: ${minimum}px target ${JSON.stringify(hit)}`);
    assert.ok(hit.x >= 0 && hit.right <= v.width + .5 && hit.y >= 0 && hit.bottom <= v.height + .5,
      `${name}: offscreen essential action ${JSON.stringify(hit)}`);
    if (hit.inBody) assert.ok(hit.y >= hit.body.top - .5 && hit.bottom <= hit.body.bottom + .5,
      `${name}: target remains clipped after scroll ${JSON.stringify(hit)}`);
    if (!hit.disabled) assert.ok(hit.hit, `${name}: essential action cannot receive input ${JSON.stringify(hit)}`);
    targetCount++;
  }
  assert.ok(targetCount >= 2, `${name}: real actions must be present`);
  assert.equal(await close(page).evaluate(element => { const r=element.getBoundingClientRect(); return element.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); }), true,
    `${name}: close remains reachable after scrolling`);
  await dialog.locator('.panel-body').evaluate(element => { element.scrollTop = 0; });
  await capture(page, name);
  record(`${name}: bounds, transparent material, scroll and ${minimum}px effective targets`, { geometry, targetCount });
  return geometry;
}
async function openFrom(page, trigger, variant, spec, name) {
  await trigger.click();
  await page.locator(`dialog.sheet--${variant}`).waitFor({ state:'visible' });
  assert.equal(await close(page).evaluate(element => element === document.activeElement), true, 'Close receives native autofocus');
  await inspectPanel(page, variant, spec, name);
}
async function escapeTo(page, trigger) {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('main').dataset.overlay === 'none');
  assert.equal(await page.getByRole('dialog').count(), 0);
  assert.equal(await trigger.evaluate(element => element === document.activeElement), true, 'Native Escape returns focus to the invoker');
}
async function settingsKeyboard(page, name) {
  const tabs = page.getByRole('tablist', { name:'Settings sections' }).getByRole('tab');
  assert.deepEqual(await tabs.allTextContents(), ['Graphics','Sound','Display','Device']);
  const selected = async label => {
    const tab = page.getByRole('tab', { name:label,exact:true });
    assert.equal(await tab.getAttribute('aria-selected'), 'true');
    assert.equal(await tab.getAttribute('tabindex'), '0');
    assert.equal(await tab.evaluate(element => element === document.activeElement), true);
    assert.equal(await page.getByRole('tabpanel').count(), 1, 'Only one Settings panel is exposed');
    assert.equal(await page.getByRole('tabpanel', { name:label,exact:true }).isVisible(), true);
    assert.equal(await page.locator('[role="tab"][tabindex="0"]').count(), 1);
  };
  await page.getByRole('tab', { name:'Graphics',exact:true }).focus();
  await page.keyboard.press('ArrowRight'); await selected('Sound');
  await page.keyboard.press('End'); await selected('Device');
  await page.keyboard.press('ArrowRight'); await selected('Graphics');
  await page.keyboard.press('ArrowLeft'); await selected('Device');
  await page.keyboard.press('Home'); await selected('Graphics');
  for (const key of [...Array(14).fill('Tab'), ...Array(14).fill('Shift+Tab')]) {
    await page.keyboard.press(key);
    const focus = await page.evaluate(() => ({ modal:Boolean(document.activeElement?.closest('dialog:modal')),
      tag:document.activeElement?.tagName, html:document.activeElement?.outerHTML.slice(0,800), documentFocused:document.hasFocus() }));
    assert.equal(focus.modal, true, `Native focus remains inside the panel: ${JSON.stringify({ key,...focus })}`);
  }
  record(`${name}: roving keyboard tabs and native forward/reverse focus containment`);
}
async function matrix(page, spec) {
  await enter(page);
  const help = page.getByRole('button',{ name:'Help',exact:true });
  if (await help.isVisible()) {
    await openFrom(page,help,'help',spec,`${spec.name}-help`); await escapeTo(page,help);
  } else {
    // Short-window HUD intentionally hides its duplicate Help shortcut.
    // The visible Settings → Device path must still reach the full Help panel.
    await settings(page).click(); await settingsTab(page,'Device');
    await openFrom(page,page.getByRole('button',{ name:'Help and keyboard controls',exact:true }),
      'help',spec,`${spec.name}-help`);
    await escapeTo(page,settings(page));
    record(`${spec.name}: Help remains reachable through Device in the compact HUD`);
  }
  for (const [variant, label] of [['show','Choose show mode'],['position','Position firework']]) {
    const trigger = page.getByRole('button', { name:label,exact:true });
    await openFrom(page, trigger, variant, spec, `${spec.name}-${variant}`);
    await escapeTo(page, trigger);
  }
  const pickerTrigger = page.getByRole('button', { name:/^Choose firework:/ });
  await openFrom(page, pickerTrigger, 'picker', spec, `${spec.name}-picker-classics`);
  await page.getByRole('button', { name:'Grand collection',exact:true }).click();
  assert.equal(await page.getByRole('group', { name:'Grand firework styles' }).getByRole('button').count(), 5);
  await inspectPanel(page, 'picker', spec, `${spec.name}-picker-grand`);
  await escapeTo(page, pickerTrigger);
  await openFrom(page, settings(page), 'settings', spec, `${spec.name}-settings-graphics`);
  assert.equal(await page.getByRole('tab', { name:'Graphics',exact:true }).getAttribute('aria-selected'), 'true');
  assert.equal(await page.getByRole('tabpanel').count(), 1);
  await page.evaluate(() => window.__firecrackersQA.freeze(false));
  const stopped = await snap(page); await page.waitForTimeout(250);
  assert.equal((await snap(page)).time,stopped.time,'The real overlay pause stops the shared simulation clock');
  await page.evaluate(() => window.__firecrackersQA.freeze(true));
  await settingsKeyboard(page, spec.name);
  for (const tab of ['Sound','Display','Device']) {
    await settingsTab(page, tab);
    await inspectPanel(page, 'settings', spec, `${spec.name}-settings-${tab.toLowerCase()}`);
    assert.equal(await page.getByRole('tabpanel').count(), 1);
    if (tab === 'Display') {
      await page.getByLabel('Protect a clear area', { exact:true }).check();
      await page.getByRole('button', { name:'Copy link',exact:true }).click();
      const value = await page.getByLabel('Display link', { exact:true }).inputValue();
      assert.ok(new URL(value).searchParams.get('protect') === '1');
      await inspectPanel(page, 'settings', spec, `${spec.name}-settings-display-expanded`);
    }
  }
  await page.getByText('Graphics details', { exact:true }).click();
  const expanded = await inspectPanel(page, 'settings', spec, `${spec.name}-settings-diagnostics`);
  if (expanded.view.width <= 767 || expanded.view.height <= 540)
    assert.ok(expanded.bodyScrollHeight > expanded.bodyClientHeight, 'Expanded diagnostics must scroll within the compact panel');
  await page.getByRole('button', { name:'Reset this sky',exact:true }).click();
  await inspectPanel(page, 'reset', spec, `${spec.name}-reset`);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog.sheet--settings').isVisible(), true);
  assert.equal((await snap(page)).paused, true, 'Reset dismissal keeps the Settings overlay pause owner');
  await settingsTab(page, 'Device');
  await page.getByRole('button', { name:'Reset this sky',exact:true }).click();
  await page.getByRole('button', { name:'Keep my sky',exact:true }).click();
  assert.equal((await snap(page)).paused, true);
  await escapeTo(page, settings(page));
  assert.equal((await snap(page)).paused, false, 'Closing only an overlay resumes the original running scene');
  // Backdrop close is real pointer input, and must neither launch nor change style.
  const before = await snap(page);
  await settings(page).click(); await page.mouse.click(4, 4);
  await page.waitForFunction(() => document.querySelector('main').dataset.overlay === 'none');
  assert.equal(await settings(page).evaluate(element => element === document.activeElement), true);
  const after = await snap(page); assert.equal(after.launched,before.launched); assert.equal(after.selected,before.selected);
  await page.getByRole('button', { name:'Pause scene',exact:true }).click();
  await settings(page).click(); await settingsTab(page, 'Device');
  await page.getByRole('button', { name:'Reset this sky',exact:true }).click();
  await page.getByRole('button', { name:'Keep my sky',exact:true }).click();
  await close(page).click();
  assert.equal((await snap(page)).paused, true, 'Panel and reset cancellation preserve the manual pause owner');
  assert.equal(await page.getByRole('button', { name:'Launch selected firework',exact:true }).isDisabled(), true);
  await page.getByRole('button', { name:'Resume scene',exact:true }).click();
  record(`${spec.name}: backdrop close, reset cancellation and independent pause owners`);
}
async function run(name, spec, fn, expectedErrors = []) {
  if (selectedCases && !selectedCases.includes(name)) return;
  const context = await browser.newContext({ viewport:{ width:spec.width,height:spec.height },
    deviceScaleFactor:spec.deviceScaleFactor || 1, hasTouch:spec.width < 1024, isMobile:spec.width < 768, serviceWorkers:'block' });
  const page = await context.newPage(), errors = [];
  page.setDefaultTimeout(20000);
  page.on('pageerror', error => errors.push({ type:'page',message:error.message }));
  page.on('console', message => { if (message.type() === 'error') errors.push({ type:'console',message:message.text(),url:message.location().url }); });
  const expected = error => expectedErrors.some(pattern => pattern.test(error.message)) &&
    (!error.message.includes('net::ERR_FAILED') || (error.type === 'console' && /\/assets\/main-[^/]+\.js(?:\?|$)/.test(error.url || '')));
  try {
    const response = await page.request.get(new URL('/release.json',base).href);
    assert.equal(response.status(),200);
    const release = await response.json();
    assert.equal(release.version,expectedVersion); assert.equal(release.sha256,expectedRelease.sha256);
    assert.equal(release.modules.length,expectedRelease.modules.length,'Every case must use the same exact published build');
    await fn(page);
    for (const error of errors) assert.ok(expected(error), `Unexpected ${name} error: ${JSON.stringify(error)}`);
    if (expectedErrors.length) report.expectedFaults.push({ name, errors });
    else assert.deepEqual(errors, []);
    record(`${name}: no unexpected application errors`, { ...(spec.method ? { method:spec.method } : {}) });
  } catch (error) {
    report.failures.push({ name,error:error.stack || String(error),errors });
    console.error('FAIL',name,error.stack || String(error));
    await capture(page, `FAILED-${name}`).catch(() => {});
  } finally {
    report.errors.push(...errors.filter(error => !expected(error))); await context.close();
    await writeFile(path.join(output,'panel-progress.json'),JSON.stringify(report,null,2));
  }
}
try {
  for (const spec of viewports) await run(spec.name, spec, page => matrix(page, spec));
  await run('picker-drag-and-position', { width:393,height:851 }, async page => {
    await enter(page); const before = await snap(page);
    await openPicker(page);
    const card = page.getByRole('button', { name:'Gold Willow',exact:true }); await card.scrollIntoViewIfNeeded();
    let r = await card.boundingBox();
    await page.mouse.move(r.x+r.width/2,r.y+r.height/2); await page.mouse.down(); await page.mouse.move(4,4,{ steps:8 });
    assert.equal(await page.locator('dialog.is-dragging').isVisible(), true);
    assert.equal(await page.locator('dialog .panel-header').isVisible(), false);
    assert.equal(await page.locator('dialog').evaluate(element => getComputedStyle(element).backgroundColor), 'rgba(0, 0, 0, 0)');
    await capture(page, 'picker-drag-transparent'); await page.mouse.up();
    assert.equal((await snap(page)).launched,before.launched); assert.equal((await snap(page)).selected,before.selected);
    assert.equal(await page.locator('main').getAttribute('data-overlay'),'picker');
    await card.scrollIntoViewIfNeeded(); r = await card.boundingBox();
    const hero = await page.locator('main').evaluate(element => JSON.parse(element.dataset.heroRect));
    await page.evaluate(() => {
      window.__panelPointerReceipt=[];
      for (const type of ['pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture'])
        document.addEventListener(type,event=>window.__panelPointerReceipt.push({ type:event.type,id:event.pointerId,pointerType:event.pointerType,
          button:event.button,x:event.clientX,y:event.clientY,target:event.target.tagName,
          family:event.target.closest?.('.flow-family')?.getAttribute('aria-label'),
          overlay:document.querySelector('main').dataset.overlay,drag:document.querySelector('main').dataset.dragActive }),true);
    });
    report.dragBefore = await card.evaluate(element=>({ selection:document.getSelection()?.toString(),
      userSelect:getComputedStyle(element).userSelect,touchAction:getComputedStyle(element).touchAction }));
    assert.equal(report.dragBefore.selection,'','A completed/cancelled firework drag must not leave selected text for a native text drag');
    const startX=process.env.PANEL_DRAG_ORIGIN==='glyph'?r.x+16:r.x+r.width/2;
    await page.mouse.move(startX,r.y+r.height/2); await page.mouse.down();
    await page.mouse.move(hero.x+hero.width/2,hero.y+hero.height*.32,{ steps:12 });
    const dragReceipt=await page.evaluate(()=>({ events:window.__panelPointerReceipt,
      snapshot:window.__firecrackersQA.snapshot(),active:document.querySelector('main').dataset.dragActive,
      target:document.querySelector('.burst-drop-target')?.className }));
    report.dragReceipt=dragReceipt;
    assert.equal(dragReceipt.active,'true',`The real second gesture must acquire a firework drag: ${JSON.stringify(dragReceipt)}`);
    assert.match(dragReceipt.target || '',/valid burst/,`The sky point must admit a burst: ${JSON.stringify(dragReceipt)}`);
    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector('main').dataset.overlay === 'none');
    const dropped = await snap(page); assert.equal(dropped.launched,before.launched+1); assert.equal(dropped.bursts,before.bursts+1);
    await page.evaluate(() => window.__firecrackersQA.advance(35));
    await page.getByRole('button', { name:'Position firework',exact:true }).click();
    await page.getByRole('button', { name:'Right',exact:true }).click();
    await page.getByRole('button', { name:'Set position',exact:true }).click();
    assert.equal((await snap(page)).placement,.8);
    await openPicker(page); await page.getByRole('button',{ name:'Grand collection',exact:true }).click();
    await page.getByRole('button',{ name:'Sapphire Saturn',exact:true }).click();
    assert.equal((await snap(page)).selected,'sapphire-saturn'); assert.equal((await snap(page)).launched,dropped.launched);
    record('Real picker drag cancellation/one sky burst, position commit and selection keep their original behavior');
  });
  await run('presentation', { width:375,height:667 }, async page => {
    await enter(page); await settings(page).click(); await settingsTab(page,'Display');
    await page.getByLabel('Canvas output',{ exact:true }).selectOption('transparent');
    await page.getByLabel('Protect a clear area',{ exact:true }).check();
    await page.getByLabel('Frame-rate target',{ exact:true }).selectOption('30');
    await page.getByRole('button',{ name:'Start display',exact:true }).click();
    assert.equal(await page.locator('main').getAttribute('data-display'),'transparent');
    assert.equal(await page.getByRole('dialog').count(),0);
    await capture(page,'presentation-transparent');
    await page.keyboard.press('Escape'); await settings(page).click(); await settingsTab(page,'Display');
    await inspectPanel(page,'settings',{ width:375,height:667 },'presentation-return-controls');
    await page.getByRole('button',{ name:'Return to interactive sky',exact:true }).click(); await close(page).click();
    assert.equal(await page.locator('main').getAttribute('data-display'),'interactive');
    assert.equal((await snap(page)).show,null); assert.equal(await page.getByRole('button',{ name:'Launch selected firework',exact:true }).isEnabled(),true);
    record('Protected transparent presentation retains reachable controls and returns to interactive manual sky');
  });
  // Holding real chunks exposes startup surfaces without rewriting app state.
  for (const spec of viewports.filter(spec => !spec.largeText)) {
    await run(`${spec.name}-startup`,spec,async page => {
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      await page.route('**/assets/main-*.js',async route => { await gate; await route.continue(); });
      await page.goto(new URL('?backend=canvas',base).href,{ waitUntil:'domcontentloaded' });
      try {
        const shell = page.locator('.boot-shell'); await shell.waitFor();
        await inspectAuxiliary(page,shell,spec,`${spec.name}-boot-loading`);
      } finally { release(); }
      await page.waitForFunction(() => document.querySelector('main')?.dataset.ready === 'true',undefined,{ timeout:65000 });
    });
    await run(`${spec.name}-entry-recovery`,spec,async page => {
      let aborted = 0;
      await page.route('**/assets/main-*.js',route => { aborted++; return route.abort(); });
      await page.goto(base,{ waitUntil:'domcontentloaded' });
      await page.getByText(/The app could not finish loading/).waitFor();
      await inspectAuxiliary(page,page.locator('.boot-shell'),spec,`${spec.name}-entry-recovery`);
      assert.equal(await page.getByRole('link',{ name:'Reload website',exact:true }).isVisible(),true);
      assert.equal(await page.getByRole('link',{ name:'Open compatibility mode',exact:true }).isVisible(),true);
      assert.equal(aborted,1,'Entry recovery must result from the one deliberately blocked entry module');
    },[/Failed to load resource: net::ERR_FAILED/]);
    await run(`${spec.name}-react-recovery`,spec,async page => {
      await page.addInitScript(() => { window.matchMedia = () => { throw new Error('Injected panel preference capability failure'); }; });
      await page.goto(base,{ waitUntil:'domcontentloaded' });
      await page.getByRole('heading',{ name:'Sky interrupted',exact:true }).waitFor();
      await inspectAuxiliary(page,page.locator('.boot-shell'),spec,`${spec.name}-react-recovery`);
      assert.equal(await page.getByRole('button',{ name:'Reload website',exact:true }).isVisible(),true);
      assert.equal(await page.getByRole('link',{ name:'Open compatibility mode',exact:true }).isVisible(),true);
    },[/Injected panel preference capability failure/]);
  }
  await run('renderer-loading-and-recovery',{ width:393,height:851 },async page => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/assets/Renderer-*.js',async route => { await gate; await route.continue(); });
    const url = new URL('?backend=webgl&qa=1',base);
    await page.goto(url.href,{ waitUntil:'domcontentloaded' });
    try {
      await page.locator('.loading-state').waitFor();
      await inspectAuxiliary(page,page.locator('.loading-state'),viewports[2],'renderer-loading');
    } finally { release(); }
    await page.waitForFunction(() => document.querySelector('main')?.dataset.ready === 'true' && window.__firecrackersQA,
      undefined,{ timeout:65000 });
    assert.equal((await snap(page)).backend,'WebGL 2');
    const lost = await page.evaluate(() => {
      const ext = document.querySelector('.scene-host canvas').getContext('webgl2')?.getExtension('WEBGL_lose_context');
      if (!ext) return false; ext.loseContext(); return true;
    });
    assert.equal(lost,true,'Recovery requires actual software WebGL context loss');
    await page.locator('.recovery').waitFor();
    await inspectAuxiliary(page,page.locator('.recovery'),viewports[2],'renderer-recovery');
    await page.getByRole('link',{ name:'Use compatibility graphics',exact:true }).click();
    await page.waitForFunction(() => document.querySelector('main')?.dataset.ready === 'true',undefined,{ timeout:65000 });
    assert.match(await page.locator('main').getAttribute('data-backend'),/^Canvas/);
    await page.getByRole('button',{ name:'Launch selected firework',exact:true }).click();
    await page.waitForFunction(() => Number(document.querySelector('main').dataset.bursts)>0,undefined,{ timeout:25000 });
    record('Real delayed renderer loading and context-loss recovery keep visible actions and a playable fallback');
  },[/^THREE\.WebGPURenderer: WebGL Device Lost:\s+Message: Unknown reason$/]);
} finally {
  await browser.close(); report.browserClosed = true; report.remainingContexts = browser.contexts().length;
  report.finishedAt = new Date().toISOString();
  await writeFile(path.join(output,'panel-report.json'),JSON.stringify(report,null,2));
}
console.log(JSON.stringify({ passed:report.checks.length,failed:report.failures.length,errors:report.errors.length,
  browserClosed:report.browserClosed,remainingContexts:report.remainingContexts,failures:report.failures },null,2));
if (report.failures.length || report.errors.length) process.exitCode = 1;

async function inspectAuxiliary(page,surface,spec,name) {
  const data = await surface.evaluate(element => {
    const r=element.getBoundingClientRect(),s=getComputedStyle(element);
    return { x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,
      viewport:{ width:innerWidth,height:innerHeight },background:s.backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth+1 };
  });
  assert.equal(data.overflow,false); assert.ok(data.width<=360.5);
  assert.ok(data.x>=8&&data.right<=data.viewport.width-8+.5&&data.y>=8&&data.bottom<=data.viewport.height-8+.5,`${name}: ${JSON.stringify(data)}`);
  const compact=data.viewport.width<=767||data.viewport.height<=540;
  assert.ok(data.height<=data.viewport.height*(compact?.6:.78)+.5,`${name}: bounded startup/recovery surface`);
  for (const target of await surface.locator('a[href],button').all()) {
    if (!await target.isVisible()) continue;
    await target.scrollIntoViewIfNeeded();
    const hit=await target.evaluate(element=>{const r=element.getBoundingClientRect();return{width:r.width,height:r.height,bottom:r.bottom,hit:element.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
    const min=data.viewport.width<=1023?48:44;
    assert.ok(hit.width>=min&&hit.height>=min&&hit.hit&&hit.bottom<=data.viewport.height,`${name}: reachable ${min}px action ${JSON.stringify(hit)}`);
  }
  await capture(page,name); record(`${name}: startup/recovery bounds and reachable actions`,{ geometry:data });
}
