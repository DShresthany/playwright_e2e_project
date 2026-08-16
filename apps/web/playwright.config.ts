import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
    channel: 'chrome',
  },
  projects: [
    {
      name: 'setup',
      testDir: './e2e/setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'unauthenticated',
      testMatch: /auth\/.*|catalog\/catalog\.spec\.ts/,
    },
    {
      name: 'authenticated',      
      testDir: './e2e/tests',
      testIgnore: /auth\/.*|catalog\/catalog\.spec\.ts/,
      dependencies: ['setup'],
      workers: 1,
      use: {
        storageState: 'e2e/.auth/standard.json',
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm run dev:worker',
      url: 'http://localhost:8787',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});

