# No transactional email of any kind

Status: ready-for-agent

## Problem

Nothing in the codebase sends email. A customer who pays ₹78,500 gets a redirect to their
order page and nothing else — no confirmation, no receipt, no dispatch notice. Nobody is
notified when an order arrives either, so an order can sit unnoticed until someone opens the
admin dashboard.

## Fix

Resend is the shortest path on Vercel: three DNS records on `techchasers.in`, one API key.

Ship in this order:

1. Customer order confirmation (order number, items, GST-inclusive total, shipping address)
2. Admin new-order alert
3. Payment received
4. Shipped, with tracking number and carrier

The order status transitions that should trigger mail already exist in
`src/app/api/orders/[id]/route.ts` (`statusHistory` is written on every change), so the hooks
have somewhere obvious to live.
