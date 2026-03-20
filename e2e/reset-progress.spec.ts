/**
 * E2E test: reset progress flow.
 */
import { test, expect } from '@playwright/test';
import { loginAsNico } from './helpers/login';

test('user can reset progress', async ({ page }) => {
  await loginAsNico(page);

  await page.getByRole('button', { name: /settings/i }).click();
  await page.getByTestId('reset-progress-button').click();
  await page.getByTestId('confirm-reset-input').fill('reset');
  await page.getByTestId('confirm-reset-confirm').click();

  await expect(page.getByTestId('confirm-reset-input')).not.toBeVisible();
  await page.getByTestId('nav-training').click();
  await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 10000 });
});
