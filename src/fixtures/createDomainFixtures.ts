import { Page, test as base } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { BasePage } from '@pages/BasePage';

type PageCtor<T extends BasePage> = new (page: Page) => T;

interface DomainFixtures<OrgLoc extends BasePage, Session extends BasePage, Cart extends BasePage> {
  loginPage: LoginPage;
  orgLocSelectionPage: OrgLoc;
  sessionStartPage: Session;
  cartPage: Cart;
}

/**
 * One fixture definition, parameterized per domain (grocery /
 * restaurant-dinein / restaurant-qsr): `loginPage` is always the same
 * shared LoginPage, org/location selection is always driven the same way —
 * only which page-object classes get instantiated differs, because the
 * underlying screens genuinely differ per domain (restaurants have an extra
 * Access Mode step grocery doesn't).
 */
export function createDomainFixtures<OrgLoc extends BasePage, Session extends BasePage, Cart extends BasePage>(
  OrgLocSelectionPage: PageCtor<OrgLoc>,
  SessionStartPage: PageCtor<Session>,
  CartPage: PageCtor<Cart>
) {
  return base.extend<DomainFixtures<OrgLoc, Session, Cart>>({
    loginPage: async ({ page }, use) => {
      await use(new LoginPage(page));
    },
    orgLocSelectionPage: async ({ page }, use) => {
      await use(new OrgLocSelectionPage(page));
    },
    sessionStartPage: async ({ page }, use) => {
      await use(new SessionStartPage(page));
    },
    cartPage: async ({ page }, use) => {
      await use(new CartPage(page));
    },
  });
}

export { expect } from '@playwright/test';
