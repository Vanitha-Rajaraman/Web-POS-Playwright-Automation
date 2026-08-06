import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '@config/env';

export class LoginPage extends BasePage {
  readonly mobileInput: Locator;
  readonly pinInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.mobileInput = page.getByPlaceholder('Enter mobile number');
    this.pinInput = page.getByPlaceholder('Enter secure PIN');
    this.loginButton = page.getByRole('button', { name: /Login to Lynx/i });
  }

  async goto(): Promise<void> {
    await this.page.goto(env.baseUrl);
    await this.mobileInput.waitFor({ state: 'visible' });
  }

  async login(mobileNumber: string, pin: string): Promise<void> {
    await this.mobileInput.fill(mobileNumber);
    await this.pinInput.fill(pin);
    await this.loginButton.click();
  }
}
