import { expect, test } from '@playwright/test';

test('admin edits a glossary term, rejects invalid JSON and lists verification items', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/admin');
  await expect(page.getByRole('heading', { name: 'Admin', level: 1 })).toBeVisible();
  await page.getByLabel('Filter items').fill('compdev');
  await page.getByRole('list', { name: 'Items' }).getByRole('button').first().click();
  const editor = page.getByLabel(/Edit as JSON/);
  const json = JSON.parse(await editor.inputValue()) as { definition: string };
  json.definition = `${json.definition} Edited in the admin test.`;
  await editor.fill(JSON.stringify(json));
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
  await expect(page.getByText('Edited bundled item')).toBeVisible();

  await editor.fill('{"id": "Bad Id"}');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(/Not saved/)).toBeVisible();

  await page.getByRole('tab', { name: 'Verification' }).click();
  await expect(page.getByText(/items are flagged/)).toBeVisible();
  await page.getByRole('tab', { name: 'Coverage' }).click();
  await expect(page.getByText(/syllabus items have a lesson/)).toBeVisible();
  expect(errors).toEqual([]);
});
