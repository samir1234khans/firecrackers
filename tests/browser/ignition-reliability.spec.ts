import { expect, test } from '@playwright/test';
import { enterSky } from './enter';

type QA = { freeze: (value: boolean) => void; snapshot: () => { active: number; fuse: boolean } };
const qaWindow = () => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA;

// Freeze only the test simulation to reproduce input/render-clock divergence.
// These checks prove gesture semantics, not GPU performance or device endurance.
test('a completed mouse hold survives a stalled simulation frame', async ({ page }, testInfo) => {
  await enterSky(page, 'backend=webgl&qa=1');
  await page.evaluate(() => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA.freeze(true));
  const hold = page.getByRole('button', { name: 'Hold to light selected firework', exact: true });
  await hold.hover();
  await page.mouse.down();
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'contact');
  await page.waitForTimeout(900);
  await page.mouse.up();
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'fuse');
  expect(await page.evaluate(() => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA.snapshot().active)).toBe(1);
  await page.evaluate(() => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA.freeze(false));
  await expect(page.locator('main')).toHaveAttribute('data-bursts', '1', { timeout: 20000 });
  await page.screenshot({ path: testInfo.outputPath('real-time-completed-hold.png') });
});

test('short holds and cancelled long presses do not ignite', async ({ page }) => {
  await enterSky(page, 'backend=webgl&qa=1');
  await page.evaluate(() => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA.freeze(true));
  const hold = page.getByRole('button', { name: 'Hold to light selected firework', exact: true });
  await hold.click();
  await expect(page.locator('.hud-status')).toContainText('or tap Light once');
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'ready');
  await hold.hover();
  await page.mouse.down();
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'contact');
  await page.waitForTimeout(800);
  await hold.dispatchEvent('pointercancel', { pointerId: 1, isPrimary: true });
  await page.mouse.up();
  expect(await page.evaluate(() => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA.snapshot().active)).toBe(0);
  await expect(page.locator('main')).toHaveAttribute('data-launched', '0');
  await page.getByRole('button', { name: 'Light once', exact: true }).click();
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'fuse');
});

test('keyboard hold completes without a frame and blur cancels a pending press', async ({ page }) => {
  await enterSky(page, 'backend=webgl&qa=1');
  await page.evaluate(() => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA.freeze(true));
  const hold = page.getByRole('button', { name: 'Hold to light selected firework', exact: true });
  await hold.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Gold Willow', exact: true }).focus();
  await page.keyboard.up('Space');
  expect(await page.evaluate(() => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA.snapshot().active)).toBe(0);
  await hold.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(800);
  await page.keyboard.up('Space');
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'fuse');
  expect(await page.evaluate(() => (window as unknown as { __firecrackersQA: QA }).__firecrackersQA.snapshot().active)).toBe(1);
});
