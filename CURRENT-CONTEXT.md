# TechChasers — Current implementation context

Last updated: 2026-09-01 (clean storefront pass)

Use this as a short resume point. For UI work, the authoritative design rules are in [`docs/storefront-redesign/README.md`](docs/storefront-redesign/README.md), not this status document.

## Product and direction

TechChasers sells consumer electronics, mobile devices, PCs, PC components, custom PC builds, and accessories. The customer-facing UI follows the **Precision Showroom** direction: light, product-led, technical, and calm. It takes inspiration from the clarity of Apple, Samsung, and Tesla retail pages — one dominant idea per viewport, product imagery over explanatory copy, short headlines, compact neutral type — without copying their assets, layouts, or brand language.

The clean-storefront simplification described in `docs/storefront-redesign/CLEAN-STOREFRONT-IMPLEMENTATION-PROMPT.md` has been executed. Do not restore the dense composition it removed.

The admin is deliberately different: it is an **operations console**, not a marketing page. It should privilege stock, fulfillment, payment, catalog maintenance, and safe mutations over promotional composition.

## Current UI foundations

- Global tokens live in `src/app/globals.css` and are documented in `design-system/techchasers/MASTER.md`.
- Typography: **Inter only**. `src/app/layout.tsx` loads Inter (400/500/600/700) and nothing else. `--font-heading` and `--font-display` are aliases of `--font-body`; the ~60 CSS-module rules that still say `var(--font-heading)` therefore render Inter. Do not repoint those aliases at a second family and do not reintroduce Manrope. The prior recursive font custom-property bug is fixed; do not reintroduce semantic variables that reference themselves.
- Global heading scale is restrained: `h1 clamp(1.75rem, 2.6vw, 2.25rem)`, `h2 clamp(1.5rem, 2.2vw, 2rem)`, `h3 1.125rem`, all weight 600. Larger display type exists only in the homepage hero.
- The global `.eyebrow` utility is deleted, and every storefront uppercase eyebrow label is gone (homepage sections, PC Builder, account, policies). Do not add them back.
- Key tokens: white canvas `#FFFFFF`, soft surface `#F5F6F8`, ink `#101114`, border `#D8DCE3`, action blue `#1428A0`.
- `--header-height` now tracks the real header: `64px` desktop, `60px` ≤1024, `56px` ≤640, `100px` ≤479. `--sticky-offset` and `scroll-padding-top` derive from it.
- Use semantic CSS tokens rather than raw page-level colors. Preserve 44px minimum targets for active controls.

## Storefront implementation

