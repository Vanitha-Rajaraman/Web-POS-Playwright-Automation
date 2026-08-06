import { test, expect } from '@fixtures/restaurant-qsr';
import { env } from '@config/env';
import { verifyLoginAgainstApi } from '@utils/apiValidation';
import { logger } from '@utils/logger';

test.describe('Restaurant (QSR): login and onboarding', () => {
  test('logs in, completes onboarding, and matches the API-reported identity', async (
    { page, loginPage, orgLocSelectionPage, sessionStartPage },
    testInfo
  ) => {
    await test.step('Log in', async () => {
      logger.info(`Logging in as ${env.mobileNumber}`);
      await loginPage.goto();
      await loginPage.login(env.mobileNumber, env.pin);
    });

    await test.step('Select organization and location', async () => {
      logger.info(`Selecting org "${env.restaurantOrgName}" / location "${env.qsrLocationName}"`);
      await orgLocSelectionPage.selectOrgAndLocation(env.restaurantOrgName, env.qsrLocationName);
    });

    await test.step('Select POS access mode, proceed to session (Start Day if needed)', async () => {
      await sessionStartPage.proceedToSession();
    });

    await test.step('Verify terminal picker shows the selected org/location', async () => {
      await expect(sessionStartPage.title).toHaveText('Start session');
      await expect(sessionStartPage.organizationCrumb).toHaveText(env.restaurantOrgName);
      await expect(sessionStartPage.locationCrumb).toContainText(env.qsrLocationName);
      logger.info(`Reached "Start session" for ${env.restaurantOrgName} / ${env.qsrLocationName}`);
    });

    await test.step('Verify UI identity against API', async () => {
      await verifyLoginAgainstApi(testInfo, page, env.mobileNumber, env.pin, {
        orgName: env.restaurantOrgName,
        locationName: env.qsrLocationName,
      });
    });
  });
});
