/**
 * E2E test: plan change flow.
 */
import { test, expect } from '@playwright/test'

test('user can change plan', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('login-username').fill('nico')
  await page.getByTestId('login-password').fill('password')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 5000 })

  await page.getByRole('button', { name: /settings/i }).click()
  await page.waitForURL(/\/settings/)
  const planSelector = page.getByTestId('plan-selector')
  await expect(planSelector).toBeVisible({ timeout: 5000 })
  const options = await planSelector.locator('option').allTextContents()
  if (options.length > 1) {
    await planSelector.selectOption({ index: 1 })
    await page.getByTestId('confirm-reset-input').fill('reset')
    await page.getByTestId('confirm-reset-confirm').click()
    await expect(page.getByTestId('confirm-reset-input')).not.toBeVisible()
  }
})
