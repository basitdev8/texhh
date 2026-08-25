"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductForm, { ProductFormData } from "@/components/admin/ProductForm";
import { useToast } from "@/components/ui/Toast";
import type { IProduct, ICategory } from "@/types";
import styles from "../../admin.module.css";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProduct(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

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
        comparePrice: data.comparePrice ? Number(data.comparePrice) : null,
      };
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast("Product updated", "success");
        router.push("/admin/products");
      } else {
        showToast(result.error || "Failed to update product", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading product…</div>;
  }
  if (!product) {
    return (
      <div className={styles.loading}>
        Product not found.{" "}
        <Link href="/admin/products" style={{ color: "var(--color-accent)" }}>
          Back to list
        </Link>
      </div>
    );
  }

  const categoryId =
    typeof product.category === "string"
      ? product.category
      : (product.category as ICategory)?._id;

  const initialData = {
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price,
    comparePrice: (product.comparePrice ?? "") as number | "",
    brand: product.brand,
    category: categoryId || "",
    stock: product.stock,
    featured: product.featured,
    tags: product.tags || [],
    images: product.images || [],
    specifications: Object.entries(product.specifications || {}).map(
      ([key, value]) => ({ key, value })
    ),
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
            Edit <span className={styles.pageTitleItalic}>piece</span>.
          </h1>
          <p className={styles.pageSubtitle}>
            Updating <strong>{product.name}</strong>. Changes go live the
            moment you save.
          </p>
        </div>
      </header>
      <ProductForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
      />
    </>
  );
}
