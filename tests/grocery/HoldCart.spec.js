import { test, expect } from '../../src/fixtures/domainSession.js';
import { groceryData } from '../../src/data/grocery.js';
import { logger } from '../../src/utils/logger.js';
import { buildFreshCustomer } from '../../src/data/factories/sessionData.js';
import { HoldCartPage } from '../../src/pages/grocery/HoldCartPage.js';
/**
 * Hold Cart and retrieve: attach a customer, add a product, hold the cart (parking
 * it server-side), then retrieve it back from the Held Carts screen and complete
 * the order — asserting the held product actually reappears in the active cart
 * after retrieval, not just that the hold/retrieve actions didn't error. Login
 * happens once per domain suite (see src/fixtures/domainSession.js) — this test
 * starts already authenticated. Uses a fresh, generated customer per run so its
 * held-cart row is uniquely identifiable and never collides with another test's
 * leftover held cart for a fixed customer.
 */
export function registerTests() {
  test.describe('Grocery: hold cart and retrieve', () => {
      test('attaches a customer, adds a product, holds the cart, and retrieves it back', async ({ cartPage, page }) => {
          test.setTimeout(90000);
          const holdCartPage = new HoldCartPage(page);
          const customer = buildFreshCustomer();
          await test.step('Open cart with a fresh customer and add a product', async () => {
              logger.info(`Attaching customer ${customer.mobileNumber} / ${customer.name}`);
              await cartPage.openCartWithCustomer(customer.mobileNumber, customer.name);
              await cartPage.addProductByBarcode(groceryData.holdClearProduct.barcode);
              await expect(page.getByText(`Barcode: ${groceryData.holdClearProduct.barcode}`)).toBeVisible();
          });
          await test.step('Hold the cart', async () => {
              await holdCartPage.open();
              await holdCartPage.holdCurrentOrder('Automation test hold');
              logger.info(`Cart held for customer ${customer.name}`);
          });
          await test.step('Retrieve the held cart from Held Carts', async () => {
              await holdCartPage.openHeldCarts();
              await holdCartPage.retrieveHeldCart(customer.name);
              await expect(page.getByText(`Barcode: ${groceryData.holdClearProduct.barcode}`)).toBeVisible();
              logger.info(`Held cart retrieved for customer ${customer.name} — product is back in the active cart`);
          });
          await test.step('Place the order (cash)', async () => {
              await cartPage.placeOrderWithCash();
              await expect(cartPage.paymentSuccessHeading).toBeVisible();
              logger.info('Order placed successfully after retrieving the held cart');
          });
      });
  });

}
