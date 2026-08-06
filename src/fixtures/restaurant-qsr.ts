import { OrgLocSelectionPage } from '@pages/restaurant-qsr/OrgLocSelectionPage';
import { SessionStartPage } from '@pages/restaurant-qsr/SessionStartPage';
import { CartPage } from '@pages/restaurant-qsr/CartPage';
import { createDomainFixtures, expect } from './createDomainFixtures';

export const test = createDomainFixtures(OrgLocSelectionPage, SessionStartPage, CartPage);
export { expect };
