import { expect, test } from '@playwright/test';
import { enterSky } from './enter';

test('revealed controls stay actionable until the next deliberate launch', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  await enterSky(page, 'backend=webgl');
  const mobile = testInfo.project.name.includes('mobile');
  const once = page.getByRole('button', { name: 'Light once', exact: true });
  if (mobile) await once.tap(); else await once.click();
  await expect.poll(async () => Number(await page.locator('main').getAttribute('data-bursts')), { timeout: 45000 }).toBe(1);
  await expect(page.locator('main')).toHaveClass(/controls-hidden/, { timeout: 15000 });
  const size = page.viewportSize();
  if (!size) throw new Error('Viewport is required for the actual reveal gesture.');
  if (mobile) await page.touchscreen.tap(size.width / 2, 100);
  else await page.mouse.click(size.width / 2, 100);
  await expect(page.locator('main')).not.toHaveClass(/controls-hidden/);
  await page.waitForTimeout(4200);
  await expect(page.locator('main')).not.toHaveClass(/controls-hidden/);
  await expect(page.locator('main')).toHaveAttribute('data-launched', '1');
  const peony = page.getByRole('button', { name: 'Multicolor Peony', exact: true });
  if (mobile) await peony.tap(); else await peony.click();
  await expect(peony).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: testInfo.outputPath('revealed-controls-still-actionable.png') });
  if (mobile) await once.tap(); else await once.click();
  await expect.poll(async () => Number(await page.locator('main').getAttribute('data-bursts')), { timeout: 45000 }).toBe(2);
  await expect(page.locator('main')).toHaveClass(/controls-hidden/, { timeout: 15000 });
  await page.screenshot({ path: testInfo.outputPath('next-real-burst.png') });
});
