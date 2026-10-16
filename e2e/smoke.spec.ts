import { expect, test } from '@playwright/test';

test('app boots offline-ready and navigates', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ready for your next lesson?' })).toBeVisible();
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByLabel('Theme').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});

test('search page responds to the keyboard shortcut', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ready for your next lesson?' })).toBeVisible();
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible();
});

test('unknown routes show a friendly page', async ({ page }) => {
  await page.goto('/#/does-not-exist');
  await expect(page.getByText('That page does not exist.')).toBeVisible();
});
