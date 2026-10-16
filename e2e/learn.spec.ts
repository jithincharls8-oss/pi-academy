import { expect, test } from '@playwright/test';

test('a lesson renders all sections and its knowledge check grades answers', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/learn');
  await expect(page.getByRole('heading', { name: 'Learn', level: 1 })).toBeVisible();
  await page
    .getByRole('link', { name: /Exception and compression/ })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'Exception and compression', level: 1 }),
  ).toBeVisible();
  for (const section of [
    'Plain English',
    'Deep Dive',
    'Worked Example',
    'Diagram',
    'Common Mistakes',
    'Real-World Scenario',
  ]) {
    await expect(page.getByRole('heading', { name: section })).toBeVisible();
  }
  await expect(page.getByRole('region', { name: 'Diagram' }).locator('figure svg')).toBeVisible({
    timeout: 15000,
  });
  const first = page.getByRole('article', { name: 'Where is exception reporting applied?' });
  await first
    .getByRole('radio', { name: 'In the PI Interface, before data is sent to the Data Archive' })
    .check();
  await first.getByRole('button', { name: 'Check answer' }).click();
  await expect(first.getByText('Correct', { exact: false }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
