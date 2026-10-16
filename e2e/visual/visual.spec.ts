import { expect, test } from '@playwright/test';

// Screenshot baselines for the redesign. Run with `npm run visual`; refresh after an intended
// visual change with `npm run visual -- --update-snapshots`. Kept out of the default e2e run
// because font rendering differs between machines; compare on the machine that made the baseline.
const PAGES = [
  ['home', '/#/'],
  ['learn', '/#/learn'],
  ['lesson', '/#/learn/exception-and-compression'],
  ['daily-exam', '/#/exam/daily'],
  ['practice', '/#/practice'],
  ['sandbox', '/#/sandbox'],
  ['reference', '/#/reference'],
  ['planner', '/#/planner'],
  ['styleguide', '/#/styleguide'],
] as const;

for (const theme of ['light', 'dark'] as const) {
  for (const [name, path] of PAGES) {
    test(`${name} looks as designed (${theme})`, async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.goto(path);
      await expect(page.locator(`html[data-theme='${theme}']`)).toHaveCount(1);
      await page.waitForLoadState('networkidle');
      await page.evaluate('document.fonts.ready');
      // Diagrams render asynchronously; wait until the page height stops changing.
      let last = -1;
      for (let i = 0; i < 20; i++) {
        const h = await page.evaluate<number>('document.body.scrollHeight');
        if (h === last) break;
        last = h;
        await page.waitForTimeout(400);
      }
      await expect(page).toHaveScreenshot(`${name}-${theme}.png`, {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.01,
        // The greeting depends on the time of day.
        mask: [page.getByText(/^Good (morning|afternoon|evening)$/)],
      });
    });
  }
}
