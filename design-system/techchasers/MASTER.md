# TechChasers design system

This is the storefront and admin UI source of truth. When implementing a page, read this file first, then the matching file in `pages/`; page rules override this file only where they are more specific.

## North star: precision showroom

TechChasers is a multi-brand electronics shop for people choosing phones, PCs, components, and accessories. The interface should feel as calm and product-led as a modern Samsung retail page without copying Samsung branding, layouts, assets, or proprietary type.

The experience is:

- light: white and cool-gray surfaces, generous negative space, no visual texture;
- direct: familiar retail language such as “Products,” “Add to cart,” and “Order summary”;
- technical: the facts needed to compare products are visible before marketing prose;
- trustworthy: price, stock, delivery, payment, compatibility, and recovery states are explicit;
- fast: motion and decoration never delay product discovery or checkout.

The primary customer is comparing expensive technical products on mobile or desktop. Their main job is to find a compatible product or build, understand the tradeoffs, and buy it with confidence. “Shop products” is the primary storefront action; “Build a PC” is the differentiated secondary path.

## Design dials

| Dial | Target | Meaning |
| --- | --- | --- |
| Variance | 3/10 | Symmetric, grid-led layouts with one deliberate exception: the Signal Rail |
| Motion | 3/10 | State feedback and short entrances only |
| Density | 3/10 | One dominant idea per marketing viewport; efficient catalog, builder, checkout, and admin surfaces |

## Signature: the Signal Rail

The Signal Rail is a quiet row of two or three category-specific facts placed below a product name or beside its image. Examples: `6.7″ AMOLED · 256 GB · 5G`, `RTX 5070 · 32 GB · 1 TB`, or `AM5 · ATX · DDR5`.

- Use real structured specifications, never invented copy.
- Choose facts that help compare items in the current category.
- Keep one line on cards; allow two lines only on a product detail page.
- Use tabular numerals and subtle separators. It is information, not a badge cloud.
- Omit the rail when reliable specs are unavailable.

The rail belongs on comparison surfaces. It is **not** rendered on homepage discovery cards, where it competes with product recognition; there the image, name, and price carry the card. The product detail page is its primary home.

This is the single expressive system element. Everything around it remains quiet.

## Foundations

### Color

Use semantic tokens in components. The existing token names may remain during migration, but their final values and roles must match this table.

| Role | Target token | Value | Use |
| --- | --- | --- | --- |
| Canvas | `--color-bg` | `#FFFFFF` | Page background |
| Subtle surface | `--color-bg-soft` | `#F5F6F8` | Product image wells, grouped content |
| Muted surface | `--color-bg-alt` | `#ECEFF3` | Selected/filter/step surfaces |
| Raised surface | `--color-surface` | `#FFFFFF` | Header, summary, modal |
| Ink | `--color-ink` | `#101114` | Primary text and dark actions |
| Secondary text | `--color-text-secondary` | `#4B5563` | Supporting copy |
| Muted text | `--color-text-muted` | `#667085` | Metadata that passes contrast on white and soft surfaces |
| Border | `--color-border` | `#D8DCE3` | Controls and strong dividers |
| Soft border | `--color-border-light` | `#E9EBEF` | Section and card separation |
| Action blue | `--color-accent` | `#1428A0` | Links, focus, selected states, key highlights |
| Action hover | `--color-accent-hover` | `#0E1E7A` | Hover/pressed action |
| Action tint | `--color-accent-subtle` | `#F0F3FF` | Selected state background |
| Success | `--color-success` | `#18794E` | In stock, complete, paid |
| Success tint | `--color-success-light` | `#ECFDF3` | Success notice background |
| Warning | `--color-warning` | `#A15C00` | Low stock, compatibility caution |
| Warning tint | `--color-warning-light` | `#FFF7E6` | Warning notice background |
| Error | `--color-error` | `#C4320A` | Invalid, failed, unavailable |
| Error tint | `--color-error-light` | `#FFF1ED` | Error notice background |

Rules:

- At least 80% of any storefront viewport should be white or a cool neutral.
- Blue indicates interaction or selection; it is not ambient decoration.
- Green, amber, and red communicate state only.
- Use dark hero media only when the actual product image requires it; the page chrome remains light.
- Body text and control labels meet 4.5:1 contrast. Focus and component boundaries remain independently visible.

