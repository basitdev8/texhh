"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import styles from "../admin.module.css";

interface StoreSettingsForm {
  freeShippingThreshold: number | "";
  flatShippingRate: number | "";
  gstRate: number | "";
  codEnabled: boolean;
  codMaxOrderAmount: number | "";
  bankTransferEnabled: boolean;
  shippingBannerText: string;
}

const EMPTY: StoreSettingsForm = {
  freeShippingThreshold: "",
  flatShippingRate: "",
  gstRate: "",
  codEnabled: true,
  codMaxOrderAmount: 10000,
  bankTransferEnabled: false,
  shippingBannerText: "",
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<StoreSettingsForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setForm(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleNumber = (
    field: "freeShippingThreshold" | "flatShippingRate" | "gstRate" | "codMaxOrderAmount"
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [field]: value === "" ? "" : Number(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.freeShippingThreshold === "" || form.flatShippingRate === "" || form.gstRate === "" || form.codMaxOrderAmount === "") {
      setError("Shipping, tax and COD limits are all required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freeShippingThreshold: Number(form.freeShippingThreshold),
          flatShippingRate: Number(form.flatShippingRate),
          gstRate: Number(form.gstRate),
          codEnabled: form.codEnabled,
          codMaxOrderAmount: Number(form.codMaxOrderAmount),
          bankTransferEnabled: form.bankTransferEnabled,
          shippingBannerText: form.shippingBannerText,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForm(data.data);
        showToast("Settings saved", "success");
      } else {
        setError(data.error || "Failed to save settings");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const threshold = Number(form.freeShippingThreshold || 0);
  const flat = Number(form.flatShippingRate || 0);
  const gst = Number(form.gstRate || 0);

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.pageHeaderEyebrowRow}>
            <span className={styles.pageHeaderEyebrowLine} />
            <span className={styles.pageHeaderEyebrow}>Store / Settings</span>
          </div>
          <h1 className={styles.pageTitle}>Store settings</h1>
          <p className={styles.pageSubtitle}>
            Shipping, tax and payment rules. These apply to every new order the
            moment you save — existing orders keep the figures they were placed with.
          </p>
        </div>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading settings…</div>
      ) : (
        <form className={styles.settingsForm} onSubmit={handleSubmit}>
          {error && <div className={styles.settingsError}>{error}</div>}

          <section className={styles.settingsSection}>
            <h2 className={styles.settingsSectionTitle}>Shipping</h2>
            <div className={styles.settingsGrid}>
              <label className={styles.settingsField}>
                <span className={styles.settingsLabel}>Free shipping above (₹)</span>
                <input
                  type="number"
                  min={0}
                  step="1"
                  className={styles.settingsInput}
                  value={form.freeShippingThreshold}
                  onChange={handleNumber("freeShippingThreshold")}
                />
                <span className={styles.settingsHelp}>
                  Orders at or above this subtotal ship free.
                </span>
              </label>

              <label className={styles.settingsField}>
                <span className={styles.settingsLabel}>Shipping charge below that (₹)</span>
                <input
                  type="number"
                  min={0}
                  step="1"
                  className={styles.settingsInput}
                  value={form.flatShippingRate}
                  onChange={handleNumber("flatShippingRate")}
                />
                <span className={styles.settingsHelp}>
                  A {formatPrice(flat)} order pays {formatPrice(flat)} shipping; a{" "}
                  {formatPrice(threshold)} order pays nothing.
                </span>
              </label>

              <label className={`${styles.settingsField} ${styles.settingsFieldWide}`}>
                <span className={styles.settingsLabel}>Storefront shipping note</span>
                <input
                  type="text"
                  className={styles.settingsInput}
                  value={form.shippingBannerText}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, shippingBannerText: e.target.value }))
                  }
                  maxLength={300}
                />
                <span className={styles.settingsHelp}>
                  Shown under the cart summary. Keep it consistent with the numbers above
                  and with the shipping policy page.
                </span>
              </label>
            </div>
          </section>

          <section className={styles.settingsSection}>
            <h2 className={styles.settingsSectionTitle}>Tax</h2>
            <div className={styles.settingsGrid}>
              <label className={styles.settingsField}>
                <span className={styles.settingsLabel}>GST rate (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  className={styles.settingsInput}
                  value={form.gstRate}
                  onChange={handleNumber("gstRate")}
                />
                <span className={styles.settingsHelp}>
                  Product prices are GST-inclusive. This rate only back-computes the GST
                  shown in the breakdown — changing it does not change what customers pay.
                </span>
              </label>
              <div className={styles.settingsField}>
                <span className={styles.settingsLabel}>Worked example</span>
                <div className={styles.settingsExample}>
                  <div>
                    <span>Item price</span>
                    <span>{formatPrice(10000)}</span>
                  </div>
                  <div>
                    <span>of which GST ({gst}%)</span>
                    <span>{formatPrice(Math.round((10000 * gst) / (100 + gst)))}</span>
                  </div>
                  <div>
                    <span>Shipping</span>
                    <span>{10000 >= threshold ? "Free" : formatPrice(flat)}</span>
                  </div>
                  <div className={styles.settingsExampleTotal}>
                    <span>Customer pays</span>
                    <span>
                      {formatPrice(10000 + (10000 >= threshold ? 0 : flat))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.settingsSection}>
            <h2 className={styles.settingsSectionTitle}>Payments</h2>
            <label className={styles.settingsToggleRow}>
              <input
                type="checkbox"
                checked={form.codEnabled}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, codEnabled: e.target.checked }))
                }
              />
              <span>
                <span className={styles.settingsLabel}>Offer Cash on Delivery</span>
                <span className={styles.settingsHelp}>
                  Turning this off hides COD at checkout and rejects any COD order sent
                  directly to the API.
                </span>
              </span>
            </label>
            <div className={styles.settingsGrid} style={{ marginTop: "var(--space-5)" }}>
              <label className={styles.settingsField}>
                <span className={styles.settingsLabel}>Maximum COD order value (₹)</span>
                <input
                  type="number"
                  min={0}
                  step="1"
                  className={styles.settingsInput}
                  value={form.codMaxOrderAmount}
                  onChange={handleNumber("codMaxOrderAmount")}
                />
                <span className={styles.settingsHelp}>
                  COD orders above this total are rejected. Set to 0 to disable COD by limit.
                </span>
              </label>
            </div>
            <label className={styles.settingsToggleRow} style={{ marginTop: "var(--space-5)" }}>
              <input
                type="checkbox"
                checked={form.bankTransferEnabled}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bankTransferEnabled: e.target.checked }))
                }
              />
              <span>
                <span className={styles.settingsLabel}>Offer Bank Transfer</span>
                <span className={styles.settingsHelp}>
                  Keep this disabled until bank details and payment reconciliation are ready.
                </span>
              </span>
            </label>
          </section>

          <div className={styles.settingsActions}>
            <button type="submit" className={styles.primaryBtn} disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
