import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env.js';

export default defineConfig({
  testDir: './tests',
  // One worker runs each browser/domain project. Tests inside a domain remain serial
  // so that they can share one login and finish with one logout.
  fullyParallel: false,
  workers: 9,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github'], ['list']]
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: env.baseUrl,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  // Cached storageState cannot reliably resume this SPA's onboarding.
  // Ordered domain suites share one page from login through final logout.
  projects: [
    ...[
      ['chromium', devices['Desktop Chrome']],
      ['firefox', devices['Desktop Firefox']],
      ['webkit', devices['Desktop Safari']],
    ].flatMap(([browserName, device]) => [
      {
        name: `${browserName}-grocery`,
        testMatch: '**/suites/*.spec.js',
        grep: /@grocery/,
        use: { ...device },
      },
      {
        name: `${browserName}-dinein`,
        testMatch: '**/suites/*.spec.js',
        grep: /@dinein/,
        use: { ...device },
      },
      {
        name: `${browserName}-qsr`,
        testMatch: '**/suites/*.spec.js',
        grep: /@qsr/,
        use: { ...device },
      },
    ]),
    {
      name: 'parallel-tabs',
      testMatch: '**/parallel/*.spec.js',
      use: { ...devices['Desktop Chrome'] },
      outputDir: 'test-results/parallel',
    },
    {
      name: 'auth',
      testMatch: '**/auth/*.spec.js',
      use: { ...devices['Desktop Chrome'] },
      outputDir: 'test-results/auth',
    },
    {
      name: 'framework',
      testMatch: '**/framework/*.spec.js',
      outputDir: 'test-results/framework',
    },
  ],
});
