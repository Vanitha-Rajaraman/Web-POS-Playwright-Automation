const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');
const SessionPage = require('../pages/SessionPage');
const CartPage = require('../pages/CartPage');
const testData = require('../data/testData.json');

const LOGIN_STATE_PATH = path.join(__dirname, '..', 'fixtures', 'auth', 'storageState.json');
const SESSION_STATE_PATH = path.join(__dirname, '..', 'fixtures', 'auth', 'sessionState.json');

test.describe.configure({ mode: 'serial' });

test.describe('POS app flow in one browser and one page', () => {
  let context;
  let page;
  let loginPage;
  let sessionPage;
  let cartPage;

  test.beforeAll(async ({ browser }) => {
    fs.mkdirSync(path.dirname(LOGIN_STATE_PATH), { recursive: true });
    fs.mkdirSync(path.join(__dirname, '..', 'test-results'), { recursive: true });

    context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: null,
    });
    page = await context.newPage();

    loginPage = new LoginPage(page);
    sessionPage = new SessionPage(page);
    cartPage = new CartPage(page);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('TC_LOGIN_001 - Valid login stores auth state', async () => {
    const { mobile, pin } = testData.users.valid;

    await loginPage.goto();
    await loginPage.login(mobile, pin);
    await loginPage.waitForAuthTokens();
    await loginPage.assertLoginSuccess();
    await loginPage.saveStorageState(LOGIN_STATE_PATH);
  });

  test('TC_SESSION_001 - Locations screen is visible', async () => {
    await sessionPage.assertLocationsVisible();
  });

  test('TC_SESSION_002 - Location can be selected', async () => {
    await sessionPage.selectLocation();
    await sessionPage.assertStartSessionVisible();
  });

  test('TC_SESSION_003 - Session starts with valid cash amount', async () => {
    await sessionPage.startSession(testData.session.cashAmount);
    await sessionPage.assertLoginAsManagerVisible();
  });

  test('TC_SESSION_004 - Login as manager button works', async () => {
    await sessionPage.loginAsManager();
    await sessionPage.assertGoToCartVisible();
  });

  test('TC_CART_001 - Cart page is loaded and session state is stored', async () => {
    await sessionPage.goToCart();
    await cartPage.assertCartLoaded();
    await loginPage.waitForAuthTokens();
    await loginPage.saveStorageState(SESSION_STATE_PATH);
  });

  test('TC_CART_002 - Customer can be added', async () => {
    const { mobile, name } = testData.customer;

    await cartPage.addCustomer(mobile, name);
    await cartPage.assertCartLoaded();
  });

  test('TC_CART_003 - Products panel opens', async () => {
    await cartPage.openProducts();
    await cartPage.assertProductsVisible();
  });

  test('TC_CART_004 - Product search returns results', async () => {
    await cartPage.openProducts();
    await cartPage.searchProduct(testData.product.keyword);
    await expect(cartPage.addProductBtns.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC_CART_005 - First product added to cart', async () => {
    await cartPage.openProducts();
    await cartPage.searchProduct(testData.product.keyword);
    await cartPage.addProductByIndex(0);
    await cartPage.assertCartLoaded();
  });

  test('TC_CART_006 - Quantity can be set for a product', async () => {
    await cartPage.openProducts();
    await cartPage.searchProduct(testData.product.keyword);
    await cartPage.addProductByIndex(0);
    await cartPage.setQuantity('5');
    await cartPage.assertCartLoaded();
  });
});
