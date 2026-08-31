# Storefront redesign implementation plan

This is an execution plan, not a request to reinterpret the visual direction. Implementers must first read [`design-system/techchasers/MASTER.md`](../../design-system/techchasers/MASTER.md), then the page override for the phase, then this phase’s files.

Preserve existing business behavior unless a step explicitly says otherwise. Keep CSS Modules and current UI primitives; the supplied reference components are design evidence, not copy-paste dependencies.

## Definition of done

The redesign is complete only when:

- every storefront and admin route follows the new foundation and relevant page contract;
- the old editorial vocabulary/treatments are gone from customer-visible UI;
- all applicable states in the shared state matrix are implemented;
- lint/build pass and every changed route is inspected at 375, 768, 1024, and 1440px;
- keyboard, 200% zoom, reduced motion, long content, missing media, and payment/cart recovery have been exercised;
- the hard finish gate in the master design system passes.

## Phase 0 — Baseline and safeguards

Goal: freeze working behavior and make visual regressions observable before changing foundations.

Work:

1. Record rendered baselines for home, products, one product detail, PC Builder, cart with an item, checkout, login, account/orders, and representative admin list/form pages.
2. Inventory every use of old palette, Fraunces/display italics, grain, marquee, `Reveal`, editorial numbering, `atelier`, `edit`, `piece`, `object`, and `compose` across storefront files.
3. Write a route/state checklist using the matrix in `storefront-spec.md`; include realistic long names, missing images/specs, discounts, low/out-of-stock, empty data, request failure, and pending/successful mutations.
4. Confirm cart → checkout → payment/order and PC Builder → cart behavior before UI changes.

Verify:

- Baselines and state checklist cover every route listed in `src/app/(storefront)` and `src/app/admin`.
- `npm run lint` and `npm run build` results are recorded before edits.

## Phase 1 — Foundations and primitives

Goal: make the new system available without page-by-page token reinvention.

