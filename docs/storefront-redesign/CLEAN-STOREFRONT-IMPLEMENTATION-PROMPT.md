# Clean storefront implementation prompt

Use this prompt to implement the next TechChasers storefront redesign. This is an implementation task, not a request for another plan or visual critique.

## Objective

Transform TechChasers from a dense, document-like electronics storefront into a calm, product-led commerce experience inspired by the clarity of Apple, Samsung, and Tesla.

Take the references as a design philosophy:

- one dominant idea per viewport;
- product imagery carries more weight than explanatory copy;
- short headlines, short supporting text, and restrained actions;
- compact neutral typography;
- generous whitespace without oversized decorative typography;
- content is serialized into distinct visual moments instead of presented all at once.

Do not copy their branding, assets, exact layouts, proprietary fonts, or marketing language. The result must remain recognizably TechChasers and must use real catalog data.

## Read before editing

Read these sources in order:

1. [`CURRENT-CONTEXT.md`](../../CURRENT-CONTEXT.md) for current implementation state and verification constraints.
2. [`CONTEXT.md`](../../CONTEXT.md) for canonical commerce terminology.
3. [`references/hero.md`](../../references/hero.md) and [`references/checkout.md`](../../references/checkout.md) for supplied interaction references.
4. [`design-system/techchasers/MASTER.md`](../../design-system/techchasers/MASTER.md) for existing tokens and accessibility rules.
5. The relevant route file in [`design-system/techchasers/pages/`](../../design-system/techchasers/pages/) before changing that route.

This prompt overrides older guidance where it encourages oversized headings, repeated eyebrow labels, card-heavy composition, long explanatory copy, or a tall two-tier storefront header.

## Diagnosis to solve

The current storefront gives too many elements equal visual importance:

- the header is tall and contains a persistent search field plus a full second navigation row;
- the hero combines an eyebrow, long database title, paragraph, price, specification rail, two main actions, product image, and a separate image action;
- the homepage immediately stacks categories, popular products, a multi-paragraph PC-builder explainer, three builder instruction cards, three reassurance cards, and another product grid;
- Manrope headings at heavy weights and large scales make ordinary content feel like editorial marketing;
- borders, cards, labels, metadata, and blue accents repeat often enough to create visual noise.

The redesign is complete only when those causes are removed, not merely restyled.

## Design contract

### Typography

- Use Inter for headings, body copy, controls, prices, and data. Remove Manrope from the rendered storefront hierarchy.
- Default body copy: `14px` to `16px`, line-height `1.45` to `1.6`.
- Navigation and compact metadata: `12px` to `14px`.
- Section headings: normally `28px` to `40px` on desktop and `24px` to `32px` on mobile.
- Reserve larger display type for the homepage hero only. Keep it responsive and visually subordinate to the product image.
- Prefer weights `400`, `500`, and `600`. Use `700` only for a truly primary headline or price.
- Use sentence case. Remove repeated uppercase eyebrow labels unless one label is essential for context.

### Color and surfaces

- Keep the light neutral palette: white, soft gray, near-black text, and one restrained action blue.
- Use blue for links, selection, and focus—not as decoration on every label.
- Prefer whitespace and alignment over borders, nested cards, tinted panels, and shadows.
- Use shadows only for genuinely floating UI such as search suggestions, menus, and sticky purchase controls.
- Use one radius language. Product media may use a subtle radius; ordinary sections should not all become rounded cards.

### Copy

- Every marketing section gets one headline and at most one short supporting sentence.
- Buttons use direct labels such as `Shop`, `Learn more`, `View products`, and `Start a build`.
- Remove copy that explains what the layout already demonstrates.
- Keep factual prices and specifications. Do not invent ratings, urgency, discounts, compatibility, or product claims.

### Interaction

- Preserve keyboard access, visible but quiet focus states, semantic controls, and 44px mobile targets.
- Keep the search field continuously visible in the header. Suggestions stay in a compact anchored dropdown.
- Keep loading, empty, error, disabled, and recovery states wherever data is fetched.
- Preserve cart, authentication, product, compatibility, payment, inventory, order, and admin business behavior.

## Required storefront structure

### Header

Build one compact commerce header, approximately `60px` to `68px` tall on desktop.

- One row: TechChasers logo, persistent search, account, cart, and menu/navigation.
- Search remains visually central but should not dominate the page.
- Keep the placeholder `Search for products`.
- Search focus uses a quiet neutral border without a large blue rectangle or glow.
- Move lower-priority category navigation into a menu or a thin secondary mechanism that does not double the header height.
- On mobile, use a compact top row and one full-width search row only when necessary. The result must remain materially shorter than the current header.

