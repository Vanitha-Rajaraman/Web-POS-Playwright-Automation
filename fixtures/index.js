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