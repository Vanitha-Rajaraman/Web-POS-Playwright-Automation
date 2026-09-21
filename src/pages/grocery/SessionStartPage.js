import { expect } from '@playwright/test';
import { buildOpeningCashAmount } from '../../data/factories/sessionData.js';
import { BasePage } from '../BasePage.js';
/**
 * Everything between location select and a live session: an optional
 * "Start Day" prompt (only shown when the location has no active business
 * day — i.e. every prior session was closed), the terminal picker ("Start
 * session"), and — for a terminal with no active session — a "System
 * health" screen (printer/EDC/network/buzzer checks + opening cash) whose
 * "Start session" action lands on the POS home dashboard. Picking a
 * terminal that already has an active session skips System health entirely
 * and resumes straight to the dashboard, so `selectTerminal` handles both.
 */
export class SessionStartPage extends BasePage {
    constructor(page) {
        super(page);
        this.startDayButton = page.getByRole('button', { name: 'Start Day', exact: true });
        this.title = page.getByTestId('text-session-start-title');
        this.organizationCrumb = page.getByTestId('text-session-start-organization');
        this.locationCrumb = page.getByTestId('text-session-start-location');
        this.backButton = page.getByTestId('button-session-start-back');
        this.systemHealthTitle = page.getByTestId('text-system-health-title');
        this.terminalNameLabel = page.getByTestId('text-system-health-terminal-name');
        this.openingCashInput = page.getByTestId('input-system-health-opening-cash');
        this.startSessionButton = page.getByTestId('button-system-health-pos-action');
    }
    /** Starts a fresh session or resumes an existing one, ending at the home dashboard. */
    async prepareForTests({ org, location, terminal }) {
        await this.proceedToSession();
        if (await this.isAtTerminalPicker()) {
            await expect(this.organizationCrumb).toHaveText(org);
            await expect(this.locationCrumb).toContainText(location);
            await this.selectTerminal(terminal);
            if (await this.isAtOpeningCashScreen()) {
                await this.startSession(buildOpeningCashAmount());
            }
        }
        await expect(this.page).toHaveURL(/\/products\/homepage/, { timeout: 30000 });
    }
    terminalCard(terminalName) {
        return this.page.getByText(terminalName, { exact: true });
    }
    async isLoaded() {
        return this.title.isVisible();
    }
    /**
     * "Start Day" only shows up when the location has no active business day
     * — most of the time the day is already active and the app goes straight
     * to the terminal picker, so this handles both without failing on either.
     * A third outcome is also real: if this account already has an active
     * session on ANY terminal, org/location selection skips the terminal
     * picker entirely and resumes straight to the POS home dashboard —
     * `isAtTerminalPicker` lets callers detect that and skip the rest.
     */
    async proceedToSession() {
        await Promise.race([
            this.startDayButton.waitFor({ state: 'visible' }),
            this.title.waitFor({ state: 'visible' }),
            this.page.waitForURL(/\/products\/homepage/),
        ]);
        if (await this.startDayButton.isVisible().catch(() => false)) {
            await this.startDayButton.click();
            await this.title.waitFor({ state: 'visible' });
        }
    }
    /** False if org/location selection resumed straight to the dashboard (account already has an active session elsewhere). */
    async isAtTerminalPicker() {
        return this.title.isVisible();
    }
    /**
     * Clicks a terminal card and waits for whichever of the two real outcomes
     * happens: the System health / opening-cash screen (fresh terminal), or a
     * resume straight to the POS home dashboard (terminal already has an
     * active session).
     */
    async selectTerminal(terminalName) {
        await this.terminalCard(terminalName).click();
        await Promise.race([
            this.systemHealthTitle.waitFor({ state: 'visible' }),
            this.page.waitForURL(/\/products\/homepage/),
        ]);
    }
    async isAtOpeningCashScreen() {
        return this.systemHealthTitle.isVisible();
    }
    /** Enters the opening cash amount and starts the session, landing on the POS home dashboard. */
    async startSession(openingCashAmount) {
        await this.openingCashInput.fill(openingCashAmount);
        await this.startSessionButton.click();
        await this.page.waitForURL(/\/products\/homepage/);
    }
}
