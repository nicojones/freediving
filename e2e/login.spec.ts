/**
 * E2E test: login flow.
 * Runs in a real browser against the live app (dev server + backend).
 * Playwright starts both servers via playwright.config.ts webServer.
 */
import { test, expect } from '@playwright/test'

test('user can log in', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('login-username').fill('nico')
  await page.getByTestId('login-password').fill('password')
  await page.getByTestId('login-submit').click()
  // Success = dashboard day list is visible (user is past login)
  await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 5000 })
})
