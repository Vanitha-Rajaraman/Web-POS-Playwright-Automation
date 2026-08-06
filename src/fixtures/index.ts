import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';

/**
 * Common fixtures shared by every domain (grocery / restaurant-dinein /
 * restaurant-qsr). Org/location/start-session page objects are domain-specific
 * — import them from `@fixtures/grocery`, `@fixtures/restaurant-dinein`, or
 * `@fixtures/restaurant-qsr` instead.
 */
interface Fixtures {
  loginPage: LoginPage;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect } from '@playwright/test';
