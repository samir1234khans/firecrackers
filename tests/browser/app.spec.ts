import { test, expect, type Page } from '@playwright/test';

async function enter(page: Page, backend = 'webgl') {
  await page.goto(`/?backend=${backend}`);
  await page.getByRole('button', { name: 'Skip introduction' }).click();
  await expect(page.getByRole('button', { name: 'Light once', exact: true })).toBeEnabled();
}
async function counts(page: Page) {
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByText('Graphics details', { exact: true }).click();
  const row = page.locator('dl div').filter({ hasText: 'Launched / bursts' });
  const values = (await row.locator('dd').innerText()).split('/').map(Number);
  return { launched: values[0], bursts: values[1] };
}

test('deliberate lighting reaches a rendered burst, with sound and no application errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enter(page);
  await expect(page).toHaveTitle('Firecrackers');
  await page.getByRole('button', { name: 'Place firework left' }).click();
  await expect(page.getByRole('slider', { name: 'Firework position' })).toHaveValue('28');
  await page.getByRole('button', { name: 'Enable sound' }).click();
  await expect(page.getByRole('button', { name: 'Mute sound' })).toBeVisible();
  await page.getByRole('button', { name: 'Light once', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Light once', exact: true })).toBeDisabled();
  await expect(page.locator('.scene-message')).toHaveText('Stay for the falling embers.', { timeout: 30000 });
  await page.waitForTimeout(1400);
  await page.keyboard.press('Escape');
  await page.screenshot({ path: test.info().outputPath('willow-burst.png') });
  expect(await counts(page)).toEqual({ launched: 1, bursts: 1 });
  await expect(page.locator('dl')).toContainText('WebGL 2');
  expect(errors).toEqual([]);
});

test('short hold cancels without firing; keyboard alternative starts the same lifecycle', async ({ page }) => {
  await enter(page);
  const fuse = page.getByRole('button', { name: 'Hold to light selected firework' });
  await fuse.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(160);
  await page.keyboard.up('Space');
  await expect(page.getByRole('button', { name: 'Light once', exact: true })).toBeEnabled();
  expect(await counts(page)).toEqual({ launched: 0, bursts: 0 });
  await page.getByRole('button', { name: 'Close panel' }).click();
  await fuse.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(6000);
  expect((await counts(page)).launched).toBe(1);
});

test('five choices, automatic show, manual priority, pause and reset are connected', async ({ page }) => {
  await enter(page);
  for (const name of ['Gold Willow', 'Multicolor Peony', 'Chrysanthemum', 'Silver Crossette Crackle', 'Grand Finale']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await page.getByRole('button', { name: 'Automatic show' }).click();
  await page.getByRole('radio', { name: /Festival/ }).check();
  await page.getByRole('button', { name: 'Start show' }).click();
  await page.waitForTimeout(3600);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Chrysanthemum', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Automatic show' })).toHaveText('Auto show');
  await page.getByRole('button', { name: 'Pause scene', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Resume scene' })).toBeVisible();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Reset this sky' }).click();
  await page.getByRole('button', { name: 'Keep my sky' }).click();
  await page.getByRole('button', { name: 'Reset this sky' }).click();
  await page.getByRole('button', { name: 'Reset sky and preferences' }).click();
  await expect(page.getByRole('heading', { name: 'A little spark. A whole night sky.' })).toBeVisible();
});

test('comfort preferences persist; scene and audio do not resume on refresh', async ({ page }) => {
  await enter(page);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByLabel('Graphics quality').selectOption('low');
  await page.getByLabel('Reduced interface motion').check();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Light once', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Enable sound' })).toBeVisible();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByLabel('Graphics quality')).toHaveValue('low');
  await expect(page.getByLabel('Reduced interface motion')).toBeChecked();
  await page.screenshot({ path: test.info().outputPath('settings.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('cached app cold-loads offline and can light a different family', async ({ page, context }) => {
  await enter(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Light once', exact: true })).toBeEnabled();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Light once', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Multicolor Peony', exact: true }).click();
  await page.getByRole('button', { name: 'Light once', exact: true }).click();
  await page.waitForTimeout(6000);
  expect((await counts(page)).bursts).toBe(1);
  await context.setOffline(false);
});

test('every family produces an inspectable peak and the screen recovers in landscape', async ({ page }) => {
  test.setTimeout(180000);
  const families = ['Gold Willow', 'Multicolor Peony', 'Chrysanthemum', 'Silver Crossette Crackle', 'Grand Finale'];
  for (const [index, name] of families.entries()) {
    await page.goto('/?backend=webgl');
    const skip = page.getByRole('button', { name: 'Skip introduction' });
    if (await skip.isVisible()) await skip.click();
    await expect(page.getByRole('button', { name: 'Light once', exact: true })).toBeEnabled();
    await page.getByRole('button', { name, exact: true }).click();
    await page.getByRole('button', { name: 'Light once', exact: true }).click();
    await expect(page.locator('.scene-message')).toHaveText('Stay for the falling embers.', { timeout: 30000 });
    await page.waitForTimeout(name === 'Grand Finale' ? 3000 : 1100);
    await page.keyboard.press('Escape');
    await page.screenshot({ path: test.info().outputPath(`family-${index}.png`) });
  }
  await page.setViewportSize({ width: 851, height: 393 });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('landscape-settings.png') });
});
