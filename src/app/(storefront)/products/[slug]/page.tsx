"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import ProductGallery from "@/components/storefront/ProductGallery";
import ProductCard from "@/components/storefront/ProductCard";
import Badge from "@/components/ui/Badge";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/components/ui/Toast";
import { formatPrice, getDiscountPercentage } from "@/lib/utils";
import type { IProduct, ICategory } from "@/types";
import styles from "./productDetail.module.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const [product, setProduct] = useState<IProduct | null>(null);
  const [related, setRelated] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProduct(data.data);
          const categoryId =
            typeof data.data.category === "string"
              ? data.data.category
              : (data.data.category as ICategory)?._id;
          if (categoryId) {
            fetch(`/api/products?category=${categoryId}&limit=4`)
              .then((r) => r.json())
              .then((rel) => {
                setRelated(
                  (rel.data || []).filter(
                    (p: IProduct) => p._id !== data.data._id
                  )
                );
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container">
        <div className={styles.loading}>Loading product…</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <div className={styles.notFound}>
          <h1 className={styles.notFoundTitle}>Product not found</h1>
          <p>This product no longer exists or has been removed.</p>
          <Link
            href="/products"
            style={{
              display: "inline-block",
              marginTop: "var(--space-5)",
              color: "var(--color-accent)",
            }}
          >
            ← Back to products
          </Link>
        </div>
      </div>
    );
  }

  const category =
    typeof product.category === "object"
      ? (product.category as ICategory)
      : null;
  const isOnSale =
    product.comparePrice && product.comparePrice > product.price;
  const discount = isOnSale
    ? getDiscountPercentage(product.price, product.comparePrice!)
    : 0;
  const specEntries = Object.entries(product.specifications || {});

  const handleAddToCart = () => {
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images[0] || "/placeholder.svg",
      maxStock: product.stock,
    });
    showToast(`${product.name} added to cart`, "success");
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <nav className={styles.breadcrumbs}>
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/products">Products</Link>
          {category && (
            <>
              <span>/</span>
              <Link href={`/products?category=${category.slug}`}>
                {category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className={styles.layout}>
          <ProductGallery images={product.images} alt={product.name} />

          <div className={styles.info}>
            <span className={styles.brand}>{product.brand}</span>
            <h1 className={styles.title}>{product.name}</h1>

            <div className={styles.ratingRow}>
              <span className={styles.stars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <svg
                    key={i}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill={i < Math.round(product.rating) ? "currentColor" : "none"}
                    className={
                      i >= Math.round(product.rating) ? styles.starEmpty : ""
                    }
                  >
                    <path
                      d="M8 1.5l2 4 4.5.65L11.25 9.4 12 14l-4-2.1L4 14l.75-4.6L1.5 6.15 6 5.5l2-4z"
                      stroke="currentColor"
                      strokeWidth="0.5"
                    />
                  </svg>
                ))}
              </span>
              <span className={styles.reviewCount}>
                {product.rating.toFixed(1)} · {product.reviewCount} reviews
              </span>
            </div>

            <div className={styles.priceRow}>
              <span className={styles.price}>{formatPrice(product.price)}</span>
              {isOnSale && (
                <>
                  <span className={styles.comparePrice}>
                    {formatPrice(product.comparePrice!)}
                  </span>
                  <span className={styles.discount}>-{discount}%</span>
                </>
              )}
            </div>

            <p className={styles.shortDesc}>{product.shortDescription}</p>

            <div className={styles.stockRow}>
              {product.stock > 0 ? (
                <Badge variant="success">In Stock</Badge>
              ) : (
                <Badge variant="error">Out of Stock</Badge>
              )}
              {product.stock > 0 && product.stock <= 5 && (
                <span style={{ color: "var(--color-warning)" }}>
                  Only {product.stock} left
                </span>
              )}
            </div>

            <div className={styles.actionRow}>
              <div className={styles.qtyControl}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className={styles.qtyValue}>{quantity}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
              <button
                className={styles.addToCart}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? "Out of stock" : "Add to Cart"}
              </button>
            </div>

            {specEntries.length > 0 && (
              <div className={styles.specs}>
                <h3 className={styles.specsTitle}>Key specifications</h3>
                <table className={styles.specTable}>
                  <tbody>
                    {specEntries.map(([k, v]) => (
                      <tr key={k}>
                        <td className={styles.specKey}>{k}</td>
                        <td className={styles.specValue}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className={styles.description}>
          <h2 className={styles.descriptionTitle}>Product Details</h2>
          <p className={styles.descriptionText}>{product.description}</p>
        </div>

        {related.length > 0 && (
          <section className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>You may also like</h2>
            <div className={styles.relatedGrid}>
              {related.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
