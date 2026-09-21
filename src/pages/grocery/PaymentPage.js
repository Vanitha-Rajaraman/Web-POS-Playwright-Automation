import { BasePage } from '../BasePage.js';
/**
 * The Payment screen reached from the cart via "Pay & Print (F1)": tenders the
 * due amount as Card, UPI, Credit, or a Cash/Card/UPI split, and confirms order
 * completion. (The plain cash tender — "Exact" + "(F2) PAY" with no tab switch
 * — stays on CartPage as placeOrderWithCash(), since it's the one path every
 * other cart-flow test needs regardless of what it's specifically testing.)
 */
export class PaymentPage extends BasePage {
    constructor(page) {
        super(page);
        this.payAndPrintButton = page.getByRole('button', { name: /^Pay & Print/i });
        this.cardTabButton = page.getByRole('button', { name: 'Card', exact: true });
        this.upiTabButton = page.getByRole('button', { name: 'UPI', exact: true });
        // Only present once the account/location has credit sales enabled for the attached
        // customer — absent otherwise, so callers should expect payWithCredit() to fail
        // if that isn't configured.
        this.creditTabButton = page.getByRole('button', { name: 'Credit', exact: true });
        this.splitTabButton = page.getByRole('button', { name: 'Split', exact: true });
        this.exactAmountButton = page.getByRole('button', { name: 'Exact', exact: true });
        // Settles Cash directly, and also the standalone Card/UPI terminal-capture sub-step —
        // its label always starts "(F2) PAY", only the trailing amount varies.
        this.finalPayButton = page.getByRole('button', { name: /^\(F2\) PAY/i });
        this.creditOrderCreationButton = page.getByRole('button', { name: /^\(F2\) Credit Order Creation/i });
        this.splitPaymentMethodSelect = page.getByRole('combobox', { name: 'Payment method' });
        this.splitAmountInput = page.getByRole('spinbutton', { name: 'Amount' });
        // Split's button label changes per leg ("Process Primary payment →", "Process Payment 2",
        // "Process Payment 3"...) — match the constant "Process" prefix, not the full dynamic text.
        this.splitProcessButton = page.getByRole('button', { name: /^Process/i });
        this.splitUseRemainingButton = page.getByRole('button', { name: /use remaining/i });
        this.paymentSuccessHeading = page.getByRole('heading', { name: 'Payment Successful!' });
        this.orderIdText = page.getByText(/Order ID:/i);
        this.goToHomeButton = page.getByRole('button', { name: /Go to Home/i });
    }
    /** Pays the full due amount by card and completes the order (single "(F2) PAY" click settles it —
     *  no separate physical-terminal handshake in this staging environment). */
    async payWithCard() {
        await this.payAndPrintButton.click();
        await this.cardTabButton.click();
        await this.finalPayButton.click();
        await this.paymentSuccessHeading.waitFor({ state: 'visible' });
    }
    /** Pays the full due amount via UPI and completes the order. */
    async payWithUpi() {
        await this.payAndPrintButton.click();
        await this.upiTabButton.click();
        await this.finalPayButton.click();
        await this.paymentSuccessHeading.waitFor({ state: 'visible' });
    }
    /**
     * Creates a credit order for the due amount against the attached customer's account and
     * completes the sale (requires a customer to be attached via CartPage.openCartWithCustomer,
     * using a mobile number the account/location has credit sales enabled for — Credit only
     * appears on the Payment screen once that customer is attached).
     */
    async payWithCredit() {
        await this.payAndPrintButton.click();
        await this.creditTabButton.click();
        await this.creditOrderCreationButton.click();
        await this.paymentSuccessHeading.waitFor({ state: 'visible' });
    }
    /**
     * Fills the split amount field and waits for the value to actually stick before returning.
     * Selecting a payment method — or typing an amount — can trigger the field to remount and
     * silently drop what was just typed; a single fill+immediate-check isn't reliable (observed
     * losing the value even after one retry), so this polls with a short settle delay between
     * attempts instead.
     */
    async fillSplitAmountReliably(amount) {
        for (let attempt = 0; attempt < 5; attempt++) {
            await this.splitAmountInput.fill(amount);
            await this.page.waitForTimeout(300);
            if ((await this.splitAmountInput.inputValue()) === amount) {
                return;
            }
        }
        throw new Error(`Could not fill split amount "${amount}" — the field kept resetting`);
    }
    /**
     * "Use remaining" fills the amount field asynchronously — the field is still empty right
     * after the click resolves, and "Process Payment N" isn't disabled in that empty state, so
     * clicking Process immediately submits a blank amount and the leg silently never completes.
     * Poll until the field actually has a value before treating the click as done.
     */
    async waitForRemainingAmountFilled() {
        for (let attempt = 0; attempt < 10; attempt++) {
            if ((await this.splitAmountInput.inputValue()) !== '') {
                return;
            }
            await this.page.waitForTimeout(200);
        }
        throw new Error('Split amount field never auto-filled after clicking "Use remaining"');
    }
    /**
     * Pays the due amount split across multiple tenders (e.g. cash ₹600 / card ₹600 / upi ₹500)
     * and completes the order. Each leg captures directly via "Process Payment N" — unlike the
     * standalone Card/UPI tabs, Split doesn't need a second terminal-capture click per leg. The
     * final leg uses the UI's own "Use remaining" control rather than typing a matching amount —
     * an amount equal to the exact remaining balance is the one case observed to reliably reset
     * itself right as the leg is processed, so letting the app compute it avoids that race
     * entirely. The last leg finishes the whole order automatically.
     */
    async payWithSplit(payments) {
        await this.payAndPrintButton.click();
        await this.splitTabButton.click();
        for (let i = 0; i < payments.length; i++) {
            const { method, amount } = payments[i];
            const isLastLeg = i === payments.length - 1;
            await this.splitPaymentMethodSelect.selectOption(method);
            if (isLastLeg) {
                // Selecting the method remounts the "Add next payment" panel — clicking "Use remaining"
                // immediately can land on the pre-remount button and silently no-op.
                await this.page.waitForTimeout(300);
                await this.splitUseRemainingButton.click();
                await this.waitForRemainingAmountFilled();
            }
            else {
                await this.fillSplitAmountReliably(amount);
            }
            await this.splitProcessButton.click();
        }
        await this.paymentSuccessHeading.waitFor({ state: 'visible' });
    }
    async isOrderCompleted() {
        return /\/order-completed/.test(this.page.url());
    }
}
