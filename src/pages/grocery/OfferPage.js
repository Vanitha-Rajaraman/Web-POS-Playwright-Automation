import { BasePage } from '../BasePage.js';
/**
 * The cart screen's offer handling: a "Apply Offer" button (visible on the cart
 * table whenever any line is offer-eligible) that triggers server-side offer
 * calculation for the whole cart, plus the read-only "Offers (F10)" sidebar
 * drawer that lists the configured offer rules (e.g. "Buy 1 X and get 100% off
 * on Y") without applying anything itself.
 */
export class OfferPage extends BasePage {
    constructor(page) {
        super(page);
        this.applyOfferButton = page.getByRole('button', { name: 'Apply Offer', exact: true });
        this.offersHeading = page.getByRole('heading', { name: 'Offers', exact: true, level: 1 });
        this.closeButton = page.getByRole('button', { name: 'Close', exact: true });
    }
    /** Opens the read-only "Offers (F10)" drawer listing configured offer rules for the current cart. */
    async open() {
        // "Offers (F10)" renders as a <p> with the "(F10)" shortcut in a separate nested
        // node, the same split-text-node pattern as "Products (F3)"/"Loyalty (F8)".
        await this.page.locator('p', { hasText: 'Offers' }).first().click();
        await this.offersHeading.waitFor({ state: 'visible' });
    }
    /**
     * Clicks "Apply Offer" on the cart screen and captures the cart/v4/calculate/offers API
     * response, returning the fields needed to assert an offer genuinely applied server-side
     * (e.g. a BUY X GET Y line's price dropping to its discounted value) rather than trusting
     * the UI cart table alone.
     */
    async applyOffers() {
        const responsePromise = this.page.waitForResponse((res) => /\/cart\/v4\/calculate\/offers\//.test(res.url()) && res.request().method() === 'POST');
        await this.applyOfferButton.click();
        const response = await responsePromise;
        const body = await response.json();
        if (body.status !== 'SUCCESS') {
            throw new Error(`Offer apply failed: ${body.message ?? JSON.stringify(body)}`);
        }
        const cartData = body.data.cartData;
        return {
            status: body.status,
            appliedOffer: cartData.billing.appliedOffer,
            totalCartValue: cartData.billing.totalCartValue,
            cartProducts: cartData.cartProducts.map((p) => ({
                gtin: p.gtin,
                offerApplied: p.offerApplied,
                isOfferAvailable: p.isOfferAvailable,
                offerValue: p.offerValue,
                sellingPrice: p.sellingPrice,
                offerQuantityNotMet: p.offerQuantityNotMet,
            })),
        };
    }
    /** The apply-offer result for one cart line, found by its barcode (gtin) — for per-product assertions. */
    productResult(result, barcode) {
        return result.cartProducts.find((p) => p.gtin === barcode);
    }
}
