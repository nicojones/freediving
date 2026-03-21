/**
 * Runs before all E2E tests. Resets nico/athena accounts to clean state.
 */
import type { FullConfig } from '@playwright/test';

const E2E_PORT = process.env.E2E_PORT || '3098';
const BASE_URL = `http://localhost:${E2E_PORT}`;

export default async function globalSetup(_config: FullConfig) {
  try {
    await fetch(`${BASE_URL}/api/auth/e2e-reset`, { method: 'POST' });
  } catch {
    // Server may not be ready yet; webServer starts before globalSetup
    // Retry once after a short delay
    await new Promise((r) => setTimeout(r, 2000));
    await fetch(`${BASE_URL}/api/auth/e2e-reset`, { method: 'POST' });
  }
}
