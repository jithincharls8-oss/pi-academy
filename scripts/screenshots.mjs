// Usage: node scripts/screenshots.mjs <outDir> <route>[,<route>...] [light|dark]
// Requires `npx vite preview --port 4173` to be running.
import { chromium } from '@playwright/test';
const [outDir = 'screens', routes = '/', theme = 'light'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1360, height: 860 }, colorScheme: theme });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
for (const r of routes.split(',')) {
  await page.goto(`http://localhost:4173/#${r}`);
  await page.waitForTimeout(1200);
  const name = r.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home';
  await page.screenshot({ path: `${outDir}/${name}-${theme}.png`, fullPage: false });
}
await browser.close();
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
