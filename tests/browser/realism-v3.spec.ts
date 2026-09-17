import { test, expect, type Page } from '@playwright/test';
import { enterSky } from './enter';
type QA = { freeze: (v: boolean) => void; advance: (s: number) => void; render: () => void; snapshot: () => Record<string, number | string> };
async function advance(page: Page, seconds: number) {
  await page.evaluate(async seconds => {
    const q = (window as unknown as { __firecrackersQA: QA }).__firecrackersQA;
    q.advance(seconds);
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); q.render();
  }, seconds);
}
test('observatory stage and full ignition render with retained smoke and detached embers', async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await enterSky(page, 'backend=webgl&qa=1');
  await page.waitForFunction(() => Boolean((window as unknown as { __firecrackersQA?: QA }).__firecrackersQA));
  await page.evaluate(() => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA.freeze(true));
  await expect(page.locator('.scene-host')).toHaveAttribute('data-realism', 'observatory-v3');
  await expect(page.locator('main')).toHaveAttribute('data-version', '2026-09-17.3');
  await page.screenshot({ path: test.info().outputPath('rv3-01-idle.png') });
  await page.getByRole('button', { name: 'Light once', exact: true }).click();
  await advance(page, 1);
  await page.screenshot({ path: test.info().outputPath('rv3-02-fuse.png') });
  await advance(page, 1.7);
  await page.screenshot({ path: test.info().outputPath('rv3-03-launch.png') });
  await advance(page, 2.9);
  await page.screenshot({ path: test.info().outputPath('rv3-04-break.png') });
  await advance(page, 2.1);
  const state = await page.evaluate(() => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA.snapshot());
  expect(Number(state.embers)).toBeGreaterThan(0);
  expect(Number(state.bursts)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await page.screenshot({ path: test.info().outputPath('rv3-05-canopy.png') });
  await page.getByRole('button', { name: 'Multicolor Peony', exact: true }).click();
  await page.getByRole('button', { name: 'Light once', exact: true }).click();
  await advance(page, 4.4);
  await page.screenshot({ path: test.info().outputPath('rv3-06-layered.png') });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByLabel('Graphics quality')).toHaveValue('ultra');
  await page.getByRole('button', { name: 'Close panel' }).click();
  expect(errors).toEqual([]);
});
