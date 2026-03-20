import { defineConfig } from '@playwright/test'

const E2E_PORT = '3098'

export default defineConfig({
  testDir: 'e2e',
  workers: 1,
  webServer: {
    command: `npx next dev -p ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}/api/auth/me`,
    env: {
      FREEDIVING_DB_PATH: ':memory:',
      NODE_ENV: 'test',
    },
    timeout: 90000,
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: `http://localhost:${E2E_PORT}` },
})
