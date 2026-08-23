# Three existing orders were written under the old tax math

Status: wontfix

## Problem

Three orders predate the GST-inclusive change. They were stored with tax added on top at 8%
and shipping at 9.99, computed as if in dollars. Their `subtotal + tax + shippingCost` equals
`totalAmount`, whereas new orders store `tax` as an inclusive disclosure figure where it does
not.

Any report that sums `tax` across all orders mixes the two conventions.

## Decision

Left as-is. They are test-era records, the amounts are small, and rewriting stored financial
history to match new arithmetic is worse than a documented discontinuity. Revisit only if
these orders ever need to appear on a GST return — in which case correct them by hand rather
than by migration.