- **Header** is one compact row (`Header.tsx` / `Header.module.css`): logo, persistent search, `Products` and `Build a PC` inline above 1024px, then account, cart, and `Menu`. The old second navigation row, the `All Categories` dropdown, and the `Mobiles`/`Computers`/`Accessories` inline links are gone; categories live in the `Menu` drawer. Measured: 65px at 1440 (was 109px), 61px at 768–1024, 105px at 375 (was 117px). Below 480px the bar adds one full-width search row; the 44px-target rule on two stacked rows is what sets that ~105px floor.
- The `Menu` drawer is a labelled dialog: locks background scroll, moves focus to its close button on open, closes on Escape or backdrop, and restores focus to the trigger.
- Search is a continuously visible field on every width. Focus uses a quiet neutral border (`--color-text-secondary`), never a blue glow. `SearchBar` returns debounced suggestions in a compact anchored dropdown with loading and no-result states; Escape dismisses it in every state; submitting routes to `/products?search=…`. Do not reintroduce a search icon, modal, overlay, or full-screen mobile search surface.
- `/search` remains as a legacy direct route; nothing in the storefront navigates to it.
- **Homepage** is exactly four moments plus one slim reassurance line: featured-product hero, category row, one curated collection (`Popular right now`), PC Builder campaign. The `Recently Added` rail, the three builder instruction cards, and the three reassurance cards are deleted. Four `<section>` elements remain on the route. Document height at 1440px went from 3814px to 2344px; at 375px from 5611px to 2823px. The hero is 480px at 1440 and 512px at 375 (was 660px / 637px).
- `HeroBanner` is a two-column stage: copy in a 5/12 track, product media in a 7/12 track, sized to content. Titles over 40 characters use a reduced size clamped to three lines.
- **Product cards** are borderless — a rounded `--color-bg-soft` image well, then text. Catalog add-to-cart is a secondary (bordered) control. `discoveryOnly` cards render no stock messaging, no add-to-cart, and no Signal Rail. The name link carries the line clamp so it is a real 44px target below the desktop breakpoint.
- The Signal Rail renders on the product detail page. It does **not** render on any product card today: homepage cards suppress it by contract, and `/api/products` excludes `specifications` from list responses (pre-existing `.select('-description -specifications')`), so catalog cards never had spec data. The `ProductCard` rail code is retained for a future list surface that does select specs.
- **Product detail** order is fixed: gallery, identity, price, purchase action, reassurance, details. The tinted price card, the stock status pills, and the duplicate savings line are replaced by plain text. Specifications show 6 with a quiet text disclosure control; rows are hairline-separated.
- **Cart and checkout** keep every workflow and validation path. Removed: the free-shipping progress bar, tinted summary/review panels, numeric prefixes on step headings, and instructional prose. Labels are sentence case (`Cart`, `Order summary`, `Total`, `Shipping`, `Checkout`, `Secure checkout`).
- **Footer** is low weight: wordmark plus two link groups and one legal row. The brand paragraph, the assurance rows, and the four hardcoded `?category=smartphones|laptops|accessories` links (which pointed at slugs that do not exist in this catalog) are gone.
- Ornamental `→`/`←` glyphs are removed from labels across the storefront. The account order-row chevron and the gallery lightbox key hints are intentional exceptions.

## Admin implementation

- Shared admin structure: `src/app/admin/layout.*`, `src/components/admin/Sidebar.*`, and `src/app/admin/admin.module.css`.
- The critical regression was fixed: `admin.module.css` had become dashboard-only while list, form, detail, modal, and settings pages referenced missing CSS-module classes. The shared operational vocabulary is restored for Products, Orders, Customers, Categories, PC Components, Settings, and order/product details.
- `DataTable` now exposes actual sort buttons with `aria-sort`, instead of click-only table headers.
- The dashboard keeps overview metrics, action queues, low-stock alerts, and recent orders. Low-stock cards use `minmax(0, 1fr)`, shrinkable labels, and non-wrapping stock counts so long product names cannot create horizontal page overflow.
- Retired admin copy: do not bring back “shelves,” “pieces,” “order book,” or other editorial storefront language. Use direct labels such as `Products`, `Orders`, and `Store settings`.

## Responsive foundations

A dedicated responsive/finish pass has been applied across the storefront. The rules below are now load-bearing; do not undo them without replacing the behaviour.

- `globals.css` defines `--header-height` and `--sticky-offset`. Sticky columns use `var(--sticky-offset)` instead of a hard-coded `84px`, and `html` sets `scroll-padding-top` so focused content is never hidden under the header.
- Below 768px every `input`/`select`/`textarea` is forced to 16px so iOS Safari does not zoom the viewport on focus. This is why the header search field is 48px tall at and below 1024px: a 44px submit button plus a 16px input does not fit in less. That height is the floor on the ~105px mobile header — do not shrink one without the other.
- Mobile action bars declare `data-mobile-action-bar="compact" | "wide"`. `globals.css` uses `body:has(...) > footer` to reserve exactly the bar's height so a fixed bar can never sit on top of the last footer row. A new bar must set this attribute.
- Every `fr`-based grid track uses `minmax(0, …)`. A scroller such as the gallery thumb rail otherwise propagates its min-content width upward; that was producing real horizontal page scroll on `/products/[slug]` at 375px.
- No customer-visible text renders below 12px, and interactive controls are at least 44px below the desktop breakpoint. Inline text links inside prose are the intended exception.

### Per-surface mobile structure

