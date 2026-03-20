import type { Page } from '@playwright/test';

/** Default timeout for post-login dashboard to appear (plan loading can take a few seconds). */
export const DASHBOARD_TIMEOUT = 15000;

/**
 * Log in as nico and wait for the dashboard to be visible.
 * Use this in E2E tests that need an authenticated session.
 */
export async function loginAsNico(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByTestId('login-username').waitFor({ state: 'visible', timeout: 10000 });
  await page.getByTestId('login-username').fill('nico');
  await page.getByTestId('login-password').fill('password');
  await page.getByTestId('login-submit').click();
  await page
    .getByTestId('dashboard-day-list')
    .waitFor({ state: 'visible', timeout: DASHBOARD_TIMEOUT });
}
