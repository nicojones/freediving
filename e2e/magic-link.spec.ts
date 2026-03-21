/**
 * E2E tests for magic link sign-up flow.
 * Requires NODE_ENV=test and no BREVO_API_KEY so the email module captures the link.
 */
import { test, expect } from '@playwright/test';

test.describe('magic link flow', () => {
  test('request link shows success state, try again resets form', async ({ page }) => {
    await page.route('**/api/auth/request-magic-link', async (route) => {
      await route.fulfill({ status: 200, json: { message: 'Check your email' } });
    });
    await page.goto('/login');
    await page.getByTestId('login-email').fill('success-test@example.com');
    await page.getByTestId('login-send-link').click();
    await expect(page.getByTestId('login-success')).toContainText(
      'Check the inbox for success-test@example.com',
      { timeout: 10000 }
    );
    await expect(page.getByTestId('login-email')).not.toBeVisible();
    await page.getByTestId('login-try-again').click();
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-email')).toHaveValue('success-test@example.com');
  });

  test('request link shows success, then verify logs user in', async ({ page, request }) => {
    const res = await request.post('/api/auth/test-create-magic-link', {
      data: { email: 'magic-test@example.com' },
    });
    if (!res.ok()) {
      const text = await res.text();
      throw new Error(`test-create-magic-link failed ${res.status()}: ${text}`);
    }
    const { url } = await res.json();
    expect(url).toBeTruthy();

    await page.goto(url);
    await page.getByTestId('dashboard-day-list').waitFor({ state: 'visible', timeout: 15000 });
  });
});

test.describe('e2e session (no login UI)', () => {
  test('e2e-set-session logs nico in and shows dashboard', async ({ page }) => {
    await page.goto('/api/auth/e2e-set-session?username=nico');
    await page.getByTestId('dashboard-day-list').waitFor({ state: 'visible', timeout: 20000 });
  });

  test('e2e-set-session rejects invalid username', async ({ request }) => {
    const res = await request.get('/api/auth/e2e-set-session?username=baduser');
    expect(res.status()).toBe(400);
  });
});

test.describe('verify error redirect', () => {
  test('expired token redirect shows error message', async ({ page }) => {
    await page.goto('/login?error=expired');
    await expect(page.getByText('Link expired or already used')).toBeVisible({ timeout: 5000 });
  });

  test('missing token redirect shows error message', async ({ page }) => {
    await page.goto('/login?error=missing');
    await expect(page.getByText('Invalid link')).toBeVisible({ timeout: 5000 });
  });
});
