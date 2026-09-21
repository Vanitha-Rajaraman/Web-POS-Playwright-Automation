import { test, expect } from '../../src/fixtures/domainSession.js';

export function registerTests() {
  test('grocery: starts or resumes the shared session', async ({ domainSession, page, sessionStartPage }) => {
    test.setTimeout(90000);
    await domainSession.startSession();
    await expect(page).toHaveURL(/\/products\/homepage/);
  });
}
