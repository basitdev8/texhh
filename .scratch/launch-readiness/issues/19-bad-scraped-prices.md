# Four products carry placeholder prices and are unpublished

Status: ready-for-human

## Problem

The scraped catalogue contains four products priced at ₹222, which is not a real price for
any of them:

- Google Pixel 10
- Google Pixel 10 Pro
- Google Pixel 9A
- Pixel Buds Pro with ANC

One of them had been picked as a homepage feature, so a ₹222 flagship phone would have been
the first thing a visitor saw. Anyone who bought one would have a contract at that price;
the Terms allow us to cancel an obvious pricing error, but only after the customer has been
charged and disappointed.

## What was done

All four were set to `isActive: false` — unpublished rather than deleted, so the real price
can be entered and the product published from the admin panel. They are unreachable by URL
and excluded from listings and search. A different product was promoted to the featured slot.

Active catalogue: 196 of 200 products.

## Fix

Set the correct price for each in `/admin/products`, then republish. Prices elsewhere in the
catalogue come from the same scrape and have not been individually checked — spot-check the
high-value lines before you take real orders, and see the own-catalogue ticket for replacing
this data wholesale.
