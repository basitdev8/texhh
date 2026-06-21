"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/storefront/ProductCard";
import Pagination from "@/components/ui/Pagination";
import type { IProduct, ICategory } from "@/types";
import styles from "./products.module.css";

interface PaginationData {
  page: number;
  totalPages: number;
  total: number;
}

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryParam = searchParams.get("category") || "";
  const sortParam = searchParams.get("sort") || "-createdAt";
  const pageParam = parseInt(searchParams.get("page") || "1");
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [priceOpen, setPriceOpen] = useState(!!(minPriceParam || maxPriceParam));

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  // Approximate per-category counts (best-effort; not blocking)
  useEffect(() => {
    if (categories.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries: [string, number][] = [];
      for (const c of categories) {
        try {
          const res = await fetch(
            `/api/products?category=${c._id}&limit=1`
          );
          const json = await res.json();
          entries.push([c.slug, json.pagination?.total ?? 0]);
        } catch {
          entries.push([c.slug, 0]);
        }
      }
      if (!cancelled) {
        setCategoryCounts(Object.fromEntries(entries));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categories]);

  useEffect(() => {
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

    setLoading(true);
    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.data || []);
        setPagination(
          data.pagination || { page: 1, totalPages: 1, total: 0 }
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [
    categoryParam,
    sortParam,
    pageParam,
    minPriceParam,
    maxPriceParam,
    categories,
  ]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === "") params.delete(key);
      else params.set(key, val);
    }
    if (!("page" in updates)) params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  const applyPrice = () => {
    updateParams({
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    });
  };

  const clearAll = () => {
    setMinPrice("");
    setMaxPrice("");
    router.push("/products");
  };

  const hasPriceFilter = !!(minPriceParam || maxPriceParam);
  const activeCategory = categories.find((c) => c.slug === categoryParam);

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Editorial header */}
        <header className={styles.header}>
          <div>
            <div className={styles.eyebrowRow}>
              <span className={styles.eyebrowLine} />
              <span className={styles.eyebrow}>
                {activeCategory ? `Category / ${activeCategory.name}` : "The Edit / All Pieces"}
              </span>
            </div>
            <h1 className={styles.title}>
              {activeCategory ? (
                <>
                  {activeCategory.name.split(" ").slice(0, -1).join(" ") || activeCategory.name}{" "}
                  <span className={styles.titleItalic}>
                    {activeCategory.name.split(" ").slice(-1)[0]}
                  </span>
                </>
              ) : (
                <>
                  The whole <span className={styles.titleItalic}>catalogue</span>.
                </>
              )}
            </h1>
          </div>
          <div className={styles.headerRight}>
            <p className={styles.subtitle}>
              {activeCategory
                ? activeCategory.description
                : "Every piece in the TechHH edit — sortable, filterable, and photographed like an object should be."}
            </p>
            <div className={styles.headerStats}>
              <span className={styles.headerStatsLabel}>Showing</span>
              {loading ? "…" : pagination.total}
              <span className={styles.headerStatsLabel}>
                {pagination.total === 1 ? "piece" : "pieces"}
              </span>
            </div>
          </div>
        </header>

        {/* Sticky filter toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.chipRow} role="tablist" aria-label="Categories">
            <button
              className={`${styles.chip} ${!categoryParam ? styles.chipActive : ""}`}
              onClick={() => updateParams({ category: null })}
              data-cursor-text="All"
            >
              All
            </button>
            {categories.map((cat, i) => (
              <button
                key={cat._id}
                className={`${styles.chip} ${categoryParam === cat.slug ? styles.chipActive : ""}`}
                onClick={() => updateParams({ category: cat.slug })}
                data-cursor-text={cat.name.slice(0, 8)}
              >
                <span className={styles.chipNum}>
                  №{String(i + 1).padStart(2, "0")}
                </span>
                {cat.name}
                {categoryCounts[cat.slug] != null && (
                  <span style={{ opacity: 0.55 }}>
                    ({categoryCounts[cat.slug]})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className={styles.toolbarRight}>
            <button
              className={`${styles.priceToggle} ${hasPriceFilter || priceOpen ? styles.priceToggleActive : ""}`}
              onClick={() => setPriceOpen((v) => !v)}
              aria-expanded={priceOpen}
              data-cursor-text="Price"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 6.5h9M2 3.5h5M2 9.5h7" strokeLinecap="round" />
              </svg>
              Price
              {hasPriceFilter && (
                <span style={{ marginLeft: 4 }}>
                  · {minPriceParam || "0"}–{maxPriceParam || "∞"}
                </span>
              )}
            </button>

            <div className={styles.sortWrap}>
              <select
                className={styles.sortSelect}
                value={sortParam}
                onChange={(e) => updateParams({ sort: e.target.value })}
                data-cursor-text="Sort"
              >
                <option value="-createdAt">Sort: Newest</option>
                <option value="createdAt">Sort: Oldest</option>
                <option value="price">Sort: Price ↑</option>
                <option value="-price">Sort: Price ↓</option>
                <option value="-rating">Sort: Top rated</option>
                <option value="name">Sort: A → Z</option>
              </select>
              <svg
                className={styles.sortChevron}
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
              >
                <path
                  d="M2 4l3 3 3-3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Price drawer */}
        {priceOpen && (
          <div className={styles.priceDrawer}>
            <span className={styles.priceDrawerLabel}>Price range (₹)</span>
            <input
              type="number"
              placeholder="Min"
              className={styles.priceInput}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min={0}
            />
            <input
              type="number"
              placeholder="Max"
              className={styles.priceInput}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min={0}
            />
            <button
              className={styles.applyBtn}
              onClick={applyPrice}
              data-cursor-text="Apply"
            >
              Apply
            </button>
            <button
              className={styles.clearBtn}
              onClick={clearAll}
              data-cursor-text="Clear"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className={styles.loading}>Loading the edit…</div>
        ) : products.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Nothing matches just yet.</p>
            <p className={styles.emptyText}>
              Try widening your filters or clearing them. The TechHH edit is
              tight on purpose — but never this tight.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {products.map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} />
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
    </div>
  );
}
