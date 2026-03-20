/**
 * E2E test: full session flow from login to completion.
 * Runs in a real browser against the live app (dev server + backend).
 * Playwright starts both servers via playwright.config.ts webServer.
 */
import { test, expect } from '@playwright/test'

// Session can take ~60s with 10x speed; allow up to 90s for flakiness
test.setTimeout(90000)

test('user can complete a session with test mode', async ({ page }) => {
  // 1. Login
  await page.goto('/')
  await page.getByTestId('login-username').fill('nico')
  await page.getByTestId('login-password').fill('password')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 5000 })

  // 2. Pick a day and open session preview
  const firstDayCard = page.locator('[data-testi/d^="day-card-"]').first()
  await firstDayCard.click()

  // 3. Enable test mode (skips real timers) and set 10x speed
  await page.getByTestId('test-mode-toggle').click()
  await page.locator('[data-testid="speed-option"][data-testid-value="10"]').click()

  // 4. Start the session
  await page.getByTestId('start-session-button').click()

  // 5. Assert session completes (complete button appears within 60s)
  await expect(page.getByTestId('complete-session-button')).toBeVisible({ timeout: 60000 })
})
