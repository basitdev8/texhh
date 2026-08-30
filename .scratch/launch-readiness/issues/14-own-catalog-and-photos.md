# Replace the scraped catalogue with your own

Status: resolved

## Completed

- The scraped catalogue and scraper/import scripts were deleted.
- `data/products.xlsx` now imports 26 supplied products into the database.
- All imported products have stock set to 1.
- `astbharat.com` was removed from the Next image allowlist and stale order-image URLs were
  cleared from the database.
- 198 public OneDrive product images were downloaded, validated, uploaded to Cloudinary, and
  mapped in order to the correct 26 product records.
- Product image order is now controllable from admin product edit via drag and drop.
- Product specifications are populated for all 26 products.

## Resolution

The supplied OneDrive folders were resolved as public image downloads and stored locally before
the Cloudinary upload. Every product now has its mapped gallery rather than a storefront
placeholder. The downloader and uploader remain available for future catalogue updates.
