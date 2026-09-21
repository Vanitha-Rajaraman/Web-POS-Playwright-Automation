import { BasePage } from '../BasePage.js';
/**
 * The Coupons drawer, opened from the cart via the actual F9 keypress — the
 * on-screen "Coupons (F9)" sidebar icon does NOT respond to a click (verified
 * repeatedly; every other sidebar icon, e.g. Products/Loyalty, does). Offers
 * two ways to apply a discount: typing a coupon code manually ("static"), or
 * picking one from a list of automatically-eligible coupons for the current
 * cart/customer ("dynamic") under an "AVAILABLE COUPONS" heading, each row
 * with its own "Apply" button.
 */
export class CouponPage extends BasePage {
    constructor(page) {
        super(page);
        this.heading = page.getByRole('heading', { name: 'Coupons', exact: true });
        this.couponCodeInput = page.getByPlaceholder('Enter Coupon Code');
        this.applyButton = page.getByRole('button', { name: 'Apply', exact: true });
        this.noCouponsAvailableText = page.getByText('No coupons available', { exact: true });
        this.successToast = page.getByText('Coupons Successfully applied', { exact: true });
    }
    /** Opens the Coupons drawer — only the F9 keyboard shortcut opens it, not a click on the sidebar icon. */
    async open() {
        await this.page.locator('body').click({ position: { x: 10, y: 10 } }).catch(() => { });
        await this.page.keyboard.press('F9');
        await this.heading.waitFor({ state: 'visible' });
    }
    /**
     * Waits for the coupon-apply API call triggered by `trigger` and returns the fields
     * needed to assert the coupon genuinely applied server-side, rather than trusting the
     * UI toast/total alone.
     */
    async captureApplyResponse(trigger) {
        const responsePromise = this.page.waitForResponse((res) => /\/cart\/coupon\/apply/.test(res.url()) && res.request().method() === 'POST');
        await trigger();
        const response = await responsePromise;
        const body = await response.json();
        if (body.status !== 'SUCCESS') {
            throw new Error(`Coupon apply failed: ${body.message ?? JSON.stringify(body)}`);
        }
        return {
            status: body.status,
            couponCode: body.data.cartCoupon.couponCode,
            couponStatus: body.data.cartCoupon.couponStatus,
            couponValue: body.data.cartCoupon.couponValue,
            appliedCoupon: body.data.billing.appliedCoupon,
        };
    }
    /** Types a coupon code and applies it (the "static"/manually-entered coupon path), returning the API result for assertions. */
    async applyStaticCoupon(code) {
        return this.captureApplyResponse(async () => {
            await this.couponCodeInput.fill(code);
            await this.applyButton.click();
        });
    }
    /**
     * A dynamic (automatically-eligible) coupon's row, by its exact label text (e.g.
     * "WELCOME10"). The Apply button isn't a direct sibling of the label text node — it's a
     * sibling of an enclosing wrapper — so this walks up to the nearest ancestor that itself
     * contains an "Apply" button, which stays correct regardless of the exact wrapper depth.
     */
    dynamicCouponRow(label) {
        return this.page
            .getByText(label, { exact: true })
            .locator('xpath=ancestor::*[.//button[normalize-space(text())="Apply"]][1]');
    }
    /** Applies a dynamic coupon by clicking its row's own "Apply" button, returning the API result for assertions. */
    async applyDynamicCoupon(label) {
        return this.captureApplyResponse(async () => {
            await this.dynamicCouponRow(label).getByRole('button', { name: 'Apply', exact: true }).click();
        });
    }
}
