/**
 * E2E test: reset progress flow.
 *
 * Reset progress is available in the plan context menu on the Plans tab.
 * User-created plans show the menu; bundled plans do not. We create a plan
 * and switch to it so the active plan has the context menu.
 */
import { test, expect } from '@playwright/test';
import { loginAsAthena } from './helpers/login';

const RESET_PLAN = {
  id: 'e2e-reset-plan',
  name: 'E2E Reset Plan',
  description: 'Plan for reset test',
  days: [
    {
      id: 'e2erst1',
      day: 1,
      phases: [
        { type: 'hold' as const, duration: 6 },
        { type: 'recovery' as const, duration: 12 },
      ],
    },
  ],
};

test('user can reset progress', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await loginAsAthena(page);

  // Create a user plan and switch to it (bundled plans have no context menu)
  await page.getByTestId('nav-create').click();
  await page.waitForURL(/\/create/);
  await page.getByTestId('create-plan-tab-paste').click();
  await page.evaluate(
    async (json) => {
      await navigator.clipboard.writeText(json);
    },
    JSON.stringify(RESET_PLAN, null, 2)
  );
  await page.getByTestId('create-plan-paste-button').click();
  await page.getByTestId('create-plan-create-button').click();
  await expect(page.getByTestId('create-plan-success')).toBeVisible({ timeout: 5000 });

  await page.getByTestId('nav-plans').click();
  await page.waitForURL(/\/plans/);
  await page.locator(`[data-plan-name="${RESET_PLAN.name}"]`).click();
  await page.getByTestId('confirm-switch-plan-confirm').click();
  await page.getByTestId('confirm-switch-plan-modal').waitFor({ state: 'detached' });

  // Active plan is now user-created; open menu and reset
  await page.getByTestId('active-plan-box').locator('[data-testid^="plan-menu-"]').click();
  await page.getByTestId('reset-progress-button').click();
  await page.getByTestId('confirm-reset-input').fill('reset');
  await page.getByTestId('confirm-reset-confirm').click();

  await expect(page.getByTestId('confirm-reset-input')).not.toBeVisible();
  await page.getByTestId('nav-training').click();
  await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 10000 });
});
