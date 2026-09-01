"use client";

import Link from "next/link";
import Image from "next/image";
import { ICartItem } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { isAllowedImageSource } from "@/lib/image";
import { formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import styles from "./CartItem.module.css";

interface CartItemProps {
  item: ICartItem;
}

export default function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const isComponent = item.itemType === "component";
  const itemHref = isComponent ? "/pc-builder" : `/products/${item.productId}`;

  return (
    <article className={styles.row}>
      <div className={styles.imageWrap}>
        <Image
          src={isAllowedImageSource(item.image) ? item.image : "/placeholder.svg"}
          alt={item.name}
          fill
          sizes="88px"
          className={styles.image}
        />
      </div>

      <div className={styles.info}>
        <div className={styles.titleRow}>
          {isComponent && (
            <Badge variant="info">PC Component</Badge>
          )}
          <h3 className={styles.name}>
            <Link href={itemHref}>{item.name}</Link>
          </h3>
        </div>

        <div className={styles.price}>{formatPrice(item.price)} each</div>

        <div className={styles.qtyControls}>
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() =>
              updateQuantity(item.productId, Math.max(1, item.quantity - 1))
            }
            disabled={item.quantity <= 1}
            aria-label={`Decrease quantity of ${item.name}`}
          >
            −
          </button>
          <span className={styles.qtyValue} aria-live="polite">
            {item.quantity}
          </span>
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() =>
              updateQuantity(item.productId, item.quantity + 1)
            }
            disabled={item.quantity >= item.maxStock}
            aria-label={`Increase quantity of ${item.name}`}
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.right}>
        <span className={styles.lineTotal}>
          {formatPrice(item.price * item.quantity)}
        </span>
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => removeItem(item.productId)}
          aria-label={`Remove ${item.name} from cart`}
        >
          Remove
        </button>
      </div>
    </article>
  );
}
