# Abandoned Razorpay orders accumulate forever

Status: ready-for-human

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

## Resolution

Implemented a secured Vercel cron route and a 30-minute expiry rule. Abandoned checkouts are
excluded from dashboard totals, queues, and pending-payment counts; the dashboard also runs the
cleanup when opened. Orders with a payment ID are never expired.

## Launch check

Set `CRON_SECRET` in Vercel to a random secret before deploy. The committed Vercel schedule is
daily so it deploys on every plan; use a more frequent Vercel plan/schedule if unattended
30-minute expiry is required.
