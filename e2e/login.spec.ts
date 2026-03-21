/**
 * E2E test: login flow.
 * Runs in a real browser against the live app (dev server + backend).
 * Playwright starts both servers via playwright.config.ts webServer.
 */
import { test, expect } from '@playwright/test';
import { loginAsAthena } from './helpers/login';

test('user can log in', async ({ page }) => {
  await loginAsAthena(page);
});

test('TopAppBar Fishly link navigates to Dashboard', async ({ page }) => {
  await loginAsAthena(page);
  await page.goto('/plans');
  await page.getByRole('link', { name: 'Go to training' }).click();
  await expect(page).toHaveURL('/');
  await page.getByTestId('dashboard-day-list').waitFor({ state: 'visible', timeout: 10000 });
});
