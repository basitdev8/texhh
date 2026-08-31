# Home page override

Applies to `src/app/(storefront)/page.tsx`, its CSS module, and homepage-only components.

## Job

Orient a new visitor, expose the major shopping paths, and move them into a catalog, a product, or the PC Builder. The first viewport should answer what TechChasers sells and what to do next.

## Structure

1. Global header.
2. One campaign hero: short product-specific headline, one sentence, `Shop products`, `Build a PC`, and one real featured product image.
3. Category row using real categories and imagery.
4. `Popular right now` product rail using the standard Product Card.
5. PC Builder module: the parts journey, compatibility promise, current component count, and `Start a build`.
6. Confidence strip: delivery, secure payment, support, and returns using live settings where available.
7. Recently added or recommended rail.
8. Compact footer.

Desktop hero is a 5/7 or 6/6 text/image split on a `--color-bg-soft` stage with a maximum height near 720px. Mobile stacks text before image; both primary actions remain above the fold on a 667px-tall viewport.

## Keep from the current page

- Real featured products, categories, counts, and PC Builder data.
- Product-first imagery and the two main paths.
- The PC Builder as a major homepage module.

## Replace

- “atelier,” “edit,” “pieces,” and “objects” language with retail language.
- Three-line serif/italic hero, grain overlay, marquee, numbered ornaments, staggered cards, and manifesto copy.
- Large editorial dead zones and the oversized narrative footer.

## States

- No featured product: category-first hero with `Shop products`; no placeholder orb or internal seeding message.
- No categories: omit the row and preserve section rhythm.
- No recommendations: show recently added products; if none exist, omit the rail.
- Data error: render the stable shell and a compact retry notice for the failed module.

## Acceptance

- Exactly one H1 and one dominant primary action in the hero.
- At least one real category and one real product are reachable without scrolling on desktop.
- Product cards use the Signal Rail where specs exist.
- No text is baked into product images and no CTA depends on hover.
