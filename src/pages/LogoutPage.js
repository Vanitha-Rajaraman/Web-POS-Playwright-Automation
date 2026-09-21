import { BasePage } from './BasePage.js';

/** Shared POS header profile menu. Logout must return to the login form. */
export class LogoutPage extends BasePage {
  constructor(page) {
    super(page);
    this.profileMenuTrigger = page.locator('[title="Profile"]');
    this.profileActionsHeading = page.getByText('Profile Actions', { exact: true });
    this.logoutMenuItem = page.locator('.profile-action-item', { hasText: 'Logout' });
    this.logoutSuccessToast = page.getByText('Successfully Logged out', { exact: true });
  }

  async openProfileMenu() {
    await this.profileMenuTrigger.click({ timeout: 10000 });
    await this.profileActionsHeading.waitFor({ state: 'visible', timeout: 10000 });
  }

  async logout() {
    await this.openProfileMenu();
    await this.logoutMenuItem.click({ timeout: 10000 });
  }
}
