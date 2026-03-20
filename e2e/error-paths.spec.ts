/**
 * E2E test: non-happy path flows (invalid login, invalid day, etc.).
 */
import { test, expect } from '@playwright/test';
import { loginAsNico } from './helpers/login';

test('invalid login shows error', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('login-username').waitFor({ state: 'visible', timeout: 10000 });
  await page.getByTestId('login-username').fill('baduser');
  await page.getByTestId('login-password').fill('badpass');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 5000 });
});

test('invalid day ID redirects to home', async ({ page }) => {
  await loginAsNico(page);

  await page.goto('/day/invalid-day-999');
  await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 5000 });
});
