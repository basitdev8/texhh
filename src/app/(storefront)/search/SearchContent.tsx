"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/storefront/SearchBar";
import ProductCard from "@/components/storefront/ProductCard";
import LoadingState from "@/components/ui/LoadingState";
import type { IProduct } from "@/types";
import styles from "./page.module.css";

export default function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/products?search=${encodeURIComponent(query)}&limit=24`)
      .then((res) => res.json())
      .then((data) => setResults(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>
            {query ? `Search: "${query}"` : "Search products"}
          </h1>
          <p className={styles.subtitle}>
            {query && !loading
              ? `${results.length} result${results.length !== 1 ? "s" : ""}`
              : "Find the gear that fits your build."}
          </p>
          <SearchBar initialQuery={query} autoFocus={!query} />
        </div>

        {loading ? (
          <LoadingState label="Searching the edit" detail="Matching products and components." />
        ) : query && results.length === 0 ? (
          <div className={styles.empty}>
            No products match &ldquo;{query}&rdquo;. Try a different keyword.
          </div>
        ) : results.length > 0 ? (
          <div className={styles.grid}>
            {results.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            Type in the search bar to find products, brands, or categories.
          </div>
        )}
      </div>
    </div>
  );
}
