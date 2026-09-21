import { BasePage } from '../BasePage.js';

/** Product-search drawer opened from the grocery cart. */
export class CartProductSearchPage extends BasePage {
  constructor(page) {
    super(page);
    this.productsNavButton = page.locator('p', { hasText: 'Products' }).first();
    this.productSearchInput = page.getByPlaceholder('Search products here...');
    this.addProductButton = page.getByRole('button', { name: 'Add', exact: true }).first();
  }

  async addProductByBarcode(barcode) {
    await this.productsNavButton.click();
    await this.productSearchInput.fill(barcode);
    await this.addProductButton.waitFor({ state: 'visible' });
    await this.addProductButton.click();
  }

  async addProductBySearch(query, productName) {
    await this.productsNavButton.click();
    await this.productSearchInput.fill(query);
    const productRow = this.page.getByRole('button', { name: productName }).first();
    await productRow.waitFor({ state: 'visible' });
    await productRow.locator('xpath=following-sibling::button[1]').click();
  }
}
