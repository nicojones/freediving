import { defineConfig } from '@playwright/test'

const E2E_BACKEND_PORT = '3099'
const E2E_FRONTEND_PORT = '5174'

export default defineConfig({
  testDir: 'e2e',
  webServer: [
    {
      command: 'npm run server',
      url: `http://localhost:${E2E_BACKEND_PORT}/api/auth/me`,
      env: {
        FREEDIVING_DB_PATH: ':memory:',
        PORT: E2E_BACKEND_PORT,
        NODE_ENV: 'test',
      },
      timeout: 15000,
    },
    {
      command: 'npm run dev',
      url: `http://localhost:${E2E_FRONTEND_PORT}`,
      env: {
        PORT: E2E_FRONTEND_PORT,
        VITE_API_PORT: E2E_BACKEND_PORT,
      },
      timeout: 60000,
    },
  ],
  use: { baseURL: `http://localhost:${E2E_FRONTEND_PORT}` },
})
