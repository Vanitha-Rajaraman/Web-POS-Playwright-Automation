const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const CartPage = require('../pages/CartPage');
const LoginPage = require('../pages/LoginPage');
const { getRuntimeConfig } = require('../utils/runtimeConfig');

const SESSION_STATE_PATH = path.join(__dirname, '..', 'fixtures', 'auth', 'sessionState.json');
const SESSION_STORAGE_PATH = path.join(__dirname, '..', 'fixtures', 'auth', 'sessionStorage.json');
const runtimeConfig = getRuntimeConfig();

test.describe.configure({ mode: 'serial' });

test.describe('Cart Page', () => {
  let context;
  let page;
  let cartPage;
  let loginPage;

  test.beforeAll(async ({ browser }) => {
    if (!fs.existsSync(SESSION_STATE_PATH)) {
      throw new Error('Session state not found. Run tests/login.spec.js first to create the shared login/session state.');
    }

    const sessionStorageData = fs.existsSync(SESSION_STORAGE_PATH)
      ? JSON.parse(fs.readFileSync(SESSION_STORAGE_PATH, 'utf8'))
      : {};

    context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: null,
      storageState: SESSION_STATE_PATH,
    });
    await context.addInitScript(storage => {
      for (const [key, value] of Object.entries(storage)) {
        window.sessionStorage.setItem(key, value);
      }
    }, sessionStorageData);
    page = await context.newPage();
    cartPage = new CartPage(page);
    loginPage = new LoginPage(page);

    await loginPage.goto();

    const loginVisible = await loginPage.loginButton.isVisible().catch(() => false);
    if (loginVisible) {
      throw new Error('Cart opened on the login screen. Saved auth/session state was not enough for this run. Rerun tests/login.spec.js to refresh state.');
    }

    const cartVisible = await cartPage.mobileInput.isVisible().catch(() => false);
    if (!cartVisible) {
      const goToCartVisible = await loginPage.goToCartButton.isVisible().catch(() => false);
      const homeVisible = await loginPage.isRedirectedToHome().catch(() => false);

      if (goToCartVisible) {
        await loginPage.goToCart();
      } else if (homeVisible) {
        await cartPage.openCart();
      }
    }

    await cartPage.assertCartLoaded();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('TC_CART_001 - Cart page is loaded', async () => {
    await cartPage.assertCartLoaded();
  });

  test('TC_CART_002 - Cart flow follows the recorded sequence', async () => {
    await cartPage.runCartSequence({
      customerMobile: runtimeConfig.customer.mobile,
      productKeyword: runtimeConfig.product.keyword,
      quantity: '1000',
      paymentAmount: '1000',
    });
  });

});