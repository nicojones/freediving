import { defineConfig } from '@playwright/test';

const E2E_PORT = '3098';

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  workers: process.env.CI ? 1 : 4,
  timeout: 60000,
  webServer: {
    command: `npx next dev -p ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}/api/auth/me`,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      APP_URL: `http://localhost:${E2E_PORT}`,
      BREVO_API_KEY: '', // Unset so magic link is captured for E2E
      E2E_MAGIC_LINK_ENABLED: '1', // Enable test-create-magic-link route
    },
    timeout: 90000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    permissions: ['clipboard-read', 'clipboard-write'],
  },
});
