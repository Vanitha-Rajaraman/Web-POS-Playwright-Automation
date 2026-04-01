const BasePage = require('./BasePage');

class CartPage extends BasePage {
  constructor(page) {
    super(page);

    this.mobileInput    = page.getByPlaceholder('Enter Mobile Number');
    this.nameInput      = page.getByRole('textbox', { name: 'Enter Name' });
    this.addButton      = page.getByRole('button',  { name: 'Add' });
    this.productsButton = page.getByRole('button',  { name: 'Products (F3)' });
    this.searchInput    = page.getByRole('textbox', { name: 'Search Products here...' });
    this.addProductBtns = page.getByRole('button',  { name: 'ADD' });
    this.quantityInput  = page.getByPlaceholder('Quantity');
  }

  async addCustomer(mobile, name) {
    await this.fill(this.mobileInput, mobile);
    await this.click(this.nameInput);
    await this.fill(this.nameInput, name);
    await this.click(this.addButton);
    await this.click(this.addButton);
  }

  async openProducts() {
    await this.click(this.productsButton);
  }

  async searchProduct(keyword) {
    await this.click(this.searchInput);
    await this.fill(this.searchInput, keyword);
  }

  async addProductByIndex(index = 0) {
    await this.addProductBtns.nth(index).waitFor({ state: 'visible', timeout: 10000 });
    await this.addProductBtns.nth(index).click();
  }

  async setQuantity(qty) {
    await this.fill(this.quantityInput, qty.toString());
    await this.click(this.addButton);
  }

  async assertCartLoaded() {
    await this.assertVisible(this.mobileInput, 'Cart page should be visible');
  }

  async assertProductsVisible() {
    await this.assertVisible(this.searchInput);
  }
}

module.exports = CartPage;