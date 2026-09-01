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
| Density | 4/10 | Spacious marketing surfaces; efficient catalog, builder, checkout, and admin surfaces |

## Signature: the Signal Rail

The Signal Rail is a quiet row of two or three category-specific facts placed below a product name or beside its image. Examples: `6.7″ AMOLED · 256 GB · 5G`, `RTX 5070 · 32 GB · 1 TB`, or `AM5 · ATX · DDR5`.

- Use real structured specifications, never invented copy.
- Choose facts that help compare items in the current category.
- Keep one line on cards; allow two lines only on a product detail page.
- Use tabular numerals and subtle separators. It is information, not a badge cloud.
- Omit the rail when reliable specs are unavailable.

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

Load fonts through `next/font` with separate raw face variables and semantic family tokens; never point a semantic font custom property back to itself.

- Manrope, weights 600–800: logo, page titles, section titles, and compact promotional headlines.
- Inter, weights 400–700: navigation, body, controls, prices, specs, tables, and metadata.
- Do not use Outfit, Fraunces, or serif/italic display treatments in the redesigned UI.

Type scale:

| Token | Desktop | Mobile | Use |
| --- | --- | --- | --- |
| Display | `clamp(2.75rem, 5vw, 5.5rem)` | fluid | Homepage campaign only |
| H1 | `clamp(2.25rem, 4vw, 4rem)` | fluid | One per page |
| H2 | `clamp(1.75rem, 2.5vw, 2.75rem)` | fluid | Major sections |
| H3 | `1.25rem–1.5rem` | same | Card/group titles |
| Body | `1rem` | `1rem` | Default copy, 1.5–1.65 line height |
| Small | `0.875rem` | `0.875rem` | Metadata and helper text |
| Micro | `0.75rem` | `0.75rem` | Labels only; never long copy |

Use sentence case. Reserve all caps for short brand or status labels. Do not add wide letter spacing to body, buttons, or navigation. Prices and comparison data use tabular numerals.

### Spacing and layout

Use the existing 4px-based spacing tokens. Favor `8, 12, 16, 24, 32, 48, 64, 96` px.

- Content max width: 1440px.
- Reading/form max width: 720px.
- Desktop gutter: 32px; tablet: 24px; mobile: 16px.
- Marketing section spacing: 80–112px desktop, 56–72px mobile.
- Transactional section spacing: 32–48px desktop, 24–32px mobile.
- Product grids: 4 columns large desktop, 3 at 1024–1279px, 2 at 640–1023px, 2 compact or 1 detailed below 640px depending on content.

Whitespace groups related content. Do not use empty space to create drama around routine forms or catalog controls.

### Shape and elevation

| Element | Radius |
| --- | --- |
| Buttons, inputs, chips | 8px |
| Cards and grouped panels | 12px |
| Hero/image stage | 16px |
| Pills | 999px only for filters, statuses, and compact toggles |

Default cards have no shadow. Use a border or a subtle surface change. Shadows are reserved for floating navigation, menus, sticky purchase summaries, drawers, and modals. Hover must not change layout.

### Imagery

- Product imagery is the visual hero: clean crop, neutral background, consistent scale, no color overlays.
- Reserve intrinsic space with `next/image`, accurate `sizes`, and aspect ratios to prevent layout shift.
- Product cards use `object-fit: contain`; lifestyle campaign modules may use `cover`.
- Do not place long copy over detailed product photography. When overlay text is unavoidable, provide a verified contrast scrim.
- Never reuse Samsung assets or mimic Samsung product compositions. Use catalog imagery and TechChasers content.

## Shared components

### Header and navigation

- 64–72px white header with a soft bottom divider; sticky after the first viewport.
- Logo left. Primary categories center or immediately after the logo. Search, account, and cart right.
- Search never navigates to a separate search page from the header. It opens an in-place catalogue command surface over the current route: focus the input, return debounced product results, keep loading/no-result/error states in the surface, and restore focus to the trigger on close. Mobile uses the same surface full-screen, not a tiny icon-only afterthought.
- Category menu groups `Mobiles`, `Computers`, `PC Components`, `Accessories`, and `Build a PC`; labels come from real catalog taxonomy when available.
- Cart count has an accessible label. Icon targets are at least 44×44px.

### Buttons and links

- Primary: dark ink fill with white text. Use for the page’s decisive action.
- Accent: blue fill with white text. Use for selected/transactional emphasis, not alongside another equally strong action.
- Secondary: white/transparent with a 1px border.
- Tertiary: text link with underline on hover/focus.
- Minimum height: 44px; checkout and mobile sticky actions: 48–52px.
- Loading retains the control width, shows progress, and blocks duplicate submission.
- Disabled state remains legible and explains unmet requirements nearby.

### Product card

Reading order: image → availability/promotion → brand → product name → Signal Rail → price → action.

- The entire descriptive area may link to the product; keep “Add to cart” a separate button.
- Add-to-cart is visible without hover on touch and keyboard layouts.
- Show compare price and savings only when real.
- Show `Out of stock` or `Only n left` close to price/action.
- Limit names to two or three lines without destructive ellipsis on the only product link.
- Avoid index numbers, ornamental arrows, image zoom beyond 1.02, or staggered card offsets.

### Filters and sorting

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
- Use `PC Builder`, not `Atelier` or `Compose your rig` as navigation language.
- Button verbs remain consistent through feedback: `Add to cart` → `Added to cart`.
- Product copy leads with the practical benefit or key differentiator, not abstract luxury language.

## Reference translation

- `references/hero.md`: retain the clear hero hierarchy, responsive category access, product-led image, and paired primary/secondary actions. Do not adopt Tailwind, shadcn, Framer Motion, gradient text, glass effects, irregular corner cutouts, or its generic sample taxonomy.
- `references/checkout.md`: retain the three-step progression, visible labels, persistent order summary, shipping/payment choices, skeletons, and security reassurance. Adapt payment to existing Razorpay, cash-on-delivery, and bank-transfer behavior; do not collect card data directly.
- Samsung: learn from its neutral chrome, product-scale imagery, short headlines, clear category navigation, repeated `Learn more`/`Buy` hierarchy, product rails, and support reassurance. Create a TechChasers system rather than a visual clone.

## Hard finish gate

The redesigned surface is not complete until all applicable checks pass:

- Real catalog content exercises long names, missing images, discounts, low/out-of-stock, and missing specs.
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
