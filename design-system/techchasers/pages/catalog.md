# Catalog and search override

Applies to `/products`, `/categories/[slug]`, `/search`, Product Card, Pagination, and search/filter UI.

## Job

Help customers narrow a broad electronics catalog quickly while keeping the selected filters, result count, availability, and sort order obvious.

## Structure

- Compact H1, optional category description, and result count.
- Desktop filter rail or toolbar for category, brand, price, and availability; sort aligned with count.
- Mobile `Filter` and `Sort` actions that open accessible drawers/sheets.
- Removable active-filter chips above the results.
- Uniform product grid followed by pagination.

Category routes may continue to resolve through the products query, but the page must visibly retain category context and provide a predictable back path.

## Product cards

Use the master Product Card order. Category-aware Signal Rail examples:

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
