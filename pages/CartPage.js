const BasePage = require('./BasePage');

class CartPage extends BasePage {
  constructor(page) {
    super(page);

    this.cartButton = page.getByRole('button').nth(1);
    this.mobileInput = page.getByPlaceholder('Enter Mobile Number');
    this.nameInput = page.getByRole('textbox', { name: 'Enter Name' });
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.productsButton = page.getByRole('button', { name: 'Products (F3)' });
    this.searchInput = page.getByRole('textbox', { name: 'Search Products here...' });
    this.addProductBtns = page.getByRole('button', { name: 'ADD' });
    this.quantityInput = page.getByPlaceholder('Quantity');
    this.peripheralsPanel = page.locator('div:nth-child(16)');
    this.peripheralsText = page.getByText('Peripherals');
    this.thermalPrinterText = page.getByText('Thermal Printer (Posiflex)');
    this.connectButton = page.getByRole('button', { name: 'Connect' });
    this.portInput = page.locator('#react-select-4-input');
    this.usbPortText = page.getByText('USB port', { exact: true });
    this.selectButton = page.getByRole('button', { name: 'SELECT' });
    this.totalButton = page.getByRole('button', { name: '(F1) Total ₹' });
    this.enterAmountText = page.getByText('Enter amount');
    this.amountInput = page.getByRole('spinbutton');
    this.payButton = page.getByRole('button', { name: '(F2) PAY ₹' });
    this.continueButton = page.getByRole('button', { name: 'CONTINUE' });
    this.skipButton = page.getByRole('button', { name: 'Skip' });
  }

  async openCart() {
    await this.click(this.cartButton);
  }

  async addCustomer(mobile) {
    await this.openCart();
    await this.fill(this.mobileInput, mobile);
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

  async addProduct(keyword, index = 0) {
    await this.openProducts();
    await this.searchProduct(keyword);
    await this.addProductByIndex(index);
  }

  async setQuantity(qty) {
    await this.fill(this.quantityInput, qty.toString());
    await this.click(this.addButton);
  }

  async openPeripherals() {
    await this.click(this.peripheralsPanel);
    await this.click(this.peripheralsText);
  }

  async connectThermalPrinter() {
    await this.click(this.thermalPrinterText);
    await this.click(this.connectButton);
    await this.click(this.portInput);
    await this.click(this.usbPortText);
    await this.click(this.selectButton);
  }

  async openCheckout() {
    await this.click(this.cartButton);
    await this.click(this.totalButton);
  }

  async payAmount(amount) {
    await this.click(this.enterAmountText);
    await this.fill(this.amountInput, amount.toString());
    await this.click(this.payButton);
  }

  async completePayment() {
    await this.click(this.continueButton);
    await this.click(this.skipButton);
  }

  async runCartSequence(data) {
    await this.addCustomer(data.customerMobile);
    await this.addProduct(data.productKeyword, 1);
    await this.addProduct(data.productKeyword, 0);
    await this.setQuantity(data.quantity);
    await this.openPeripherals();
    await this.connectThermalPrinter();
    await this.openCheckout();
    await this.payAmount(data.paymentAmount);
    await this.completePayment();
  }

  async assertCartLoaded() {
    await this.assertVisible(this.mobileInput, 'Cart page should be visible');
  }

  async assertProductsVisible() {
    await this.assertVisible(this.searchInput);
  }
}

module.exports = CartPage;
