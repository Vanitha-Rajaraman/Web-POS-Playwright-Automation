import { test, expect } from '../../src/fixtures/domainSession.js';
import { groceryData } from '../../src/data/grocery.js';
import { logger } from '../../src/utils/logger.js';
import { buildFreshCustomer } from '../../src/data/factories/sessionData.js';
import { CouponPage } from '../../src/pages/grocery/CouponPage.js';
/**
 * Dynamic coupon application on top of the cart flow: attach customer, add a
 * coupon-eligible product, apply the auto-eligible WELCOME10 coupon, and
 * assert both the coupon-apply API response (status/couponCode/couponStatus)
 * and the UI toast — the API assertion is the source of truth that the
 * coupon actually applied server-side, not just that a toast appeared.
 *
 * Uses a fresh, generated customer per run rather than groceryData.customer —
 * WELCOME10 is capped to one redemption per customer server-side, so a fixed
 * customer would only pass on its first-ever run and fail every run after
 * with "Maximum redeem reached". Login happens once per domain suite (see
 * src/fixtures/domainSession.js) — this test starts already authenticated.
 */
export function registerTests() {
  test.describe('Grocery: coupon application', () => {
      test('attaches a customer, applies a dynamic coupon, and places the order', async ({ cartPage, page }) => {
          test.setTimeout(90000);
          const couponPage = new CouponPage(page);
          const customer = buildFreshCustomer();
          await test.step('Open cart with a fresh customer (avoids the coupon\'s per-customer redeem cap)', async () => {
              logger.info(`Attaching customer ${customer.mobileNumber} / ${customer.name}`);
              await cartPage.openCartWithCustomer(customer.mobileNumber, customer.name);
          });
          await test.step('Add coupon-eligible product to cart', async () => {
              await cartPage.addProductByBarcode(groceryData.couponEligibleProduct.barcode);
          });
          await test.step('Apply the dynamic coupon and verify the apply API response', async () => {
              await couponPage.open();
              const result = await couponPage.applyDynamicCoupon(groceryData.coupon.dynamicCode);
              expect(result.status).toBe('SUCCESS');
              expect(result.couponCode).toBe(groceryData.coupon.dynamicCode);
              expect(result.couponStatus).toBe('ACTIVE');
              expect(Number(result.appliedCoupon)).toBeGreaterThan(0);
              logger.info(`Coupon ${result.couponCode} applied — discount ₹${result.appliedCoupon} (API status: ${result.status})`);
              await expect(couponPage.successToast).toBeVisible();
          });
          await test.step('Place the order (cash)', async () => {
              await cartPage.placeOrderWithCash();
              await expect(cartPage.paymentSuccessHeading).toBeVisible();
              logger.info('Order placed successfully with coupon applied');
          });
      });
  });

}