### Typography

One family. Load Inter through `next/font` with a raw face variable and semantic family tokens; never point a semantic font custom property back to itself. `--font-heading` and `--font-display` remain as aliases of `--font-body` so existing rules keep working — do not repoint them at a second family.

- Inter, weights 400–600: logo, headings, navigation, body, controls, prices, specs, tables, and metadata.
- Weight `700` is reserved for a truly primary headline or price. Prefer `400`, `500`, and `600`.
- Manrope is removed from the rendered UI. Do not reintroduce a display face, Outfit, Fraunces, or serif/italic display treatments.

Type scale:

| Token | Desktop | Mobile | Use |
| --- | --- | --- | --- |
| Hero | `clamp(2rem, 3.6vw, 3rem)` | `clamp(1.75rem, 7.4vw, 2.25rem)` | Homepage featured product only, and always subordinate to the product image |
| H1 | `clamp(1.75rem, 2.6vw, 2.25rem)` | fluid | One per page |
| H2 | `clamp(1.5rem, 2.2vw, 2rem)` | fluid | Major sections |
| H3 | `1.125rem` | same | Card/group titles |
| Body | `0.875rem–1rem` | same | Default copy, 1.45–1.6 line height |
| Small | `0.875rem` | `0.875rem` | Metadata and helper text |
| Micro | `0.75rem` | `0.75rem` | Labels only; never long copy, never below 12px |

Use sentence case everywhere. Do not use repeated uppercase eyebrow labels above section headings — they were removed from the homepage, catalog, account, PC Builder, and policy pages and must not return. Reserve all caps for a short brand or status label. Do not add wide letter spacing to body, buttons, or navigation. Prices and comparison data use tabular numerals.

### Spacing and layout

Use the existing 4px-based spacing tokens. Favor `8, 12, 16, 24, 32, 48, 64, 96` px.

- Content max width: 1440px.
- Reading/form max width: 720px.
- Desktop gutter: 32px; tablet: 24px; mobile: 16px.
- Marketing section spacing: 80–112px desktop, 56–72px mobile.
- Transactional section spacing: 32–48px desktop, 24–32px mobile.
- Product grids: 4 columns large desktop, 3 at 1024–1279px, 2 at 640–1023px, 2 compact or 1 detailed below 640px depending on content.

Whitespace groups related content. Do not use empty space to create drama around routine forms or catalog controls, and do not leave dead zones inside a campaign stage — size the stage to its content.

Marketing sections are serialized: one dominant idea per viewport, separated by 80–112px on desktop and 48–72px on mobile.

### Shape and elevation

| Element | Radius |
| --- | --- |
| Buttons, inputs, chips | 8px |
| Product media wells and grouped panels | 12px |
| Campaign/image stage | 16px |
| Pills | 999px only for statuses and compact toggles |

One radius language. Product media may be rounded; ordinary sections must not all become rounded cards.

Prefer whitespace and alignment over borders, nested cards, tinted panels, and shadows. Product and category cards carry **no** border, no card fill, and no shadow — the image well and the spacing define them. Reserve borders for genuine grouping (order summary, review blocks, spec rows) and shadows for genuinely floating UI: search suggestions, menus, drawers, modals, and sticky purchase bars. Hover must not change layout.

### Imagery

- Product imagery is the visual hero: clean crop, neutral background, consistent scale, no color overlays.
- Reserve intrinsic space with `next/image`, accurate `sizes`, and aspect ratios to prevent layout shift.
- Product cards use `object-fit: contain`; lifestyle campaign modules may use `cover`.
- Do not place long copy over detailed product photography. When overlay text is unavoidable, provide a verified contrast scrim.
- Never reuse Samsung assets or mimic Samsung product compositions. Use catalog imagery and TechChasers content.

## Shared components

### Header and navigation

One compact commerce row. There is no second navigation tier at any width.

