"use client";

import Link from "next/link";
import CartItem from "@/components/storefront/CartItem";
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

  // Server totals are authoritative — they are what checkout will charge. The local
  // figures only stand in for the moment before the first response arrives.
  const shipping =
    totals?.shippingCost ??
    (subtotal === 0 || subtotal >= settings.freeShippingThreshold
      ? 0
      : settings.flatShippingRate);
  const tax = totals?.tax ?? Number(((subtotal * settings.gstRate) / (100 + settings.gstRate)).toFixed(2));
  const total = totals?.totalAmount ?? subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className="container">
          <h1 className={styles.title}>Your Cart</h1>
          <div className={styles.empty}>
            <svg
              className={styles.emptyIcon}
              viewBox="0 0 80 80"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M20 24h44l-5 32H25L20 24z"
                strokeLinejoin="round"
              />
              <path
                d="M20 24L17 12H8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="30" cy="66" r="3" />
              <circle cx="54" cy="66" r="3" />
            </svg>
            <h2 className={styles.emptyTitle}>Your cart is empty</h2>
            <p className={styles.emptyText}>
              Discover premium tech and start filling your cart.
            </p>
            <Link href="/products" className={styles.emptyBtn}>
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Your Cart</h1>
        <p className={styles.subtitle}>
          {itemCount} item{itemCount !== 1 ? "s" : ""} ready for checkout
        </p>

        {blockers.length > 0 && (
          <div className={styles.alertError}>
            <span className={styles.alertTitle}>
              Some items need your attention before checkout
            </span>
            <ul className={styles.alertList}>
              {blockers.map((b) => (
                <li key={`${b.product}-${b.kind}`} className={styles.alertRow}>
                  <span>{b.message}</span>
                  <button
                    type="button"
                    className={styles.alertAction}
                    onClick={() => removeItem(b.product)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {changes.length > 0 && (
          <div className={styles.alertInfo}>
            <span className={styles.alertTitle}>Prices updated</span>
            <ul className={styles.alertList}>
              {changes.map((c) => (
                <li key={`${c.product}-${c.kind}`}>
                  {c.name}:{" "}
                  {typeof c.was === "number" && <s>{formatPrice(c.was)}</s>}{" "}
                  {typeof c.now === "number" && <strong>{formatPrice(c.now)}</strong>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.layout}>
          <div className={styles.items}>
            {items.map((item) => (
              <CartItem key={item.productId} item={item} />
            ))}
          </div>

          <aside className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>
            <div className={styles.row}>
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className={styles.row}>
              <span>Shipping</span>
              <span>
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </span>
            </div>
            <div className={styles.row}>
              <span>Incl. GST ({settings.gstRate}%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className={`${styles.row} ${styles.rowTotal}`}>
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            {blockers.length > 0 ? (
              <button type="button" className={styles.checkoutBtn} disabled>
                Resolve items above to continue
              </button>
            ) : (
              <Link href="/checkout" className={styles.checkoutBtn}>
                Proceed to Checkout →
              </Link>
            )}
            <Link href="/products" className={styles.continueLink}>
              ← Continue shopping
            </Link>
            <p className={styles.note}>{settings.shippingBannerText}</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
