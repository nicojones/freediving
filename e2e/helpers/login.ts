import type { Page } from '@playwright/test';

/** Default timeout for post-login dashboard to appear (plan loading can take a few seconds). */
export const DASHBOARD_TIMEOUT = 20000;

const loginAs = async (page: Page, username: 'nico' | 'athena'): Promise<void> => {
  await page.goto(`/api/auth/e2e-set-session?username=${username}`);
  await page.waitForLoadState('networkidle');
  await page
    .getByTestId('dashboard-day-list')
    .waitFor({ state: 'visible', timeout: DASHBOARD_TIMEOUT });
};

/**
 * Log in as nico and wait for the dashboard to be visible.
 * Uses E2E-only session endpoint (no login UI).
 */
export const loginAsNico = async (page: Page): Promise<void> => {
  await loginAs(page, 'nico');
};

/**
 * Log in as athena and wait for the dashboard to be visible.
 * Athena has no active plan set, so she always gets the default plan.
 * Use for tests that run after others to avoid "Plan not found" when the previous
 * test's user (nico) has an active plan that doesn't exist in a fresh browser context.
 */
export const loginAsAthena = async (page: Page): Promise<void> => {
  await loginAs(page, 'athena');
};

/**
 * Reset E2E test accounts (nico, athena) to clean state.
 * Call in globalSetup or beforeAll to clear progress, active plan, and user-created plans.
 */
export const e2eReset = async (
  request: import('@playwright/test').APIRequestContext
): Promise<void> => {
  await request.post('/api/auth/e2e-reset');
};
