# PC builder claims compatibility it never checks

Status: partially-resolved

## Problem

`src/app/(storefront)/pc-builder/page.tsx` sets `compatible = filled === STEPS.length` and
`BuildSummary.tsx` shows "✓ Compatible" on that basis alone. No socket, wattage, or form
factor is ever compared. `PCComponent.compatibility` exists in the schema and is read by
nothing.

The page copy promises "check compatibility live". Since builds are now purchasable, this is
a claim made against parts being sold — a mismatched socket or an underpowered PSU comes back
as a return with freight paid both ways.

## Fix

Real rules from the `specifications` map:

- CPU socket must equal motherboard socket
- PSU wattage must exceed summed component draw with headroom (GPU power draw is the driver)
- Case form factor must accept the motherboard form factor
- Cooler height must fit the case; RAM type (DDR4/DDR5) must match the motherboard

This needs consistent spec keys across every component, so it depends on the component
catalogue being real and clean. The 16 seeded components carry `Socket`, `Wattage`, `Power`
and `Form Factor` keys already, which is a start but not a guarantee.

## Resolution

The builder now evaluates the selected parts live and never calls a complete build
compatible merely because all eight slots are filled. It checks CPU/motherboard socket,
RAM DDR generation, PSU headroom, motherboard/case form factor, and cooler/case clearance.
Incompatible builds show the exact failures and cannot be added to cart. Missing supplier
specifications produce a review warning, never a green compatibility claim.

## Remaining catalogue work

The current seed data omits some required facts (notably motherboard RAM support and case
cooler clearance; some CPU power values are also absent). Add verified vendor values under
the recognised specification keys to turn those legitimate warnings into final compatibility
results for those component combinations.
