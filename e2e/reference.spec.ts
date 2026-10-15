import { expect, test } from '@playwright/test';

test('reference hub, glossary and tools work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/reference');
  await expect(page.getByRole('heading', { name: 'Reference', level: 1 })).toBeVisible();

  await page.getByRole('link', { name: /Glossary/ }).click();
  await page.getByRole('link', { name: /Swinging door/i }).first().click();
  await expect(page).toHaveURL(/reference\/glossary\/swinging-door/);
  await expect(page.getByRole('heading', { name: /Swinging door/i, level: 2 })).toBeVisible();

  await page.goto('/#/reference/sizing');
  await page.getByLabel('Licensed PI points').fill('1000000');
  await page.getByLabel('Server memory (GB)').fill('64');
  // min(65536/3, 3*1e6/1024 = 2929.7) → 2048 MB
  await expect(page.getByText('2 GB', { exact: true }).first()).toBeVisible();

  await page.goto('/#/reference/tag-names');
  await page.getByLabel('Or check any tag name').fill('BAD;TAG');
  await expect(page.getByText(/not allowed: ;/)).toBeVisible();
  expect(errors).toEqual([]);
});
