import { expect, test } from '@playwright/test';

test('customer can order a seeded multi-variant product and reload confirmation', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Password').fill('namou-demo-2026');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL('/');
  await page.getByRole('link', { name: 'Cotton Bathrobe Set' }).first().click();
  await expect(page.getByRole('heading', { name: 'Cotton Bathrobe Set' })).toBeVisible();
  await page.getByRole('button', { name: 'L', exact: true }).click();
  await expect(page.getByText('In stock', { exact: true })).toBeVisible();
  await expect(page.getByText('4 available', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Added to cart.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cart (1)' })).toBeVisible();

  await page.getByRole('link', { name: 'Cart (1)' }).click();
  await expect(page.getByText('Size: L')).toBeVisible();
  await expect(page.getByText('$56.00 each')).toBeVisible();
  await page.getByRole('button', { name: 'Increase quantity for Cotton Bathrobe Set' }).click();
  await expect(page.getByText('$112.00').first()).toBeVisible();

  await page.getByRole('link', { name: 'Proceed to Checkout' }).click();
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cotton Bathrobe Set' })).toBeVisible();
  await expect(page.getByText('Size: L')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Place Order' })).toBeEnabled();
  await page.getByRole('button', { name: 'Place Order' }).click();

  await expect(page).toHaveURL(/\/orders\/\d+$/);
  await expect(page.getByRole('heading', { name: 'Order Placed Successfully!' })).toBeVisible();
  await expect(page.getByText('Order number')).toBeVisible();
  await expect(page.getByText('Variant: L')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Order Placed Successfully!' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cart (0)' })).toBeVisible();
});
