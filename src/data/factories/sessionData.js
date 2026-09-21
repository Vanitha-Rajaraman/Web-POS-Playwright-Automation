import { faker } from '@faker-js/faker';
/** A plausible opening cash drawer amount, for starting a terminal session. */
export function buildOpeningCashAmount() {
    return faker.number.int({ min: 100, max: 2000 }).toString();
}
/**
 * A new, never-before-seen customer identity. Needed wherever the backend caps an action to
 * once per customer (e.g. the WELCOME10 coupon's redeem limit) — reusing a fixed customer
 * across repeated runs trips "Maximum redeem reached" once it's already been used.
 */
export function buildFreshCustomer() {
    const firstDigit = faker.number.int({ min: 6, max: 9 });
    const remainingDigits = faker.string.numeric(9);
    return {
        mobileNumber: `${firstDigit}${remainingDigits}`,
        name: faker.person.firstName(),
    };
}
