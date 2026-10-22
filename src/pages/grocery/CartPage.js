import { expect, errors } from '@playwright/test';
import { CartProductSearchPage } from './CartProductSearchPage.js';
import { BasePage } from '../BasePage.js';
/**
 * The POS home dashboard a session lands on after "Start session" (`isLoaded`
 * checks the URL, the one stable signal on that screen), plus the Cart screen
 * reached via the bottom nav: product search/add and payment/order placement.
 * Past the session-start screens the app exposes almost no data-testid
 * attributes, so most locators here are role/text-based instead.
 */
export class CartPage extends BasePage {
    constructor(page) {
        super(page);
        this.homeNavLabel = page.getByText('Home', { exact: true });
        this.cartNavLabel = page.getByText('Cart', { exact: true });
        this.skipCustomerButton = page.getByRole('button', { name: 'Skip', exact: true });
        this.customerMobileInput = page.getByPlaceholder('Enter Mobile Number');
        this.customerNameInput = page.getByPlaceholder('Enter customer name');
        this.addCustomerButton = page.getByRole('button', { name: 'Add Customer', exact: true });
        this.addCustomerModalHeading = page.getByRole('heading', { name: 'Add customer to this order' });
        this.productSearch = new CartProductSearchPage(page);
        this.quantityIncreaseButton = page.getByRole('button', { name: '+', exact: true }).first();
        this.payAndPrintButton = page.getByRole('button', { name: /^Pay & Print/i });
        this.exactAmountButton = page.getByRole('button', { name: 'Exact', exact: true });
        // Settles Cash directly — its label always starts "(F2) PAY", only the trailing amount varies.
        this.finalPayButton = page.getByRole('button', { name: /^\(F2\) PAY/i });
        this.paymentSuccessHeading = page.getByRole('heading', { name: 'Payment Successful!' });
    }
    /** Leaves order completion and dismisses overlays before the next shared-session test. */
    async prepareForNextTest() {
        const goHome = this.page.getByRole('button', { name: /Go to Home/i });
        if (/\/order-completed/.test(this.page.url()) || await goHome.isVisible()) {
            await goHome.click({ timeout: 10000 });
        }
        // The current app returns to the cart after payment; older builds return home.
        await expect(this.page).toHaveURL(/\/(?:dashboard|grocery\/cart|products\/homepage)(?:[/?#]|$)/, { timeout: 15000 });
        const skip = this.skipCustomerButton;
        try {
            await skip.waitFor({ state: 'visible', timeout: 5000 });
        } catch (error) {
            if (!(error instanceof errors.TimeoutError)) throw error;
        }
        if (await skip.isVisible()) await skip.click();
        await this.page.keyboard.press('Escape');
        await expect(this.paymentSuccessHeading).toBeHidden();
        await expect(this.addCustomerModalHeading).toBeHidden();
        await this.homeNavLabel.click({ trial: true, timeout: 5000 });
        await this.cartNavLabel.click({ trial: true, timeout: 5000 });
    }
    async isLoaded() {
        return /\/(?:dashboard|products\/homepage)(?:[/?#]|$)/.test(this.page.url());
    }
    /** Opens a fresh cart from the bottom nav, dismissing the "Add customer to this order" prompt it triggers. */
    async openCart() {
        await this.cartNavLabel.click();
        // click() auto-waits for the button to become actionable — isVisible() does not,
        // so it must not be used here to decide whether the "Skip" prompt appeared.
        await this.skipCustomerButton.click({ timeout: 5000 }).catch(() => { });
        // A sponsor mascot overlay can linger over the modal after Skip; Escape clears it.
        await this.page.keyboard.press('Escape').catch(() => { });
    }
    /**
     * Opens a fresh cart and attaches a customer instead of skipping. If the mobile number
     * already belongs to an existing customer, the app looks them up and locks the name field
     * to the name on file — the `name` given here only takes effect for genuinely new customers,
     * so fill() is allowed to silently time out on that field rather than fail the flow.
     */
    async openCartWithCustomer(mobileNumber, name) {
        await this.cartNavLabel.click();
        await this.customerMobileInput.fill(mobileNumber);
        await this.customerNameInput.fill(name, { timeout: 3000 }).catch(() => { });
        await this.addCustomerButton.click();
        await this.addCustomerModalHeading.waitFor({ state: 'hidden' }).catch(() => { });
        await this.page.keyboard.press('Escape').catch(() => { });
    }
    /** Cart workflows delegate product selection to the search page object. */
    async addProductByBarcode(barcode) {
        await this.productSearch.addProductByBarcode(barcode);
    }
    async addProductBySearch(query, productName) {
        await this.productSearch.addProductBySearch(query, productName);
    }
    /** Clicks the cart row's "+" once, bumping quantity by one — used to reach a specific cart total. */
    async increaseProductQuantity() {
        await this.quantityIncreaseButton.click();
    }
    /** Pays the full due amount in cash and completes the order, landing on the order-completed screen. */
    async placeOrderWithCash() {
        await this.payAndPrintButton.click();
        await this.exactAmountButton.click();
        await this.finalPayButton.click();
        await this.paymentSuccessHeading.waitFor({ state: 'visible' });
    }
    async isOrderCompleted() {
        return /\/order-completed/.test(this.page.url());
    }
}
