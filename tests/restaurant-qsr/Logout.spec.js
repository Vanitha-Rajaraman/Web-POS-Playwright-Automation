import { test } from '../../src/fixtures/domainSession.js';

export function registerTests() {
  test('logs out after all restaurant-qsr tests', async ({ domainSession }) => {
    test.setTimeout(45000);
    await domainSession.logout();
  });
}
