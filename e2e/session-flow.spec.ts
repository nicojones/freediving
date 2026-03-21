/**
 * E2E test: full session flow from login to completion.
 * Runs in a real browser against the live app (dev server + backend).
 * Playwright starts both servers via playwright.config.ts webServer.
 */
import { test, expect } from '@playwright/test';
import { loginAsAthena, e2eReset } from './helpers/login';

// Session can take ~19s with 100x speed (default plan Day 1); allow 60s total
test.setTimeout(60000);

test.beforeEach(async ({ request }) => {
  await e2eReset(request);
});

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

  // 3. Enable test mode (skips real timers) and set 100x speed
  // Default plan Day 1 is ~31 min real time; at 100x that's ~19s
  await page.getByTestId('test-mode-toggle').click();
  await page.locator('[data-testid="speed-option"][data-testid-value="100"]').click();

  // 4. Start the session
  await page.getByTestId('start-session-button').click();

  // 5. Assert session completes (complete button appears within 30s)
  await expect(page.getByTestId('complete-session-button')).toBeVisible({ timeout: 30000 });
});
