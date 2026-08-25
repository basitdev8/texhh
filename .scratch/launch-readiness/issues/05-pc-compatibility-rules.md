# PC builder claims compatibility it never checks

Status: ready-for-agent

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

Interim state at launch: the badge still lies. That was flagged and accepted.
