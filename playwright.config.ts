import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // 3 = one worker per domain (grocery/restaurant-dinein/restaurant-qsr).
  // Verified: unbounded local parallelism (this machine defaults to ~6
  // workers off 12 cores) caused every concurrent login against the shared
  // staging account to time out; 3 runs the full suite reliably.
  workers: process.env.CI ? 1 : 3,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github'], ['list']]
    : [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: env.baseUrl,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  // No "setup" project / shared storageState: every domain (grocery,
  // restaurant-dinein, restaurant-qsr) logs in independently within its own
  // test, so projects have nothing to wait on and run fully in parallel.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
