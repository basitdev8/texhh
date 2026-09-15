"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import type { IProduct } from "@/types";
import styles from "./page.module.css";

interface HomeFeatureSettings {
  heroProductId: string | null;
  homeFeaturedProductIds: string[];
  homeFeatureSelectionConfigured: boolean;
}

const EMPTY_SETTINGS: HomeFeatureSettings = {
  heroProductId: null,
  homeFeaturedProductIds: [],
  homeFeatureSelectionConfigured: false,
};

export default function AdminHomepagePage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [heroProductId, setHeroProductId] = useState<string | null>(null);
  const [editProductIds, setEditProductIds] = useState<string[]>([]);
  const [legacyImported, setLegacyImported] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/settings").then((res) => res.json()),
      fetch("/api/products?limit=100&sort=name").then((res) => res.json()),
      fetch("/api/products?featured=true&limit=100&sort=-createdAt").then((res) => res.json()),
    ])
      .then(([settingsResponse, productsResponse, legacyResponse]) => {
        if (cancelled) return;
        const settings = settingsResponse.success
          ? (settingsResponse.data as HomeFeatureSettings)
          : EMPTY_SETTINGS;
        const allProducts = (productsResponse.data || []) as IProduct[];
        const legacyProducts = (legacyResponse.data || []) as IProduct[];

        setProducts(allProducts);
        if (settings.homeFeatureSelectionConfigured) {
          setHeroProductId(settings.heroProductId);
          setEditProductIds(settings.homeFeaturedProductIds || []);
        } else {
          setHeroProductId(legacyProducts[0]?._id || null);
          setEditProductIds(legacyProducts.slice(1).map((product) => product._id));
          setLegacyImported(legacyProducts.length > 0);
        }
      })
      .catch(() => showToast("Could not load storefront featured products", "error"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product._id, product])),
    [products]
  );
  const heroProduct = heroProductId ? productsById.get(heroProductId) || null : null;
  const selectedEditProducts = editProductIds
    .map((id) => productsById.get(id))
    .filter((product): product is IProduct => Boolean(product));
  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();
    return !query || `${product.name} ${product.brand}`.toLowerCase().includes(query);
  });

  const selectHero = (nextHeroProductId: string | null) => {
    setHeroProductId(nextHeroProductId);
    if (nextHeroProductId) {
      setEditProductIds((ids) => ids.filter((id) => id !== nextHeroProductId));
    }
  };

  const toggleEditProduct = (productId: string) => {
    if (productId === heroProductId) {
      showToast("Hero spotlight product cannot be duplicated in the popular products rail", "error");
      return;
    }
    setEditProductIds((ids) =>
      ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId]
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroProductId,
          homeFeaturedProductIds: editProductIds,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        showToast(data.error || "Could not save featured settings", "error");
        return;
      }
      setHeroProductId(data.data.heroProductId);
      setEditProductIds(data.data.homeFeaturedProductIds || []);
      setLegacyImported(false);
      showToast("Homepage featured products updated", "success");
    } catch {
      showToast("Network error while saving", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Featured &amp; Hero Curation</h1>
          <p className={styles.subtitle}>
            Select the hero spotlight product and configure items shown in the Popular Products rail.
          </p>
        </div>
        <button
          type="button"
          className={styles.saveButton}
          onClick={save}
          disabled={loading || saving}
        >
          {saving ? "Saving…" : "Save Placements"}
        </button>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading catalog products…</div>
      ) : (
        <div className={styles.layout}>
          {legacyImported && (
            <div className={styles.migrationNotice}>
              Existing featured products have been pre-loaded. Click &ldquo;Save Placements&rdquo; to persist this layout.
            </div>
          )}

          {/* Section 1: Hero Banner Selection */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.sectionKicker}>Placement 01</span>
                <h2 className={styles.sectionHeading}>Hero Spotlight Product</h2>
              </div>
              {heroProduct && (
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => selectHero(null)}
                >
                  Remove Hero Selection
                </button>
              )}
            </div>

            <div className={styles.selectWrap}>
              <label htmlFor="hero-select" className={styles.label}>
                Select Product for Homepage Hero
              </label>
              <select
                id="hero-select"
                className={styles.select}
                value={heroProductId || ""}
                onChange={(e) => selectHero(e.target.value || null)}
              >
                <option value="">No hero product selected (uses fallback banner)</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} ({product.brand}) — {formatPrice(product.price)}
                  </option>
                ))}
              </select>
            </div>

            {heroProduct ? (
              <div className={styles.heroPreview}>
                <div className={styles.heroImage}>
                  <Image
                    src={heroProduct.images[0] || "/placeholder.svg"}
                    alt={heroProduct.name}
                    fill
                    sizes="120px"
                  />
                </div>
                <div className={styles.heroInfo}>
                  <span className={styles.heroBadge}>Current Hero Item</span>
                  <span className={styles.heroName}>{heroProduct.name}</span>
                  <span className={styles.heroMeta}>
                    {heroProduct.brand} · {formatPrice(heroProduct.price)}
                  </span>
                </div>
              </div>
            ) : (
              <div className={styles.empty}>No hero spotlight item assigned.</div>
            )}
          </section>

          {/* Section 2: Popular Products Rail */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.sectionKicker}>Placement 02</span>
                <h2 className={styles.sectionHeading}>Popular Products Rail</h2>
              </div>
              {editProductIds.length > 0 && (
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => setEditProductIds([])}
                >
                  Clear All
                </button>
              )}
            </div>

            {selectedEditProducts.length > 0 && (
              <div className={styles.selectedList} aria-label="Selected popular products">
                {selectedEditProducts.map((product, index) => (
                  <div className={styles.selectedItem} key={product._id}>
                    <span className={styles.selectedIndex}>{index + 1}</span>
                    <span className={styles.selectedName}>{product.name}</span>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => toggleEditProduct(product._id)}
                      aria-label={`Remove ${product.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.catalogueHead}>
              <input
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalog products..."
                aria-label="Search catalog"
              />
              <span className={styles.selectedCount}>
                {editProductIds.length} items selected
              </span>
            </div>

            <div className={styles.productList}>
              {filteredProducts.map((product) => {
                const isHero = product._id === heroProductId;
                const isSelected = editProductIds.includes(product._id);
                return (
                  <button
                    type="button"
                    key={product._id}
                    className={`${styles.productOption} ${isSelected ? styles.productOptionSelected : ""}`}
                    onClick={() => toggleEditProduct(product._id)}
                    aria-pressed={isSelected}
                    disabled={isHero}
                  >
                    <span className={styles.optionImage}>
                      <Image
                        src={product.images[0] || "/placeholder.svg"}
                        alt=""
                        fill
                        sizes="48px"
                      />
                    </span>
                    <span className={styles.optionCopy}>
                      <strong>{product.name}</strong>
                      <span>{product.brand} · {formatPrice(product.price)}</span>
                    </span>
                    <span className={styles.optionState}>
                      {isHero ? "Hero" : isSelected ? "Selected" : "+ Add"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