- 60–68px white header with a soft bottom divider; sticky from the first pixel.
- One row: logo, persistent search, at most two inline destinations (`Products`, `Build a PC`), then account, cart, and `Menu`.
- Search is a continuously visible field with the placeholder `Search for products`. Focus uses a quiet neutral border — never a blue rectangle or glow. Suggestions render in a compact anchored dropdown with loading, no-result, and error states, and submitting routes to `/products?search=…`. Do not reintroduce a search icon, modal, overlay, or full-screen mobile search surface.
- Lower-priority category navigation lives in the `Menu` drawer, not in the bar. The drawer is a labelled dialog: it locks background scroll, moves focus to its close button, closes on Escape or backdrop click, and restores focus to the trigger.
- Category labels come from real catalog taxonomy.
- Cart count has an accessible label. Icon targets are at least 44×44px.
- Below 480px the bar may add one full-width search row; the result must stay near 100px, well under the retired two-tier header.

### Buttons and links

Labels are direct: `Shop`, `Learn more`, `View products`, `Start a build`, `Add to cart`, `Checkout`. No ornamental `→`/`←` glyphs inside labels.

- Primary: dark ink fill with white text. Use for the page’s decisive action — one per view.
- Accent: blue fill with white text. Use for selected/transactional emphasis, not alongside another equally strong action.
- Secondary: white/transparent with a 1px border.
- Tertiary: text link with underline on hover/focus.
- Minimum height: 44px; checkout and mobile sticky actions: 48–52px.
- Loading retains the control width, shows progress, and blocks duplicate submission.
- Disabled state remains legible and explains unmet requirements nearby.

### Product card

Reading order: image → promotion → brand → product name → Signal Rail (comparison surfaces only) → price → action.

- Borderless: a rounded `--color-bg-soft` image well, then text on the page background. No card border, fill, or shadow.
- The image link and the name link both reach the product; the name link fills its clamped block so it is a real target.
- Catalog add-to-cart is a **secondary** control (bordered, ink text, ink fill on hover). A grid of filled buttons out-shouts the products. Reserve the filled style for a page's single decisive action.
- Add-to-cart is visible without hover on touch and keyboard layouts.
- Homepage discovery cards (`discoveryOnly`) render no stock messaging, no add-to-cart, and no Signal Rail.
- Show compare price and savings only when real.
- Show `Out of stock` or `Only n left` close to price/action on comparison surfaces.
- Names clamp to two lines (three below 640px) with the block reserved so prices and actions stay aligned across a row.
- Avoid index numbers, ornamental arrows, image zoom beyond 1.02, or staggered card offsets.

### Filters and sorting

Filters and sorting read as utilities, not as a dashboard toolbar: borderless category chips with a quiet selected state, one divider, and compact price/sort controls.

- Desktop: visible category/brand/price/availability filters with result count and sort.
- Mobile: filter and sort buttons remain visible; filters open a drawer with Apply and Clear actions.
- Active filters appear as removable chips; URL query parameters remain the state source of truth.
- Loading preserves the grid shape. Empty results explain which filters caused the state and offer `Clear filters`.

### Forms

- Visible labels are required; placeholders demonstrate format only.
- Inputs are 48px tall, 16px text on mobile, with persistent borders.
- Error text sits below the field and is connected with `aria-describedby`.
- First invalid field receives focus after submit. A form-level error summarizes server/payment failures.
- Optional fields are marked optional; required fields do not rely on asterisks alone.
- Preserve user input after network or payment failure.

### Feedback and system states

Every data-driven surface defines loading, empty, error, ready, and relevant success/disabled states.

- Loading: shape-matched skeletons; no indefinite blank canvas.
- Empty: direct explanation plus one recovery action.
- Error: what failed, what remains safe, and what the user can do next.
- Success: confirm the action using the same verb as the initiating control.
- Toasts announce incidental success; blocking failures remain inline.

### Tables and admin controls

- Tables prioritize scanability: restrained row height, sticky header when useful, right-aligned numeric data, and text-plus-color statuses.
- Collapse to labeled rows or horizontal overflow on small screens; never shrink text below 12px.
- Destructive actions require clear target naming and confirmation where recovery is difficult.

## Motion

Use CSS transitions already supported by the project. Do not add GSAP, Framer Motion, or another animation dependency for this redesign.