Primary files:

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/ui/{Button,Input,Select,Modal,Badge,Spinner,LoadingState,Toast,Pagination}.*`

Work:

1. Remove Fraunces loading and the body grain overlay. Retain Outfit and Inter via `next/font`; remove the redundant CSS `@import`.
2. Map global color, type, spacing, radius, shadow, focus, transition, container, and sticky-offset tokens to the master contract. Keep temporary aliases for old names only while dependent pages migrate.
3. Normalize focus-visible, disabled, loading, error, and minimum target behavior across UI primitives.
4. Add or reshape shared `StatusNotice`, shape-matched skeleton patterns, and drawer/modal behavior only where existing primitives cannot express the contract cleanly.
5. Make `Reveal` render content directly or retire it as each consumer migrates; primary content must never be animation-gated.
6. Ensure reduced-motion rules cover every remaining transition/animation.

Verify:

- A primitive gallery or representative pages demonstrate every variant and state.
- No raw color literal is introduced in page modules when an appropriate semantic token exists.
- Keyboard focus, disabled contrast, 44px targets, and reduced motion pass.
- Lint/build pass.

## Phase 2 — Global shell, search, and reusable commerce components

Goal: establish consistent navigation and product comparison before migrating pages.

Primary files:

- `src/app/(storefront)/layout.tsx`
- `src/components/storefront/{Header,SearchBar,Footer,ProductCard,CategoryCard}.*`
- shared cart/search/product hooks touched by these components only as needed

Work:

1. Rebuild the header/navigation to the master contract using real categories. Keep Search, Account, and Cart behavior; enlarge and label targets.
2. Make search a first-class desktop/mobile surface with query, loading, no-results, error, and keyboard behavior.
3. Replace the narrative footer with the compact IA from `storefront-spec.md`; source claims/settings rather than hard-coding them.
4. Rebuild Product Card in the canonical reading order. Add a pure mapping from category/specification data to an optional Signal Rail; do not fabricate missing specs.
5. Normalize Category Card to a simple image/title link without editorial numbers or corner ornaments.
6. Keep cart badge updates announced and prevent hover-only actions.

Verify:

- Header works with mouse, keyboard, touch, Escape, outside click, and route changes.
- Search has stable results and recovery at all target widths.
- Product Card passes default, discount, long name, missing image/spec, low stock, out-of-stock, add pending/success/error.
- The shell has no content overlap or horizontal scroll.

## Phase 3 — Home, catalog, category, search, and product detail

Goal: complete the main discovery-to-product path.

Read:

- `pages/home.md`
- `pages/catalog.md`
- `pages/product-detail.md`

Primary files:

- `src/app/(storefront)/page.tsx` and `page.module.css`
- `src/components/storefront/HeroBanner.*`
- `src/app/(storefront)/products/**`
- `src/app/(storefront)/categories/[slug]/page.tsx`
- `src/app/(storefront)/search/**`
- `src/components/storefront/ProductGallery.*`

Work:

1. Replace the homepage hierarchy with the exact module order in `home.md`. Remove marquee, manifesto, metrics without a decision purpose, and ornamental editorial treatments.
2. Build catalog filters/sort/result count/active chips with URL-backed state. Replace swallowed fetch failures with explicit error/retry state. Avoid per-category count waterfalls or split that optimization into a separately reviewed API task.
3. Ensure category routing retains visible category context and a useful not-found path.
4. Rebuild search results on the catalog grammar; query and result count stay visible.
5. Recompose product detail into gallery + sticky purchase column, then details/specifications/related content. Add the mobile purchase bar without obscuring content.
6. Use real product images/specs and current add-to-cart behavior throughout.

Verify:

- Home contains one H1 and no old editorial vocabulary.
- Filter/search URLs survive refresh and back/forward navigation.
- Product images have correct aspect, `sizes`, loading priority, and no layout shift.
- Catalog and product detail cover loading, empty/not found, error, ready, stock, add pending/success/error.
- Target-width render inspection and lint/build pass.

## Phase 4 — Cart and checkout

Goal: create a focused, recoverable transaction flow without changing payment ownership.

Read `pages/cart-checkout.md` and the checkout business code before editing layout.

Primary files:

- `src/app/(storefront)/cart/**`
- `src/components/storefront/CartItem.*`
- `src/app/(storefront)/checkout/**`
- relevant Button/Input/Status/summary components

Work:

1. Recompose cart lines and summary while preserving server validation, quantity limits, price changes, item types, and settings-driven shipping/tax.
2. Turn checkout into explicit Delivery → Payment → Review steps. Keep the entered delivery object in client state across steps and recoverable failures.
3. Keep Razorpay hosted payment behavior; show COD only when settings/order eligibility allow it; preserve bank transfer behavior. Do not add card-detail fields from the reference demo.
4. Build one reusable Order Summary for desktop sticky and mobile expandable presentations.
5. Implement focus-to-first-error, form-level payment/network messages, duplicate-submit prevention, and status-specific recovery.
6. Clear cart and navigate only after confirmed order creation/payment handling according to existing business rules.

Verify:

- Cart changes from server are explained line by line.
- Checkout back/next preserves data and blocks invalid progress accessibly.
- Exercise Razorpay load failure, cancel, verification failure/unknown, COD limit, bank transfer, empty/invalid cart, duplicate submit, and success.
- Totals match server results at every step.
- Mobile keyboard and sticky action do not cover focused fields.
- Target-width render inspection and lint/build pass.

## Phase 5 — PC Builder, auth, account, orders, and policies

Goal: complete the remaining customer workflows on the same system.

Read:

- `pages/pc-builder.md`
- `pages/account-auth.md`

Primary files:

- `src/app/(storefront)/pc-builder/**`
- `src/components/pc-builder/**`
- `src/app/(storefront)/auth/**`
- `src/app/(storefront)/account/**`
- `src/app/(storefront)/policies/**`

Work:

1. Recompose PC Builder around named steps, component comparison, persistent summary, explicit compatibility, and mobile bottom sheet.
2. Replace card-level pseudo-buttons with correct interactive elements and avoid nested control conflicts.
3. Simplify login/register into a focused form with accurate backend-supported paths and preserved destination.
4. Recompose account and order detail around orders, distinct fulfillment/payment/refund states, timeline, tracking, address, and support.
5. Standardize policy/contact reading layout and remove unsupported or duplicated footer content.

Verify:

- PC Builder preserves selections, calculates subtotal, communicates every compatibility class, and adds correct component lines.
- Auth does not flash protected content and handles pending/error/success.
- Account/orders distinguish empty from failed loads.
- Policies work at 200% zoom with useful heading hierarchy.
- Target-width render inspection and lint/build pass.

## Phase 6 — Admin migration

Goal: align operational UI with the foundation while preserving task density and safety.

Read `pages/admin.md`.

Primary files:

- `src/app/admin/**`
- `src/components/admin/**`

Work:

1. Migrate admin shell, navigation, page headers, filters, tables, dialogs, forms, status badges, image upload, and feedback to semantic tokens/primitives.
2. Keep fulfillment, payment, refund, and stock reservation visible as distinct states.
3. Add complete list and mutation states; make dangerous actions explicit and confirm irreversible changes.
4. Provide mobile/tablet structure based on task priority rather than shrinking desktop tables.

Verify:

- Every admin list demonstrates loading, empty, error, populated, and pagination/filter states where applicable.
- Every mutation demonstrates pending, success, failure, and duplicate prevention.
- Product/order forms retain entered data after recoverable failure and warn about unsaved work where applicable.
- Target-width render inspection and lint/build pass.

## Phase 7 — Removal, consistency, and finish gate

Goal: leave one coherent system and no dead editorial layer.

Work:

1. Remove unused Fraunces/display aliases, editorial tokens, grain, marquee, obsolete animations/components, and CSS made unreachable by the migrated markup.
2. Search customer-visible copy and class names for the retired vocabulary/treatments. Internal model names remain unchanged when they are business terms.
3. Verify the whole route/state checklist, including long product names, missing media/specs, prices in rupees, low/out-of-stock, compatibility, payment recovery, and admin mutations.
4. Run the hard finish gate from the master system and fix observed clipping, overlap, distorted images, inaccessible controls, inert interactions, inconsistent copy, and unhandled states.

Final verification:

```bash
npm run lint
npm run build
```

Then inspect every changed route at 375, 768, 1024, and 1440px, keyboard-only, reduced-motion, and 200% zoom. Do not call the redesign complete based only on lint/build.

## Suggested change boundaries

Keep phases independently reviewable. A safe sequence is one pull request for Foundations/Shell, one for Discovery, one for Cart/Checkout, one for Builder/Account, one for Admin, and one final cleanup only if team workflow supports it. Never mix a payment/business-rule rewrite into a visual phase without an explicit new scope and tests.
