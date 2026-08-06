import { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Everything between location select and a live session for restaurant
 * orgs: an "Access Mode" step (POS vs Kitchen Display — not shown for
 * grocery orgs), then an optional "Start Day" prompt (only shown when the
 * location has no active business day — i.e. every prior session was
 * closed), then the terminal picker ("Start session"). Framework foundation
 * stops at the terminal picker — actually starting a session changes live
 * shared staging state.
 */
export class SessionStartPage extends BasePage {
  readonly accessModeTitle: Locator;
  readonly posButton: Locator;
  readonly kdsButton: Locator;
  readonly startDayButton: Locator;
  readonly title: Locator;
  readonly organizationCrumb: Locator;
  readonly locationCrumb: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.accessModeTitle = page.getByTestId('text-access-mode-title');
    this.posButton = page.getByTestId('button-access-mode-pos');
    this.kdsButton = page.getByTestId('button-access-mode-kds');
    this.startDayButton = page.getByRole('button', { name: 'Start Day', exact: true });
    this.title = page.getByTestId('text-session-start-title');
    this.organizationCrumb = page.getByTestId('text-session-start-organization');
    this.locationCrumb = page.getByTestId('text-session-start-location');
    this.backButton = page.getByTestId('button-session-start-back');
  }

  terminalCard(terminalName: string): Locator {
    return this.page.getByText(terminalName, { exact: true });
  }

  async isLoaded(): Promise<boolean> {
    return this.title.isVisible();
  }

  async selectPointOfSale(): Promise<void> {
    await this.accessModeTitle.waitFor({ state: 'visible' });
    await this.posButton.click();
  }

  /**
   * "Start Day" only shows up when the location has no active business day
   * — most of the time the day is already active and the app goes straight
   * to the terminal picker, so this handles both without failing on either.
   */
  async proceedToSession(): Promise<void> {
    await this.selectPointOfSale();

    await Promise.race([
      this.startDayButton.waitFor({ state: 'visible' }),
      this.title.waitFor({ state: 'visible' }),
    ]);

    if (await this.startDayButton.isVisible()) {
      await this.startDayButton.click();
      await this.title.waitFor({ state: 'visible' });
    }
  }
}
