# Razorpay live keys and webhook

Status: ready-for-human

## Problem

`.env` holds `rzp_test_...` keys, so the store cannot take real money as configured. The
webhook that confirms payments server-side also needs to exist on the live domain.

## Fix

1. Complete Razorpay activation if it is not already done. The reviewer opens the policy
   pages, so those must be live on `techchasers.in` first.
2. Create the webhook in the Razorpay dashboard: URL
   `https://techchasers.in/api/payment/razorpay/webhook`, events `payment.captured`,
   `payment.failed`, `order.paid`. The secret must match `RAZORPAY_WEBHOOK_SECRET` in the
   environment exactly.
3. Put `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` (live
   values) into the Vercel environment.
4. Run one real low-value purchase end to end before announcing anything.

The verify endpoint and the webhook both funnel into `fulfillPaidOrder`, which is idempotent,
so a payment confirmed twice cannot decrement stock twice.
