import { test, expect } from '../../src/fixtures/domainSession.js';
import { groceryData } from '../../src/data/grocery.js';
import { logger } from '../../src/utils/logger.js';
import { SessionClosePage } from '../../src/pages/grocery/SessionClosePage.js';
/** Review reconciliation on the shared grocery page without finalizing session close. */
export function registerTests() {
  test.describe('Grocery: session close (denomination count)', () => {
      test('enters closing cash denominations and reaches the reconciliation summary', async ({ page }) => {
          test.setTimeout(90000);
          const sessionClosePage = new SessionClosePage(page);
          await test.step('Open the Session tab and start Close Session', async () => {
              await sessionClosePage.openSessionTab();
              await sessionClosePage.startCloseSession();
              await sessionClosePage.proceedPastHeldCartsIfShown();
              await expect(sessionClosePage.closingCashCheckHeading).toBeVisible();
          });
          const expectedTotal = Object.entries(groceryData.closingDenominationCounts).reduce((sum, [value, quantity]) => sum + Number(value) * quantity, 0);
          await test.step('Enter closing cash denomination counts', async () => {
              for (const [value, quantity] of Object.entries(groceryData.closingDenominationCounts)) {
                  await sessionClosePage.enterDenominationCount(Number(value), quantity);
              }
              logger.info(`Entered denomination counts totalling ₹${expectedTotal}`);
              // Amounts render inconsistently formatted elsewhere in this app (with/without a
              // thousands separator) — compare on digits only rather than an exact string match.
              await expect
                  .poll(async () => (await sessionClosePage.totalCashAmountText.textContent())?.replace(/[^0-9]/g, ''))
                  .toBe(String(expectedTotal));
          });
          await test.step('Proceed to the Session Statement reconciliation summary', async () => {
              await sessionClosePage.proceedToSummary();
              await expect(sessionClosePage.sessionStatementHeading).toBeVisible();
              await expect(sessionClosePage.finalReconciliationHeading).toBeVisible();
              await expect
                  .poll(async () => (await sessionClosePage.physicalCashAmountText.textContent())?.replace(/[^0-9]/g, ''))
                  .toBe(String(expectedTotal));
              logger.info('Reached Session Statement reconciliation summary — not finalizing the close');
          });
          await test.step('Back out without finalizing', async () => {
              await sessionClosePage.dismiss();
          });
      });
  });

}
