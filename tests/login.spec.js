const { test } = require('../fixtures');
const testData  = require('../data/testData.json');

test.describe('Login Page', () => {

  test('TC_LOGIN_001 - Valid login navigates to Locations', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(testData.users.valid.mobile, testData.users.valid.pin);
    await loginPage.assertLoginSuccess();
  });

});