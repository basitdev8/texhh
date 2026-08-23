# Rate limiting is per-instance and does not cover payment routes

Status: ready-for-agent

## Problem

`src/lib/rateLimit.ts` keeps counters in process memory. On Vercel every serverless instance
holds its own map, so the login limit of 8 attempts per 15 minutes is really 8 per instance —
much weaker than it reads. The file documents this itself.

Worse, only `/api/auth/login` and `/api/auth/register` are limited at all. Order creation and
Razorpay order creation have no limit, so anyone with an account can spawn unlimited pending
orders and Razorpay order objects.

## Fix

- Add limits to `POST /api/orders` and `POST /api/payment/razorpay`, keyed on user id rather
  than IP
- Move the store to Upstash Redis (`@upstash/ratelimit`) so counters are shared across
  instances; free tier is sufficient at this volume
