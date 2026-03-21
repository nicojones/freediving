/**
 * E2E test: non-happy path flows (invalid day, etc.).
 */
import { test, expect } from '@playwright/test';
import { loginAsAthena } from './helpers/login';

test('invalid day ID redirects to home', async ({ page }) => {
  await loginAsAthena(page);

  await page.goto('/day/invalid-day-999');
  await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 5000 });
});
