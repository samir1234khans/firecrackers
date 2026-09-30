// Encode original generated scenery for progressive browser loading.
// Usage: node assets-source/prepare-scenery.mjs path/to/original.png
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
const input = process.argv[2];
if (!input) throw new Error('Provide the original scenery PNG');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const source = (await readFile(input)).toString('base64');
  const output = await page.evaluate(async data => {
    const image = new Image(); image.src = 'data:image/png;base64,' + data;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    canvas.getContext('2d').drawImage(image, 0, 0);
    return canvas.toDataURL('image/webp', .9).split(',')[1];
  }, source);
  await writeFile('public/art/waterfront-night-v005.webp', Buffer.from(output, 'base64'));
} finally { await browser.close(); }
