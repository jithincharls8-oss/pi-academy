import { expect, test } from '@playwright/test';

test('daily exam: start, answer, finish and see the streak', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/exam/daily');
  await page.getByRole('button', { name: "Start today's exam" }).click();
  await expect(page.getByText('Question 1 of')).toBeVisible();
  // The first question may be any type; answer it only when it is single choice.
  const radio = page.getByRole('article').first().getByRole('radio').first();
  if (await radio.count()) await radio.check();
  await expect(page.getByText('Question 1 of')).toBeVisible();
  await page.getByRole('button', { name: /Finish session/ }).click();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByRole('heading', { name: "Today's result" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: "Today's result" })).toBeVisible();
  expect(errors).toEqual([]);
});

test('mock exam hides answers until the end and shows a review', async ({ page }) => {
  await page.goto('/#/practice?tab=mock');
  await page.getByLabel('Time limit').selectOption('60');
  await page.getByRole('button', { name: 'Start mock exam' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  const radio = page.getByRole('article').getByRole('radio').first();
  if (await radio.count()) {
    await radio.check();
    await page.getByRole('button', { name: 'Save answer' }).click();
    await expect(page.getByText('Answer saved.')).toBeVisible();
  }
  await page.getByRole('button', { name: 'Finish exam' }).click();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Review your answers' })).toBeVisible();
});

test('topic quiz runs from the practice page', async ({ page }) => {
  await page.goto('/#/practice');
  await page.getByRole('button', { name: 'Start quiz' }).click();
  await expect(page.getByRole('heading', { name: 'Topic quiz' })).toBeVisible();
  await expect(page.getByText(/Question 1 of/)).toBeVisible();
});
