import { test } from '../../src/fixtures/domainSession.js';

export function registerTests() {
  test.describe('Grocery: logout', () => {
    test('logs out after all grocery tests', async ({ domainSession }) => {
      test.setTimeout(45000);
      await domainSession.logout();
    });
  });

}
