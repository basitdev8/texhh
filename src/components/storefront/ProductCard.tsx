"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { IProduct } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/components/ui/Toast";
import { formatPrice, getDiscountPercentage, getProductSignalRail } from "@/lib/utils";
import styles from "./ProductCard.module.css";

export { getProductSignalRail };

interface ProductCardProps {
  product: IProduct;
  index?: number;
  /** Homepage rails are discovery surfaces, not purchase controls. */
  discoveryOnly?: boolean;
}

export default function ProductCard({ product, discoveryOnly = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const isOnSale = Boolean(product.comparePrice && product.comparePrice > product.price);
  const discount = isOnSale
    ? getDiscountPercentage(product.price, product.comparePrice!)
    : 0;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  // The spec rail competes with product recognition on discovery rails.
  const signalRail = discoveryOnly ? null : getProductSignalRail(product.specifications);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);
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
    setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <article className={styles.card}>
      <Link
        href={`/products/${product.slug}`}
        className={styles.imageLink}
        aria-label={`View ${product.name}`}
      >
        <div className={styles.imageWrap}>
          <Image
            src={product.images[0] || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={styles.image}
          />
          {isOnSale && (
            <span className={styles.badgeSale}>
              −{discount}%
            </span>
          )}
          {!discoveryOnly && isOutOfStock && (
            <span className={styles.badgeOutOfStock}>
              Out of stock
            </span>
          )}
        </div>
      </Link>

      <div className={styles.content}>
        {product.brand && <span className={styles.brand}>{product.brand}</span>}

        <h3 className={styles.name}>
          <Link href={`/products/${product.slug}`} className={styles.nameLink}>
            {product.name}
          </Link>
        </h3>

        {signalRail && (
          <div className={styles.signalRail} title={signalRail}>
            <span>{signalRail}</span>
          </div>
        )}

        <div className={styles.priceRow}>
          <div className={styles.priceWrap}>
            <span className={styles.price}>{formatPrice(product.price)}</span>
            {isOnSale && product.comparePrice && (
              <span className={styles.comparePrice}>
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>
          {!discoveryOnly && isLowStock && (
            <span className={styles.lowStock}>Only {product.stock} left</span>
          )}
        </div>

        {!discoveryOnly && (
          <div className={styles.actions}>
            {isOutOfStock ? (
              <Link href={`/products/${product.slug}`} className={styles.viewBtn}>
                View product
              </Link>
            ) : (
              <button
                type="button"
                className={styles.addToCartBtn}
                onClick={handleAddToCart}
                disabled={isAdding}
                aria-label={`Add ${product.name} to cart`}
                id={`add-to-cart-${product._id}`}
              >
                {isAdding ? "Added" : "Add to cart"}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
