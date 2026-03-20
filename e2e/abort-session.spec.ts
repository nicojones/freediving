/**
 * E2E test: abort session flow.
 */
import { test, expect } from '@playwright/test'
import { loginAsNico } from './helpers/login'

test.setTimeout(60000)

test('user can abort session', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('freediving_dev_mode', 'true')
  })
  await loginAsNico(page)

  const firstDay = page.locator('[data-testid^="day-card-"]').first()
  await firstDay.click()
  await page.getByTestId('test-mode-toggle').click()
  await page.locator('[data-testid="speed-option"][data-testid-value="10"]').click()
  await page.getByTestId('start-session-button').click()

  await expect(page.getByTestId('abort-session-button')).toBeVisible({ timeout: 5000 })
  await page.getByTestId('abort-session-button').click()

  await expect(page.getByTestId('start-session-button')).toBeVisible({ timeout: 5000 })
})
