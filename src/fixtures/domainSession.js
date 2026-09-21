import { test as base, expect } from '@playwright/test';
import { env } from '../config/env.js';
import { LoginPage } from '../pages/LoginPage.js';
import { LogoutPage } from '../pages/LogoutPage.js';
import { OrganizationLocationPage as GroceryOrg } from '../pages/grocery/OrganizationLocationPage.js';
import { SessionStartPage as GrocerySession } from '../pages/grocery/SessionStartPage.js';
import { CartPage as GroceryCart } from '../pages/grocery/CartPage.js';
import { OrganizationLocationPage as DineInOrg } from '../pages/restaurant-dinein/OrganizationLocationPage.js';
import { SessionStartPage as DineInSession } from '../pages/restaurant-dinein/SessionStartPage.js';
import { CartPage as DineInCart } from '../pages/restaurant-dinein/CartPage.js';
import { OrganizationLocationPage as QsrOrg } from '../pages/restaurant-qsr/OrganizationLocationPage.js';
import { SessionStartPage as QsrSession } from '../pages/restaurant-qsr/SessionStartPage.js';
import { CartPage as QsrCart } from '../pages/restaurant-qsr/CartPage.js';

const domains = {
  grocery: { Org: GroceryOrg, Session: GrocerySession, Cart: GroceryCart, org: env.orgName, location: env.locationName },
  'restaurant-dinein': { Org: DineInOrg, Session: DineInSession, Cart: DineInCart, org: env.restaurantOrgName, location: env.dineInLocationName },
  'restaurant-qsr': { Org: QsrOrg, Session: QsrSession, Cart: QsrCart, org: env.restaurantOrgName, location: env.qsrLocationName },
};

/** One live context for the current domain; never restore storage or relogin mid-suite. */
export class DomainSession {
  constructor(browser) {
    this.browser = browser;
    this.context = null;
    this.page = null;
    this.sessionReady = false;
    this.loggedOut = false;
    this.logoutAttempted = false;
  }

  async start(domain) {
    if (this.context) throw new Error('Finish the current domain before starting another.');
    if (!Object.hasOwn(domains, domain)) throw new Error(`Unknown domain: ${domain}`);
    const definition = domains[domain];
    this.domain = domain;
    this.sessionReady = false;
    this.loggedOut = false;
    this.logoutAttempted = false;
    this.context = await this.browser.newContext();
    // Playwright manages tracing through playwright.config.js and the VS Code extension.
    // Do not start or stop tracing here: manual calls conflict with the runner.
    this.page = await this.context.newPage();
    this.loginPage = new LoginPage(this.page);
    this.logoutPage = new LogoutPage(this.page);
    this.organizationLocationPage = new definition.Org(this.page);
    this.sessionStartPage = new definition.Session(this.page);
    this.cartPage = new definition.Cart(this.page);

    await this.loginPage.goto();
    await this.loginPage.login(env.mobileNumber, env.pin);
    await this.organizationLocationPage.selectOrgAndLocation(definition.org, definition.location);
  }

  async startSession() {
    this.requireActive();
    if (this.sessionReady) throw new Error('The domain session has already been started.');
    const definition = domains[this.domain];
    await this.sessionStartPage.prepareForTests({
      org: definition.org,
      location: definition.location,
      terminal: env.terminalName,
    });
    // Ready for this domain's tests: grocery reaches home; restaurants stop at the terminal picker.
    this.sessionReady = true;
  }

  async logout() {
    if (this.loggedOut) return;
    this.requireActive();
    this.logoutAttempted = true;
    // Escape dismisses session review without finalizing reconciliation.
    await this.page.keyboard.press('Escape');
    await this.logoutPage.logout();
    await expect(this.loginPage.mobileInput).toBeVisible({ timeout: 15000 });
    this.loggedOut = true;
  }

  async finish() {
    if (!this.context) return;
    const context = this.context;
    const failures = [];
    try {
      // On failure the final logout case is skipped; still attempt actual UI logout.
      // Do not mask a failed logout by retrying it or by clearing browser storage.
      if (this.page && this.loginPage && !this.loggedOut && !this.logoutAttempted) {
        if (!await this.loginPage.mobileInput.isVisible()) await this.logout();
      }
    } catch (error) {
      failures.push(error);
    }
    try {
      await context.close();
    } catch (error) {
      failures.push(error);
    } finally {
      // Do not expose closed pages or objects if setup of the next domain fails.
      this.context = null;
      this.page = null;
      this.loginPage = null;
      this.logoutPage = null;
      this.organizationLocationPage = null;
      this.sessionStartPage = null;
      this.cartPage = null;
      this.sessionReady = false;
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1) throw new AggregateError(failures, 'Multiple shared-session cleanup operations failed.');
  }

  requireActive() {
    if (!this.context || !this.page || this.loggedOut) {
      throw new Error('No active domain page. Run the ordered domain suite so its login hook runs first.');
    }
  }

  getFixture(name, requiresSession = false) {
    this.requireActive();
    if (requiresSession && !this.sessionReady) {
      throw new Error('SessionStart.spec.js must complete before cart tests. Run the full domain command.');
    }
    return this[name];
  }

  async cleanGroceryPage() {
    await this.cartPage.prepareForNextTest();
  }
}

export const test = base.extend({
  domainSession: [async ({ browser }, use) => {
    const session = new DomainSession(browser);
    try { await use(session); }
    finally { await session.finish(); }
  }, { scope: 'worker' }],
  page: async ({ domainSession }, use) => { await use(domainSession.getFixture('page')); },
  context: async ({ domainSession }, use) => { await use(domainSession.getFixture('context')); },
  loginPage: async ({ domainSession }, use) => { await use(domainSession.getFixture('loginPage')); },
  organizationLocationPage: async ({ domainSession }, use) => { await use(domainSession.getFixture('organizationLocationPage')); },
  sessionStartPage: async ({ domainSession }, use) => { await use(domainSession.getFixture('sessionStartPage')); },
  cartPage: async ({ domainSession }, use) => { await use(domainSession.getFixture('cartPage', true)); },
});

export function registerDomainSuite(domain, tags, registerCases, suiteTest = test) {
  suiteTest.describe(domain, { tag: tags }, () => {
    suiteTest.describe.configure({ mode: 'serial', retries: 0 });
    suiteTest.beforeAll(async ({ domainSession }) => {
      suiteTest.setTimeout(120000);
      await suiteTest.step(`${domain}: login once and select organization/location`, () => domainSession.start(domain));
    });
    suiteTest.afterEach(async ({ domainSession }, testInfo) => {
      if (domain === 'grocery' && domainSession.sessionReady && !domainSession.loggedOut && testInfo.status === testInfo.expectedStatus) {
        await domainSession.cleanGroceryPage();
      }
    });
    registerCases();
    suiteTest.afterAll(async ({ domainSession }) => {
      suiteTest.setTimeout(120000);
      await suiteTest.step(`${domain}: finish session`, () => domainSession.finish());
    });
  });
}

export { expect } from '@playwright/test';