### Homepage

The homepage contains four primary moments in this order:

1. **Featured product hero**
   - One product, one concise title, one short supporting line, price when available, and no more than two actions.
   - Make the product image the dominant element.
   - Remove the eyebrow, specification rail, separate `View featured product` bubble, and redundant explanatory copy.
   - Long catalog titles must not turn the hero into a text wall. Use a controlled long-title treatment and keep the image visually dominant.

2. **Visual category row**
   - Show a small number of high-value categories as image-led destinations.
   - Keep labels and optional product counts compact.
   - Avoid large descriptive category cards.

3. **One curated product collection**
   - Use one collection only. Remove the duplicate `Recently Added` homepage rail.
   - Homepage cards show image, brand when useful, product name, and price.
   - Continue hiding stock messages and add-to-cart controls on homepage discovery cards.
   - Remove the specification signal rail from homepage cards if it competes with product recognition.

4. **PC-builder campaign**
   - One large visual banner or split section.
   - One headline, one short sentence, and one `Start a build` action.
   - Remove the three instructional explanation cards and the component-slot metadata paragraph from the homepage.

Convert shipping, secure payment, and warranty reassurance into one slim line or compact strip. Do not use three paragraph cards.

### Product catalog

- Keep the product grid visually quiet and scannable.
- Make the product image, name, and price the strongest information.
- Filters and sorting should read as utilities, not as a dashboard toolbar.
- Search submissions continue to use `/products?search=…`.
- Maintain pagination and every current fetch state.

### Product detail

- Establish a clear order: gallery, product identity, price, purchase action, reassurance, then details.
- Reduce competing labels, bordered containers, and repeated metadata near the primary purchase action.
- Show only the first six specifications by default and retain the existing `Show more specifications` / `Show fewer specifications` control.
- Keep the mobile purchase bar behavior and prevent duplicated primary actions from appearing simultaneously.

### Cart and checkout

- Preserve the current checkout workflow and validation behavior.
- Reduce instructional prose and repeated boxed summaries.
- Use compact labels, clear totals, one dominant next action, and progressive disclosure for secondary order information.
- Treat [`references/checkout.md`](../../references/checkout.md) as an interaction reference rather than a component library to copy.

### Footer

- Reduce the footer’s visual weight.
- Use compact type and fewer visible groups.
- Keep required policy, account, support, and commerce links accessible.

### Admin boundary

The admin remains an operations console. Do not apply the sparse campaign composition to admin tables, order details, forms, stock alerts, or operational queues. Shared typography tokens may be updated only when admin readability remains intact.

## Implementation sequence

1. Inspect the current rendered storefront and record the desktop/mobile density problems that match this prompt.
2. Update shared typography and spacing tokens without breaking admin readability.
3. Rebuild the header and search layout.
4. Simplify the homepage into the required four-part composition.
5. Apply the same hierarchy to catalog and product detail.
6. Simplify cart, checkout, account, policy, and footer surfaces without changing their workflows.
7. Remove unused components and CSS left behind by the replaced UI.
8. Update `CURRENT-CONTEXT.md`, the design-system master, and affected page overrides so future agents do not restore the old dense composition.

Finish each step before proceeding. Do not stop after producing mockups, recommendations, or a plan.

## Hard finish gate

Verify the real rendered result at `375px`, `768px`, `1024px`, and `1440px`.

The work is complete only when all of the following are true:

- the desktop header is compact and search remains continuously visible;
- mobile navigation, search, account, and cart are usable without overlap;
- no page has horizontal document overflow;
- the homepage contains one hero, one category module, one curated product collection, one PC-builder campaign, and compact reassurance;
- each homepage viewport has one obvious dominant idea;
- no homepage section reads like a paragraph-heavy explainer;
- typography uses a restrained scale and the storefront no longer renders heavy Manrope headings;
- homepage product cards contain no stock messaging or add-to-cart controls;
- product specifications remain progressively disclosed;
- loading, empty, error, focus, hover, active, disabled, and mobile states work;
- product images are not distorted or clipped;
- `npm run lint` has no new warnings or errors;
- `npm run build` passes;
- `git diff --check` passes for every modified file;
- unrelated dirty-worktree changes remain untouched.

When handing off, report the changed surfaces, the visible simplifications, responsive verification, interaction verification, and any remaining blocker. Do not describe the work as complete based only on lint or build output.
