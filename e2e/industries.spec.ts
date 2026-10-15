import { expect, test } from '@playwright/test';

test('industry hubs and case studies render with reporters', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/industries/water');
  await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
  await expect(page.locator('figure[aria-label="Diagram"] svg').first()).toBeVisible({
    timeout: 15000,
  });
  await page.goto('/#/cases/abbott-nutrition');
  await expect(page.getByRole('heading', { name: 'Abbott Nutrition', level: 2 })).toBeVisible();
  await expect(page.getByText(/reported by/).first()).toBeVisible();
  expect(errors).toEqual([]);
});
