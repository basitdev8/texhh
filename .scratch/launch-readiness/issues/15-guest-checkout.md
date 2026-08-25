# Guest checkout

Status: ready-for-agent

## Problem

Checkout requires an account: `/checkout` redirects to login, and `Order.user` is a required
reference. Every first-time buyer must register before paying, which costs conversion.

## Fix

- Allow an order with an email and phone instead of a user reference (make `user` optional and
  add a `guestEmail`)
- Order lookup by order number plus email, since a guest has no account page
- Offer account creation after payment, claiming the order retroactively

Kept out of launch deliberately: a half-built guest flow produces orders that cannot be traced
back to anyone.
