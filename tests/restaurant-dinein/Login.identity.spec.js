import { test } from '../../src/fixtures/domainSession.js';
import { env } from '../../src/config/env.js';
import { verifyLoginAgainstApi } from '../../src/utils/apiValidation.js';

export function registerTests() {
  test.describe('restaurant-dinein: shared login', () => {
    test('verifies the shared login and API identity', async ({ page }, testInfo) => {
      await verifyLoginAgainstApi(testInfo, page, env.mobileNumber, env.pin, {
        orgName: env.restaurantOrgName, locationName: env.dineInLocationName,
      });
    });
  });

}
