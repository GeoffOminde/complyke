import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global.setup.ts',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev -- --port 3000',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180_000
  }
})
