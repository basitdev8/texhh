# Products page fires one request per category for counts

Status: ready-for-agent

## Problem

`src/app/(storefront)/products/ProductsContent.tsx` fetches
`/api/products?category=<id>&limit=1` once per category purely to read
`pagination.total` for the filter chips. With 11 categories that is 11 extra round trips on
every visit to the listing page, each one a full `countDocuments` on the server.

## Fix

Add a counts endpoint (or fold counts into `GET /api/categories`) backed by one aggregation:

```js
Product.aggregate([
  { $match: { isActive: true } },
  { $group: { _id: '$category', count: { $sum: 1 } } },
])
```

One request, one pass over the index.
