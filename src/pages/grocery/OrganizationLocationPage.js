import { BasePage } from '../BasePage.js';
/**
 * Org and location selection render on a single screen (two panes side by
 * side), not as separate steps — this page object covers both.
 */
export class OrganizationLocationPage extends BasePage {
    constructor(page) {
        super(page);
        this.orgSearchInput = page.getByPlaceholder('Search organizations');
        this.locationSearchInput = page.getByPlaceholder('Search locations');
    }
    organizationCard(name) {
        return this.page.getByText(name, { exact: false }).first();
    }
    locationCard(name) {
        return this.page.getByText(name, { exact: false }).first();
    }
    async selectOrganization(name) {
        await this.organizationCard(name).click();
    }
    async selectLocation(name) {
        await this.locationCard(name).click();
    }
    async selectOrgAndLocation(orgName, locationName) {
        await this.organizationCard(orgName).waitFor({ state: 'visible' });
        await this.selectOrganization(orgName);
        await this.locationCard(locationName).waitFor({ state: 'visible' });
        await this.selectLocation(locationName);
    }
    orgRow(name) {
        return this.organizationCard(name);
    }
    get selectedOrgRow() {
        return this.page.locator('[aria-selected="true"]');
    }
    get locRows() {
        return this.page.getByRole('listitem');
    }
    get locSearch() {
        return this.locationSearchInput;
    }
    get locNoResults() {
        return this.page.getByText(/no locations found/i);
    }
}
