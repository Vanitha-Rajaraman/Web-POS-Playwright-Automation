const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');

class SessionPage extends BasePage {
  constructor(page) {
    super(page);
    this.locationsHeading = page.getByText('Locations');
    this.twinleavesOption = page.getByText('Twinleaves');
    this.erodeOption = page.getByText('Erode');
    this.arrowKeysHint = page.getByText('Use arrow keys to select');
    this.terminalOption = page.getByText('TER-009');
    this.startSessionButton = page.getByRole('button', { name: 'Start session' });
    this.cashAmountInput = page.getByPlaceholder('Enter cash amount');
    this.loginAsManagerBtn = page.getByRole('button', { name: 'Login as Manager' });
    this.goToCartButton = page.getByRole('button', { name: 'Go to cart' });
  }

  async goto() {
    await this.navigateToApp();
  }

  async assertLocationsVisible() {
    await this.assertVisible(this.locationsHeading, 'Locations screen should be visible');
  }

  async selectLocation() {
    await this.waitForVisible(this.locationsHeading, 30000);
    await this.click(this.locationsHeading);
    await this.page.waitForTimeout(1000);

    await this.waitForVisible(this.twinleavesOption, 30000);
    await this.click(this.twinleavesOption);
    await this.page.waitForTimeout(1000);

    await this.waitForVisible(this.erodeOption, 30000);
    await this.click(this.erodeOption);
    await this.page.waitForTimeout(2000);

    // Try arrow keys hint
    const hintVisible = await this.arrowKeysHint.isVisible().catch(() => false);
    if (hintVisible) {
      await this.click(this.arrowKeysHint);
      await this.page.waitForTimeout(1000);
    }

    // Wait for terminal selector to be available
    await this.page.screenshot({ path: 'debug-terminal.png' });
    await this.waitForVisible(this.terminalOption, 45000);
    await this.click(this.terminalOption);
    await this.page.waitForTimeout(2000);
  }

  async startSession(cash = '1000') {
    await this.waitForVisible(this.startSessionButton, 30000);
    await expect(this.startSessionButton).toBeEnabled({ timeout: 30000 });
    await this.click(this.startSessionButton);
    await this.waitForVisible(this.cashAmountInput, 30000);
    await this.fill(this.cashAmountInput, cash);
    //await this.click(this.startSessionButton);
  }

  async assertStartSessionVisible() {
    await this.assertVisible(this.startSessionButton, 'Start session button should be visible');
  }

  async assertLoginAsManagerVisible() {
    await this.assertVisible(this.loginAsManagerBtn, 'Login as Manager button should be visible');
  }

  async loginAsManager() {
    await this.waitForVisible(this.loginAsManagerBtn, 30000);
    await this.click(this.loginAsManagerBtn);
  }

  async goToCart() {
    await this.waitForVisible(this.goToCartButton, 30000);
    await this.click(this.goToCartButton);
  }

  async assertGoToCartVisible() {
    await this.assertVisible(this.goToCartButton, 'Go to cart button should be visible');
  }
}

module.exports = SessionPage;
