const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    this.mobileInput  = page.getByPlaceholder('Mobile Number');
    this.pinInput     = page.getByRole('textbox', { name: 'Pin' });
    this.loginButton  = page.getByRole('button',  { name: 'Login' });
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

  async assertLoginSuccess() {
    await this.assertVisible(this.page.getByText('Locations'));
  }
}

module.exports = LoginPage;
