import { test, expect } from '@playwright/test';
import { enterSky as enter } from './enter';

test('desktop command deck exposes the new hierarchy without covering the sky', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await enter(page);
  await expect(page.getByLabel('Firecrackers command deck')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Show mode' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Manual', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Automatic show' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Festival', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Finale', exact: true })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Gold Willow details' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hold to light selected firework' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gold Willow', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Silver Crossette Crackle', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Silver Crossette Crackle details' })).toContainText('Sharp · Crackling');
  const inspector = await page.getByRole('complementary', { name: 'Silver Crossette Crackle details' }).boundingBox();
  const deck = await page.getByLabel('Firework controls').boundingBox();
  expect(inspector).not.toBeNull();
  expect(deck).not.toBeNull();
  expect(inspector!.x + inspector!.width).toBeLessThanOrEqual(1280);
  expect(deck!.y).toBeGreaterThan(500);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('ui-v3-desktop.png') });
});

test('mode rail starts shows directly and manual returns control to the user', async ({ page }) => {
  await enter(page);
  await page.getByRole('button', { name: 'Festival', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Festival', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('main')).toHaveAttribute('data-display', 'interactive');
  await page.getByRole('button', { name: 'Manual', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Manual', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Automatic show' }).click();
  await expect(page.getByRole('heading', { name: 'Let the sky take over.' })).toBeVisible();
  await page.getByRole('button', { name: 'Close panel' }).click();
});

test('radial ignition preserves hold cancellation and the single-action alternative', async ({ page }) => {
  await enter(page);
  const ignite = page.getByRole('button', { name: 'Hold to light selected firework' });
  await ignite.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(180);
  await page.keyboard.up('Space');
  await expect(page.locator('main')).toHaveAttribute('data-launched', '0');
  await page.getByRole('button', { name: 'Light once', exact: true }).click();
  await expect.poll(async () => Number(await page.locator('main').getAttribute('data-launched')), { timeout: 45000 }).toBe(1);
});

test('mobile keeps all five families and ignition accessible while simplifying the inspector', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await enter(page);
  await expect(page.getByRole('complementary', { name: 'Gold Willow details' })).toBeHidden();
  for (const name of ['Gold Willow', 'Multicolor Peony', 'Chrysanthemum', 'Silver Crossette Crackle', 'Grand Finale']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Hold to light selected firework' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open settings' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const ignite = await page.getByRole('button', { name: 'Hold to light selected firework' }).boundingBox();
  expect(ignite).not.toBeNull();
  expect(ignite!.y + ignite!.height).toBeLessThan(851);
  await page.screenshot({ path: test.info().outputPath('ui-v3-mobile.png') });
});

test('short landscape retains the full command path without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 851, height: 393 });
  await enter(page);
  await expect(page.getByRole('button', { name: 'Hold to light selected firework' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Automatic show' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open settings' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('ui-v3-landscape.png') });
});

test('settings navigation, reset and reduced-motion keep the deck centered', async ({ page }) => {
  await enter(page);
  await page.getByRole('button', { name: 'Pause scene', exact: true }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  const panel = page.getByRole('dialog');
  await expect(panel).toHaveClass(/sheet--settings/);
  await page.getByRole('navigation', { name: 'Settings sections' }).getByRole('button', { name: 'Graphics', exact: true }).click();
  await page.getByLabel('Reduced interface motion', { exact: true }).check();
  await page.getByLabel('Graphics quality', { exact: true }).selectOption('low');
  await page.screenshot({ path: test.info().outputPath('ui-v3-settings.png') });
  await page.getByRole('button', { name: 'Close panel' }).click();
  await expect(page.locator('main')).toHaveAttribute('data-paused', 'true');
  const deck = await page.getByLabel('Firework controls').boundingBox();
  const width = page.viewportSize()!.width;
  expect(Math.abs(deck!.x + deck!.width / 2 - width / 2)).toBeLessThan(2);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('navigation', { name: 'Settings sections' }).getByRole('button', { name: 'Device', exact: true }).click();
  await page.getByRole('button', { name: 'Reset this sky' }).click();
  await page.getByRole('button', { name: 'Keep my sky' }).click();
  await expect(page.getByLabel('Graphics quality')).toHaveValue('low');
  await page.getByRole('button', { name: 'Close panel' }).click();
  await page.getByRole('button', { name: 'Resume scene', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Light once', exact: true })).toBeEnabled();
});

test('small phone retains visible quick light and can operate every modal', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await enter(page);
  await expect(page.getByRole('button', { name: 'Light once', exact: true })).toBeInViewport();
  await page.getByRole('button', { name: 'Automatic show' }).click();
  await expect(page.locator('dialog')).toHaveClass(/sheet--show/);
  await page.screenshot({ path: test.info().outputPath('ui-v3-show-small-phone.png') });
  await page.getByRole('button', { name: 'Close panel' }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Replay introduction' }).click();
  await expect(page.locator('dialog')).toHaveClass(/sheet--help/);
  await page.getByRole('button', { name: 'Enter the night', exact: true }).click();
  await expect(page.locator('main')).toHaveAttribute('data-overlay', 'none');
  const width = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, view: innerWidth }));
  expect(width.page).toBeLessThanOrEqual(width.view);
  await page.screenshot({ path: test.info().outputPath('ui-v3-small-phone.png') });
});

test('the real 3D launch stage is present and the concept-sized scene is usable', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  await enter(page, 'backend=webgl&qa=1');
  await expect(page.locator('.scene-host')).toHaveAttribute('data-stage', 'spatial-v3');
  await page.evaluate(() => (window as unknown as { __firecrackersQA: { freeze: (v: boolean) => void } }).__firecrackersQA.freeze(true));
  await page.screenshot({ path: test.info().outputPath('ui-v3-launch-stage.png') });
  await page.getByRole('button', { name: 'Place firework left', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Firework position' })).toHaveValue('28');
  await page.getByRole('button', { name: 'Light once', exact: true }).click();
  await page.evaluate(async () => {
    const qa = (window as unknown as { __firecrackersQA: { advance: (s: number) => void; render: () => void } }).__firecrackersQA;
    qa.advance(5.5);
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    qa.render();
  });
  await expect(page.locator('main')).toHaveAttribute('data-bursts', '1');
  await page.keyboard.press('Escape');
  await page.screenshot({ path: test.info().outputPath('ui-v3-concept-size-burst.png') });
});
