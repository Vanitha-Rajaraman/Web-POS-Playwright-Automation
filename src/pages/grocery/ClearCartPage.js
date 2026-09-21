import { BasePage } from '../BasePage.js';
/**
 * The "Clear Cart" confirmation drawer, opened via the cart's "Clear Cart" sidebar
 * icon — requires manager approval: picking a manager from a dropdown list and
 * entering their 4-digit PIN unlocks the "Clear Cart" button, which empties the
 * active cart. Confirmed via exploration against the seeded catalog: the manager
 * picker opens as a plain list of listitems (not a native <select>), and the
 * "Clear Cart" button stays disabled until both a manager and a valid PIN are set.
 */
export class ClearCartPage extends BasePage {
    constructor(page) {
        super(page);
        this.heading = page.getByRole('heading', { name: 'Clear Cart', exact: true, level: 1 });
        this.managerSelect = page.getByText('Select manager', { exact: true });
        this.pinInput = page.getByPlaceholder('Enter 4-digit PIN');
        this.clearCartButton = page.getByRole('button', { name: 'Clear Cart', exact: true });
        this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
    }
    /** Opens the "Clear Cart" confirmation drawer from the cart's sidebar nav (requires at least one item in the cart). */
    async open() {
        await this.page.locator('p', { hasText: 'Clear Cart' }).first().click();
        await this.heading.waitFor({ state: 'visible' });
    }
    /**
     * Picks a manager from the dropdown list by name (e.g. "Vanitha"). Uses a plain
     * text locator rather than getByRole('listitem', ...) — the latter timed out
     * against the real dropdown despite matching the ARIA snapshot during exploration,
     * while a text locator (matching what worked during exploration) reliably resolves.
     */
    async selectManager(managerName) {
        await this.managerSelect.click();
        await this.page.getByText(managerName, { exact: true }).click();
    }
    /**
     * Clears the active cart with manager approval (manager name + 4-digit PIN). The
     * button briefly shows "Clearing..." while the request is in flight — this waits
     * for that transient state to resolve before returning.
     */
    async clearCartWithApproval(managerName, pin) {
        await this.selectManager(managerName);
        await this.pinInput.fill(pin);
        await this.clearCartButton.click();
        await this.page.getByRole('button', { name: 'Clearing...', exact: true }).waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
    }
}
