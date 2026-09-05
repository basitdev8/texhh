"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/storefront/ProductCard";
import Pagination from "@/components/ui/Pagination";
import StatusNotice from "@/components/ui/StatusNotice";
import type { IProduct, ICategory } from "@/types";
import styles from "./products.module.css";

interface PaginationData {
  page: number;
  totalPages: number;
  total: number;
}

export function ProductGridLoading() {
  return (
    <div className={styles.grid} aria-busy="true">
      <span className="sr-only">Loading products</span>
      {Array.from({ length: 8 }, (_, index) => (
        <div className={styles.skeletonCard} key={index} aria-hidden="true">
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonMeta}>
            <span className={styles.skeletonLine} />
            <span className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            <span className={`${styles.skeletonLine} ${styles.skeletonPrice}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryParam = searchParams.get("category") || "";
  const sortParam = searchParams.get("sort") || "-createdAt";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const searchParam = searchParams.get("search") || "";
  const inStockOnly = searchParams.get("inStock") === "true";

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.data)) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(pageParam));
    params.set("limit", "12");
    params.set("sort", sortParam);

    if (categoryParam) {
      const cat = categories.find(
        (c) => c.slug === categoryParam || c._id === categoryParam
      );
      if (cat) params.set("category", cat._id);
    }
    if (minPriceParam) params.set("minPrice", minPriceParam);
    if (maxPriceParam) params.set("maxPrice", maxPriceParam);
    if (searchParam) params.set("search", searchParam);
    if (inStockOnly) params.set("inStock", "true");

    setLoading(true);
    setHasError(false);

    fetch(`/api/products?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setProducts(data.data || []);
          setPagination(
            data.pagination || { page: 1, totalPages: 1, total: (data.data || []).length }
          );
        } else {
          setHasError(true);
        }
      })
      .catch(() => {
        setHasError(true);
      })
      .finally(() => setLoading(false));
  }, [categoryParam, sortParam, pageParam, minPriceParam, maxPriceParam, searchParam, inStockOnly, categories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === "") params.delete(key);
      else params.set(key, val);
    }
    if (!("page" in updates)) params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  const applyPriceFilter = () => {
    updateParams({
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    });
    setMobileFilterOpen(false);
  };

  const clearAllFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setMobileFilterOpen(false);
    router.push("/products");
  };

  const activeCategory = categories.find((c) => c.slug === categoryParam);
  const hasActiveFilters = Boolean(
    categoryParam || minPriceParam || maxPriceParam || searchParam || inStockOnly
  );

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Page Header */}
        <header className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <h1 className={styles.title}>
              {searchParam
                ? `Results for “${searchParam}”`
                : activeCategory
                  ? activeCategory.name
                  : "Products"}
            </h1>
            {!searchParam && activeCategory?.description && (
              <p className={styles.subtitle}>{activeCategory.description}</p>
            )}
          </div>

          <div className={styles.headerStats} aria-live="polite">
            <span className={styles.statsCount}>
              {loading ? "…" : pagination.total}
            </span>{" "}
            {pagination.total === 1 ? "product" : "products"}
          </div>
        </header>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          {/* Category Pills (Desktop) */}
          <div className={styles.categoryPills} role="tablist" aria-label="Product categories">
            <button
              type="button"
              className={`${styles.pill} ${!categoryParam ? styles.pillActive : ""}`}
              onClick={() => updateParams({ category: null })}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                type="button"
                className={`${styles.pill} ${categoryParam === cat.slug ? styles.pillActive : ""}`}
                onClick={() => updateParams({ category: cat.slug })}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Controls Right */}
          <div className={styles.toolbarControls}>
            {/* Mobile Filter Button */}
            <button
              type="button"
              className={styles.filterToggleBtn}
              onClick={() => setMobileFilterOpen(true)}
              aria-label="Open filter menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filters</span>
              {hasActiveFilters && <span className={styles.activeFilterDot} />}
            </button>

            {/* Price Filter (Desktop) */}
            <div className={styles.desktopPriceGroup}>
              <input
                type="number"
                placeholder="Min ₹"
                className={styles.priceInput}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
                min={0}
                aria-label="Minimum price in Rupees"
              />
              <span className={styles.priceDivider}>–</span>
              <input
                type="number"
                placeholder="Max ₹"
                className={styles.priceInput}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
                min={0}
                aria-label="Maximum price in Rupees"
              />
              <button
                type="button"
                className={styles.applyBtn}
                onClick={applyPriceFilter}
              >
                Apply
              </button>
            </div>

            {/* Sort Select */}
            <div className={styles.sortWrapper}>
              <select
                className={styles.sortSelect}
                value={sortParam}
                onChange={(e) => updateParams({ sort: e.target.value })}
                aria-label="Sort products"
              >
                <option value="-createdAt">Newest</option>
                <option value="createdAt">Oldest</option>
                <option value="price">Price: low to high</option>
                <option value="-price">Price: high to low</option>
                <option value="name">Name: A to Z</option>
              </select>
              <svg
                className={styles.sortChevron}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 4.5l3 3 3-3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className={styles.activeChipsRow}>
            <span className={styles.chipsLabel}>Filters</span>
            {searchParam && (
              <span className={styles.chip}>
                Search: {searchParam}
                <button
                  type="button"
                  onClick={() => updateParams({ search: null })}
                  aria-label="Clear search"
                >
                  ×
                </button>
              </span>
            )}
            {categoryParam && activeCategory && (
              <span className={styles.chip}>
                Category: {activeCategory.name}
                <button
                  type="button"
                  onClick={() => updateParams({ category: null })}
                  aria-label={`Remove ${activeCategory.name} filter`}
                >
                  ×
                </button>
              </span>
            )}
            {(minPriceParam || maxPriceParam) && (
              <span className={styles.chip}>
                Price: ₹{minPriceParam || "0"} – ₹{maxPriceParam || "∞"}
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    updateParams({ minPrice: null, maxPrice: null });
                  }}
                  aria-label="Remove price filter"
                >
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={clearAllFilters}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Product Grid / States */}
        {loading ? (
          <ProductGridLoading />
        ) : hasError ? (
          <div className={styles.errorContainer}>
            <StatusNotice
              variant="error"
              title="Products couldn’t be loaded"
              action={{ label: "Try again", onClick: fetchProducts }}
            >
              Check your connection and try again.
            </StatusNotice>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>No products found</h2>
            <p className={styles.emptyText}>
              {hasActiveFilters
                ? "Nothing matches the active filters. Try a wider price range or clear the filters."
                : "No products are listed in this category yet."}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                className={styles.emptyActionBtn}
                onClick={clearAllFilters}
              >
                Clear all filters
              </button>
            ) : (
              <Link href="/" className={styles.emptyActionBtn}>
                Return to home
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => updateParams({ page: String(p) })}
            />
          </>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div
          className={styles.mobileFilterBackdrop}
          onClick={() => setMobileFilterOpen(false)}
        >
          <div
            ref={drawerRef}
            className={styles.mobileFilterDrawer}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            <div className={styles.drawerHead}>
              <h3 className={styles.drawerTitle}>Filters</h3>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Close filter drawer"
              >
                ×
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Categories */}
              <div className={styles.drawerSection}>
                <span className={styles.drawerSectionTitle}>Category</span>
                <div className={styles.drawerCategoryList}>
                  <label className={styles.drawerRadio}>
                    <input
                      type="radio"
                      name="mobileCategory"
                      checked={!categoryParam}
                      onChange={() => updateParams({ category: null })}
                    />
                    <span>All categories</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat._id} className={styles.drawerRadio}>
                      <input
                        type="radio"
                        name="mobileCategory"
                        checked={categoryParam === cat.slug}
                        onChange={() => updateParams({ category: cat.slug })}
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className={styles.drawerSection}>
                <span className={styles.drawerSectionTitle}>Price (₹)</span>
                <div className={styles.drawerPriceInputs}>
                  <input
                    type="number"
                    placeholder="Min ₹"
                    className={styles.priceInput}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    min={0}
                  />
                  <span>–</span>
                  <input
                    type="number"
                    placeholder="Max ₹"
                    className={styles.priceInput}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    min={0}
                  />
                </div>
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={styles.drawerClearBtn}
                onClick={clearAllFilters}
              >
                Clear all
              </button>
              <button
                type="button"
                className={styles.drawerApplyBtn}
                onClick={applyPriceFilter}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
