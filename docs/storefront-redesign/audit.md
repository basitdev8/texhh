# Storefront redesign audit

Audited on 2026-08-31 from the rendered homepage at 1280×800, the storefront and admin source, [`references/hero.md`](../../references/hero.md), [`references/checkout.md`](../../references/checkout.md), and current public Samsung retail pages.

## Outcome

The existing site is not unfinished; it is committed to the wrong design thesis. “Editorial tech atelier” drives nearly every choice: warm paper, grain, serif italics, teal accents, oversized slogans, ornamental numbering, staggered cards, and vocabulary such as “edit,” “pieces,” and “objects.” That system creates personality, but it hides ordinary retail information and conflicts with the requested light, clean, Samsung-like product experience.

The redesign should retain the working commerce flows and real data, then replace the visual/content system with the [precision showroom contract](../../design-system/techchasers/MASTER.md).

## What is worth keeping

- Working catalog, product, cart, authenticated checkout, account/order, and admin flows.
- The PC Builder and compatibility checks as a strong product differentiator.
- Server-side cart validation for stock and price changes.
- Existing `next/image`, CSS Modules, CSS variables, reusable primitives, and reduced-motion support.
- Real homepage data, product imagery, categories, featured items, and store settings.
- Visible labels and inline validation on the current checkout.

## Problems to solve

### 1. Brand theater outranks shopping

The first viewport says “Objects of quiet obsession” and “premium tech atelier.” Lower modules repeat “the edit,” “pieces,” “compose your rig,” and manifesto copy. Customers looking for a phone, SSD, or GPU must translate brand language before taking action.

Target: state the offer plainly, use a real product as the hero, and make `Shop products` and `Build a PC` unambiguous.

### 2. The visual system is heavy despite pale colors

Warm cream fills, a fixed grain overlay, teal, serif italics, multiple type roles, extreme display sizes, wide all-caps labels, large radii, dark image plates, and repeated animation create more visual activity than a neutral retail system.

Target: white/cool-neutral canvas, two sans-serif roles already installed, one blue interaction color, restrained 8–16px radii, borders before shadows, and motion only for feedback.

### 3. Catalog comparison is weak

Product cards emphasize numbering, photography, and reveal actions. Key specs, availability, and delivery information are not consistently scannable. The catalog header consumes substantial space before filters/results.

Target: uniform cards, always-visible actions on touch, category-aware Signal Rails, clear stock/price state, compact headers, stable URL-driven filters, and shape-matched loading.

### 4. Navigation underweights search and taxonomy

The desktop header is centered around four links and icon-only utilities. Search is available but does not read as the main tool for a broad technical catalog. Category language is separated from the core paths.

Target: clear product families, first-class search on mobile and desktop, a predictable category menu, accessible 44px targets, and a compact sticky header.

### 5. Homepage is long and repetitive

The rendered page is roughly 5,700px tall at 1280px wide. It includes category cards, a tall/staggered featured grid, manifesto, marquee, a large builder module, statistics, subscription prompt, and a narrative-heavy footer. Several modules repeat brand mood instead of answering a new customer question.

Target: one hero, categories, product rail, PC Builder, confidence strip, one secondary rail, and a compact footer. Every section must create a distinct next step.

### 6. Checkout lacks progressive focus

The live checkout presents delivery, payment, and notes on one surface. The reference provides a clearer stepped model and a richer persistent summary, but its demo card-payment fields conflict with the current Razorpay integration.

Target: Delivery → Payment → Review, retain current payment business rules, preserve entered data through failure, and never collect raw card details.

### 7. System states are inconsistent by route

Some pages distinguish loading/error/empty; other fetches swallow errors and display an empty result. Some controls are hover-first, some disabled states do not explain why, and page-specific skeleton quality varies.

Target: an explicit state matrix for every data surface, with error recovery distinct from empty content.

### 8. Admin and storefront share color variables but need different density

A product-marketing layout should not be copied into operational tables/forms. The admin needs the same accessibility, type, color, and feedback contract with denser composition and safer mutations.

Target: one foundation, separate page grammar.

## What the supplied references contribute

### `hero.md`

Useful:

- one strong headline and short support copy;
- paired primary/secondary actions;
- immediate category access;
- product/category imagery carrying the visual weight;
- mobile navigation as an explicit surface.

Do not transplant:

- Tailwind/shadcn structure into this CSS Modules repo;
- Framer Motion or new UI dependencies;
- gradient text, glass/backdrop effects, corner cutouts, generic stock imagery, or sample taxonomy;
- the integrated-header shape, which competes with the desired quiet global shell.

### `checkout.md`

Useful:

- three named steps;
- step-local validation;
- visible labels and grouped fields;
- shipping/payment choices;
- product-rich sticky summary;
- skeletons, progress, and security reassurance.

Adapt:

- use current Indian address/payment behavior and real settings;
- keep Razorpay-hosted card handling, COD eligibility, and bank transfer;
- remove fake promo/tax/shipping calculations and US-only field assumptions;
- connect all recovery states to real APIs and order routes.

## What Samsung contributes

The useful current patterns are neutral global chrome, large product-led campaign media, short direct headlines, shallow CTA hierarchies, broad product-family navigation, recommendation rails, comparison content, and explicit delivery/support/payment reassurance. See [Samsung US](https://www.samsung.com/us/), [Samsung Smartphones](https://www.samsung.com/us/smartphones/), and [Galaxy Books](https://www.samsung.com/us/galaxybooks/).

TechChasers should not copy Samsung’s logo, fonts, blue, product assets, proprietary components, campaign composition, or exact navigation. The analogy is behavioral: products first, chrome quiet, choices clear.

## Chosen aesthetic risk

The Signal Rail turns technical specifications into the repeated structural signature across cards, product details, and the PC Builder. It is more distinctive and more useful than a decorative motif. No second signature treatment should compete with it.
