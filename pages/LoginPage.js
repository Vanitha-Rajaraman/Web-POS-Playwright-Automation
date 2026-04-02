const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    this.mobileInput = page.getByPlaceholder('Mobile Number');
    this.pinInput = page.getByRole('textbox', { name: 'Pin' });
    this.loginButton = page.getByRole('button', { name: 'Login' });

    this.locationsHeading = page.getByText('Locations');
    this.twinleavesOption = page.getByText('Twinleaves');
    this.erodeOption = page.getByText('Erode');
    this.homeGreetingHeading = page.getByRole('heading', { name: 'Hello Vanitha Rajaraman! Here' });
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

  async login(mobile, pin) {
    await this.fill(this.mobileInput, mobile);
    await this.fill(this.pinInput, pin);
    await this.click(this.loginButton);
  }

  async waitForAuthTokens() {
    await this.page.waitForFunction(() => {
      const accessToken = window.localStorage.getItem('access_token');
      const refreshToken = window.localStorage.getItem('refresh_token');
      return Boolean(accessToken && refreshToken);
    }, { timeout: 30000 });
  }

  async saveStorageState(statePath) {
    await this.page.context().storageState({ path: statePath });
  }

  async saveSessionStorage(storagePath) {
    const sessionStorageData = await this.page.evaluate(() => {
      const entries = {};
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const key = window.sessionStorage.key(i);
        entries[key] = window.sessionStorage.getItem(key);
      }
      return entries;
    });

    const fs = require('fs');
    fs.writeFileSync(storagePath, JSON.stringify(sessionStorageData, null, 2));
  }

  async assertLoginSuccess() {
    await this.assertVisible(this.locationsHeading);
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

    const redirectedToHome = await this.isRedirectedToHome();
    if (redirectedToHome) {
      return 'home';
    }

    const hintVisible = await this.arrowKeysHint.isVisible().catch(() => false);
    if (hintVisible) {
      await this.click(this.arrowKeysHint);
      await this.page.waitForTimeout(1000);
    }

    await this.waitForVisible(this.terminalOption, 45000);
    await this.click(this.terminalOption);
    await this.page.waitForTimeout(2000);

    return 'session';
  }

  async isRedirectedToHome() {
    return this.homeGreetingHeading.isVisible().catch(() => false);
  }

  async assertHomeGreetingVisible() {
    await this.assertVisible(this.homeGreetingHeading, 'Homepage greeting should be visible');
  }

  async startSession(cash = '1000') {
    await this.waitForVisible(this.startSessionButton, 30000);
    await expect(this.startSessionButton).toBeEnabled({ timeout: 30000 });
    await this.click(this.startSessionButton);
    await this.waitForVisible(this.cashAmountInput, 30000);
    await this.fill(this.cashAmountInput, cash);
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

  async assertGoToCartVisible() {
    await this.assertVisible(this.goToCartButton, 'Go to cart button should be visible');
  }

  async goToCart() {
    await this.waitForVisible(this.goToCartButton, 30000);
    await this.click(this.goToCartButton);
  }
}

module.exports = LoginPage;
