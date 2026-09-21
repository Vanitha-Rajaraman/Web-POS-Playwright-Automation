import { faker } from '@faker-js/faker';
/** An intentionally-invalid mobile number, for negative login tests. */
export function buildInvalidMobileNumber() {
    return faker.string.numeric(10);
}
/** An intentionally-invalid PIN, for negative login tests. */
export function buildInvalidPin() {
    return faker.string.numeric(4);
}
