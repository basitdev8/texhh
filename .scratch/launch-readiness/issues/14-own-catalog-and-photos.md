# Replace the scraped catalogue with your own

Status: partially-resolved

## Completed

- The scraped catalogue and scraper/import scripts were deleted.
- `data/products.xlsx` now imports 26 supplied products into the database.
- All imported products have stock set to 1.
- `astbharat.com` was removed from the Next image allowlist and stale order-image URLs were
  cleared from the database.

## Remaining

Upload real product photography through the admin panel. The supplied spreadsheet did not
contain usable image URLs, so products currently use the storefront placeholder.
