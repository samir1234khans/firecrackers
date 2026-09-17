import { expect, type Page } from '@playwright/test';

/** Wait for the actual app/renderer state, then exercise the real, visible onboarding button. */
export async function enterSky(page: Page, query = 'backend=webgl') {
  await page.goto(`/?${query}`);
  await expect(page.locator('main')).toHaveAttribute('data-ready', 'true', { timeout: 60000 });
  if (await page.locator('main').getAttribute('data-overlay') === 'help') {
    await page.getByRole('button', { name: 'Skip introduction' }).click();
  }
  await expect(page.locator('main')).toHaveAttribute('data-overlay', 'none');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  if (!query.includes('display=')) {
    await expect(page.getByRole('button', { name: 'Light once', exact: true })).toBeEnabled();
  }
}
