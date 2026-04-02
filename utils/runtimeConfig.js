const testData = require('../data/testData.json');

function getRuntimeConfig() {
  return {
    baseURL: process.env.BASE_URL || 'https://upcoming-pos.palletnow.co/',
    user: {
      mobile: process.env.POS_MOBILE || testData.users.valid.mobile,
      pin: process.env.POS_PIN || testData.users.valid.pin,
    },
    session: {
      cashAmount: process.env.POS_CASH_AMOUNT || testData.session.cashAmount,
    },
    customer: {
      mobile: process.env.POS_CUSTOMER_MOBILE || testData.customer.mobile,
      name: process.env.POS_CUSTOMER_NAME || testData.customer.name,
    },
    product: {
      keyword: process.env.POS_PRODUCT_KEYWORD || testData.product.keyword,
    },
  };
}

module.exports = {
  getRuntimeConfig,
};
