import { test, expect } from '../../src/fixtures/domainSession.js';
import { groceryData } from '../../src/data/grocery.js';
import { logger } from '../../src/utils/logger.js';
import { LoyaltyPage } from '../../src/pages/grocery/LoyaltyPage.js';
/**
 * Loyalty redemption on top of the cart flow: attach customer, add product,
 * redeem eligible loyalty points, place the order, and assert the "Loyalty
 * points applied successfully" message. Eligibility isn't simply proportional
 * to cart total — a small cart (e.g. ₹30) has shown 0 eligible points in some
 * runs (likely a minimum-order threshold or a periodic cap), while a larger
 * cart (20 units / ₹200) has reliably shown eligible points and an enabled
 * Redeem button, so this bumps quantity to that instead of the smaller total.
 * Login happens once per domain suite (see src/fixtures/domainSession.js) —
 * this test starts already authenticated.
 */
export function registerTests() {
  test.describe('Grocery: loyalty redemption', () => {
      test('attaches a customer, redeems eligible loyalty points, and places the order', async ({ cartPage, page }) => {
          test.setTimeout(90000);
          const loyaltyPage = new LoyaltyPage(page);
          await test.step('Open cart with customer details', async () => {
              logger.info(`Attaching customer ${groceryData.customer.mobileNumber} / ${groceryData.customer.name}`);
              await cartPage.openCartWithCustomer(groceryData.customer.mobileNumber, groceryData.customer.name);
          });
          await test.step('Add product and raise quantity to reach loyalty-eligible total', async () => {
              await cartPage.addProductByBarcode(groceryData.product.barcode);
              for (let i = 1; i < groceryData.loyaltyRedemption.productQuantity; i++) {
                  await cartPage.increaseProductQuantity();
              }
          });
          await test.step('Redeem eligible loyalty points', async () => {
              await loyaltyPage.open();
              await loyaltyPage.redeemMaxEligiblePoints();
              await expect(loyaltyPage.successToast).toBeVisible();
              logger.info('Loyalty points applied successfully');
          });
          await test.step('Place the order (cash)', async () => {
              await cartPage.placeOrderWithCash();
              await expect(cartPage.paymentSuccessHeading).toBeVisible();
              logger.info('Order placed successfully with loyalty redeemed');
          });
      });
  });

}
