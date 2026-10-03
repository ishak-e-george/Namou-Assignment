import { expect, test } from '@playwright/test';

test('protected cart restores the session through login and logout', async ({ page }) => {
  await page.goto('/cart');
  await expect(page).toHaveURL(/\/login(?:\?loggedOut=1)?$/);

  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Password').fill('namou-demo-2026');
  await page.getByLabel('Password').press('Enter');

  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Your Cart/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: /Your Cart/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Home Collection', exact: true })).toBeVisible();

  await page.getByRole('link', { name: /Wishlist/ }).click();
  await expect(page).toHaveURL(/\/wishlist$/);
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login(?:\?loggedOut=1)?$/);

  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Password').fill('namou-demo-2026');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/');

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login(?:\?loggedOut=1)?$/);
  await page.goto('/cart');
  await expect(page).toHaveURL(/\/login$/);
});
