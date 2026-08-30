# Launch readiness — TechChasers storefront

## Goal

Take the first real order on `techchasers.in` this week. India-only, INR-only, Razorpay
as the primary payment path, account-required checkout.

## Context

Full audit of the codebase found the buy flow broken in several places at once: PC builder
carts could not be ordered at all, the money math was US-shaped (8% added tax, $9.99
shipping, `US` default country) while charges went out in INR, and the admin panel silently
truncated every list at 100 records against a catalogue of 200.

The database (`techhh`) holds real signups and three real orders, so all catalogue work is
additive — nothing wipes users or orders.

## Decisions

| Area | Decision |
| --- | --- |
| Market | India only, INR only, single GST registration |
| Tax | Prices are GST-inclusive. `tax` = `subtotal × 18/118`, a disclosure field, never added on |
| Shipping | Free above ₹5,000, flat ₹99 below. Dispatch 1–2 business days, delivery 3–7 |
| Settings | `Settings` singleton, editable at `/admin/settings`: shipping threshold, flat rate, GST rate, COD toggle, banner text |
| Catalogue | 26 supplied products imported from `data/products.xlsx`; each has stock 1; 8 auto-featured; 16 PC components remain separate; product images still need uploading |
| PC builder | Order items carry `itemType: 'product' \| 'component'`; both collections resolved at order time |
| Checkout | Account required, no guest checkout |
| Payments | Razorpay, Cash on Delivery and Bank Transfer all remain live; risk controls deferred (see issue 02) |
| Stock | Atomic conditional decrement, never negative |

## Scope shipped for launch

1. GST-inclusive money math and consistent storefront copy
2. `Settings` singleton and admin settings page
3. `itemType` on order items — PC builds become purchasable
4. Additive catalogue importer (products, components, featured picks)
5. Atomic stock decrement
6. Cart revalidation against the server before payment
7. Server-side pagination and search on admin products, orders, customers
8. Six correctness fixes (two live 500s, open redirect, inactive-product URL, password rule mismatch, CSP enforcement)
9. Policy pages — Terms, Privacy, Refund & Cancellation, Shipping, Contact
10. Admin product form validation with field-level errors
11. `seed.ts` guarded behind `--force-reset`
12. Dead code removed; empty rating furniture hidden

## Accepted risks for week one

- Image uploads fail until the Cloudinary key is replaced (issue 01)
- COD is uncapped and decrements stock on submit, with no phone verification (issue 02)
- Bank Transfer is offered with no process behind it (issue 02)
- No transactional email of any kind (issue 03)
- Cancelling an order does not restore stock or refund (issue 04)
- The PC builder claims compatibility it has not checked (issue 05)
- Product pages are not indexable by search engines (issue 06)
- Four products had placeholder scraped prices and are unpublished pending real ones (issue 19)

## Catalogue state after import

200 products (196 active), 11 categories, 16 PC components, no product images — the
storefront falls back to a single placeholder until real photography exists. Users and
orders were untouched by the import.
