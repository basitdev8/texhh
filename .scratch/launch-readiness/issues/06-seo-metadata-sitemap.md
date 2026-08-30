# Product pages cannot be indexed by search engines

Status: resolved

## Problem

`products/[slug]`, `products`, and `search` are all `"use client"` components that fetch on
mount. Consequences:

- No `generateMetadata`, so every product shares the root title and description
- No Open Graph per product — every shared link previews as the generic site card
- No Product JSON-LD, so no price/availability rich results
- No `sitemap.xml`, no `robots.txt`

For a storefront this means organic search delivers nothing. Only the homepage is
server-rendered.

## Fix

1. `app/sitemap.ts` enumerating products and categories from the DB; `app/robots.ts`
2. Convert the product detail page to a server component with `generateMetadata`, splitting
   the interactive cart controls into a small client child
3. Product JSON-LD (`@type: Product` with `offers`, `price`, `priceCurrency: INR`,
   `availability`)
4. Same treatment for category and listing pages

Deferred from launch week because step 2 touches the file the buy flow runs through.

## Resolution

Added dynamic sitemap and robots routes, product/category/listing metadata, Open Graph and
Twitter cards, canonical product URLs, and Product JSON-LD with INR price and live availability.
The interactive buy flow remains a client component; SEO is provided by the server product layout
around it.
