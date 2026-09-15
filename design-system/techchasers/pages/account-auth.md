# Account, orders, and authentication override

Applies to `/auth/login`, `/account`, and `/account/orders/[id]`.

## Job

Let customers sign in, understand current orders, and recover from failures with minimal friction.

## Authentication

- Centered form at a 440px maximum width on a white canvas; optional product image or trust copy may occupy the desktop side but disappears before the form becomes cramped.
- Visible labels, password show/hide control, inline errors, and one primary action.
- Login/register mode names remain consistent. Preserve the intended destination after successful authentication.
- Never imply an account exists or a reset path works unless the backend supports it.

## Account overview

- Compact greeting and identity summary; no editorial “member” language.
- Orders are the primary content, sorted newest first.
- Each order shows number, date, item count, total, fulfillment status, and payment status.
- Empty orders: `You haven’t placed an order yet` plus `Browse products`.

## Order detail

- H1 uses the order number; top summary includes placed date, total, payment, and delivery status.
- Timeline uses text, timestamp, and state icon. Current status is clear without color.
- Items link back to available products where possible.
- Shipping address, payment method, tracking, notes, and support appear in separate groups.

## States and acceptance

- Auth loading does not flash protected content.
- Authentication errors remain at the form; order-load errors include `Try again`.
- Status labels map exactly to domain states rather than inventing friendlier but ambiguous synonyms.
- All controls work at 200% zoom and 375px width.
