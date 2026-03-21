/**
 * E2E test: creator attribution for public plans.
 * Logged-in user sees default plan "4:00 Dry Breathhold" with "Created by Fishly".
 */
import { test, expect } from '@playwright/test';
import { loginAsAthena, e2eReset } from './helpers/login';

test.beforeEach(async ({ request }) => {
  await e2eReset(request);
});

test('logged-in user sees default plan with creator attribution in Plans tab', async ({ page }) => {
  await loginAsAthena(page);

  await page.getByTestId('nav-plans').click();
  await page.waitForURL(/\/plans/);

  await expect(page.getByTestId('plan-selector')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('4:00 Dry Breathhold')).toBeVisible();
  await expect(page.getByTestId('active-plan-creator')).toHaveText('Created by Fishly');
});

test('logged-in user sees creator attribution on Dashboard', async ({ page }) => {
  await loginAsAthena(page);

  await expect(page.getByTestId('plan-name')).toHaveText('4:00 Dry Breathhold', {
    timeout: 5000,
  });
  await expect(page.getByTestId('dashboard-plan-creator')).toHaveText('Created by Fishly');
});
