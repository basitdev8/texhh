"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SearchBar from "@/components/storefront/SearchBar";
import ProductCard from "@/components/storefront/ProductCard";
import { ProductGridLoading } from "../products/ProductsContent";
import StatusNotice from "@/components/ui/StatusNotice";
import type { IProduct } from "@/types";
import styles from "./page.module.css";

export default function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setHasError(false);

    fetch(`/api/products?search=${encodeURIComponent(query.trim())}&limit=24`)
      .then((res) => {
        if (!res.ok) throw new Error("Search failed");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setResults(data.data || []);
        } else {
          setHasError(true);
        }
      })
      .catch(() => {
        setHasError(true);
      })
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>
              {query ? `Search: “${query}”` : "Search Products"}
            </h1>
            <p className={styles.subtitle}>
              {query && !loading
                ? `${results.length} ${results.length === 1 ? "product found" : "products found"}`
                : "Search flagship electronics, phones, laptops, and custom PC components."}
            </p>
          </div>
          <div className={styles.searchBarWrap}>
            <SearchBar initialQuery={query} autoFocus={!query} />
          </div>
        </header>

        {loading ? (
          <ProductGridLoading />
        ) : hasError ? (
          <div className={styles.noticeContainer}>
            <StatusNotice
              variant="error"
              title="Search failed"
              action={{
                label: "Retry search",
                onClick: () => window.location.reload(),
              }}
            >
              Could not complete the search request. Please check your connection and try again.
            </StatusNotice>
          </div>
        ) : query && results.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>No matching products</h2>
            <p className={styles.emptyText}>
              We couldn&apos;t find any products matching &ldquo;{query}&rdquo;. Check your spelling,
              try a broader keyword, or explore our full catalog.
            </p>
            <Link href="/products" className={styles.browseBtn}>
              Browse All Products
            </Link>
          </div>
        ) : results.length > 0 ? (
          <div className={styles.grid}>
            {results.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>Looking for something specific?</h2>
            <p className={styles.emptyText}>
              Search by product name, brand, category, or technical specification.
            </p>
            <div className={styles.popularSearches}>
              <span className={styles.popularLabel}>Popular:</span>
              <Link href="/search?q=intel" className={styles.searchTag}>Intel</Link>
              <Link href="/search?q=nvidia" className={styles.searchTag}>RTX</Link>
              <Link href="/search?q=samsung" className={styles.searchTag}>Samsung</Link>
              <Link href="/search?q=laptop" className={styles.searchTag}>Laptops</Link>
              <Link href="/search?q=ram" className={styles.searchTag}>DDR5</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
