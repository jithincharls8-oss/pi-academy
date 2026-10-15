import { expect, test } from '@playwright/test';

test('deployment planner changes the architecture with company size', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/planner');
  await expect(page.getByRole('heading', { name: 'Deployment Planner', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Single PI Server node' })).toBeVisible();
  await expect(page.locator('figure[aria-label="Architecture diagram"] svg')).toBeVisible({
    timeout: 15000,
  });

  await page.getByLabel('Company size').selectOption('large');
  await expect(
    page.getByRole('heading', { name: 'Site PI Servers with central aggregation' }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Servers' }).click();
  await expect(page.getByRole('cell', { name: 'Central PI Data Archive' })).toBeVisible();

  await page.getByLabel('Industry').selectOption('pharma');
  await page.getByRole('tab', { name: 'Security' }).click();
  await expect(page.getByText(/EnableAudit tuning parameter/)).toBeVisible();

  await page.getByRole('tab', { name: 'Tags and sizing' }).click();
  await expect(
    page.getByRole('region', { name: 'Real deployments of a similar size' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
