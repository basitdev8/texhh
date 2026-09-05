# Catalog and search override

Applies to `/products`, `/categories/[slug]`, `/search`, Product Card, Pagination, and search/filter UI.

## Job

Help customers narrow a broad electronics catalog quickly while keeping the selected filters, result count, availability, and sort order obvious.

## Structure

- Compact H1, the real category description when one exists, and the result count. No generic “browse our curated catalog” subtitle — the grid demonstrates that already.
- Filters and sorting read as utilities, not a dashboard toolbar: borderless category chips with a quiet selected state, compact price inputs and sort select, and a single divider between the header and the grid.
- Mobile `Filter` and `Sort` actions that open accessible drawers/sheets.
- Removable active-filter chips above the results.
- Uniform product grid followed by pagination.

Category routes may continue to resolve through the products query, but the page must visibly retain category context and provide a predictable back path.

## Product cards

Use the master Product Card: borderless, image well first, and a **secondary** add-to-cart so the images and prices lead the grid.

The list API (`/api/products`) excludes `specifications`, so the Signal Rail does not render here today. If a future change selects specs for the list, use these category-aware examples:

- phones/tablets: display, storage, connectivity;
- laptops/desktops: CPU, RAM, storage or GPU;
- watches/audio: size, battery, connectivity;
- components: socket/form factor, generation, capacity.

## States

- Loading: 8–12 shape-matched cards with the toolbar stable.
- Empty catalog: `No products are available yet` plus a category or home link.
- No filtered results: name active filters and offer `Clear filters`.
- Request error: `Products couldn’t be loaded` with `Try again`; do not present it as empty.
- Out of stock: product remains discoverable unless business rules hide it; action becomes `View product`.

## Acceptance

- Query parameters remain shareable and back/forward navigation restores the view.
- All filter controls have labels and keyboard operation.
- Mobile drawers trap focus, close with Escape, and return focus to the trigger.
- The grid has no staggered offsets and no card content jumps as images load.
- Price and action rows stay aligned across a row even when names differ in length.
