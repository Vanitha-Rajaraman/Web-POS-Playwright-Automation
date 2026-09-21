import { test as sessionTest, expect, DomainSession, registerDomainSuite } from '../../src/fixtures/domainSession.js';

// Exercise the real suite hooks and finish() without a browser or staging calls.
const events = [];
class OfflineSession extends DomainSession {
  async start(domain) {
    if (this.context) throw new Error('Previous domain is still open');
    this.domain = domain;
    this.sessionReady = true;
    this.loggedOut = false;
    this.logoutAttempted = false;
    this.page = { domain };
    this.context = { close: async () => events.push(`${domain}:close`) };
    this.loginPage = { mobileInput: { isVisible: async () => false } };
    events.push(`${domain}:login`);
  }
  async logout() {
    this.logoutAttempted = true;
    this.loggedOut = true;
    events.push(`${this.domain}:logout`);
  }
  async cleanGroceryPage() {
    events.push(`${this.domain}:clean`);
  }
}

const test = sessionTest.extend({
  domainSession: [async ({}, use) => {
    const session = new OfflineSession();
    try { await use(session); }
    finally { await session.finish(); }
  }, { scope: 'worker' }],
});

test.describe('Ordered domain lifecycle without staging', () => {
  test.describe.configure({ mode: 'serial' });
  for (const domain of ['grocery', 'restaurant-dinein', 'restaurant-qsr']) {
    let firstPage;
    registerDomainSuite(domain, [], () => {
      test('first feature uses the shared page', async ({ page }) => {
        firstPage = page;
        expect(page.domain).toBe(domain);
        events.push(`${domain}:first`);
      });
      test('second feature reuses that exact page', async ({ page }) => {
        expect(page).toBe(firstPage);
        events.push(`${domain}:second`);
      });
      test('last case logs out', async ({ domainSession }) => {
        await domainSession.logout();
      });
    }, test);
  }
  test('each logout and close precedes the next domain login', () => {
    expect(events.filter(event => !event.endsWith(':clean'))).toEqual(
      ['grocery', 'restaurant-dinein', 'restaurant-qsr'].flatMap(domain =>
        ['login', 'first', 'second', 'logout', 'close'].map(action => `${domain}:${action}`)),
    );
    expect(events.filter(event => event.endsWith(':clean'))).toHaveLength(2);
  });
});

test('teardown logs out if the final case did not run', async () => {
  const session = new OfflineSession();
  await session.start('failed-flow');
  await session.finish();
  await session.finish();
  expect(events.filter(event => event.startsWith('failed-flow:')))
    .toEqual(['failed-flow:login', 'failed-flow:logout', 'failed-flow:close']);
});

test('logout failure propagates while context still closes', async () => {
  const session = new OfflineSession();
  await session.start('logout-failure');
  session.logout = async () => { throw new Error('Logout unavailable'); };
  await expect(session.finish()).rejects.toThrow('Logout unavailable');
  expect(session.context).toBeNull();
  expect(events).toContain('logout-failure:close');
});

test('fixtures reject use before domain setup', async () => {
  const session = new DomainSession();
  expect(() => session.getFixture('page')).toThrow('No active domain page');
  await expect(session.startSession()).rejects.toThrow('No active domain page');
});

test('cart fixture requires SessionStart and rejects reuse after logout', async () => {
  const session = new OfflineSession();
  await session.start('fixture-guards');
  session.sessionReady = false;
  expect(session.getFixture('page')).toBe(session.page);
  expect(() => session.getFixture('cartPage', true)).toThrow('SessionStart.spec.js must complete');
  await session.logout();
  expect(() => session.getFixture('page')).toThrow('No active domain page');
  await session.finish();
});

test('both teardown errors are preserved and stale references are cleared', async () => {
  const session = new OfflineSession();
  await session.start('double-failure');
  const logoutFailure = new Error('Logout failed');
  const closeFailure = new Error('Close failed');
  session.logout = async () => { throw logoutFailure; };
  session.context.close = async () => { throw closeFailure; };
  await expect(session.finish()).rejects.toMatchObject({ errors: [logoutFailure, closeFailure] });
  expect(session.context).toBeNull();
  expect(session.page).toBeNull();
  expect(session.loginPage).toBeNull();
  expect(session.sessionReady).toBe(false);
  await session.finish();
});

test('partial setup still closes its context without attempting logout', async () => {
  const session = new DomainSession();
  let closed = false;
  session.context = { close: async () => { closed = true; } };
  await session.finish();
  expect(closed).toBe(true);
  expect(session.context).toBeNull();
});
