# Resend transactional email

The app sends transactional email through Resend. Add these values to `.env` locally and to the deployment environment before going live:

```dotenv
# Required
RESEND_API_KEY=re_your_api_key
RESEND_FROM="TechChasers <orders@techchasers.in>"

# Recommended
RESEND_REPLY_TO=support@techchasers.in
RESEND_ORDER_NOTIFICATION_EMAIL=owner@techchasers.in
NEXT_PUBLIC_APP_URL=https://techchasers.in

# Used only by `npm run test-email`; defaults to RESEND_ORDER_NOTIFICATION_EMAIL.
RESEND_TEST_TO=you@techchasers.in
```

`RESEND_FROM` must use a sending domain verified in the Resend dashboard. No secret is exposed to the browser.

## What sends mail

- Account created: customer welcome email.
- COD or bank-transfer order created: customer order confirmation and optional internal new-order alert.
- Razorpay payment confirmed: customer payment confirmation and optional internal paid-order alert.
- Admin changes an order to shipped, delivered, or cancelled: customer status email. Shipping mail includes carrier, tracking number, and estimated delivery when available. Updating shipment details after dispatch also sends the refreshed tracking information.

Mail is non-blocking: a Resend outage never cancels a valid registration, payment, or order update. Resend idempotency keys prevent duplicate email when payment verification and a webhook race or retry.

## Test after setting `.env`

```bash
npm run test-email
```

The command sends one test email to `RESEND_TEST_TO` (or `RESEND_ORDER_NOTIFICATION_EMAIL`) and returns a non-zero exit code when Resend rejects it.
