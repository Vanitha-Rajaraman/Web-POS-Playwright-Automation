import { BasePage } from '../BasePage.js';
/**
 * The "Hold cart" side drawer (opened via the cart's "Hold Cart (F6)" sidebar icon)
 * plus the "Held Carts" screen reached via the bottom nav's "Hold Orders" — holding
 * a cart parks it server-side under the attached customer and immediately clears the
 * active cart, auto-opening a fresh "Add customer to this order" prompt for the next
 * sale (confirmed via exploration — this is the same auto-prompt a completed payment
 * triggers). Each held-cart row on the Held Carts screen is keyed by the customer
 * name it was held under, with its own "Retrieve" button.
 */
export class HoldCartPage extends BasePage {
    constructor(page) {
        super(page);
        this.heading = page.getByRole('heading', { name: 'Hold cart', exact: true });
        this.reasonInput = page.getByPlaceholder('e.g. Customer waiting for friend');
        this.holdCurrentOrderButton = page.getByRole('button', { name: 'Hold Current Order', exact: true });
        this.viewHeldOrdersButton = page.getByRole('button', { name: 'View Held Orders', exact: true });
        this.heldCartsHeading = page.getByRole('heading', { name: 'Held Carts', exact: true });
        this.heldCartsSearchInput = page.getByPlaceholder('Search name, phone, #id...');
        this.noHeldOrdersText = page.getByText('No hold orders found', { exact: true });
    }
    /** Opens the "Hold cart" drawer from the cart's sidebar nav (requires at least one item in the active cart). */
    async open() {
        await this.page.locator('p', { hasText: 'Hold Cart' }).first().click();
        await this.heading.waitFor({ state: 'visible' });
    }
    /**
     * Holds the current cart with an optional reason, parking it server-side. The app
     * immediately opens a fresh "Add customer to this order" prompt for the next sale —
     * this dismisses it with "Skip" so the caller lands back on a clean, empty cart
     * rather than needing to handle that prompt itself.
     */
    async holdCurrentOrder(reason) {
        if (reason) {
            await this.reasonInput.fill(reason);
        }
        await this.holdCurrentOrderButton.click();
        await this.page.getByRole('button', { name: 'Skip', exact: true }).click({ timeout: 5000 }).catch(() => { });
    }
    /** Opens the "Held Carts" screen from the bottom nav. */
    async openHeldCarts() {
        await this.page.getByText('Hold Orders', { exact: true }).click();
        await this.heldCartsHeading.waitFor({ state: 'visible' });
    }
    /**
     * A held cart's row, found by the customer name heading it was held under — the
     * "Retrieve" button isn't a direct sibling of that heading, so this walks up to the
     * nearest ancestor that itself contains a "Retrieve" button (same pattern as
     * CouponPage.dynamicCouponRow), which stays correct regardless of the exact row
     * wrapper depth.
     */
    heldCartRow(customerName) {
        return this.page
            .getByRole('heading', { name: customerName, exact: true, level: 3 })
            .locator('xpath=ancestor::*[.//button[normalize-space(text())="Retrieve"]][1]');
    }
    /** Retrieves a held cart back into the active cart, by the customer name it was held under. */
    async retrieveHeldCart(customerName) {
        await this.heldCartRow(customerName).getByRole('button', { name: 'Retrieve', exact: true }).click();
    }
}
