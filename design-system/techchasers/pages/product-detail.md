# Product detail override

Applies to `/products/[slug]` and Product Gallery.

## Job

Make an expensive product easy to evaluate and safe to purchase. The customer must understand variant-independent facts, price, availability, delivery expectations, and the next action without hunting.

## Desktop structure

- Breadcrumbs.
- Left 7/12 gallery with stable thumbnail navigation; right 5/12 sticky purchase column.
- Brand, product name, rating/review count when real, Signal Rail, price/savings, stock, quantity, and `Add to cart`.
- Delivery/payment/returns reassurance immediately below the action.
- Below the fold: overview, complete specifications, shipping/returns, and related products.

## Mobile structure

- Breadcrumbs collapse to a single back link.
- Gallery first, then product facts and price.
- A bottom purchase bar appears only after the main action scrolls away; it includes price and `Add to cart` and respects safe areas.
- Specifications use disclosure groups with descriptive headings, not an enormous two-column table.

## Rules

- Remove “piece,” “story,” decorative eyebrow lines, italic titles, and price-card ornament.
- Product facts come from real fields. Do not fabricate colors, variants, warranties, or delivery dates.
- Quantity controls expose names such as `Decrease quantity` and `Increase quantity`.
- When stock is zero, disable purchase, state why, and keep related products visible.

## States

- Loading: stable gallery and purchase-column skeleton.
- Not found: direct message, search field, and `Browse products`.
- Add success: button and cart badge confirm `Added to cart`; avoid navigation hijacking.
- Cart validation failure: inline message near the action with recovery.

## Acceptance

- Product name, price, stock, and primary action are visible without scrolling at 1440×900.
- Every gallery control works with keyboard and has an accessible name.
- Long names and 20+ specs remain readable at 375px.
