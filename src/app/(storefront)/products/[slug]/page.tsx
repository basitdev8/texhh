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
      itemType: "product",
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
          <span className={styles.crumbSep}>/</span>
          <Link href="/products">Products</Link>
          {category && (
            <>
              <span className={styles.crumbSep}>/</span>
              <Link href={`/products?category=${category.slug}`}>
                {category.name}
              </Link>
            </>
          )}
          <span className={styles.crumbSep}>/</span>
          <span className={styles.crumbCurrent}>{product.name}</span>
        </nav>

        <div className={styles.layout}>
          <div className={styles.galleryCol}>
            <ProductGallery images={product.images} alt={product.name} />
          </div>

          <div className={styles.info}>
            <div className={styles.eyebrowRow}>
              <span className={styles.eyebrowLine} />
              <span className={styles.brand}>{product.brand}</span>
              {category && (
                <Link
                  href={`/products?category=${category.slug}`}
                  className={styles.categoryChip}
                >
                  {category.name}
                </Link>
              )}
            </div>

            <h1 className={styles.title}>{product.name}</h1>

            {/* Ratings stay hidden until there is a review system to fill them —
                "0.0 · 0 reviews" on every product reads as "nobody bought this". */}
            {product.reviewCount > 0 && (
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
                  {product.rating.toFixed(1)} · {product.reviewCount} review
                  {product.reviewCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            <p className={styles.shortDesc}>{product.shortDescription}</p>

            <div className={styles.priceCard}>
              <div className={styles.priceRow}>
                <span className={styles.price}>
                  {formatPrice(product.price)}
                </span>
                {isOnSale && (
                  <>
                    <span className={styles.comparePrice}>
                      {formatPrice(product.comparePrice!)}
                    </span>
                    <span className={styles.discount}>−{discount}%</span>
                  </>
                )}
              </div>
              <div className={styles.stockRow}>
                {product.stock > 0 ? (
                  <Badge variant="success">In Stock</Badge>
                ) : (
                  <Badge variant="error">Out of Stock</Badge>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <span className={styles.lowStock}>
                    Only {product.stock} left
                  </span>
                )}
                {isOnSale && (
                  <span className={styles.savings}>
                    You save{" "}
                    {formatPrice(product.comparePrice! - product.price)}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.actionRow}>
              <div className={styles.qtyControl}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
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
                  aria-label="Increase quantity"
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
                {product.stock > 0 && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 7h10M8 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>

            <ul className={styles.assurances}>
              {[
                {
                  title: "Free 48h shipping",
                  sub: "Express, on orders over ₹5,000",
                  path: "M2 6h11l3 4v4h-2M2 6v8h2m10 0H8m-4 0a2 2 0 1 0 4 0m6 0a2 2 0 1 0 4 0",
                },
                {
                  title: "2-year warranty",
                  sub: "Backed by our atelier, no asterisk",
                  path: "M10 1.8l6 2.6v4.2c0 4-2.6 6.8-6 7.6-3.4-.8-6-3.6-6-7.6V4.4l6-2.6zM7.2 9.6l1.8 1.8 3.8-3.8",
                },
                {
                  title: "30-day returns",
                  sub: "Changed your mind? Send it back",
                  path: "M3 8a7 7 0 1 1 .9 3.4M3 8V4M3 8h4",
                },
              ].map((a) => (
                <li key={a.title} className={styles.assurance}>
                  <svg
                    className={styles.assuranceIcon}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={a.path} />
                  </svg>
                  <div>
                    <span className={styles.assuranceTitle}>{a.title}</span>
                    <span className={styles.assuranceSub}>{a.sub}</span>
                  </div>
                </li>
              ))}
            </ul>

            {specEntries.length > 0 && (
              <div className={styles.specs}>
                <h3 className={styles.specsTitle}>Key specifications</h3>
                <div className={styles.specGrid}>
                  {specEntries.map(([k, v]) => (
                    <div key={k} className={styles.specItem}>
                      <span className={styles.specKey}>{k}</span>
                      <span className={styles.specValue}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.description}>
          <div className={styles.descriptionHead}>
            <span className={styles.sectionEyebrow}>Details / The Story</span>
            <h2 className={styles.descriptionTitle}>About this piece</h2>
          </div>
          <div className={styles.descriptionBody}>
            <p className={styles.descriptionText}>{product.description}</p>
            {product.tags?.length > 0 && (
              <div className={styles.tags}>
                {product.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className={styles.relatedSection}>
            <div className={styles.relatedHead}>
              <span className={styles.sectionEyebrow}>More / You may like</span>
              <h2 className={styles.relatedTitle}>
                Pairs <em className={styles.italic}>well</em> with
              </h2>
            </div>
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
