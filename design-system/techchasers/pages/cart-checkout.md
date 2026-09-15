# Cart and checkout override

Applies to `/cart`, `/checkout`, Cart Item, checkout fields, payment choices, and order summary.

## Job

Preserve confidence from cart review through successful order creation. The business rules already in the app—server cart validation, stock changes, authentication, Razorpay, cash on delivery, and bank transfer—remain authoritative.

Reduce instructional prose and repeated boxed summaries. Compact labels, clear totals, one dominant next action, and progressive disclosure for secondary order information. Copy is sentence case: `Cart`, `Order summary`, `Checkout`, `Total`, `Shipping`, `GST (n%)`, `Secure checkout`.

## Cart

- H1 (`Cart`) and item count.
- The free-shipping line is text only and appears only while the customer does not yet qualify. No progress bar.
- Desktop: item list plus sticky Order Summary; mobile: list then summary with a sticky `Checkout` bar after content.
- Each line includes image, product/component label, name, quantity, current price, stock warning, remove action, and line total.
- Server validation changes appear above the affected lines and inside them. `Review changes` is not enough: state the old/new price or stock limit.
- Empty cart: one short message, `View products`, and `Build a PC`. No marketing sentence.

## Checkout flow

Adopt the useful structure from `references/checkout.md`, adapted to current payment behavior:

1. Delivery: name, address, city, state, postal code, country, phone.
2. Payment: Razorpay, cash on delivery when eligible, or bank transfer; never collect raw card fields.
3. Review: address, payment choice, notes, item list, and final total before placing the order.

Use a semantic stepper with text labels. Step headings are the step name only (`Delivery`, `Payment`, `Review`) — the stepper already numbers them. Completed steps are editable. Validation is step-local, and the first invalid field receives focus.

Review blocks and the order summary use a hairline border on the page background, not a tinted panel.

Desktop uses a 2/3 form and 1/3 sticky summary. Mobile shows a compact expandable summary near the top and a safe-area-aware bottom action with the current total.

## Order Summary

- Product thumbnails and quantities remain visible.
- Subtotal, shipping, tax, savings when real, and total use aligned tabular numerals.
- Display the payment method and any COD limit before the final action.
- Security reassurance is factual: secure payment, supported provider, and support path. Avoid fake seals.

## Failure and recovery

- Empty/invalid cart: block checkout, explain the line issue, and link to cart.
- Razorpay script failure: keep entered delivery data and offer retry or another eligible method.
- Payment cancel: state that no payment was completed and preserve the order/cart state.
- Verification uncertainty: do not claim failure if status is unknown; tell the customer how to check orders or contact support.
- Duplicate submission: action locks and shows progress until a definitive response.
- Success: clear the cart only after confirmed order creation and route to the real order detail/confirmation surface.

## Acceptance

- Back/forward movement preserves valid data.
- No raw card number, expiry, or CVV fields are added.
- Every total matches the server-calculated amount.
- A customer can recover from each payment failure without re-entering the delivery address.
