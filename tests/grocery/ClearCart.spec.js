import { test, expect } from '../../src/fixtures/domainSession.js';
import { groceryData } from '../../src/data/grocery.js';
import { logger } from '../../src/utils/logger.js';
import { buildFreshCustomer } from '../../src/data/factories/sessionData.js';
import { ClearCartPage } from '../../src/pages/grocery/ClearCartPage.js';
/**
 * Clear Cart with manager approval: attach a customer, add a product, then clear
 * the cart using manager Vanitha's PIN — asserting the product row is gone
 * afterward, not just that a success toast appeared. Login happens once per domain suite
 * (see src/fixtures/domainSession.js) — this test starts already
 * authenticated. Uses a fresh, generated customer per run so it never collides
 * with a held/leftover cart another test left behind for a fixed customer.
 */
export function registerTests() {
  test.describe('Grocery: clear cart', () => {
      test('attaches a customer, adds a product, and clears the cart with manager approval', async ({ cartPage, page }) => {
          test.setTimeout(90000);
          const clearCartPage = new ClearCartPage(page);
          const customer = buildFreshCustomer();
          await test.step('Open cart with a fresh customer and add a product', async () => {
              logger.info(`Attaching customer ${customer.mobileNumber} / ${customer.name}`);
              await cartPage.openCartWithCustomer(customer.mobileNumber, customer.name);
              await cartPage.addProductByBarcode(groceryData.holdClearProduct.barcode);
              await expect(page.getByText(`Barcode: ${groceryData.holdClearProduct.barcode}`)).toBeVisible();
          });
          await test.step('Clear the cart with manager approval', async () => {
              await clearCartPage.open();
              await clearCartPage.clearCartWithApproval(groceryData.manager.name, groceryData.manager.pin);
              await expect(page.getByText(`Barcode: ${groceryData.holdClearProduct.barcode}`)).not.toBeVisible();
              logger.info(`Cart cleared with manager approval (${groceryData.manager.name})`);
          });
      });
  });

}
