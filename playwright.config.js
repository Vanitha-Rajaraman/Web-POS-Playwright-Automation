const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000,
  retries: 0,
  workers: 1,                         // 1 worker = single browser worker
  globalSetup: require.resolve('./fixtures/global.setup.js'),
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'reports/html' }],
  ],
  use: {
    baseURL: 'https://upcoming-pos.palletnow.co/',
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
      name: 'login',
      testMatch: /login\.spec\.js/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: null,  // maximize
        deviceScaleFactor: undefined,
        storageState: undefined 
      },
    },
    {
      name: 'session',
      testMatch: /session\.spec\.js/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: null,  // maximize
        deviceScaleFactor: undefined,
        storageState: path.join(__dirname, 'fixtures', 'auth', 'storageState.json') 
      },
    },
    {
      name: 'cart',
      testMatch: /cart\.spec\.js/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: null,  // maximize
        deviceScaleFactor: undefined,
        storageState: path.join(__dirname, 'fixtures', 'auth', 'sessionState.json') 
      },
    },
  ],
});