# No review system, and the empty furniture was hidden

Status: ready-for-agent

## Problem

`Product` carries `rating` and `reviewCount`, and the product page rendered "★ 0.0 · 0
reviews" on every item because nothing ever writes them. On a new store that reads as
"nobody bought this", so the rating row is now hidden.

## Fix

- `Review` model: product, user, rating 1–5, title, body, verified-purchase flag, created
- Only customers with a `delivered` order containing the product may review it
- Recompute `rating` and `reviewCount` on the product when a review lands
- Admin moderation queue
- Unhide the rating row on the product page, and add `aggregateRating` to the Product JSON-LD
  from issue 06

Social proof matters at ₹78,500 price points, but it cannot have content on day one.
