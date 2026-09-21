import { BasePage } from '../BasePage.js';
/** Denomination rows render in this fixed order on the "Closing Cash Check" screen — each
 *  spinbutton shares the same accessible name ("0"), so rows can only be told apart by
 *  position, not role+name (confirmed via exploration against the real screen). */
const DENOMINATION_ORDER = [500, 200, 100, 50, 20, 10, 5, 2, 1];
/**
 * The end-of-day "Close Session" flow, reached from the bottom nav's "Session" tab. Covers
 * up to the "Session Statement" reconciliation screen only — it deliberately stops short of
 * the final confirm button on that screen, which actually ends the business day for the
 * terminal (a real, hard-to-reverse action on shared staging that every other grocery spec's
 * shared session depends on). That final day-end confirmation is intentionally left to a
 * separate page object/test.
 *
 * If there are carts on hold, starting the flow first shows a "Hold Carts Found" interstitial
 * (confirmed via exploration) — `proceedPastHeldCartsIfShown` continues via "Proceed Anyway",
 * which leaves those held carts untouched (unlike its "Delete" siblings).
 */
export class SessionClosePage extends BasePage {
    constructor(page) {
        super(page);
        this.sessionNavLabel = page.getByText('Session', { exact: true });
        this.currentSessionStatusText = page.getByText('Current Session', { exact: true });
        this.closeSessionButton = page.getByRole('button', { name: 'Close Session', exact: true });
        this.holdCartsFoundHeading = page.getByRole('heading', { name: 'Hold Carts Found', exact: true });
        this.proceedAnywayButton = page.getByRole('button', { name: 'Proceed Anyway', exact: true });
        this.closingCashCheckHeading = page.getByRole('heading', { name: 'Closing Cash Check', exact: true });
        this.proceedToSummaryButton = page.getByRole('button', { name: 'Proceed to Summary', exact: true });
        this.sessionStatementHeading = page.getByRole('heading', { name: 'Session Statement', exact: true });
        this.finalReconciliationHeading = page.getByRole('heading', { name: 'Final Reconciliation', exact: true });
        // The only combobox on the Session Statement screen — has no accessible name of its own.
        this.discrepancyReasonSelect = page.getByRole('combobox');
        this.backToCountButton = page.getByRole('button', { name: 'Back to Count', exact: true });
    }
    /** Opens the "Session" tab from the bottom nav. */
    async openSessionTab() {
        await this.sessionNavLabel.click();
        await this.currentSessionStatusText.waitFor({ state: 'visible' });
    }
    /** Clicks "Close Session" on the Session tab, starting the end-of-day flow. */
    async startCloseSession() {
        await this.closeSessionButton.click();
        await Promise.race([
            this.holdCartsFoundHeading.waitFor({ state: 'visible' }),
            this.closingCashCheckHeading.waitFor({ state: 'visible' }),
        ]);
    }
    async isHoldCartsInterstitialShown() {
        return this.holdCartsFoundHeading.isVisible();
    }
    /** Continues past the "Hold Carts Found" interstitial without touching any held carts. */
    async proceedPastHeldCartsIfShown() {
        if (await this.isHoldCartsInterstitialShown()) {
            await this.proceedAnywayButton.click();
            await this.closingCashCheckHeading.waitFor({ state: 'visible' });
        }
    }
    valueAfterLabel(label) {
        return this.page.getByText(label, { exact: true }).locator('xpath=following-sibling::*[1]');
    }
    get totalCashAmountText() {
        return this.valueAfterLabel('Total Cash');
    }
    denominationInput(value) {
        const index = DENOMINATION_ORDER.indexOf(value);
        return this.page.getByRole('spinbutton').nth(index);
    }
    /** Enters a physical note/coin count for one denomination on the "Closing Cash Check" screen. */
    async enterDenominationCount(value, quantity) {
        await this.denominationInput(value).fill(String(quantity));
    }
    /** Enters physical cash counts for several denominations at once, e.g. `{ 500: 2, 100: 3 }`. */
    async enterDenominationCounts(counts) {
        for (const [value, quantity] of Object.entries(counts)) {
            await this.enterDenominationCount(Number(value), quantity);
        }
    }
    /** Moves from "Closing Cash Check" to the "Session Statement" reconciliation screen. */
    async proceedToSummary() {
        await this.proceedToSummaryButton.click();
        await this.sessionStatementHeading.waitFor({ state: 'visible' });
    }
    get expectedCashAmountText() {
        return this.valueAfterLabel('Expected Cash');
    }
    get physicalCashAmountText() {
        return this.valueAfterLabel('Physical Cash');
    }
    get discrepancyAmountText() {
        return this.valueAfterLabel('Discrepancy');
    }
    /** Selects a reason for the cash discrepancy — only present/required when Physical ≠ Expected. */
    async selectDiscrepancyReason(reason) {
        await this.discrepancyReasonSelect.selectOption({ label: reason });
    }
    /**
     * Every screen in this flow (Hold Carts Found, Closing Cash Check, Session Statement) is a
     * full-screen takeover that replaces the header/bottom-nav entirely, not an overlay on top
     * of them (confirmed via exploration — no header renders alongside any of them). Escape
     * dismisses the flow and returns to the normal dashboard with header/nav restored, without
     * finalizing anything.
     */
    async dismiss() {
        await this.page.keyboard.press('Escape');
    }
}
