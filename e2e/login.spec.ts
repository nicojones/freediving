/**
 * E2E test: login flow.
 * Runs in a real browser against the live app (dev server + backend).
 * Playwright starts both servers via playwright.config.ts webServer.
 */
import { test } from '@playwright/test';
import { loginAsAthena } from './helpers/login';

test('user can log in', async ({ page }) => {
  await loginAsAthena(page);
});
