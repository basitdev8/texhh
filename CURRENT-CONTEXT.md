# TechChasers — Current implementation context

Last updated: 2026-08-31 (responsive pass)

Use this as a short resume point. For UI work, the authoritative design rules are in [`docs/storefront-redesign/README.md`](docs/storefront-redesign/README.md), not this status document.

## Product and direction

TechChasers sells consumer electronics, mobile devices, PCs, PC components, custom PC builds, and accessories. The customer-facing UI follows the **Precision Showroom** direction: light, product-led, technical, and calm. It takes inspiration from modern Samsung retail clarity without copying Samsung assets, layouts, or brand language.

The admin is deliberately different: it is an **operations console**, not a marketing page. It should privilege stock, fulfillment, payment, catalog maintenance, and safe mutations over promotional composition.

## Current UI foundations

- Global tokens live in `src/app/globals.css` and are documented in `design-system/techchasers/MASTER.md`.
- Typography: **Manrope** for titles and **Inter** for UI, body copy, prices, and data. The prior recursive font custom-property bug is fixed; do not reintroduce semantic variables that reference themselves.
- Key tokens: white canvas `#FFFFFF`, soft surface `#F5F6F8`, ink `#101114`, border `#D8DCE3`, action blue `#1428A0`.
- Use semantic CSS tokens rather than raw page-level colors. Preserve 44px minimum targets for active controls.

## Storefront implementation

- `HeroBanner` is a centered product campaign: real featured product, brief copy, two actions, signal rail, and a large product stage. It translates `references/hero.md` rather than copying it.
- Search is a continuously visible field in the storefront header on desktop and mobile. `SearchBar` returns debounced product suggestions in a compact anchored dropdown; submitting routes into the filtered product catalog at `/products?search=…`. Do not reintroduce a search icon, modal, overlay, or full-screen mobile search surface.
- `/search` remains as a legacy direct route; the header no longer navigates to it.
- Product cards use the Signal Rail only when real specs are available.

## Admin implementation

- Shared admin structure: `src/app/admin/layout.*`, `src/components/admin/Sidebar.*`, and `src/app/admin/admin.module.css`.
- The critical regression was fixed: `admin.module.css` had become dashboard-only while list, form, detail, modal, and settings pages referenced missing CSS-module classes. The shared operational vocabulary is restored for Products, Orders, Customers, Categories, PC Components, Settings, and order/product details.
- `DataTable` now exposes actual sort buttons with `aria-sort`, instead of click-only table headers.
- The dashboard keeps overview metrics, action queues, low-stock alerts, and recent orders. Low-stock cards use `minmax(0, 1fr)`, shrinkable labels, and non-wrapping stock counts so long product names cannot create horizontal page overflow.
- Retired admin copy: do not bring back “shelves,” “pieces,” “order book,” or other editorial storefront language. Use direct labels such as `Products`, `Orders`, and `Store settings`.

## Responsive foundations

A dedicated responsive/finish pass has been applied across the storefront. The rules below are now load-bearing; do not undo them without replacing the behaviour.

- `globals.css` defines `--header-height` and `--sticky-offset`. Sticky columns use `var(--sticky-offset)` instead of a hard-coded `84px`, and `html` sets `scroll-padding-top` so focused content is never hidden under the header.
- Below 768px every `input`/`select`/`textarea` is forced to 16px so iOS Safari does not zoom the viewport on focus.
- Mobile action bars declare `data-mobile-action-bar="compact" | "wide"`. `globals.css` uses `body:has(...) > footer` to reserve exactly the bar's height so a fixed bar can never sit on top of the last footer row. A new bar must set this attribute.
- Every `fr`-based grid track uses `minmax(0, …)`. A scroller such as the gallery thumb rail otherwise propagates its min-content width upward; that was producing real horizontal page scroll on `/products/[slug]` at 375px.
- No customer-visible text renders below 12px, and interactive controls are at least 44px below the desktop breakpoint. Inline text links inside prose are the intended exception.

### Per-surface mobile structure

- **Hero**: at 640px and below the stage becomes a normal flex column (copy, then product image). The desktop absolutely positioned showcase overlapped the CTA row whenever a product name wrapped past three lines.
- **Product detail**: breadcrumbs collapse to one back link below 768px, specifications stack label-over-value, and the bottom purchase bar is only mounted once the in-page `Add to cart` scrolls out of view (`IntersectionObserver`). It previously rendered always and carried `aria-hidden` around a focusable button.
- **Cart**: a safe-area-aware `Checkout` bar with the live order total appears at 900px and below.
- **PC Builder**: below 900px the desktop summary column is removed and replaced by a bottom build bar that opens a full build sheet. The sheet closes on Escape, locks background scroll, and restores focus to its trigger. Build slots are real `<button>` elements rather than `role="button"` divs.
- **Checkout**: below 960px the order summary moves above the form and collapses to a one-line disclosure showing the running total.
- **Admin**: the `DataTable` scroll container is a labelled, focusable region, and clickable rows respond to Enter/Space.

## Known gaps and cautions

- Several admin list/dashboard fetch paths still swallow errors. Do not represent a failed request as zero data; add explicit retryable error states when touching those routes.
- `/admin`, `/checkout`, and `/account` all redirect to login without a session, so their rendered responsive pass is still outstanding. The CSS and markup changes for those routes are in place but have only been verified by build and static reading.
- Checkout does not add a duplicated floating "Place order" bar on mobile. The step's own primary action is already full width directly under a short form, and the review step's button already carries the total. The page override's "bottom action with the current total" is therefore satisfied by the collapsible summary plus that button, not by a second control.
- Product detail specifications stack rather than using true disclosure groups. Readability at 375px is met; the disclosure grouping in `product-detail.md` is still open.
- The worktree is intentionally dirty. Preserve unrelated edits; do not reset or overwrite broad areas.

## Verification baseline

Latest checks:

- `npm run build` — passes.
- `npm run lint` — no errors; one existing warning in `src/lib/db.ts` about an unused eslint-disable directive.
- `npx tsc --noEmit` — clean.
- Rendered against a production build at 375, 768, 1024, and 1440px: home, `/products`, `/products/[slug]`, `/cart`, `/pc-builder`, `/search`, `/auth/login`, and `/policies/*`. No horizontal page scroll, no text below 12px, no control under 44px outside inline prose links.
- The dev server on port 3000 does not hydrate in the attached preview browser. Verify interaction against `npm run build && npm start`, not `npm run dev`.
- `git diff --check` reports an existing blank line at EOF in `src/lib/utils.ts`; do not remove it unless that file is otherwise in scope.

## Next-agent workflow

1. Read `CLAUDE.md`, then `docs/storefront-redesign/README.md`.
2. Read `design-system/techchasers/MASTER.md` and the route override before changing UI.
3. Check this file for current code state and `CONTEXT.md` for canonical business language.
4. Inspect the relevant route at 375, 768, 1024, and 1440px when authenticated access is available.
5. Preserve business behavior and verify with `npm run lint` and `npm run build`.
