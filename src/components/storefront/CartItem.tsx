"use client";

import Link from "next/link";
import Image from "next/image";
import { ICartItem } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import styles from "./CartItem.module.css";

interface CartItemProps {
  item: ICartItem;
}

export default function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className={styles.row}>
      <div className={styles.imageWrap}>
        <Image
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          fill
          sizes="100px"
          className={styles.image}
        />
      </div>
      <div className={styles.info}>
        <div className={styles.name}>
          <Link href={`/products/${item.productId}`}>{item.name}</Link>
        </div>
        <div className={styles.price}>{formatPrice(item.price)} each</div>
        <div className={styles.qtyControls}>
          <button
            className={styles.qtyBtn}
            onClick={() =>
              updateQuantity(item.productId, Math.max(1, item.quantity - 1))
            }
            disabled={item.quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className={styles.qtyValue}>{item.quantity}</span>
          <button
            className={styles.qtyBtn}
            onClick={() =>
              updateQuantity(item.productId, item.quantity + 1)
            }
            disabled={item.quantity >= item.maxStock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.lineTotal}>
          {formatPrice(item.price * item.quantity)}
        </div>
        <button
          className={styles.removeBtn}
          onClick={() => removeItem(item.productId)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
