"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductForm, { ProductFormData } from "@/components/admin/ProductForm";
import { useToast } from "@/components/ui/Toast";
import styles from "../../admin.module.css";

export default function NewProductPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: ProductFormData) => {
    setSubmitting(true);
    try {
      const specifications: Record<string, string> = {};
      for (const s of data.specifications) {
        if (s.key && s.value) specifications[s.key] = s.value;
      }
      const payload = {
        ...data,
        specifications,
        price: Number(data.price),
        stock: Number(data.stock),
        comparePrice: data.comparePrice ? Number(data.comparePrice) : undefined,
        shortDescription: data.shortDescription || `${data.name} - premium electronics`,
        description: data.description || `${data.name} - high quality product from ${data.brand || "leading brand"}.`,
      };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast("Product created", "success");
        router.push("/admin/products");
      } else {
        showToast(result.error || "Failed to create product", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.pageHeaderEyebrowRow}>
            <span className={styles.pageHeaderEyebrowLine} />
            <Link
              href="/admin/products"
              className={styles.pageHeaderEyebrow}
              style={{ color: "var(--color-ink)" }}
            >
              ← Catalogue / Products
            </Link>
          </div>
          <h1 className={styles.pageTitle}>
            New <span className={styles.pageTitleItalic}>piece</span>.
          </h1>
          <p className={styles.pageSubtitle}>
            Add a product to the storefront. Photos, copy, specs, stock —
            everything goes live the moment you save.
          </p>
        </div>
      </header>
      <ProductForm onSubmit={handleSubmit} isSubmitting={submitting} />
    </>
  );
}
