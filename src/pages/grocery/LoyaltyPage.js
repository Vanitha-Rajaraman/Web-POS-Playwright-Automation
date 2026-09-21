import { BasePage } from '../BasePage.js';
/**
 * The Loyalty redemption drawer, opened from the cart via the "Loyalty (F8)"
 * sidebar icon (a plain click works here, unlike Coupons which only responds
 * to the actual F9 keypress). Redemption eligibility depends on the cart
 * total — a small cart (e.g. ₹10) shows 0 eligible points even for a customer
 * with a large balance; verified that once the cart is large enough, the
 * redemption fields pre-fill with the max eligible amount and the Redeem
 * button becomes enabled on its own.
 */
export class LoyaltyPage extends BasePage {
    constructor(page) {
        super(page);
        this.heading = page.getByRole('heading', { name: 'Loyalty', exact: true });
        this.closeButton = page.getByRole('button', { name: 'Close', exact: true });
        this.pointsToRedeemInput = page.getByPlaceholder('Enter points');
        this.valueToRedeemInput = page.getByPlaceholder('Enter value');
        // Label is dynamic ("Redeem 3 pts for ₹3.00") — match the constant prefix.
        this.redeemButton = page.getByRole('button', { name: /^Redeem/i });
        this.successToast = page.getByText('Loyalty points applied successfully', { exact: true });
    }
    /** Opens the Loyalty drawer from the cart's sidebar nav. */
    async open() {
        // "Loyalty (F8)" renders as a <p> with the "(F8)" shortcut in a separate nested node,
        // the same split-text-node pattern as "Products (F3)" — target the <p> by partial text.
        await this.page.locator('p', { hasText: 'Loyalty' }).first().click();
        await this.heading.waitFor({ state: 'visible' });
    }
    /**
     * Redeems whatever loyalty points/value are currently eligible for this cart (the fields
     * pre-fill with the max amount automatically) and confirms the success toast appeared.
     */
    async redeemMaxEligiblePoints() {
        await this.redeemButton.click();
        await this.successToast.waitFor({ state: 'visible' });
    }
}
