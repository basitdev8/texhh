# PC Builder override

Applies to `/pc-builder` and PC component cards/badges.

## Job

Guide a customer from an empty build to a compatible cart without requiring expert memory. This is TechChasers’ product differentiator and should feel more purposeful than the marketing pages.

## Structure

- H1 `Build your PC`, one-sentence explanation, and progress (`3 of 8 parts selected`).
- Desktop: step navigation, component results, and a sticky Build Summary.
- Mobile: horizontally scrollable named steps, one component list, and a bottom summary bar that opens a full build sheet.
- Each component card shows image, brand/name, price, stock, category-specific Signal Rail, compatibility state, and `Select`/`Selected`.
- Build Summary lists every part slot, subtotal, compatibility result, and `Add build to cart`.

## Compatibility language

- Compatible: `These selected parts work together.`
- Warning: explain the uncertain or recommended condition and allow progress only when current business rules permit it.
- Blocking issue: name both conflicting parts and the property that conflicts; link back to the earliest part that can resolve it.
- Compatibility is text plus icon/color, never color alone.

## States

- Empty step: explain that no parts are available and let the user continue to other steps.
- Loading: keep step navigation and Build Summary stable.
- Partial build: preserve selections while moving between steps or sorting.
- Add disabled: state `Select at least one part` or `Resolve compatibility issues` beside the action.
- Add success: `Build added to cart` and show number of component lines added.

## Acceptance

- The customer always knows the active step, selected parts, subtotal, and compatibility result.
- Keyboard users can select a component without relying on a card-level `role=button` when nested controls exist.
- No “atelier,” “compose,” numbered editorial marks, or decorative stagger.
- A 375px viewport never hides the active step or final action behind the browser safe area.
