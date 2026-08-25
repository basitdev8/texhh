# Replace the scraped catalogue with your own

Status: ready-for-human

## Problem

`data/astbharat.json` is a scrape of `astbharat.com` — 200 products with names, brands,
prices, and full descriptions copied verbatim, plus 1323 image URLs pointing at
`astbharat.com/wp-content/uploads/...`.

The images are not being used (products import with none, behind a placeholder), but the
copied text is live, and `next.config.ts` still whitelists `astbharat.com` as an image host.

Two exposures: copyright on the descriptions, and a catalogue that describes products you may
not actually stock or price the same way.

## Fix

- Real product data: your own SKUs, prices, stock levels, and written descriptions
- Your own photography, uploaded through the admin panel once issue 01 is resolved
- Remove `astbharat.com` from `next.config.ts` image `remotePatterns`
- Delete `data/astbharat.json` and `scripts/scrape-astbharat.mjs` once the catalogue is real

Until then the storefront is trading on someone else's product copy.
