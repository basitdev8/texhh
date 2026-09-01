# Storefront redesign handoff

Use this documentation when implementing or reviewing any TechChasers storefront or admin UI.

## Read in this order

1. [`CURRENT-CONTEXT.md`](../../CURRENT-CONTEXT.md) when resuming work, for current implementation state, verification evidence, and known gaps.
2. [`CONTEXT.md`](../../CONTEXT.md) for canonical product and operations vocabulary.
3. [`design-system/techchasers/MASTER.md`](../../design-system/techchasers/MASTER.md) for the visual, interaction, content, responsive, and finish contract.
4. The matching file in [`design-system/techchasers/pages/`](../../design-system/techchasers/pages/) for route composition and states.
5. [`storefront-spec.md`](./storefront-spec.md) for shared journeys, components, state matrix, accessibility, and performance boundaries.
6. The active phase in [`implementation-plan.md`](./implementation-plan.md) for file scope and completion criteria.
7. [`audit.md`](./audit.md) only when the reason for a decision or reference translation is needed.

## Working rule

Preserve current business behavior and data ownership. The redesign changes how the product is understood and operated; it does not silently replace auth, catalog, cart validation, compatibility, payment, order, upload, or admin rules.

`CURRENT-CONTEXT.md` records observed implementation state and open verification work. The master and page override files remain the source of truth when they disagree with a status note.

The supplied `hero.md` and `checkout.md` files are pattern references. Adapt the behavior to the current Next.js + CSS Modules codebase; do not install their Tailwind, shadcn, Framer Motion, or demo payment stack.

## Completion

A page is complete when its page override, the shared state matrix, the master hard finish gate, and the active implementation phase’s verification criteria all pass. Lint/build alone are insufficient.
