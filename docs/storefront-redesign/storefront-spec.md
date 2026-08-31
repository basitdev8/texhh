# Storefront UX specification

This document defines cross-route behavior. Visual rules live in [`design-system/techchasers/MASTER.md`](../../design-system/techchasers/MASTER.md); page composition lives in its [`pages/`](../../design-system/techchasers/pages/) directory.

## Scope

Included:

- global storefront header, search, category navigation, footer, and shared primitives;
- home, catalog/category/search, product detail, PC Builder, cart, checkout, authentication, account, order detail, and policy/contact pages;
- admin shell, dashboards, lists, forms, statuses, and settings;
- responsive, accessible, loading, empty, error, disabled, success, and recovery states.

Excluded unless required to support the UI:

- changing product/order/payment business rules;
- replacing MongoDB, auth, Razorpay, Cloudinary, Zustand, or CSS Modules;
- adding Tailwind, shadcn, Framer Motion, GSAP, or an icon package;
- copying Samsung assets or component code.

## Information architecture

### Primary navigation

1. Products
2. Mobiles
3. Computers
4. PC Components
5. Accessories
6. Build a PC

The exact category destinations must resolve from existing taxonomy. Do not create empty hard-coded categories merely to fill the menu. Search, Account, and Cart are global utilities.

### Footer

Keep four compact groups at most:

- Shop: Products, category highlights, PC Builder
- Orders & support: Account/orders, contact, shipping, refunds
- Company/legal: Terms, privacy
- Store assurance: payment, delivery, support text sourced from settings when available

Remove manifesto copy, unsupported social links, edition labels, decorative newsletter prompts, and repeated policy links.

## Core journeys

### Find and buy a product

Home/search/category → filter or search → product detail → add to cart → validated cart → authenticated checkout → delivery → payment → review → provider/order result → order detail.

Completion criteria:

- the selected product and cart survive navigation and refresh according to current persistence behavior;
- server price/stock wins over cached cart data and the difference is explained;
- failure never discards recoverable form/cart state;
- success links to the created order.

### Build and buy a PC

Home/primary nav → PC Builder → select any or all eight part types → understand compatibility → add component lines to cart → normal checkout.

Completion criteria:

- active step, selected parts, subtotal, and compatibility remain visible;
- blocking conflicts name the affected parts and recovery step;
- cart and order lines retain `itemType: component` behavior.

### Track an order

Account/login → account orders → order detail → fulfillment/payment timeline → tracking/support.

Completion criteria:

- order, payment, refund, and fulfillment states remain distinct;
- status text maps to real model values;
- missing tracking does not render fake progress.

## Shared component inventory

Reuse or reshape existing components before adding new ones.

| Component | Responsibility | Key states |
| --- | --- | --- |
| Header | Navigation, search, account, cart | top/sticky, menu open, search open, mobile |
| Search surface | Query, suggestions, results | idle, typing, loading, no results, error |
| Product Card | Compare and act on one product | default, discount, low/out, adding, added, error |
| Signal Rail | Category-specific structured specs | populated, partial, omitted |
| Product Gallery | Hero media and thumbnails | loading, selected, missing image, zoom/modal |
| Filter Bar/Drawer | URL-backed filters and sort | default, active, applying, no results |
| Cart Item | Validated line management | normal, changed price, low/out, updating, removing |
| Order Summary | Items and totals | loading, ready, changed/blocked |
| Checkout Stepper | Delivery/payment/review progress | current, complete, invalid, editable |
| Status Notice | Inline state/recovery | info, success, warning, error |
| Loading skeleton | Preserve target layout | card, detail, list, form, summary |
| Empty state | Explain and recover | catalog, search, cart, orders, admin lists |
| Modal/Drawer | Focused secondary task | opening, open, closing, error |
| Data Table | Admin scan and actions | loading, empty, error, populated, paginated |

## State matrix

For every asynchronous component, the implementation PR must account for each applicable cell before it is complete.

| State | Required behavior |
| --- | --- |
| Initial/loading | Stable dimensions, meaningful `aria-busy`/status text, no hidden primary content forever |
| Empty | Accurate reason, one primary recovery, no implication of a request failure |
| Error | Plain cause when known, retained safe data, retry or alternate path |
| Ready | Complete content and enabled actions consistent with business rules |
| Pending mutation | Prevent duplicates, preserve control width, announce progress |
| Disabled | Legible label and nearby reason when the reason is not obvious |
| Success | Same verb as the action, update dependent UI such as cart count/order state |
| Stale/conflict | Show server truth and explain changed price, stock, or compatibility |

## Content rules

- Use sentence case except real brand/product names and compact statuses.
- Headings say what the section contains: `Popular products`, not `Currently obsessed`.
- Helper copy answers a likely customer question; it does not repeat the label.
- Errors identify the failed action and recovery: `Payment could not be verified. Check Orders before trying again.`
- Empty states invite the next valid action.
- Avoid claims such as “vetted,” “two-year warranty,” “ships worldwide,” or “secure” unless backed by settings/business policy.

## Accessibility contract

- Semantic landmarks, one H1, ordered headings, and a skip link.
- Visible keyboard focus; sticky regions use scroll padding so focused content is not obscured.
- Minimum 44×44px targets and 8px separation for adjacent touch controls.
- Icon-only controls have accessible names; decorative SVGs are hidden from assistive technology.
- Drawers/modals trap focus, close with Escape, restore trigger focus, and prevent background interaction.
- Form errors are programmatically connected; the first invalid field receives focus.
- Live regions announce cart, filter-result, checkout, and status changes without stealing focus.
- Color never carries stock, payment, order, or compatibility status alone.
- 200% zoom and reflow work without two-dimensional scrolling except intentional data tables.

## Responsive contract

- Design mobile structure first for transactional flows.
- Navigation becomes a drawer plus a first-class search surface.
- Filters become a drawer with persistent Apply/Clear actions.
- Sticky desktop summaries become inline or safe-area-aware bottom bars on mobile.
- Tables disclose or scroll intentionally; form fields stack.
- Long product names, rupee prices, specifications, and addresses define wrapping behavior; no fixed-height text boxes.

## Performance contract

- Keep server components where interaction is not required; do not convert a whole route to client rendering for a small control.
- Keep the current `next/image` path and set accurate `sizes`/priority only for genuine LCP media.
- Reserve image and skeleton dimensions so data/image loading does not shift surrounding content.
- Do not add animation, UI, or icon dependencies for this redesign.
- Product grids avoid per-category request waterfalls where the existing API can provide or be extended to provide aggregate data; treat API optimization as a separate scoped change if needed.
- Primary content is present without waiting for an entrance animation.

## Page ownership map

| Surface | Page contract |
| --- | --- |
| Home | [`home.md`](../../design-system/techchasers/pages/home.md) |
| Products, category, search | [`catalog.md`](../../design-system/techchasers/pages/catalog.md) |
| Product detail | [`product-detail.md`](../../design-system/techchasers/pages/product-detail.md) |
| PC Builder | [`pc-builder.md`](../../design-system/techchasers/pages/pc-builder.md) |
| Cart and checkout | [`cart-checkout.md`](../../design-system/techchasers/pages/cart-checkout.md) |
| Auth, account, order detail | [`account-auth.md`](../../design-system/techchasers/pages/account-auth.md) |
| Admin | [`admin.md`](../../design-system/techchasers/pages/admin.md) |

Policy/contact pages follow the master system with a 720px reading column, clear table-of-contents links for long documents, visible last-updated data when real, and the global shell.
