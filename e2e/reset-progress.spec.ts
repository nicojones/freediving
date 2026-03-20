/**
 * E2E test: reset progress flow.
 */
import { test, expect } from '@playwright/test'

test('user can reset progress', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('login-username').fill('nico')
  await page.getByTestId('login-password').fill('password')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 5000 })

  await page.getByRole('button', { name: /settings/i }).click()
  await page.getByTestId('reset-progress-button').click()
  await page.getByTestId('confirm-reset-input').fill('reset')
  await page.getByTestId('confirm-reset-confirm').click()

  await expect(page.getByTestId('confirm-reset-input')).not.toBeVisible()
  await page.getByRole('button', { name: /training/i }).click()
  await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 3000 })
})
