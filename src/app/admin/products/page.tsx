"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import DataTable, { Column } from "@/components/admin/DataTable";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import type { IProduct, ICategory } from "@/types";
import styles from "../admin.module.css";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [deleting, setDeleting] = useState<IProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { showToast } = useToast();

  const PER_PAGE = 25;

  const fetchProducts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(PER_PAGE));
    params.set("page", String(page));
    params.set("isActive", "all");
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  // A new search or filter starts from the first page again.
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchProducts, 200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, page]);

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleting._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Product deleted", "success");
        setDeleting(null);
        fetchProducts();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<IProduct>[] = useMemo(
    () => [
      {
        key: "name",
        name: "Product",
        render: (p) => (
          <div className={styles.cellName}>
            <div className={styles.cellImage}>
              {p.images?.[0] && (
                <Image
                  src={p.images[0]}
                  alt={p.name}
                  fill
                  sizes="42px"
                  style={{ objectFit: "contain" }}
                />
              )}
            </div>
            <div>
              <div className={styles.cellNameText}>{p.name}</div>
              <div className={styles.cellNameSub}>{p.brand}</div>
            </div>
          </div>
        ),
      },
      {
        key: "price",
        name: "Price",
        render: (p) => formatPrice(p.price),
      },
      {
        key: "stock",
        name: "Stock",
        render: (p) =>
          p.stock === 0 ? (
            <Badge variant="error">Out of stock</Badge>
          ) : p.stock <= 5 ? (
            <Badge variant="warning">{p.stock} left</Badge>
          ) : (
            <span>{p.stock}</span>
          ),
      },
      {
        key: "actions",
        name: "Actions",
        sortable: false,
        render: (p) => (
          <div className={styles.actionsCell}>
            <Link
              href={`/admin/products/${p._id}`}
              className={styles.iconBtn}
              aria-label="Edit"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 1l3 3-7 7H3v-3l7-7z" strokeLinejoin="round" />
              </svg>
            </Link>
            <button
              className={`${styles.iconBtn} ${styles.danger}`}
              onClick={() => setDeleting(p)}
              aria-label="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4h10M5 4V2h4v2M4 4l1 9h4l1-9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.pageHeaderEyebrowRow}>
            <span className={styles.pageHeaderEyebrowLine} />
            <span className={styles.pageHeaderEyebrow}>
              Catalogue / {total} pieces
            </span>
          </div>
          <h1 className={styles.pageTitle}>Products</h1>
          <p className={styles.pageSubtitle}>
            Edit, retire, or add products to the storefront. Changes go
            live the moment you save.
          </p>
        </div>
        <div className={styles.pageHeaderActions}>
          <Link href="/admin/homepage" className={styles.secondaryBtn}>
            Homepage curation
          </Link>
          <Link href="/admin/products/new" className={styles.primaryBtn}>
            New product
          </Link>
        </div>
      </header>

      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Search by name, brand…"
          className={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading products…</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={products}
            emptyMessage="No products found"
            emptyDescription="Try adjusting filters, or add your first product."
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete product"
        footer={
          <>
            <button
              className={styles.secondaryBtn}
              onClick={() => setDeleting(null)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              className={styles.primaryBtn}
              style={{ background: "var(--color-error)" }}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete{" "}
          <strong>{deleting?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}
