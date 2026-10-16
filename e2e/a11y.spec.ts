import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = [
  '/',
  '/learn',
  '/learn/exception-and-compression',
  '/exam/daily',
  '/practice',
  '/sandbox',
  '/sandbox/explorer',
  '/sandbox/smt',
  '/sandbox/vision',
  '/sandbox/webapi',
  '/sandbox/compression',
  '/sandbox/datalink',
  '/reference',
  '/reference/sizing',
  '/planner',
  '/industries',
  '/cases',
  '/admin',
  '/search',
  '/settings',
];

for (const scheme of ['light', 'dark'] as const)
  for (const path of PAGES) {
    test(`no serious accessibility violations on ${path} (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(`/#${path}`);
      await page.locator('main').waitFor();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const bad = r.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map(
          (v) =>
            `${v.id} (${v.nodes.length}): ${v.nodes
              .slice(0, 3)
              .map((n) => `${n.target.join(' ')} ${n.any[0]?.message ?? ''}`)
              .join(' | ')}`,
        );
      expect(bad, bad.join('\n')).toEqual([]);
    });
  }
