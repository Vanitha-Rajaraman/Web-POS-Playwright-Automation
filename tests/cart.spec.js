const { test, expect } = require('../fixtures');
const testData = require('../data/testData.json');

test.describe('Cart Page', () => {

  test.beforeEach(async ({ sessionPage, cartPage, loginPage }) => {
    await sessionPage.goto();

    const locationsVisible = await sessionPage.locationsHeading.isVisible().catch(() => false);
    if (!locationsVisible) {
      const { mobile, pin } = testData.users.valid;
      await loginPage.goto();
      await loginPage.login(mobile, pin);
      await loginPage.assertLoginSuccess();
    }

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