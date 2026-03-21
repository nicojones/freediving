/**
 * E2E test: full session flow from login to completion.
 * Runs in a real browser against the live app (dev server + backend).
 * Playwright starts both servers via playwright.config.ts webServer.
 */
import { test, expect } from '@playwright/test';
import { loginAsAthena } from './helpers/login';

// Session can take ~60s with 10x speed; allow up to 90s for flakiness
test.setTimeout(90000);

test('user can complete a session with test mode', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('freediving_dev_mode', 'true');
  });
  await loginAsAthena(page);

  // 2. Open session preview for current training day (avoids rest/completed days)
  await page
    .getByRole('button', { name: /Start Session/i })
    .first()
    .click();

  // 3. Enable test mode (skips real timers) and set 10x speed
  await page.getByTestId('test-mode-toggle').click();
  await page.locator('[data-testid="speed-option"][data-testid-value="10"]').click();

  // 4. Start the session
  await page.getByTestId('start-session-button').click();

  // 5. Assert session completes (complete button appears within 60s)
  await expect(page.getByTestId('complete-session-button')).toBeVisible({ timeout: 60000 });
});
