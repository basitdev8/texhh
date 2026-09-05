# Home page override

Applies to `src/app/(storefront)/page.tsx`, its CSS module, and homepage-only components.

## Job

Orient a new visitor, expose the major shopping paths, and move them into a catalog, a product, or the PC Builder. The first viewport should answer what TechChasers sells and what to do next.

## Structure

The homepage is four primary moments, in this order, plus one slim reassurance line. Nothing else belongs on it.

1. Global header.
2. **Featured product hero.** One product, one concise title, one short supporting line, the price when available, and no more than two actions (`Shop`, `View products`). The product image is the dominant element and sits in the wider grid track. No eyebrow, no specification rail, no separate `View featured product` bubble, no explanatory paragraph.
3. **Visual category row.** A small number (max six) of image-led destinations with compact labels and product counts. No descriptive category cards.
4. **One curated product collection** (`Popular right now`) using the standard Product Card in `discoveryOnly` mode. One collection only — the second `Recently Added` rail is removed and must not return.
5. **PC Builder campaign.** One visual banner: one headline, one short sentence, one `Start a build` action. No instructional cards, no component-slot metadata paragraph.
6. **Reassurance strip.** Shipping, payment, and warranty as one slim line above the footer. Never three paragraph cards.
7. Compact footer.

The hero is a two-column stage on a `--color-bg-soft` surface: copy in a 5/12 track, product media in a 7/12 track, sized to its content with no dead zone. Below 900px it stacks copy then image. Long catalog names use the controlled long-title treatment (reduced size, clamped to three lines) so the hero never becomes a text wall.

## Keep from the current page

- Real featured products, categories, counts, and PC Builder data.
- Product-first imagery and the two main paths.
- The PC Builder as a major homepage module.

## Replace

- “atelier,” “edit,” “pieces,” and “objects” language with retail language.
- Three-line serif/italic hero, grain overlay, marquee, numbered ornaments, staggered cards, and manifesto copy.
- Large editorial dead zones and the oversized narrative footer.
- Uppercase section eyebrows (`BROWSE CATALOG`, `TOP PICKS`, `LATEST ADDITIONS`, `INTERACTIVE PC CONFIGURATOR`).
- The three PC-builder instruction cards and the three reassurance cards.
- The duplicate `Recently Added` product rail.

## States

- No featured product: the hero falls back to a short brand line with `Shop` and `Start a build`; no placeholder orb, no internal seeding message.
- No categories: omit the row and preserve section rhythm.
- No curated selection: the collection falls back to featured, then recently added products in the data layer; if none exist, omit the section. Do not add a second rail to fill the space.
- Data error: render the stable shell and a compact retry notice for the failed module.

## Acceptance

- Exactly one H1 and one dominant primary action in the hero.
- Each viewport has one obvious dominant idea; no section reads like a paragraph-heavy explainer.
- The hero product image is visually dominant over its headline.
- Homepage product cards contain no stock messaging, no add-to-cart control, and no Signal Rail.
- No text is baked into product images and no CTA depends on hover.
