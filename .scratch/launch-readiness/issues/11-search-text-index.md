# Search uses regex scans while a text index sits unused

Status: ready-for-agent

## Problem

`Product` declares `ProductSchema.index({ name: 'text', description: 'text', tags: 'text' })`
but `GET /api/products` searches with `$or` over three `$regex` clauses. The index is never
touched. Effects: full collection scan per search, no relevance ranking, no stemming, no
typo tolerance. Input is escaped against ReDoS, so this is performance and quality rather
than a security problem.

## Fix

Use `$text: { $search: q }` with `{ score: { $meta: 'textScore' } }` and sort by score, then
fall back to the regex path for very short queries and prefix matching where a text index is
weak. Revisit at catalogue sizes past a few thousand products, where Atlas Search becomes the
better answer.
