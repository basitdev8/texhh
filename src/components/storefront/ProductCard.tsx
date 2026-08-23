"use client";

import Link from "next/link";
import Image from "next/image";
import { IProduct } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/components/ui/Toast";
import { formatPrice, getDiscountPercentage } from "@/lib/utils";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: IProduct;
  index?: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useToast();

  const isOnSale = product.comparePrice && product.comparePrice > product.price;
  const isNew =
    new Date().getTime() - new Date(product.createdAt).getTime() <
    14 * 24 * 60 * 60 * 1000;
  const discount = isOnSale
    ? getDiscountPercentage(product.price, product.comparePrice!)
    : 0;

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating);
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        width="11"
        height="11"
        viewBox="0 0 14 14"
        fill={i < rounded ? "currentColor" : "none"}
        className={i >= rounded ? styles.starEmpty : ""}
      >
        <path
          d="M7 1l1.76 3.57L12.5 5.1l-2.75 2.68.65 3.78L7 9.68 3.6 11.56l.65-3.78L1.5 5.1l3.74-.53L7 1z"
          stroke="currentColor"
          strokeWidth="0.7"
        />
      </svg>
    ));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product._id,
      itemType: "product",
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0] || "/placeholder.svg",
      maxStock: product.stock,
    });
    showToast(`${product.name} added to cart`, "success");
  };

  const indexLabel =
    typeof index === "number" ? String(index + 1).padStart(2, "0") : "";

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <Link
          href={`/products/${product.slug}`}
          aria-label={product.name}
        >
          <Image
            src={product.images[0] || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 25vw"
            className={styles.image}
          />
        </Link>

        {indexLabel && (
          <span className={styles.indexBadge}>№ {indexLabel}</span>
        )}

        {isOnSale ? (
          <span className={styles.discount}>−{discount}%</span>
        ) : isNew ? (
          <span className={`${styles.tagBadge} ${styles.tagBadgeAccent}`}>
            New
          </span>
        ) : null}

        {product.stock === 0 && (
          <span className={styles.outOfStockOverlay}>Sold Out</span>
        )}

        <button
          className={styles.addToCart}
          onClick={handleAddToCart}
          id={`add-to-cart-${product._id}`}
          disabled={product.stock === 0}
        >
          Add to Cart
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6h8M7 3l3 3-3 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className={styles.info}>
        <div className={styles.brandRow}>
          <span className={styles.brand}>{product.brand}</span>
          {/* Hidden until reviews exist — see the reviews ticket. */}
          {product.reviewCount > 0 && (
            <span className={styles.rating}>
              <span className={styles.stars}>{renderStars(product.rating)}</span>
              <span className={styles.reviewCount}>
                ({product.reviewCount})
              </span>
            </span>
          )}
        </div>

        <h3 className={styles.name}>
          <Link href={`/products/${product.slug}`} className={styles.nameLink}>
            {product.name}
          </Link>
        </h3>

        <div className={styles.priceRow}>
          <div className={styles.priceMain}>
            <span className={styles.price}>{formatPrice(product.price)}</span>
            {isOnSale && (
              <span className={styles.comparePrice}>
                {formatPrice(product.comparePrice!)}
              </span>
            )}
          </div>
          <Link
            href={`/products/${product.slug}`}
            className={styles.viewLink}
            aria-label={`View ${product.name}`}
          >
            View →
          </Link>
        </div>
      </div>
    </article>
  );
}
