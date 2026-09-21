import { test, expect } from '../../src/fixtures/domainSession.js';
import { groceryData } from '../../src/data/grocery.js';
import { logger } from '../../src/utils/logger.js';
/**
 * Login happens once per domain suite via the shared-session fixture (see
 * src/fixtures/domainSession.js) — this test starts already authenticated
 * on the POS dashboard and picks up straight at cart creation. Run grocery specs
 * with --workers=1 so every file lands on the same worker and truly shares one login.
 */
export function registerTests() {
  test.describe('Grocery: cart product addition and order placement', () => {
      test('adds a product to a new cart and places the order', async ({ cartPage }) => {
          test.setTimeout(60000);
          await test.step('Open a new cart with customer details', async () => {
              logger.info(`Attaching customer ${groceryData.customer.mobileNumber} / ${groceryData.customer.name}`);
              await cartPage.openCartWithCustomer(groceryData.customer.mobileNumber, groceryData.customer.name);
              logger.info('Cart created');
          });
          await test.step('Add product to cart', async () => {
              logger.info(`Adding product with barcode "${groceryData.product.barcode}" (${groceryData.product.name})`);
              await cartPage.addProductByBarcode(groceryData.product.barcode);
          });
          await test.step('Place the order (pay full amount in cash)', async () => {
              await cartPage.placeOrderWithCash();
              await expect(cartPage.paymentSuccessHeading).toBeVisible();
              await expect.poll(() => cartPage.isOrderCompleted()).toBe(true);
              logger.info('Order placed successfully');
          });
      });
  });

}
