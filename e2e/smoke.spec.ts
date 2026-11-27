import { expect, test } from '@playwright/test';

// A new number each run, so the test never collides with an earlier account.
const newPhone = () => '03' + String(Math.floor(Math.random() * 1e9)).padStart(9, '0');

test('new shopkeeper signs up, pings from Hello, and Counter shows 1', async ({ page }) => {
  await page.goto('/signup');

  await page.getByLabel('Shop name').fill('Smoke Test Kiryana');
  await page.getByLabel('Mobile number').fill(newPhone());
  await page.getByLabel('Password', { exact: true }).fill('smoke-test-password');
  await page.getByRole('button', { name: 'Create account' }).click();

  // Home: one tile per mini-app manifest, and the shop name in the header.
  await expect(page.getByRole('heading', { name: 'Your apps' })).toBeVisible();
  await expect(page.getByText('Smoke Test Kiryana')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Counter' })).toBeVisible();

  await page.getByRole('link', { name: 'Hello' }).click();
  await page.getByRole('button', { name: 'Send ping' }).click();
  await expect(page.getByRole('status')).toHaveText(/Sent 1 ping\./);

  await page.getByRole('link', { name: 'Back' }).click();
  await page.getByRole('link', { name: 'Counter' }).click();
  await expect(page.getByTestId('ping-count')).toHaveText('1');

  // Nothing scrolls sideways at phone width.
  const scrollsSideways = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(scrollsSideways).toBe(false);
});
