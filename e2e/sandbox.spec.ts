import { expect, test } from '@playwright/test';

for (const [path, title] of [
  ['/#/sandbox/explorer', /PI System Explorer/],
  ['/#/sandbox/smt', /System Management Tools|PI SMT/],
  ['/#/sandbox/webapi', /PI Web API/],
  ['/#/sandbox/compression', /[Cc]ompression/],
  ['/#/sandbox/datalink', /DataLink/],
] as const) {
  test(`${path} opens without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(path);
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Simulation on fictional data').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('sandbox hub lists the tools that exist', async ({ page }) => {
  await page.goto('/#/sandbox');
  await expect(page.getByRole('heading', { name: 'PI Sandbox', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: /PI System Explorer/ }).click();
  await expect(page).toHaveURL(/sandbox\/explorer/);
});

test('PI Vision opens an example display and switches asset', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/sandbox/vision');
  await page.getByRole('button', { name: 'Open Feed Pumps Overview' }).click();
  await expect(page.getByText('Simulation on fictional data').first()).toBeVisible();
  await expect(page.getByText('P-101 Flow').first()).toBeVisible();
  await page.getByLabel('Switch asset').selectOption({ index: 1 });
  await expect(page.getByText('P-102 Flow').first()).toBeVisible();
  expect(errors).toEqual([]);
});
