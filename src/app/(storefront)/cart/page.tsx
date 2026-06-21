"use client";

import Link from "next/link";
import CartItem from "@/components/storefront/CartItem";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import styles from "./page.module.css";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const itemCount = useCartStore((s) => s.getItemCount());

  const shipping = subtotal === 0 ? 0 : subtotal >= 100 ? 0 : 9.99;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = subtotal + shipping + tax;

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
              <span>Tax (8%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className={`${styles.row} ${styles.rowTotal}`}>
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Link href="/checkout" className={styles.checkoutBtn}>
              Proceed to Checkout →
            </Link>
            <Link href="/products" className={styles.continueLink}>
              ← Continue shopping
            </Link>
            <p className={styles.note}>
              Free shipping on orders over $100. Taxes calculated at checkout.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
