# Abandoned Razorpay orders accumulate forever

Status: ready-for-agent

## Problem

`POST /api/payment/razorpay` writes an order with `paymentStatus: 'pending'` before opening
the Razorpay modal. If the customer dismisses the modal or the tab dies, that order stays
pending forever. Nothing expires it, so the orders collection and the admin list fill with
noise, and `pendingPayments` on the dashboard becomes meaningless.

Stock is not affected — it is only decremented on capture — so this is operational hygiene
rather than an inventory problem.

## Fix

Mark pending Razorpay orders older than roughly 30 minutes as `abandoned` (a new payment
status, kept distinct from `failed` so genuine failures stay visible), via a Vercel cron
route. Exclude abandoned orders from dashboard counts. Never touch an order that already has
a `razorpayPaymentId`.
