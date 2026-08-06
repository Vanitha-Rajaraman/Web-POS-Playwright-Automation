import { OrgLocSelectionPage } from '@pages/restaurant-dinein/OrgLocSelectionPage';
import { SessionStartPage } from '@pages/restaurant-dinein/SessionStartPage';
import { CartPage } from '@pages/restaurant-dinein/CartPage';
import { createDomainFixtures, expect } from './createDomainFixtures';

export const test = createDomainFixtures(OrgLocSelectionPage, SessionStartPage, CartPage);
export { expect };
