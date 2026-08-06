import { test, expect } from '@fixtures/grocery';
import { env } from '@config/env';
import { verifyLoginAgainstApi } from '@utils/apiValidation';
import { logger } from '@utils/logger';

test.describe('Grocery: login and onboarding', () => {
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
      logger.info(`Selecting org "${env.orgName}" / location "${env.locationName}"`);
      await orgLocSelectionPage.selectOrgAndLocation(env.orgName, env.locationName);
    });

    await test.step('Proceed to session (Start Day if needed)', async () => {
      await sessionStartPage.proceedToSession();
    });

    await test.step('Verify terminal picker shows the selected org/location', async () => {
      await expect(sessionStartPage.title).toHaveText('Start session');
      await expect(sessionStartPage.organizationCrumb).toHaveText(env.orgName);
      await expect(sessionStartPage.locationCrumb).toContainText(env.locationName);
      logger.info(`Reached "Start session" for ${env.orgName} / ${env.locationName}`);
    });

    await test.step('Verify UI identity against API', async () => {
      await verifyLoginAgainstApi(testInfo, page, env.mobileNumber, env.pin, {
        orgName: env.orgName,
        locationName: env.locationName,
      });
    });
  });
});
