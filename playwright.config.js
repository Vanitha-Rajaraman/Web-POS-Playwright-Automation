const { defineConfig, devices } = require('@playwright/test');
const { getRuntimeConfig } = require('./utils/runtimeConfig');

const runtimeConfig = getRuntimeConfig();

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000,
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'reports/html' }],
  ],
  use: {
    baseURL: runtimeConfig.baseURL,
    headless: true,
    viewport: null,  // null = remove viewport limit, use screen size (maximized)
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: null,
        deviceScaleFactor: undefined,
      },
    },
  ],
});
