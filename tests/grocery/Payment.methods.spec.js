import { test, expect } from '../../src/fixtures/domainSession.js';
import { groceryData } from '../../src/data/grocery.js';
import { logger } from '../../src/utils/logger.js';
import { PaymentPage } from '../../src/pages/grocery/PaymentPage.js';
/**
 * Order completion across every tender: Cash, Card, UPI, Credit, and a Cash/Card/UPI
 * Split — all against the same product (barcode 5555500184316) so each test exercises
 * an identical cart. Cash stays on CartPage.placeOrderWithCash() (the one order-completion
 * path every other cart-flow test also relies on); Card/UPI/Credit/Split live on
 * PaymentPage, reached the same way via CartPage's "Pay & Print (F1)" button.
 *
 * Credit requires a customer attached whose mobile number the account/location has
 * credit sales enabled for — groceryData.customer (9090909090 / Demo Pallet) is that
 * customer; the Credit tender tab is absent from the Payment screen for anyone else.
 * Login happens once per domain suite (see src/fixtures/domainSession.js) — every
 * test here starts already authenticated.
 */
export function registerTests() {
  test.describe('Grocery: cart payment methods', () => {
      test('pays by cash and completes the order', async ({ cartPage }) => {
          test.setTimeout(60000);
          await test.step('Open cart with customer details and add product', async () => {
              await cartPage.openCartWithCustomer(groceryData.customer.mobileNumber, groceryData.customer.name);
              await cartPage.addProductByBarcode(groceryData.paymentProduct.barcode);
          });
          await test.step('Pay by cash', async () => {
              await cartPage.placeOrderWithCash();
              await expect(cartPage.paymentSuccessHeading).toBeVisible();
              logger.info('Order placed successfully via Cash');
          });
      });
      test('pays by card and completes the order', async ({ cartPage, page }) => {
          test.setTimeout(60000);
          const paymentPage = new PaymentPage(page);
          await test.step('Open cart with customer details and add product', async () => {
              await cartPage.openCartWithCustomer(groceryData.customer.mobileNumber, groceryData.customer.name);
              await cartPage.addProductByBarcode(groceryData.paymentProduct.barcode);
          });
          await test.step('Pay by card', async () => {
              await paymentPage.payWithCard();
              await expect(paymentPage.paymentSuccessHeading).toBeVisible();
              logger.info('Order placed successfully via Card');
          });
      });
      test('pays by UPI and completes the order', async ({ cartPage, page }) => {
          test.setTimeout(60000);
          const paymentPage = new PaymentPage(page);
          await test.step('Open cart with customer details and add product', async () => {
              await cartPage.openCartWithCustomer(groceryData.customer.mobileNumber, groceryData.customer.name);
              await cartPage.addProductByBarcode(groceryData.paymentProduct.barcode);
          });
          await test.step('Pay by UPI', async () => {
              await paymentPage.payWithUpi();
              await expect(paymentPage.paymentSuccessHeading).toBeVisible();
              logger.info('Order placed successfully via UPI');
          });
      });
      test('attaches the credit-enabled customer and pays on credit', async ({ cartPage, page }) => {
          test.setTimeout(60000);
          const paymentPage = new PaymentPage(page);
          await test.step('Open cart with the credit-enabled customer (9090909090 / Demo Pallet) and add product', async () => {
              logger.info(`Attaching customer ${groceryData.customer.mobileNumber} / ${groceryData.customer.name} (credit-enabled)`);
              await cartPage.openCartWithCustomer(groceryData.customer.mobileNumber, groceryData.customer.name);
              await cartPage.addProductByBarcode(groceryData.paymentProduct.barcode);
          });
          await test.step('Pay on credit', async () => {
              await expect(paymentPage.payAndPrintButton).toBeVisible();
              await paymentPage.payAndPrintButton.click();
              await expect(paymentPage.creditTabButton, 'Credit tab should be visible for the credit-enabled customer').toBeVisible();
              await paymentPage.creditTabButton.click();
              await paymentPage.creditOrderCreationButton.click();
              await paymentPage.paymentSuccessHeading.waitFor({ state: 'visible' });
              await expect(paymentPage.paymentSuccessHeading).toBeVisible();
              logger.info('Order placed successfully via Credit');
          });
      });
      test('attaches a customer and pays with a cash/card/UPI split', async ({ cartPage, page }) => {
          test.setTimeout(60000);
          const paymentPage = new PaymentPage(page);
          await test.step('Open cart with customer details', async () => {
              logger.info(`Attaching customer ${groceryData.customer.mobileNumber} / ${groceryData.customer.name}`);
              await cartPage.openCartWithCustomer(groceryData.customer.mobileNumber, groceryData.customer.name);
          });
          await test.step('Add product and raise quantity to reach the split total', async () => {
              await cartPage.addProductByBarcode(groceryData.paymentProduct.barcode);
              for (let i = 1; i < groceryData.splitPayment.productQuantity; i++) {
                  await cartPage.increaseProductQuantity();
              }
          });
          await test.step('Pay with a Cash/Card/UPI split', async () => {
              logger.info(`Splitting payment: ${groceryData.splitPayment.legs.map((l) => `${l.method} ₹${l.amount}`).join(', ')}`);
              await paymentPage.payWithSplit(groceryData.splitPayment.legs);
              await expect(paymentPage.paymentSuccessHeading).toBeVisible();
              logger.info('Order placed successfully via split payment');
          });
      });
  });

}
