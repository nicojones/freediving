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
  const options = page.getByTestId('plan-selector-option');
  const optionCount = await options.count();
  if (optionCount > 1) {
    const firstOption = options.nth(0);
    const secondOption = options.nth(1);
    const firstIsActive = await firstOption.evaluate((el) =>
      el.classList.contains('bg-primary/10')
    );
    const toSwitch = firstIsActive ? secondOption : firstOption;
    await toSwitch.click();
    await page.getByTestId('confirm-switch-plan-confirm').click();
    await page.getByTestId('confirm-switch-plan-modal').waitFor({ state: 'detached' });
  }
});

test.setTimeout(90000);

test('progress is preserved when switching plans', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('freediving_dev_mode', 'true');
  });
  await loginAsAthena(page);

  // Complete a day in plan A (default)
  const firstDayCard = page.locator('[data-testid^="day-card-"]').first();
  await firstDayCard.click();
  await page.getByTestId('test-mode-toggle').click();
  await page.locator('[data-testid="speed-option"][data-testid-value="100"]').click();
  await page.getByTestId('start-session-button').click();
  await expect(page.getByTestId('complete-session-button')).toBeVisible({ timeout: 60000 });
  await page.getByTestId('complete-session-button').click();
  await page.waitForURL(/\/session\/complete/);

  // Go to Plans, switch to plan B, then back to plan A
  await page.getByTestId('nav-plans').click();
  await page.waitForURL(/\/plans/);
  const options = page.getByTestId('plan-selector-option');
  const optionCount = await options.count();
  if (optionCount > 1) {
    // Switch to a different plan (nth(0)); if it's the active one, use nth(1)
    const firstOption = options.nth(0);
    const secondOption = options.nth(1);
    const firstIsActive = await firstOption.evaluate((el) =>
      el.classList.contains('bg-primary/10')
    );
    const toPlanB = firstIsActive ? secondOption : firstOption;
    await toPlanB.click();
    await page.getByTestId('confirm-switch-plan-confirm').click();
    await page.getByTestId('confirm-switch-plan-modal').waitFor({ state: 'detached' });
    // Switch back to plan A (the one we completed - has "1/" in progress, e.g. "1/1 days")
    const planAOption = page
      .getByTestId('plan-selector-option')
      .filter({ has: page.locator('[data-testid^="plan-progress-"]').filter({ hasText: /^1\// }) })
      .first();
    await expect(planAOption).toBeVisible({ timeout: 15000 });
    await planAOption.click();
    await page.getByTestId('confirm-switch-plan-confirm').click();
    await page.getByTestId('confirm-switch-plan-modal').waitFor({ state: 'detached' });
  }

  // Back to dashboard: completed day should still be shown as done
  await page.getByTestId('nav-training').click();
  await page.waitForURL(/\/(day\/[^/]+)?$/);
  // If we landed on session preview (day view), click Back to reach day list
  const backBtn = page.getByTestId('back-button');
  if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await backBtn.click();
  }
  await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Done')).toBeVisible();
});
