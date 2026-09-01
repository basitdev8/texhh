"use client";

import React, { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import ProductGallery from "@/components/storefront/ProductGallery";
import ProductCard from "@/components/storefront/ProductCard";
import Badge from "@/components/ui/Badge";
import LoadingState from "@/components/ui/LoadingState";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/components/ui/Toast";
import { formatPrice, getDiscountPercentage, getProductSignalRail } from "@/lib/utils";
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
  const [isAdding, setIsAdding] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showAllSpecifications, setShowAllSpecifications] = useState(false);
  const primaryActionRef = useRef<HTMLButtonElement | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProduct(data.data);
          setShowAllSpecifications(false);
          const categoryId =
            typeof data.data.category === "string"
              ? data.data.category
              : (data.data.category as ICategory)?._id;
          if (categoryId) {
            fetch(`/api/products?category=${categoryId}&limit=4`)
              .then((r) => r.json())
              .then((rel) => {
                setRelated(
                  (rel.data || []).filter((p: IProduct) => p._id !== data.data._id)
                );
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  // The mobile purchase bar only appears once the in-page action scrolls away,
  // so it never duplicates or covers a visible control.
  useEffect(() => {
    const target = primaryActionRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { rootMargin: "-72px 0px 0px 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [product]);

  if (loading) {
    return (
      <div className="container" style={{ padding: "var(--space-12) 0" }}>
        <LoadingState
          label="Loading product details"
          detail="Fetching specifications, availability, and pricing."
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: "var(--space-16) 0", textAlign: "center" }}>
        <div className={styles.notFound}>
          <h1 className={styles.notFoundTitle}>Product not found</h1>
          <p className={styles.notFoundText}>
            The product you are looking for may have been retired or renamed.
          </p>
          <div className={styles.notFoundActions}>
            <Link href="/products" className={styles.notFoundBtn}>
              ← Browse all products
            </Link>
            <Link href="/search" className={styles.notFoundSecondaryBtn}>
              Search catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const category =
    typeof product.category === "object" ? (product.category as ICategory) : null;
  const isOnSale = Boolean(product.comparePrice && product.comparePrice > product.price);
  const discount = isOnSale
    ? getDiscountPercentage(product.price, product.comparePrice!)
    : 0;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const signalRail = getProductSignalRail(product.specifications);
  const specEntries = Object.entries(product.specifications || {});
  const defaultSpecCount = 6;
  const visibleSpecEntries = showAllSpecifications
    ? specEntries
    : specEntries.slice(0, defaultSpecCount);
  const hiddenSpecCount = Math.max(0, specEntries.length - defaultSpecCount);

  const handleAddToCart = () => {
    if (isOutOfStock || isAdding) return;
    setIsAdding(true);
    addItem({
      productId: product._id,
      itemType: "product",
      name: product.name,
      price: product.price,
      quantity,
      image: product.images[0] || "/placeholder.svg",
      maxStock: product.stock,
    });
    showToast(`${quantity} × ${product.name} added to cart`, "success");
    setTimeout(() => setIsAdding(false), 800);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Breadcrumbs — collapse to a single back link on phones */}
        <Link
          href={category ? `/products?category=${category.slug}` : "/products"}
          className={styles.backLink}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to {category ? category.name : "Products"}
        </Link>

        <nav className={styles.breadcrumbs} aria-label="Breadcrumbs">
          <Link href="/">Home</Link>
          <span className={styles.crumbSep} aria-hidden="true">/</span>
          <Link href="/products">Products</Link>
          {category && (
            <>
              <span className={styles.crumbSep} aria-hidden="true">/</span>
              <Link href={`/products?category=${category.slug}`}>{category.name}</Link>
            </>
          )}
          <span className={styles.crumbSep} aria-hidden="true">/</span>
          <span className={styles.crumbCurrent} aria-current="page">{product.name}</span>
        </nav>

        {/* 2-Column Main Stage */}
        <div className={styles.stage}>
          {/* Left Column: Gallery */}
          <div className={styles.galleryCol}>
            <ProductGallery images={product.images} alt={product.name} />
          </div>

          {/* Right Column: Sticky Purchase Details */}
          <div className={styles.purchaseCol}>
            <div className={styles.purchaseInner}>
              {product.brand && (
                <span className={styles.brand}>{product.brand}</span>
              )}

              <h1 className={styles.title}>{product.name}</h1>

              {/* Signal Rail */}
              {signalRail && (
                <div className={styles.signalRail}>
                  <span>{signalRail}</span>
                </div>
              )}

              {/* Pricing & Stock Card */}
              <div className={styles.priceCard}>
                <div className={styles.priceRow}>
                  <span className={styles.price}>{formatPrice(product.price)}</span>
                  {isOnSale && product.comparePrice && (
                    <>
                      <span className={styles.comparePrice}>
                        {formatPrice(product.comparePrice)}
                      </span>
                      <span className={styles.discountBadge}>−{discount}%</span>
                    </>
                  )}
                </div>

                <div className={styles.stockRow}>
                  {isOutOfStock ? (
                    <Badge variant="error">Out of Stock</Badge>
                  ) : (
                    <Badge variant="success">In Stock</Badge>
                  )}
                  {isLowStock && (
                    <span className={styles.lowStock}>
                      Only {product.stock} items remaining
                    </span>
                  )}
                  {isOnSale && product.comparePrice && (
                    <span className={styles.savingsText}>
                      Save {formatPrice(product.comparePrice - product.price)}
                    </span>
                  )}
                </div>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <p className={styles.shortDesc}>{product.shortDescription}</p>
              )}

              {/* Quantity & Add to Cart Controls */}
              <div className={styles.actionSection}>
                <div className={styles.quantityControls}>
                  <label htmlFor="product-qty" className="sr-only">
                    Quantity
                  </label>
                  <div className={styles.qtyStepper}>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span id="product-qty" className={styles.qtyValue} aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock || isOutOfStock}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  ref={primaryActionRef}
                  className={styles.addToCartBtn}
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAdding}
                  id={`pdp-add-to-cart-${product._id}`}
                >
                  {isOutOfStock
                    ? "Out of stock"
                    : isAdding
                    ? "Added to cart"
                    : "Add to cart"}
                </button>
              </div>

              {/* Reassurance List */}
              <div className={styles.assurances}>
                <div className={styles.assuranceItem}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <div>
                    <span className={styles.assuranceTitle}>Express Delivery</span>
                    <span className={styles.assuranceSub}>Dispatched within 24–48 hours</span>
                  </div>
                </div>

                <div className={styles.assuranceItem}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <div>
                    <span className={styles.assuranceTitle}>Manufacturer Warranty</span>
                    <span className={styles.assuranceSub}>100% genuine guaranteed product</span>
                  </div>
                </div>

                <div className={styles.assuranceItem}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  <div>
                    <span className={styles.assuranceTitle}>Hassle-free Returns</span>
                    <span className={styles.assuranceSub}>Eligible for return per store policy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications & Overview Section */}
        <section className={styles.detailsSection} id="product-specifications">
          <div className={styles.detailsGrid}>
            {/* Overview */}
            <div className={styles.overviewCol}>
              <h2 className={styles.sectionHeading}>Product Overview</h2>
              <div className={styles.descriptionText}>
                <p>{product.description}</p>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div className={styles.tagList}>
                  {product.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Specifications */}
            {specEntries.length > 0 && (
              <div className={styles.specsCol}>
                <h2 className={styles.sectionHeading}>Technical Specifications</h2>
                <div className={styles.specsTable} id="product-specification-list">
                  {visibleSpecEntries.map(([key, val]) => (
                    <div key={key} className={styles.specRow}>
                      <span className={styles.specKey}>{key}</span>
                      <span className={styles.specVal}>{val}</span>
                    </div>
                  ))}
                </div>
                {hiddenSpecCount > 0 && (
                  <button
                    type="button"
                    className={styles.showMoreSpecs}
                    onClick={() => setShowAllSpecifications((showing) => !showing)}
                    aria-expanded={showAllSpecifications}
                    aria-controls="product-specification-list"
                  >
                    <span>
                      {showAllSpecifications
                        ? "Show fewer specifications"
                        : `Show ${hiddenSpecCount} more specification${hiddenSpecCount === 1 ? "" : "s"}`}
                    </span>
                    <svg
                      className={showAllSpecifications ? styles.showMoreIconOpen : undefined}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className={styles.relatedSection} aria-labelledby="related-heading">
            <div className={styles.relatedHeader}>
              <h2 id="related-heading" className={styles.sectionHeading}>
                Related Products
              </h2>
              {category && (
                <Link href={`/products?category=${category.slug}`} className={styles.relatedLink}>
                  View all in {category.name} →
                </Link>
              )}
            </div>

            <div className={styles.relatedGrid}>
              {related.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile Sticky Action Bar */}
      {showStickyBar && (
      <div className={styles.mobileStickyBar} data-mobile-action-bar="wide">
        <div className={styles.mobileStickyInner}>
          <div className={styles.mobileStickyPrice}>
            <span className={styles.mobilePriceLabel}>Total</span>
            <span className={styles.mobilePriceValue}>{formatPrice(product.price * quantity)}</span>
          </div>
          <button
            type="button"
            className={styles.mobileAddToCartBtn}
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
          >
            {isOutOfStock ? "Out of stock" : isAdding ? "Added" : "Add to cart"}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
