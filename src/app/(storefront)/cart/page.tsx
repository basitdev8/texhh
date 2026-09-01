"use client";

import Link from "next/link";
import CartItem from "@/components/storefront/CartItem";
import StatusNotice from "@/components/ui/StatusNotice";
import { useCartStore } from "@/store/cartStore";
import { useCartValidation } from "@/hooks/useCartValidation";
import { formatPrice } from "@/lib/utils";
import styles from "./page.module.css";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const itemCount = useCartStore((s) => s.getItemCount());
  const { changes, blockers, totals, settings } = useCartValidation();

  const shipping =
    totals?.shippingCost ??
    (subtotal === 0 || subtotal >= settings.freeShippingThreshold
      ? 0
      : settings.flatShippingRate);
  const tax = totals?.tax ?? Number(((subtotal * settings.gstRate) / (100 + settings.gstRate)).toFixed(2));
  const total = totals?.totalAmount ?? subtotal + shipping;

  const freeShippingThreshold = settings.freeShippingThreshold || 5000;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIconWrap} aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h1 className={styles.emptyTitle}>Your cart is currently empty</h1>
            <p className={styles.emptySubtitle}>
              Explore our range of precision electronics, smartphones, and custom PC components.
            </p>
            <div className={styles.emptyActions}>
              <Link href="/products" className={styles.primaryActionBtn}>
                Browse Products
              </Link>
              <Link href="/pc-builder" className={styles.secondaryActionBtn}>
                Build a PC
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.title}>Shopping Cart</h1>
          <span className={styles.itemCountBadge}>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </header>

        {/* Validation notices */}
        {blockers.length > 0 && (
          <div className={styles.noticeWrap}>
            <StatusNotice
              variant="error"
              title="Items requiring attention before checkout"
            >
              <ul className={styles.noticeList}>
                {blockers.map((b) => (
                  <li key={`${b.product}-${b.kind}`} className={styles.noticeRow}>
                    <span>{b.message}</span>
                    <button
                      type="button"
                      className={styles.noticeBtn}
                      onClick={() => removeItem(b.product)}
                    >
                      Remove item
                    </button>
                  </li>
                ))}
              </ul>
            </StatusNotice>
          </div>
        )}

        {changes.length > 0 && (
          <div className={styles.noticeWrap}>
            <StatusNotice variant="info" title="Catalog price updates applied">
              <ul className={styles.noticeList}>
                {changes.map((c) => (
                  <li key={`${c.product}-${c.kind}`}>
                    {c.name}: {typeof c.was === "number" && <s>{formatPrice(c.was)}</s>}{" "}
                    {typeof c.now === "number" && <strong>{formatPrice(c.now)}</strong>}
                  </li>
                ))}
              </ul>
            </StatusNotice>
          </div>
        )}

        {/* 2-Column Cart Layout */}
        <div className={styles.layout}>
          {/* Left: Items List */}
          <div className={styles.itemsSection}>
            <div className={styles.itemsList}>
              {items.map((item) => (
                <CartItem key={item.productId} item={item} />
              ))}
            </div>

            <div className={styles.cartFooterActions}>
              <Link href="/products" className={styles.continueLink}>
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Right: Order Summary */}
          <aside className={styles.summarySection} aria-label="Order summary">
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>

              {/* Free Shipping Progress Indicator */}
              <div className={styles.shippingIndicator}>
                <div className={styles.shippingBarBg}>
                  <div
                    className={styles.shippingBarFill}
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
                <p className={styles.shippingText}>
                  {isFreeShipping
                    ? "✓ You qualify for free express delivery"
                    : `Add ${formatPrice(amountNeededForFreeShipping)} more to qualify for free shipping`}
                </p>
              </div>

              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span className={styles.num}>{formatPrice(subtotal)}</span>
                </div>

                <div className={styles.summaryRow}>
                  <span>Estimated Shipping</span>
                  <span className={styles.num}>
                    {shipping === 0 ? "FREE" : formatPrice(shipping)}
                  </span>
                </div>

                <div className={styles.summaryRow}>
                  <span>Estimated GST ({settings.gstRate}%)</span>
                  <span className={styles.num}>{formatPrice(tax)}</span>
                </div>

                <div className={`${styles.summaryRow} ${styles.summaryTotalRow}`}>
                  <span>Order Total</span>
                  <span className={styles.totalNum}>{formatPrice(total)}</span>
                </div>
              </div>

              <div className={styles.checkoutActionWrap}>
                {blockers.length > 0 ? (
                  <button type="button" className={styles.checkoutBtn} disabled>
                    Resolve items to proceed
                  </button>
                ) : (
                  <Link href="/checkout" className={styles.checkoutBtn} id="cart-proceed-checkout">
                    Proceed to Checkout
                  </Link>
                )}
              </div>

              <div className={styles.assuranceNote}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Encrypted 256-bit secure checkout</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile checkout bar — the summary sits far below the item list on
          phones, so the decisive action stays reachable. */}
      <div className={styles.mobileCheckoutBar} data-mobile-action-bar="compact">
        <div className={styles.mobileCheckoutInner}>
          <div className={styles.mobileTotal}>
            <span className={styles.mobileTotalLabel}>Order total</span>
            <span className={styles.mobileTotalValue}>{formatPrice(total)}</span>
          </div>
          {blockers.length > 0 ? (
            <button type="button" className={styles.mobileCheckoutBtn} disabled>
              Resolve items
            </button>
          ) : (
            <Link href="/checkout" className={styles.mobileCheckoutBtn}>
              Checkout
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
