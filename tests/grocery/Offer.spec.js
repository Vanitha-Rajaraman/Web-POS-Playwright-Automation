import { test, expect } from '../../src/fixtures/domainSession.js';
import { groceryData } from '../../src/data/grocery.js';
import { logger } from '../../src/utils/logger.js';
import { OfferPage } from '../../src/pages/grocery/OfferPage.js';
/**
 * BUY X GET Y offer application on top of the cart flow: attach customer, add the
 * offer's buy product (5555500184354) and its get product (5555500184323), apply
 * the offer, and assert both the offer-apply API response (cart/v4/calculate/offers)
 * and the UI table — the API assertion is the source of truth that the offer
 * actually applied server-side (the get product's price dropping to its discounted
 * value), not just that the "OFFER AVAILABLE" badge or a toast appeared.
 * Login happens once per domain suite (see src/fixtures/domainSession.js) —
 * this test starts already authenticated.
 */
export function registerTests() {
  test.describe('Grocery: BUY X GET Y offer application', () => {
      test('attaches a customer, adds buy+get products, applies the offer, and places the order', async ({ cartPage, page }) => {
          test.setTimeout(90000);
          const offerPage = new OfferPage(page);
          await test.step('Open cart with customer details', async () => {
              logger.info(`Attaching customer ${groceryData.customer.mobileNumber} / ${groceryData.customer.name}`);
              await cartPage.openCartWithCustomer(groceryData.customer.mobileNumber, groceryData.customer.name);
          });
          await test.step('Add the offer\'s buy product and get product to the cart', async () => {
              await cartPage.addProductByBarcode(groceryData.offer.buyProduct.barcode);
              await cartPage.addProductByBarcode(groceryData.offer.getProduct.barcode);
          });
          await test.step('Apply the offer and verify the apply API response', async () => {
              const result = await offerPage.applyOffers();
              expect(result.status).toBe('SUCCESS');
              expect(Number(result.appliedOffer)).toBeGreaterThan(0);
              const buyProductResult = offerPage.productResult(result, groceryData.offer.buyProduct.barcode);
              const getProductResult = offerPage.productResult(result, groceryData.offer.getProduct.barcode);
              expect(buyProductResult, 'buy product should be present in the offer-apply response').toBeDefined();
              expect(getProductResult, 'get product should be present in the offer-apply response').toBeDefined();
              // BUY X qualifies the offer; only GET Y receives the discount.
              expect(buyProductResult.offerValue).toBe(0);
              expect(buyProductResult.sellingPrice).toBeGreaterThan(0);
              expect(getProductResult.offerApplied).toBe(true);
              // The BUY X GET Y offer discounts the get product to ₹0 (100% off).
              expect(getProductResult.sellingPrice).toBe(0);
              expect(getProductResult.offerValue).toBeGreaterThan(0);
              expect(Number(result.appliedOffer)).toBe(getProductResult.offerValue);
              logger.info(`Offer applied — get product (${getProductResult.gtin}) discounted to ₹${getProductResult.sellingPrice} ` +
                  `(offerValue ₹${getProductResult.offerValue}, API status: ${result.status})`);
          });
          await test.step('Place the order (cash)', async () => {
              await offerPage.finishApplyingOffers();
              await cartPage.placeOrderWithCash();
              await expect(cartPage.paymentSuccessHeading).toBeVisible();
              logger.info('Order placed successfully with BUY X GET Y offer applied');
          });
      });
  });

}
