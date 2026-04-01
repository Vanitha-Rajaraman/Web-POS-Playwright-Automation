const { test } = require('../fixtures');
const testData = require('../data/testData.json');

test.describe('Session Page', () => {
  test('Session workflow - all 4 steps in single browser and single page', async ({ sessionPage, loginPage }) => {
    await sessionPage.goto();

    const locationsVisible = await sessionPage.locationsHeading.isVisible().catch(() => false);
    if (!locationsVisible) {
      const { mobile, pin } = testData.users.valid;
      await loginPage.goto();
      await loginPage.login(mobile, pin);
      await loginPage.assertLoginSuccess();
    }

    await test.step('TC_SESSION_001 - Locations screen is visible', async () => {
      await sessionPage.assertLocationsVisible();
    });

    await test.step('TC_SESSION_002 - Location can be selected', async () => {
      await sessionPage.selectLocation();
      await sessionPage.assertStartSessionVisible();
    });

    await test.step('TC_SESSION_003 - Session starts with valid cash amount', async () => {
      await sessionPage.startSession(testData.session.cashAmount);
      await sessionPage.assertLoginAsManagerVisible();
    });

    await test.step('TC_SESSION_004 - Login as manager button works', async () => {
      await sessionPage.loginAsManager();
      await sessionPage.assertGoToCartVisible();
    });
  });
});
