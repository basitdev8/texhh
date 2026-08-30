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
          // Preserve the current storefront selections as a starting point, but
          // do not write anything until the admin explicitly saves this screen.
          setHeroProductId(legacyProducts[0]?._id || null);
          setEditProductIds(legacyProducts.slice(1).map((product) => product._id));
          setLegacyImported(legacyProducts.length > 0);
        }
      })
      .catch(() => showToast("Could not load homepage products", "error"))
      .finally(() => !cancelled && setLoading(false));
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
      showToast("The main featured product is kept separate from the home edit", "error");
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
        showToast(data.error || "Could not save homepage curation", "error");
        return;
      }
      setHeroProductId(data.data.heroProductId);
      setEditProductIds(data.data.homeFeaturedProductIds || []);
      setLegacyImported(false);
      showToast("Homepage curation saved", "success");
    } catch {
      showToast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Store / Homepage</div>
          <h1 className={styles.title}>Homepage <em>curation</em>.</h1>
          <p className={styles.subtitle}>
            Choose one main featured product for the hero, then build the separate
            collection shown below it. Products can only occupy one placement.
          </p>
        </div>
        <button type="button" className={styles.saveButton} onClick={save} disabled={loading || saving}>
          {saving ? "Saving…" : "Save homepage"}
        </button>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading product placements…</div>
      ) : (
        <div className={styles.layout}>
          {legacyImported && (
            <p className={styles.migrationNote}>
              Your existing featured products were brought in as a starting point. Save once to make these new, separate homepage placements live.
            </p>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.sectionKicker}>01 / Hero</span>
                <h2>Main featured product</h2>
              </div>
              {heroProduct && (
                <button type="button" className={styles.textButton} onClick={() => selectHero(null)}>
                  Remove
                </button>
              )}
            </div>
            <p className={styles.help}>Only one product can be in the main hero at a time.</p>
            <label className={styles.selectLabel}>
              <span>Choose as main featured product</span>
              <select value={heroProductId || ""} onChange={(event) => selectHero(event.target.value || null)}>
                <option value="">No hero product selected</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>{product.name} — {product.brand}</option>
                ))}
              </select>
            </label>
            {heroProduct ? (
              <ProductPlacement product={heroProduct} label="Main featured product" />
            ) : (
              <div className={styles.empty}>Choose one active product to show in the home hero.</div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.sectionKicker}>02 / Home edit</span>
                <h2>Featured products below the hero</h2>
              </div>
              {editProductIds.length > 0 && (
                <button type="button" className={styles.textButton} onClick={() => setEditProductIds([])}>
                  Clear all
                </button>
              )}
            </div>
            <p className={styles.help}>Choose another featured product for the collection below the hero. Add as many as you need; the selection order is used on the storefront.</p>

            {selectedEditProducts.length > 0 && (
              <div className={styles.selectedList} aria-label="Selected home edit products">
                {selectedEditProducts.map((product, index) => (
                  <div className={styles.selectedItem} key={product._id}>
                    <span className={styles.selectedIndex}>{String(index + 1).padStart(2, "0")}</span>
                    <span className={styles.selectedName}>{product.name}</span>
                    <button type="button" onClick={() => toggleEditProduct(product._id)} aria-label={`Remove ${product.name} from the home edit`}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.catalogueHead}>
              <label className={styles.searchLabel}>
                <span className="sr-only">Search products</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or brands…" />
              </label>
              <span>{editProductIds.length} selected</span>
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
                      <Image src={product.images[0] || "/placeholder.svg"} alt="" fill sizes="56px" />
                    </span>
                    <span className={styles.optionCopy}>
                      <strong>{product.name}</strong>
                      <span>{product.brand} · {formatPrice(product.price)}</span>
                    </span>
                    <span className={styles.optionState}>{isHero ? "Hero" : isSelected ? "Selected" : "Add"}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function ProductPlacement({ product, label }: { product: IProduct; label: string }) {
  return (
    <div className={styles.heroPreview}>
      <div className={styles.heroImage}>
        <Image src={product.images[0] || "/placeholder.svg"} alt={product.name} fill sizes="160px" />
      </div>
      <div>
        <span>{label}</span>
        <strong>{product.name}</strong>
        <small>{product.brand} · {formatPrice(product.price)}</small>
      </div>
    </div>
  );
}
