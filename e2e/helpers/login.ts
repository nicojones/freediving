import type { Page } from '@playwright/test';

/** Default timeout for post-login dashboard to appear (plan loading can take a few seconds). */
export const DASHBOARD_TIMEOUT = 15000;

async function loginAs(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/');
  await page.getByTestId('login-username').waitFor({ state: 'visible', timeout: 10000 });
  await page.getByTestId('login-username').fill(username);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await page
    .getByTestId('dashboard-day-list')
    .waitFor({ state: 'visible', timeout: DASHBOARD_TIMEOUT });
}

/**
 * Log in as nico and wait for the dashboard to be visible.
 * Use this in E2E tests that need an authenticated session.
 */
export async function loginAsNico(page: Page): Promise<void> {
  await loginAs(page, 'nico', 'password');
}

/**
 * Log in as athena and wait for the dashboard to be visible.
 * Athena has no active plan set, so she always gets the default plan.
 * Use for tests that run after others to avoid "Plan not found" when the previous
 * test's user (nico) has an active plan that doesn't exist in a fresh browser context.
 */
export async function loginAsAthena(page: Page): Promise<void> {
  await loginAs(page, 'athena', 'password');
}
