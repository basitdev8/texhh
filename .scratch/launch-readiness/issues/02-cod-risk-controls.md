# COD and Bank Transfer have no risk controls

Status: partially-resolved

## Problem

Checkout offers three payment methods. Two of them can lose money as written.

**Cash on Delivery** creates an order and decrements stock the moment the form is submitted.
There is no order value cap, no phone verification, and no admin confirmation step. Any
registered account can zero out inventory on ₹78,500 products with fake orders, and there is
no way to recover return freight on a refused delivery.

**Bank Transfer** tells the customer "We will send banking details after order placement".
Nothing sends anything — there is no email system at all (see issue 03). The order sits
pending forever and the customer hears nothing.

## Fix

- Cap COD at a configurable order value (₹10,000 suggested) using the `Settings` document
  that already holds the COD toggle.
- Hold stock for COD only after an admin marks the order confirmed, rather than on submit.
- Verify the phone number by OTP before accepting a COD order.
- Either remove Bank Transfer until a process exists behind it, or show static bank details
  on the order confirmation page and in the confirmation email.

## Notes

Deliberately deferred past launch. The uncapped-COD exposure was flagged and accepted for
week one.

## Resolution

- COD now has an admin-configurable order cap (₹10,000 default) enforced by both checkout and
  the server.
- Offline orders no longer decrement inventory at checkout. Stock is reserved exactly once when
  an admin confirms the order, and is released on cancellation.
- Bank transfer is disabled by default and rejected by the API until an admin deliberately
  enables it; this prevents orders being accepted without a payment process.

## Remaining

Phone OTP verification is not implemented because no SMS provider/account has been selected.
Keep COD disabled in Store Settings if OTP verification is required before launch.