- Hover/focus/selection: 120–180ms.
- Drawer, menu, modal: 180–240ms.
- Optional first-view hero entrance: opacity plus at most 8px translation, 280–360ms, once.
- Animate `transform` and `opacity`, not layout dimensions.
- No parallax, continuous marquees, drifting product plates, spring rotation, or universal scroll reveals.
- Under `prefers-reduced-motion: reduce`, render the final state immediately and retain only essential feedback.

## Responsive structure

Verify at 375, 768, 1024, and 1440px.

- 375px: single-column forms, compact two-column product grid only when labels remain readable, sticky mobile checkout/builder action, no clipped chips.
- 768px: two-column catalogs, drawer filters, order summary below the main task unless sticky space is safe.
- 1024px: three-column catalog, two-column transactional layout, desktop navigation.
- 1440px: four-column catalog within the max-width container; line lengths remain bounded.

Breakpoints change structure. They do not merely scale the desktop layout down.

## Content language

Use the customer’s vocabulary: products, categories, cart, checkout, parts, build, order, delivery, payment, and support. Keep copy specific and calm.

- Use `Catalog`, not `The Edit`.
- Use `Product`, not `Piece` or `Object`.
- Retired: `Studio / …` policy eyebrows, `Configuration Progress`, `Shopping Cart`, `Proceed to Checkout`, `Encrypted 256-bit …`. Use `Cart`, `Checkout`, `Progress`, `Secure checkout`.
- Every marketing section gets one headline and at most one short supporting sentence. Delete copy that explains what the layout already demonstrates.
- Use `PC Builder`, not `Atelier` or `Compose your rig` as navigation language.
- Button verbs remain consistent through feedback: `Add to cart` → `Added to cart`.
- Product copy leads with the practical benefit or key differentiator, not abstract luxury language.

## Reference translation

- `docs/storefront-redesign/CLEAN-STOREFRONT-IMPLEMENTATION-PROMPT.md`: the executed simplification brief. Where it and this file disagree on density, typography, hero composition, or header height, the brief's contract is what shipped and this file has been updated to match it.
- `references/hero.md`: retain the clear hero hierarchy, responsive category access, product-led image, and paired primary/secondary actions. Do not adopt Tailwind, shadcn, Framer Motion, gradient text, glass effects, irregular corner cutouts, or its generic sample taxonomy.
- Apple, Samsung, and Tesla: learn the discipline — one dominant idea per viewport, product imagery over explanatory copy, short headlines, restrained actions, compact neutral type. Do not copy their branding, assets, layouts, fonts, or marketing language.
- `references/checkout.md`: retain the three-step progression, visible labels, persistent order summary, shipping/payment choices, skeletons, and security reassurance. Adapt payment to existing Razorpay, cash-on-delivery, and bank-transfer behavior; do not collect card data directly.
- Samsung: learn from its neutral chrome, product-scale imagery, short headlines, clear category navigation, repeated `Learn more`/`Buy` hierarchy, product rails, and support reassurance. Create a TechChasers system rather than a visual clone.

## Hard finish gate

The redesigned surface is not complete until all applicable checks pass:

- Real catalog content exercises long names, missing images, discounts, low/out-of-stock, and missing specs.
- The header is one compact row with search continuously visible, and no page reintroduces a second navigation tier.
- No storefront section reads like a paragraph-heavy explainer, and each marketing viewport has one obvious dominant idea.
- Loading, empty, error, ready, disabled, and success states are visible and recoverable.
- Keyboard order follows visual order; focus is never hidden by sticky UI.
- Controls have accessible names and at least 44×44px pointer targets.
- Text contrast is at least 4.5:1; state is never conveyed by color alone.
- No horizontal page scroll at target widths.
- Images reserve space and are not distorted; primary content remains available without animation.
- Header, drawers, summaries, and mobile sticky actions do not overlap content.
- `npm run lint` and `npm run build` pass.
- Each changed route is rendered and inspected at 375, 768, 1024, and 1440px.

## Evidence

- Local references: [`references/hero.md`](../../references/hero.md), [`references/checkout.md`](../../references/checkout.md)
- Current Samsung retail patterns: [Samsung US home](https://www.samsung.com/us/), [Smartphones](https://www.samsung.com/us/smartphones/), [Galaxy Books](https://www.samsung.com/us/galaxybooks/)
