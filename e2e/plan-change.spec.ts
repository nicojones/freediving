/**
 * E2E test: plan change flow.
 */
import { test, expect } from '@playwright/test';
import { loginAsNico } from './helpers/login';

test('user can change plan', async ({ page }) => {
  await loginAsNico(page);

  await page.getByRole('button', { name: /plans/i }).click();
  await page.waitForURL(/\/plans/);
  const planSelector = page.getByTestId('plan-selector');
  await expect(planSelector).toBeVisible({ timeout: 5000 });
  const options = await planSelector.locator('option').allTextContents();
  if (options.length > 1) {
    await planSelector.selectOption({ index: 1 });
    await page.getByTestId('confirm-reset-input').fill('reset');
    await page.getByTestId('confirm-reset-confirm').click();
    await expect(page.getByTestId('confirm-reset-input')).not.toBeVisible();
  }
});
