# Cancel and refund are labels with no behaviour

Status: ready-for-agent

## Problem

An admin can set an order to `cancelled` and its payment to `refunded` from
`/admin/orders/[id]`, but neither does anything real:

- Stock is never restored, so every cancellation permanently loses inventory from the
  catalogue. Inventory drifts wrong from the first cancelled order.
- No Razorpay refund is issued. The money stays captured until someone refunds it by hand in
  the Razorpay dashboard.
- Customers cannot cancel at all — there is no button, so every cancellation arrives as an
  email or phone call.

## Fix

- Restore stock when an order moves to `cancelled` (guard against double-restore the way
  `fulfillPaidOrder` guards double-decrement — a conditional update, not a read-then-write).
- Call the Razorpay refund API when payment status moves to `refunded`, and record the
  refund id on the order.
- Let customers cancel while status is `pending` or `processing`.
- Whatever ships must match what the Refund & Cancellation policy page states.
