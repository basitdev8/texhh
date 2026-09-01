"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import type { IProduct } from "@/types";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  autoFocus?: boolean;
  variant?: "default" | "header";
}

const DEBOUNCE_MS = 220;
const MIN_CHARS = 2;
const MAX_SUGGESTIONS = 6;

export default function SearchBar({
  initialQuery = "",
  placeholder = "Search products, brands, categories...",
  autoFocus = false,
  variant = "default",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const suggestionsId = useId();

  // Debounced fetch of suggestions as the user types.
  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) {
      abortRef.current?.abort();
      setResults([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(
        `/api/products?search=${encodeURIComponent(q)}&limit=${MAX_SUGGESTIONS}`,
        { signal: controller.signal }
      )
        .then((res) => {
          if (!res.ok) throw new Error("Search request failed");
          return res.json();
        })
        .then((data) => {
          setResults(data.data || []);
          setActiveIndex(-1);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") setResults([]);
        })
        .finally(() => {
          if (abortRef.current === controller) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const goToSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If a suggestion is highlighted, open it; otherwise run the full search.
    if (activeIndex >= 0 && results[activeIndex]) {
      setOpen(false);
      router.push(`/products/${results[activeIndex].slug}`);
    } else {
      goToSearch(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown = open && query.trim().length >= MIN_CHARS;

  return (
    <div
      className={`${styles.wrapper} ${variant === "header" ? styles.headerVariant : ""}`}
      ref={wrapperRef}
    >
      <form
        className={styles.form}
        onSubmit={handleSubmit}
        role="search"
        autoComplete="off"
      >
        <svg
          className={styles.icon}
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
        >
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 12l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          className={styles.input}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          aria-label="Search"
          aria-expanded={showDropdown}
          role="combobox"
          aria-controls={suggestionsId}
          aria-autocomplete="list"
        />
        <button className={styles.submitBtn} type="submit" aria-label="Submit search">
          <svg className={styles.submitIcon} width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m16.25 16.25 4.25 4.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className={styles.submitLabel}>Search</span>
        </button>
      </form>

      {showDropdown && (
        <div className={styles.dropdown} id={suggestionsId} role="listbox">
          {loading && results.length === 0 ? (
            <div className={styles.dropdownStatus}>Searching…</div>
          ) : results.length === 0 ? (
            <div className={styles.dropdownStatus}>
              No matches for “{query.trim()}”
            </div>
          ) : (
            <>
              {results.map((p, i) => (
                <Link
                  key={p._id}
                  href={`/products/${p.slug}`}
                  className={`${styles.item} ${i === activeIndex ? styles.itemActive : ""}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <span className={styles.thumb}>
                    <Image
                      src={p.images?.[0] || "/placeholder.svg"}
                      alt={p.name}
                      fill
                      sizes="44px"
                      className={styles.thumbImg}
                    />
                  </span>
                  <span className={styles.itemBody}>
                    <span className={styles.itemName}>{p.name}</span>
                    <span className={styles.itemMeta}>{p.brand}</span>
                  </span>
                  <span className={styles.itemPrice}>{formatPrice(p.price)}</span>
                </Link>
              ))}
              <button
                type="button"
                className={styles.seeAll}
                onClick={() => goToSearch(query)}
              >
                See all results for “{query.trim()}” →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
