const fs = require('fs');
const path = require('path');
const { test } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');
const CartPage = require('../pages/CartPage');
const { getRuntimeConfig } = require('../utils/runtimeConfig');

const LOGIN_STATE_PATH = path.join(__dirname, '..', 'fixtures', 'auth', 'storageState.json');
const SESSION_STATE_PATH = path.join(__dirname, '..', 'fixtures', 'auth', 'sessionState.json');
const SESSION_STORAGE_PATH = path.join(__dirname, '..', 'fixtures', 'auth', 'sessionStorage.json');
const runtimeConfig = getRuntimeConfig();
const mockUsbChooser = () => {
  const makeAbortError = () => {
    try {
      return new DOMException('User cancelled the requestDevice() chooser.', 'NotFoundError');
    } catch {
      const error = new Error('User cancelled the requestDevice() chooser.');
      error.name = 'NotFoundError';
      return error;
    }
  };

  const stub = async () => {
    throw makeAbortError();
  };

  if (!('usb' in navigator) || !navigator.usb) {
    Object.defineProperty(navigator, 'usb', {
      configurable: true,
      value: {
        requestDevice: stub,
        getDevices: async () => [],
      },
    });
    return;
  }

  navigator.usb.requestDevice = stub;
  if (!navigator.usb.getDevices) {
    navigator.usb.getDevices = async () => [];
  }
};

test.describe.configure({ mode: 'serial' });

test.describe('Login And Session Setup', () => {
  let context;
  let page;
  let loginPage;
  let cartPage;

  test.beforeAll(async ({ browser }) => {
    fs.mkdirSync(path.dirname(LOGIN_STATE_PATH), { recursive: true });
    context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: null,
    });
    await context.addInitScript(mockUsbChooser);
    page = await context.newPage();
    loginPage = new LoginPage(page);
    cartPage = new CartPage(page);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('TC_LOGIN_SESSION_001 - Login and session setup stores reusable state', async () => {
    const { mobile, pin } = runtimeConfig.user;

    await test.step('Login stores AT and RT', async () => {
      await loginPage.goto();
      await loginPage.login(mobile, pin);
      await loginPage.waitForAuthTokens();
      await loginPage.assertLoginSuccess();
      await loginPage.saveStorageState(LOGIN_STATE_PATH);
    });

    await test.step('Session setup continues on the same page', async () => {
      await loginPage.assertLocationsVisible();
      const locationOutcome = await loginPage.selectLocation();

      if (locationOutcome === 'home') {
        await loginPage.assertHomeGreetingVisible();
        // await cartPage.openCart();
        // await cartPage.assertCartLoaded();
      } else {
        await loginPage.assertStartSessionVisible();
        await loginPage.startSession(runtimeConfig.session.cashAmount);
        await loginPage.assertLoginAsManagerVisible();
        await loginPage.loginAsManager();
        await loginPage.assertGoToCartVisible();
        await loginPage.goToCart();
        await cartPage.assertCartLoaded();
      }

      await loginPage.waitForAuthTokens();
      await loginPage.saveStorageState(SESSION_STATE_PATH);
      await loginPage.saveSessionStorage(SESSION_STORAGE_PATH);
    });
  });
});
