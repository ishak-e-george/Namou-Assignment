import { expect, test } from '@playwright/test';

test('protected cart restores the session through login and logout', async ({ page }) => {
  await page.goto('/cart');
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Password').fill('namou-demo-2026');
  await page.getByLabel('Password').press('Enter');

  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your cart', exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your cart', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Shop', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/cart');
  await expect(page).toHaveURL(/\/login$/);
});
