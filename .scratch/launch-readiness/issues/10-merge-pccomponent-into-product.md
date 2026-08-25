# Merge PCComponent into Product

Status: ready-for-agent

## Problem

PC components live in their own collection with their own API, admin page, and stock field.
Making builds purchasable meant teaching the order routes to resolve two collections behind
an `itemType` discriminator on each order item. That works, but every stock, pricing, and
catalogue code path now has two branches, and components have no product page, no reviews, no
SEO surface.

## Fix

Fold components into `Product` under a `PC Components` category with a `componentType` field,
then:

- Retire `PCComponent`, `/api/pc-components`, and `/admin/pc-components` (the generic product
  admin covers them)
- Simplify the order routes back to a single lookup and drop the `itemType` branch
- Migration script mapping existing components to products, preserving `_id` so historical
  order items keep resolving

Chosen against for launch week because it touches the builder, the admin, the importer, and
every stock path at once.
