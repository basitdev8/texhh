# Product detail override

Applies to `/products/[slug]` and Product Gallery.

## Job

Make an expensive product easy to evaluate and safe to purchase. The customer must understand variant-independent facts, price, availability, delivery expectations, and the next action without hunting.

## Desktop structure

- Breadcrumbs.
- Left 7/12 gallery with stable thumbnail navigation; right 5/12 sticky purchase column.
- One order, no exceptions: identity (brand, product name, Signal Rail, short description), then price, then the purchase action, then reassurance, then details.
- Price and availability are plain text, not a tinted bordered price card. One stock statement (`In stock` / `Only n left` / `Out of stock`), the compare price, and the discount percentage — do not also repeat a savings amount or a status pill.
- Delivery/payment/returns reassurance sits immediately below the action as a compact list under one hairline.
- Below the fold: overview, complete specifications, shipping/returns, and related products.

## Mobile structure

- Breadcrumbs collapse to a single back link.
- Gallery first, then product facts and price.
- A bottom purchase bar appears only after the main action scrolls away; it includes price and `Add to cart` and respects safe areas.
- Specifications show the first six, with a quiet text control (`Show n more specifications` / `Show fewer specifications`) carrying `aria-expanded` and `aria-controls`. Rows are hairline-separated, not a bordered striped table. Below 768px they stack label over value.

## Rules

- Remove “piece,” “story,” decorative eyebrow lines, italic titles, and price-card ornament.
- Product facts come from real fields. Do not fabricate colors, variants, warranties, or delivery dates.
- Quantity controls expose names such as `Decrease quantity` and `Increase quantity`.
- When stock is zero, disable purchase, state why, and keep related products visible.

## States

- Loading: stable gallery and purchase-column skeleton.
- Not found: direct message and `View products`. The header search is continuously visible on this route, so do not add a second search control.
- Add success: button and cart badge confirm `Added to cart`; avoid navigation hijacking.
- Cart validation failure: inline message near the action with recovery.

## Acceptance

- Product name, price, stock, and primary action are visible without scrolling at 1440×900.
- Every gallery control works with keyboard and has an accessible name.
- Long names and 20+ specs remain readable at 375px.
