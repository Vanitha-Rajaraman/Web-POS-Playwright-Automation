import { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Org and location selection render on a single screen (two panes side by
 * side), not as separate steps — this page object covers both.
 */
export class OrgLocSelectionPage extends BasePage {
  readonly orgSearchInput: Locator;
  readonly locationSearchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.orgSearchInput = page.getByPlaceholder('Search organizations');
    this.locationSearchInput = page.getByPlaceholder('Search locations');
  }

  organizationCard(name: string): Locator {
    return this.page.getByText(name, { exact: true });
  }

  locationCard(name: string): Locator {
    return this.page.getByText(name, { exact: false }).first();
  }

  async selectOrganization(name: string): Promise<void> {
    await this.organizationCard(name).click();
  }

  async selectLocation(name: string): Promise<void> {
    await this.locationCard(name).click();
  }

  async selectOrgAndLocation(orgName: string, locationName: string): Promise<void> {
    await this.organizationCard(orgName).waitFor({ state: 'visible' });
    await this.selectOrganization(orgName);

    await this.locationCard(locationName).waitFor({ state: 'visible' });
    await this.selectLocation(locationName);
  }
}
