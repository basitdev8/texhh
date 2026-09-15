# Admin override

Applies to `/admin/**` and shared admin components. The admin uses the same foundations but is denser and operational, not Samsung-like marketing UI.

## Job

Let an administrator understand store health and complete product, order, component, customer, homepage, and settings work with low error risk.

## Shell

- Persistent desktop sidebar and compact top bar; mobile uses a drawer with the current section named in the header.
- Active navigation uses blue text/tint plus a structural marker.
- Main content has a readable max width where forms benefit; tables may use the full available width.

## Dashboard and lists

- Summary metrics state their period and unit.
- Tables use sticky headings where useful, aligned currency/numbers, filters tied to URL state, and clear empty/error states.
- Row actions are named; destructive actions are separated from routine actions.
- On narrow screens, prioritize key columns and move the rest into a details disclosure rather than illegible compression.

## Forms

- Group product data by identity, merchandising, pricing, inventory, media, and specifications.
- Required/optional status is explicit. Save state persists long enough to be perceived.
- Image upload has progress, preview, replacement/removal, failure recovery, and useful alt-text guidance.
- Unsaved-change protection applies to long create/edit forms.

## Status

- Order fulfillment, payment, refund, and stock reservation are distinct fields; never collapse them into one generic badge.
- Status changes name their consequences before confirmation.

## Acceptance

- Every list supports loading, empty, error, and populated states.
- Every mutation has pending, success, failure, and duplicate-submission behavior.
- Keyboard focus remains visible in dense tables and dialogs.
- Storefront marketing components are not reused when an admin-specific structure is clearer.
