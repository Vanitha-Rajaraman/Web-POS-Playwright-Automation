const { test: base, expect } = require('@playwright/test');
const LoginPage   = require('../pages/LoginPage');
const CartPage    = require('../pages/CartPage');

const test = base.extend({

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

});

module.exports = { test, expect };
