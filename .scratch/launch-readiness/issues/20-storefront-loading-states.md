# Storefront loading states

Status: resolved

## Resolution

Raw loading text was replaced with branded loading states:

- Product listings use animated, responsive shimmer-card skeletons.
- Search, product detail, checkout, order detail, PC builder, and sign-in use an animated
  TechChasers loading mark.
- Motion respects `prefers-reduced-motion`.

`npm run lint` and `npm run build` pass; the repository still has two unrelated lint warnings.
