import { test, expect, type Page } from '@playwright/test';
import { enterSky } from './enter';

type QA = { freeze: (value: boolean) => void; advance: (seconds: number) => void; render: () => void; snapshot: () => Record<string, number | string> };
const qa = (page: Page, seconds: number) => page.evaluate(async value => {
  const q = (window as unknown as { __firecrackersQA: QA }).__firecrackersQA;
  q.advance(value);
  // TSL scene/bloom passes update once per renderer frame. Do not capture the old cached pass.
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  q.render();
}, seconds);
async function enter(page: Page, query = 'backend=webgl&qa=1') {
  await enterSky(page, query);
  await page.waitForFunction(() => Boolean((window as unknown as { __firecrackersQA?: QA }).__firecrackersQA), undefined, { timeout: 45000 });
}
async function frozen(page: Page) {
  await page.evaluate(() => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA.freeze(true));
}

test('V2 renderer produces all five spatial effects and ignition checkpoints without errors', async ({ page }) => {
  test.setTimeout(210000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const families = ['Gold Willow', 'Multicolor Peony', 'Chrysanthemum', 'Silver Crossette Crackle', 'Grand Finale'];
  for (const [index, family] of families.entries()) {
    await enter(page);
    await frozen(page);
    await page.getByRole('button', { name: family, exact: true }).click();
    if (index === 0) await page.screenshot({ path: test.info().outputPath('00-grounded-prop.png') });
    await page.getByRole('button', { name: 'Light once', exact: true }).click();
    if (index === 0) {
      await qa(page, 1);
      await page.screenshot({ path: test.info().outputPath('01-traveling-fuse.png') });
      await qa(page, 1.7);
      await page.screenshot({ path: test.info().outputPath('02-powered-ascent.png') });
      await qa(page, 2.8);
    } else await qa(page, index === 4 ? 7.6 : 5.5);
    await expect.poll(async () => Number(await page.locator('main').getAttribute('data-bursts'))).toBeGreaterThan(0);
    await page.screenshot({ path: test.info().outputPath(`family-${index}-peak.png`) });
    if (index === 0) {
      await qa(page, 3);
      await page.screenshot({ path: test.info().outputPath('04-willow-canopy.png') });
      await qa(page, 2);
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Multicolor Peony', exact: true }).click();
      await page.getByRole('button', { name: 'Light once', exact: true }).click();
      await qa(page, 4.2);
      await page.screenshot({ path: test.info().outputPath('05-retained-smoke-relighting.png') });
    }
  }
  expect(errors).toEqual([]);
});

test('settings preserve manual pause and repeated Space cannot toggle it repeatedly', async ({ page }) => {
  await enter(page);
  await page.getByRole('button', { name: 'Pause scene', exact: true }).first().click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Close panel' }).click();
  await expect(page.locator('main')).toHaveAttribute('data-paused', 'true');
  await page.getByRole('button', { name: 'Resume scene', exact: true }).first().click();
  await page.locator('body').click({ position: { x: 10, y: 150 } });
  await page.keyboard.down('Space');
  await expect(page.locator('main')).toHaveAttribute('data-paused', 'true');
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  await expect(page.locator('main')).toHaveAttribute('data-paused', 'true');
  await page.keyboard.up('Space');
});

test('presentation settings generate a usable silent link and protected layout', async ({ page }) => {
  await enter(page);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByLabel('Canvas output').selectOption('transparent');
  await page.getByLabel('Protect a clear area').check();
  await page.getByLabel('Frame-rate target').selectOption('30');
  await page.getByRole('button', { name: 'Copy link' }).click();
  const link = await page.getByLabel('Display link').inputValue();
  expect(link).toContain('display=transparent');
  expect(link).toContain('protect=1');
  await page.screenshot({ path: test.info().outputPath('operator-settings.png') });
  await page.goto(`${link}&qa=1&backend=webgl`);
  await page.waitForFunction(() => Boolean((window as unknown as { __firecrackersQA?: QA }).__firecrackersQA), undefined, { timeout: 45000 });
  await expect(page.locator('main')).toHaveAttribute('data-display', 'transparent');
  await frozen(page); await qa(page, 6);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Enable sound', exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Return to interactive sky' }).click();
  await expect(page.locator('main')).toHaveAttribute('data-display', 'interactive');
});

test('transparent canvas has transparent corners and visible emitted pixels', async ({ page }) => {
  await enter(page, 'backend=webgl&qa=1&display=transparent&show=festival&fps=30');
  await frozen(page); await qa(page, 6);
  const pixels = await page.evaluate(async () => {
    const q = (window as unknown as { __firecrackersQA: QA }).__firecrackersQA;
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    q.render();
    const source = document.querySelector('.scene-host canvas') as HTMLCanvasElement;
    const image = new Image();
    image.src = source.toDataURL();
    await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height;
    const c = canvas.getContext('2d')!; c.drawImage(image, 0, 0);
    const { data } = c.getImageData(0, 0, canvas.width, canvas.height);
    let visible = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 10) visible++;
    return { corner: data[3], visible, total: canvas.width * canvas.height };
  });
  expect(pixels.corner).toBe(0); expect(pixels.visible).toBeGreaterThan(20);
  expect(pixels.visible).toBeLessThan(pixels.total * .85);
  await page.screenshot({ path: test.info().outputPath('transparent-overlay.png'), omitBackground: true });
});

test('resize during ascent preserves progress and landscape controls remain reachable', async ({ page }) => {
  await enter(page); await frozen(page);
  await page.getByRole('button', { name: 'Light once', exact: true }).click();
  let before = await page.evaluate(() => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA.snapshot());
  for (let step = 0; step < 40 && before.phase !== 'thrust' && before.phase !== 'coast'; step++) {
    await qa(page, .1);
    before = await page.evaluate(() => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA.snapshot());
  }
  expect(['thrust', 'coast']).toContain(before.phase);
  expect(before.launched).toBe(1);
  await page.setViewportSize({ width: 851, height: 393 });
  await qa(page, 3);
  const after = await page.evaluate(() => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA.snapshot());
  expect(after.launched).toBe(before.launched); expect(Number(after.bursts)).toBeGreaterThan(0);
  await page.screenshot({ path: test.info().outputPath('landscape-burst.png') });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByLabel('Graphics quality').selectOption('low');
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
