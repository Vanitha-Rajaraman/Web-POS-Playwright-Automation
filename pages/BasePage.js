const { expect } = require('@playwright/test');

const BASE_URL = 'https://upcoming-pos.palletnow.co/';

class BasePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * navigateToApp()
   * All page objects call this instead of page.goto() in specs.
   * Single place to change the URL if it ever changes.
   */
  async navigateToApp() {
    await this.page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.page.waitForLoadState('networkidle', { timeout: 60000 });
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async click(locator) {
    await locator.waitFor({ state: 'visible', timeout: 30000 });
    await locator.click();
  }

  async fill(locator, value) {
    await locator.waitFor({ state: 'visible', timeout: 30000 });
    await locator.clear();
    await locator.fill(value);
  }

  async waitForVisible(locator, timeout = 30000) {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async waitMs(ms) {
    await this.page.waitForTimeout(ms);
  }

  async getTitle() {
    return this.page.title();
  }

  async assertVisible(locator, msg) {
    await expect(locator, msg).toBeVisible({ timeout: 30000 });
  }

  async assertEnabled(locator) {
    await expect(locator).toBeEnabled({ timeout: 10000 });
  }

  async assertContainsText(locator, text) {
    await expect(locator).toContainText(text, { timeout: 10000 });
  }

  async assertInputValue(locator, value) {
    await expect(locator).toHaveValue(value, { timeout: 10000 });
  }

  async takeScreenshot(name) {
    await this.page.screenshot({
      path: `test-results/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }
}

module.exports = BasePage;