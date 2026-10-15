import { expect, test } from '@playwright/test';

for (const [path, title] of [
  ['/#/sandbox/explorer', /PI System Explorer/],
  ['/#/sandbox/smt', /System Management Tools|PI SMT/],
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
