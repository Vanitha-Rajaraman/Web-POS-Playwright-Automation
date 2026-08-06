import { OrgLocSelectionPage } from '@pages/grocery/OrgLocSelectionPage';
import { SessionStartPage } from '@pages/grocery/SessionStartPage';
import { CartPage } from '@pages/grocery/CartPage';
import { createDomainFixtures, expect } from './createDomainFixtures';

export const test = createDomainFixtures(OrgLocSelectionPage, SessionStartPage, CartPage);
export { expect };
