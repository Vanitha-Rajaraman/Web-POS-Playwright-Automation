const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const LoginPage = require('../pages/LoginPage');
const CartPage = require('../pages/CartPage');

async function globalSetup() {
  const LOGIN_STATE_PATH = path.join(__dirname, 'auth', 'storageState.json');
  const CART_STATE_PATH = path.join(__dirname, 'auth', 'sessionState.json');
  fs.mkdirSync(path.dirname(LOGIN_STATE_PATH), { recursive: true });
  fs.mkdirSync('test-results', { recursive: true });

  const isLoginRun = process.argv.some(arg => arg.includes('login.spec'));
  const isSessionRun = process.argv.some(arg => arg.includes('session.spec'));
  const isCartRun = process.argv.some(arg => arg.includes('cart.spec'));
  const hasLoginState = fs.existsSync(LOGIN_STATE_PATH);
  const hasCartState = fs.existsSync(CART_STATE_PATH);

  if (isLoginRun && !isSessionRun && !isCartRun) {
    console.log('[Setup] Skipping - login tests do not need storage state');
    return;
  }

  // Reuse saved auth/session state for direct session/cart runs so
  // only the actual test browser opens in headed mode.
  if (isSessionRun && !isCartRun && hasLoginState) {
    console.log('[Setup] Skipping - reusing existing login storage state for session tests');
    return;
  }

  if (isCartRun && !isSessionRun && hasCartState) {
    console.log('[Setup] Skipping - reusing existing session storage state for cart tests');
    return;
  }

  if (isSessionRun && isCartRun && hasLoginState && hasCartState) {
    console.log('[Setup] Skipping - reusing existing saved states for session/cart tests');
    return;
  }

  const isHeaded =
    process.env.HEADLESS === 'false' ||
    process.env.PLAYWRIGHT_HEADLESS === 'false' ||
    process.argv.includes('--headed');

  const browser = await chromium.launch({
    headless: !isHeaded,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const loginPage = new LoginPage(page);
  const cartPage = new CartPage(page);

  try {
    await loginPage.goto();
    await loginPage.login('8531821606', '1111');
    await loginPage.assertLoginSuccess();

    await context.storageState({ path: LOGIN_STATE_PATH });

    await loginPage.selectLocation();
    await loginPage.startSession('1000');
    await loginPage.loginAsManager();
    await loginPage.goToCart();
    await cartPage.assertCartLoaded();

    await context.storageState({ path: CART_STATE_PATH });
  } catch (err) {
    try {
      if (!page.isClosed()) {
        await page.screenshot({ path: 'test-results/setup-failure.png', fullPage: true });
      }
    } catch (screenshotErr) {
      console.warn('[Setup] Screenshot failed:', screenshotErr.message);
    }
    console.error('[Setup] Flow failed:', err.message);
    throw err;
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;
