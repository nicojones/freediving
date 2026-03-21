/**
 * E2E test: plan change flow.
 */
import { test, expect } from '@playwright/test';
import { loginAsAthena } from './helpers/login';

test('user can change plan', async ({ page }) => {
  await loginAsAthena(page);

  await page.getByTestId('nav-plans').click();
  await page.waitForURL(/\/plans/);
  const planSelector = page.getByTestId('plan-selector');
  await expect(planSelector).toBeVisible({ timeout: 5000 });
  const optionCount = await page.getByTestId('plan-selector-option').count();
  if (optionCount > 1) {
    await page.getByTestId('plan-selector-option').nth(1).click();
    await page.getByTestId('confirm-reset-input').fill('reset');
    await page.getByTestId('confirm-reset-confirm').click();
    await expect(page.getByTestId('confirm-reset-input')).not.toBeVisible();
  }
});
