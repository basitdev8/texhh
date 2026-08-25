# No GST invoice

Status: ready-for-agent

## Problem

Prices are GST-inclusive and orders store a back-computed `tax` field, but nothing generates
an invoice: no numbered invoice series, no HSN code per product, no downloadable receipt, and
the order detail page does not even show the GST breakup.

For Indian electronics retail this is a compliance gap rather than a missing feature.

## Fix

1. Show the GST breakup on the order detail page (taxable value, CGST/SGST or IGST, total)
   — cheap, do this first
2. Add `hsnCode` to `Product` and expose it in the admin product form
3. Invoice number series (financial-year prefixed, gapless, stored on the order)
4. Downloadable PDF invoice with GSTIN, place of supply, and per-line HSN

Blocked on facts: the business GSTIN and per-product HSN codes. Also note that intra-state
versus inter-state supply decides CGST+SGST versus IGST, which needs the registered state.
