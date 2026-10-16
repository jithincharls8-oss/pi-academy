// Screenshot every page at two widths in light and dark for the design audit.
// Usage: node scripts/design/screens.mjs <outDir>   (needs `npx vite preview --port 4173` running)
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] ?? 'design-shots';
mkdirSync(out, { recursive: true });
const PAGES = [
  ['home', '/'],
  ['learn', '/learn'],
  ['lesson', '/learn/exception-and-compression'],
  ['daily-exam', '/exam/daily'],
  ['practice', '/practice'],
  ['sandbox', '/sandbox'],
  ['vision', '/sandbox/vision'],
  ['explorer', '/sandbox/explorer'],
  ['smt', '/sandbox/smt'],
  ['webapi', '/sandbox/webapi'],
  ['compression', '/sandbox/compression'],
  ['datalink', '/sandbox/datalink'],
  ['reference', '/reference'],
  ['glossary', '/reference/glossary'],
  ['decisions', '/reference/decisions'],
  ['sizing', '/reference/sizing'],
  ['planner', '/planner'],
  ['industries', '/industries'],
  ['industry', '/industries/chemicals'],
  ['cases', '/cases'],
  ['admin', '/admin'],
  ['search', '/search'],
  ['settings', '/settings'],
];
const b = await chromium.launch();
for (const scheme of ['light', 'dark']) {
  for (const width of [1366, 1920]) {
    const ctx = await b.newContext({
      viewport: { width, height: width === 1366 ? 768 : 1080 },
      colorScheme: scheme,
    });
    const p = await ctx.newPage();
    for (const [name, path] of PAGES) {
      await p.goto(`http://localhost:4173/#${path}`);
      await p.locator('main').waitFor();
      await p.waitForLoadState('networkidle');
      await p.waitForTimeout(400);
      await p.screenshot({ path: `${out}/${name}-${width}-${scheme}.png` });
    }
    await ctx.close();
  }
}
await b.close();
console.log(`wrote ${PAGES.length * 4} screenshots to ${out}`);
