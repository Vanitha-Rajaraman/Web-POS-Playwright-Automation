import { CartProductSearchPage } from '../../src/pages/grocery/CartProductSearchPage.js';
import { test, expect } from '../../src/fixtures/domainSession.js';
import { groceryData } from '../../src/data/grocery.js';
import { logger } from '../../src/utils/logger.js';
/**
 * Product search coverage: full barcode, partial barcode, full name, partial name.
 * Search is a prefix match per field (verified against the real catalog — a barcode
 * *suffix* returns nothing, and a broad partial query can return dozens of unrelated
 * results), so every case here uses CartProductSearchPage.addProductBySearch(), which scopes the
 * "Add" click to the row matching the product name rather than the first result.
 * Login happens once per domain suite (see src/fixtures/domainSession.js) — every
 * test here starts already authenticated.
 */
const searchCases = [
    { label: 'full barcode', query: groceryData.product.barcode },
    { label: 'partial barcode', query: groceryData.product.partialBarcode },
    { label: 'full product name', query: groceryData.product.name },
    { label: 'partial product name', query: groceryData.product.partialName },
];
export function registerTests() {
  test.describe('Grocery: product search and addition', () => {
      for (const { label, query } of searchCases) {
          test(`adds the product via ${label} search ("${query}")`, async ({ cartPage, page }) => {
              test.setTimeout(60000);
              const productSearchPage = new CartProductSearchPage(page);
              await test.step('Open cart', async () => {
                  await cartPage.openCart();
              });
              await test.step(`Search "${query}" (${label}) and add the product`, async () => {
                  await productSearchPage.addProductBySearch(query, groceryData.product.name);
              });
              await test.step('Place the order (cash)', async () => {
                  await cartPage.placeOrderWithCash();
                  await expect(cartPage.paymentSuccessHeading).toBeVisible();
                  logger.info(`Order placed successfully via ${label} search`);
              });
          });
      }
  });

}
