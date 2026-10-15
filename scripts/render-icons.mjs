// Renders public/icon.svg to PNGs with the pre-installed Chromium (no extra deps).
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
for (const [size, out] of [
  [192, 'public/icon-192.png'],
  [512, 'public/icon-512.png'],
  [1024, 'src-tauri/app-icon.png'],
]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`,
  );
  await page.screenshot({ path: out, omitBackground: true });
  await page.close();
}
await browser.close();