- **Hero**: the stage is a CSS grid that collapses to one column at 900px (copy, then product image). The old absolutely positioned showcase is gone, so it can no longer overlap the CTA row.
- **Product detail**: breadcrumbs collapse to one back link below 768px, specifications stack label-over-value, and the bottom purchase bar is only mounted once the in-page `Add to cart` scrolls out of view (`IntersectionObserver`). It previously rendered always and carried `aria-hidden` around a focusable button.
- **Cart**: a safe-area-aware `Checkout` bar with the live order total appears at 900px and below.
- **PC Builder**: below 900px the desktop summary column is removed and replaced by a bottom build bar that opens a full build sheet. The sheet closes on Escape, locks background scroll, and restores focus to its trigger. Build slots are real `<button>` elements rather than `role="button"` divs.
- **Checkout**: below 960px the order summary moves above the form and collapses to a one-line disclosure showing the running total.
- **Admin**: the `DataTable` scroll container is a labelled, focusable region, and clickable rows respond to Enter/Space.

## Known gaps and cautions

- Several admin list/dashboard fetch paths still swallow errors. Do not represent a failed request as zero data; add explicit retryable error states when touching those routes.
- The `Menu` drawer moves focus in and restores it on close but does not trap Tab inside itself. Tab order continues past it into the page behind the backdrop.
- Pre-existing dead code left in place deliberately (not created by this pass): `src/components/ui/Reveal.tsx` is unreferenced, `ProductCard.tsx` re-exports `getProductSignalRail` with no consumer, and `Toast.module.css` defines unused `successIcon`/`errorIcon`/`infoIcon` classes.
- Long catalog names still clamp with an ellipsis on the name link (two lines, three below 640px). The image link above carries the full name in its `aria-label`, so the product is never unreachable.
- `/admin`, `/checkout`, and `/account` all redirect to login without a session, so their rendered responsive pass is still outstanding. The CSS and markup changes for those routes are in place but have only been verified by build and static reading.
- The product detail specifications now use a real disclosure control, so the `product-detail.md` grouping note is satisfied for readability; descriptive disclosure *groups* (per-topic headings) are still open.
- Checkout does not add a duplicated floating "Place order" bar on mobile. The step's own primary action is already full width directly under a short form, and the review step's button already carries the total. The page override's "bottom action with the current total" is therefore satisfied by the collapsible summary plus that button, not by a second control.
- The worktree is intentionally dirty. Preserve unrelated edits; do not reset or overwrite broad areas.

## Verification baseline

Latest checks (clean storefront pass):

- `npm run build` — passes. Note: the Turbopack build fetches Inter from Google Fonts and fails hard on a transient network error. Retry before investigating; it is not a code fault.
- `npm run lint` — no errors; one existing warning in `src/lib/db.ts` about an unused eslint-disable directive.
- Rendered against a production build (`npm run build && npm start`) at 375, 768, 1024, and 1440px: home, `/products`, `/products?search=…`, `/products/[slug]`, `/cart` (seeded), `/pc-builder`, `/search`, `/auth/login`, `/policies/shipping`. Every width and route: no horizontal page scroll, no text below 12px, no interactive control under 44px below the desktop breakpoint outside inline prose links.
- Interaction verified against the production build: header search suggestions (4 results for `iqoo`), no-result state, Escape dismissal, quiet neutral focus border; menu drawer open/Escape/focus-restore/scroll-lock; product specifications 6 → 35 → 6 with `aria-expanded` toggling; mobile purchase bar mounts only while the in-page `Add to cart` is off screen (never both at once).
- The dev server on port 3000 does not hydrate in the attached preview browser. Verify interaction against `npm run build && npm start`, not `npm run dev`.
- `git diff --check` reports an existing blank line at EOF in `src/lib/utils.ts`; do not remove it unless that file is otherwise in scope.
- `/checkout`, `/account`, and `/admin` redirect to login without a session, so their rendered pass is still unverified. Their markup and CSS changes are in place and build clean.

## Next-agent workflow

1. Read `CLAUDE.md`, then `docs/storefront-redesign/README.md`.
2. Read `design-system/techchasers/MASTER.md` and the route override before changing UI.
3. Check this file for current code state and `CONTEXT.md` for canonical business language.
4. Inspect the relevant route at 375, 768, 1024, and 1440px when authenticated access is available.
5. Preserve business behavior and verify with `npm run lint` and `npm run build`.
