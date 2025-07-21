import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: '66%',
  reporter: 'dot',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
