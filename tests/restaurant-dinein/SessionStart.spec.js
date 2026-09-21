import { test, expect } from '../../src/fixtures/domainSession.js';

export function registerTests() {
  test('restaurant-dinein: starts or resumes the shared session', async ({ domainSession, page, sessionStartPage }) => {
    test.setTimeout(90000);
    await domainSession.startSession();
    await expect(sessionStartPage.title).toHaveText('Start session');
  });
}
