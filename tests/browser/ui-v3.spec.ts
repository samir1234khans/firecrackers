import { test, expect, type Page } from '@playwright/test';

async function enter(page: Page) {
  await page.goto('/?backend=webgl');
  const skip = page.getByRole('button', { name: 'Skip introduction' });
  if (await skip.isVisible()) await skip.evaluate(element => (element as HTMLButtonElement).click());
  await expect(page.getByRole('button', { name: 'Light once', exact: true })).toBeEnabled({ timeout: 45000 });
}

test('desktop command deck exposes the new hierarchy without covering the sky', async ({ page }) => {
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
  expect(deck!.y).toBeGreaterThan(560);
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
