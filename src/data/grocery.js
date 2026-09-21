/**
 * Fixed grocery test data (real values from the seeded staging catalog, not
 * generated) — org/location/terminal live in `env` since those come from
 * .env, but product data used to drive the cart flow lives here.
 */
export const groceryData = {
    product: {
        barcode: '5555500167159',
        name: 'mPOS Product 1',
        // Product search is a prefix match per field — a barcode *suffix* returns nothing, so
        // the partial barcode below is a leading substring, verified against the real catalog.
        partialBarcode: '555550016715',
        partialName: 'Product',
    },
    // Mobile number 9090909090 is the specific customer the account/location has credit
    // sales enabled for — the Credit tender tab on the Payment screen only appears once
    // this customer is attached to the cart (confirmed via exploration); the name is
    // locked to whatever's on file for an existing mobile number, so it only takes when
    // this customer doesn't already exist yet.
    customer: {
        mobileNumber: '9090909090',
        name: 'Demo Pallet',
    },
    // ₹1000/unit, reliably clears the "add items worth ₹100" threshold for the WELCOME10
    // dynamic coupon on a single unit — confirmed via exploration against the seeded catalog.
    couponEligibleProduct: {
        barcode: '5555500181605',
        name: 'Loyalty Product',
    },
    coupon: {
        dynamicCode: 'WELCOME10',
    },
    // A configured "Buy X Get Discount on Y" offer (100% off Y): buying buyProduct entitles
    // getProduct to a full discount — confirmed via exploration against the seeded catalog
    // (Offers (F10) drawer shows "Buy 1 test 244 and get 100% off on test 241").
    offer: {
        buyProduct: { barcode: '5555500184354', name: 'test 244' },
        getProduct: { barcode: '5555500184323', name: 'test 241' },
    },
    // Shared product for the cart-payment-methods suite — used identically across Cash,
    // Card, UPI, Credit, and Split so each test exercises the same tender amount.
    paymentProduct: {
        barcode: '5555500184316',
    },
    // Shared product for the hold-cart and clear-cart suites.
    holdClearProduct: {
        barcode: '5555500184262',
    },
    // Manager account used to approve Clear Cart — confirmed via exploration against
    // the seeded catalog (the manager picker lists "Sathish" and "Vanitha").
    manager: {
        name: 'Vanitha',
        pin: '1111',
    },
    // paymentProduct is ₹1700/unit (confirmed via exploration: 3 units totalled ₹5100 on
    // the Payment screen) — a single unit split across three tenders summing to exactly
    // ₹1700 (600 + 600 + 500) so the split fully settles the bill in three legs.
    splitPayment: {
        productQuantity: 1,
        legs: [
            { method: 'Cash', amount: '600' },
            { method: 'Card', amount: '600' },
            { method: 'UPI', amount: '500' },
        ],
    },
    // Loyalty eligibility isn't simply proportional to cart total — a ₹30 cart showed 0
    // eligible points in one run (likely a small-order threshold or a periodic cap), while
    // ₹200 (20 units) reliably showed eligible points and an enabled Redeem button.
    loyaltyRedemption: {
        productQuantity: 20,
    },
    // Arbitrary physical cash count for the "Closing Cash Check" screen in the Close Session
    // flow — exercises every denomination row. Doesn't need to match the terminal's actual
    // expected cash: that test only verifies the reconciliation screen renders and totals
    // correctly, it never finalizes the close.
    closingDenominationCounts: {
        500: 2,
        200: 1,
        100: 3,
        50: 2,
        20: 1,
        10: 2,
        5: 1,
        2: 2,
        1: 5,
    },
};
