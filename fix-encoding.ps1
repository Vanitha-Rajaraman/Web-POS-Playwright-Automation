s# fix-encoding.ps1
# Run this script ONCE from your project root in PowerShell:
#   cd "C:\Users\PalletNow\Playwright Web POS Automation"
#   .\fix-encoding.ps1
#
# This writes all 3 spec files and fixtures/index.js fresh
# with correct UTF-8 (no BOM) encoding — fixes the BOM issue permanently.

Write-Host "Writing files with clean UTF-8 encoding..." -ForegroundColor Cyan

# ── cart.spec.js ─────────────────────────────────────────────────────────────
$cartSpec = @'
const { test, expect } = require('../fixtures');
const testData = require('../data/testData.json');

test.describe('Cart Page', () => {

  test.beforeEach(async ({ sessionPage, cartPage }) => {
    await sessionPage.goto();
    await sessionPage.selectLocation();
    await sessionPage.startSession(testData.session.cashAmount);
    await sessionPage.loginAsManager();
    await sessionPage.goToCart();
    await cartPage.assertCartLoaded();
  });

  test('TC_CART_001 - Cart page is loaded', async ({ cartPage }) => {
    await cartPage.assertCartLoaded();
  });

  test('TC_CART_002 - Customer can be added', async ({ cartPage }) => {
    const { mobile, name } = testData.customer;
    await cartPage.addCustomer(mobile, name);
    await cartPage.assertCartLoaded();
  });

  test('TC_CART_003 - Products panel opens', async ({ cartPage }) => {
    await cartPage.openProducts();
    await cartPage.assertProductsVisible();
  });

  test('TC_CART_004 - Product search returns results', async ({ cartPage }) => {
    await cartPage.openProducts();
    await cartPage.searchProduct(testData.product.keyword);
    await expect(cartPage.addProductBtns.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC_CART_005 - First product added to cart', async ({ cartPage }) => {
    await cartPage.openProducts();
    await cartPage.searchProduct(testData.product.keyword);
    await cartPage.addProductByIndex(0);
    await cartPage.assertCartLoaded();
  });

  test('TC_CART_006 - Quantity can be set for a product', async ({ cartPage }) => {
    await cartPage.openProducts();
    await cartPage.searchProduct(testData.product.keyword);
    await cartPage.addProductByIndex(0);
    await cartPage.setQuantity('5');
    await cartPage.assertCartLoaded();
  });

});
'@

# ── session.spec.js ───────────────────────────────────────────────────────────
$sessionSpec = @'
const { test, expect } = require('../fixtures');
const testData = require('../data/testData.json');

test.describe('Session Page', () => {

  test.beforeEach(async ({ sessionPage }) => {
    await sessionPage.goto();
    await sessionPage.assertLocationsVisible();
  });

  test('TC_SESSION_001 - Locations screen is visible', async ({ sessionPage }) => {
    await sessionPage.assertLocationsVisible();
  });

  test('TC_SESSION_002 - Location can be selected', async ({ sessionPage }) => {
    await sessionPage.selectLocation();
    await sessionPage.assertStartSessionVisible();
  });

  test('TC_SESSION_003 - Session starts with valid cash amount', async ({ sessionPage }) => {
    await sessionPage.selectLocation();
    await sessionPage.startSession(testData.session.cashAmount);
    await sessionPage.assertLoginAsManagerVisible();
  });

  test('TC_SESSION_004 - Login as manager button works', async ({ sessionPage }) => {
    await sessionPage.selectLocation();
    await sessionPage.startSession(testData.session.cashAmount);
    await sessionPage.loginAsManager();
    await sessionPage.assertGoToCartVisible();
  });

  test('TC_SESSION_005 - Go to cart navigates to cart page', async ({ sessionPage, cartPage }) => {
    await sessionPage.selectLocation();
    await sessionPage.startSession(testData.session.cashAmount);
    await sessionPage.loginAsManager();
    await sessionPage.goToCart();
    await cartPage.assertCartLoaded();
  });

});
'@

# ── login.spec.js ─────────────────────────────────────────────────────────────
$loginSpec = @'
const { test, expect } = require('../fixtures');
const testData = require('../data/testData.json');

test.describe('Login Page', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.assertPageLoaded();
  });

  test('TC_LOGIN_001 - Page loads with all elements', async ({ loginPage }) => {
    await loginPage.assertPageLoaded();
  });

  test('TC_LOGIN_002 - Valid login navigates to Locations', async ({ loginPage }) => {
    const { mobile, pin } = testData.users.valid;
    await loginPage.login(mobile, pin);
    await loginPage.assertLoginSuccess();
  });

  test('TC_LOGIN_003 - Wrong PIN stays on login page', async ({ loginPage }) => {
    await loginPage.login(testData.users.valid.mobile, '9999');
    await loginPage.assertStillOnLoginPage();
  });

  test('TC_LOGIN_004 - Page title is not empty', async ({ loginPage }) => {
    const title = await loginPage.getTitle();
    expect(title.length).toBeGreaterThan(0);
  });

});
'@

# ── fixtures/index.js ─────────────────────────────────────────────────────────
$fixturesIndex = @'
const { test: base, expect } = require('@playwright/test');
const LoginPage   = require('../pages/LoginPage');
const SessionPage = require('../pages/SessionPage');
const CartPage    = require('../pages/CartPage');

const test = base.extend({

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  sessionPage: async ({ page }, use) => {
    await use(new SessionPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

});

module.exports = { test, expect };
'@

# Write all files with UTF-8 NO BOM encoding
[System.IO.File]::WriteAllText("$PWD\tests\cart.spec.js",    $cartSpec,      [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText("$PWD\tests\session.spec.js", $sessionSpec,   [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText("$PWD\tests\login.spec.js",   $loginSpec,     [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText("$PWD\fixtures\index.js",     $fixturesIndex, [System.Text.UTF8Encoding]::new($false))

Write-Host "Done! All files written with clean UTF-8 (no BOM)" -ForegroundColor Green
Write-Host ""
Write-Host "Now run:" -ForegroundColor Yellow
Write-Host "  npx playwright test --project=setup" -ForegroundColor White
Write-Host "  npx playwright test --headed" -ForegroundColor White