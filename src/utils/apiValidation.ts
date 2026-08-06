import { Page, TestInfo, expect } from '@playwright/test';
import { AuthApi, RetailUser } from '@api/endpoints/authApi';
import { createAuthenticatedApiContext } from '@api/apiClient';
import { logger } from './logger';

interface UiSnapshot {
  orgName: string;
  locationName: string;
}

/**
 * Cross-checks the identity the UI just authenticated as against what the
 * backend independently reports for the same mobile+PIN — authenticated
 * with tokens pulled from `page`'s own browser context (the same one that
 * just logged in), not a shared/cached session. Captures the comparison and
 * the raw API response as report attachments, and logs to the console so
 * both the terminal (live, while the test runs) and the HTML report's
 * stdout section show it.
 *
 * The retail/user API doesn't return org/location names (only internal
 * org_id codes), so those are recorded here for visibility but only account
 * identity (mobile number, roles) is actually asserted against the API.
 */
export async function verifyLoginAgainstApi(
  testInfo: TestInfo,
  page: Page,
  mobileNumber: string,
  pin: string,
  ui: UiSnapshot
): Promise<RetailUser> {
  const apiRequestContext = await createAuthenticatedApiContext(page.context());
  const authApi = new AuthApi(apiRequestContext);

  let retailUser: RetailUser;
  try {
    retailUser = await authApi.getRetailUser(mobileNumber, pin);
  } finally {
    await apiRequestContext.dispose();
  }

  const comparison = {
    ui: { orgName: ui.orgName, locationName: ui.locationName, mobileNumber },
    api: {
      mobileNumber: retailUser.mobileNumber,
      roles: retailUser.roles,
      uidx: retailUser.uidx,
      email: retailUser.email,
    },
  };

  logger.info('UI vs API identity check', comparison);

  await testInfo.attach('UI vs API - identity check', {
    body: JSON.stringify(comparison, null, 2),
    contentType: 'application/json',
  });
  await testInfo.attach('API - raw retail/user response', {
    body: JSON.stringify(retailUser, null, 2),
    contentType: 'application/json',
  });

  expect(retailUser.mobileNumber, 'API-reported mobile number should match the UI login').toBe(mobileNumber);
  expect(retailUser.roles, 'API-reported roles should include POS_USER').toEqual(
    expect.arrayContaining(['POS_USER'])
  );

  return retailUser;
}
