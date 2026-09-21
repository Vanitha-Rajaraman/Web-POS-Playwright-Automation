import { registerTests as qsrSessionStart } from '../restaurant-qsr/SessionStart.spec.js';
import { registerTests as dineInSessionStart } from '../restaurant-dinein/SessionStart.spec.js';
import { registerTests as grocerySessionStart } from '../grocery/SessionStart.spec.js';
import { test, registerDomainSuite } from '../../src/fixtures/domainSession.js';
import { registerTests as groceryLogin } from '../grocery/Login.identity.spec.js';
import { registerTests as cartOrder } from '../grocery/Cart.order.spec.js';
import { registerTests as productSearch } from '../grocery/CartProductSearch.spec.js';
import { registerTests as cartHold } from '../grocery/HoldCart.spec.js';
import { registerTests as cartClear } from '../grocery/ClearCart.spec.js';
import { registerTests as cartOffer } from '../grocery/Offer.spec.js';
import { registerTests as cartCoupon } from '../grocery/Coupon.spec.js';
import { registerTests as loyalty } from '../grocery/Loyalty.spec.js';
import { registerTests as payments } from '../grocery/Payment.methods.spec.js';
import { registerTests as sessionClose } from '../grocery/SessionClose.review.spec.js';
import { registerTests as groceryLogout } from '../grocery/Logout.spec.js';
import { registerTests as dineInLogin } from '../restaurant-dinein/Login.identity.spec.js';
import { registerTests as dineInLogout } from '../restaurant-dinein/Logout.spec.js';
import { registerTests as qsrLogin } from '../restaurant-qsr/Login.identity.spec.js';
import { registerTests as qsrLogout } from '../restaurant-qsr/Logout.spec.js';

// A single registration point guarantees order across feature files. If a case
// fails, skip later cases and attempt logout in afterAll instead of logging in again.
test.describe('POS ordered domain sessions', () => {
  test.describe.configure({ mode: 'serial', retries: 0 });
  registerDomainSuite('grocery', ['@grocery'], () => {
    groceryLogin();
    grocerySessionStart();
    cartOrder();
    productSearch();
    cartHold();
    cartClear();
    cartOffer();
    cartCoupon();
    loyalty();
    payments();
    sessionClose();
    groceryLogout();
  });
  registerDomainSuite('restaurant-dinein', ['@restaurant', '@dinein'], () => {
    dineInLogin();
    dineInSessionStart();
    // Register future dine-in feature cases here; each uses the same page.
    dineInLogout();
  });
  registerDomainSuite('restaurant-qsr', ['@restaurant', '@qsr'], () => {
    qsrLogin();
    qsrSessionStart();
    // Register future QSR feature cases here; each uses the same page.
    qsrLogout();
  });
});
