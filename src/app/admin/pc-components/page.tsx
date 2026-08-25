"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import DataTable, { Column } from "@/components/admin/DataTable";
import Modal from "@/components/ui/Modal";
import ImageUploader from "@/components/admin/ImageUploader";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import type { IPCComponent, PCComponentType } from "@/types";
import styles from "../admin.module.css";

const COMPONENT_TYPES: PCComponentType[] = [
  "CPU",
  "GPU",
  "RAM",
  "Storage",
  "Motherboard",
  "PSU",
  "Case",
  "Cooler",
];

interface FormState {
  name: string;
  type: PCComponentType;
  brand: string;
  price: string;
  stock: string;
  image: string;
  specifications: { key: string; value: string }[];
}

const emptyForm: FormState = {
  name: "",
  type: "CPU",
  brand: "",
  price: "",
  stock: "0",
  image: "",
  specifications: [{ key: "", value: "" }],
};

export default function AdminPCComponentsPage() {
  const [components, setComponents] = useState<IPCComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<PCComponentType | "">("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<IPCComponent | null>(null);
  const [deleting, setDeleting] = useState<IPCComponent | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const fetchComponents = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "200");
    if (typeFilter) params.set("type", typeFilter);
    fetch(`/api/pc-components?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setComponents(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComponents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setCreating(true);
  };

  const openEdit = (c: IPCComponent) => {
    setEditing(c);
    setForm({
      name: c.name,
      type: c.type,
      brand: c.brand,
      price: String(c.price),
      stock: String(c.stock),
      image: c.image,
      specifications:
        Object.entries(c.specifications || {}).map(([key, value]) => ({
          key,
          value,
        })).length > 0
          ? Object.entries(c.specifications || {}).map(([key, value]) => ({
              key,
              value,
            }))
          : [{ key: "", value: "" }],
    });
    setCreating(true);
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.brand.trim() || !form.price) {
      showToast("Name, brand and price are required", "error");
      return;
    }
    setSubmitting(true);
    try {
      const specifications: Record<string, string> = {};
      for (const s of form.specifications) {
        if (s.key && s.value) specifications[s.key] = s.value;
      }
      const payload = {
        name: form.name,
        type: form.type,
        brand: form.brand,
        price: Number(form.price),
        stock: Number(form.stock || 0),
        image: form.image,
        specifications,
      };
      const url = editing
        ? `/api/pc-components/${editing._id}`
        : "/api/pc-components";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(editing ? "Component updated" : "Component created", "success");
        closeModal();
        fetchComponents();
      } else {
        showToast(data.error || "Failed to save", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/pc-components/${deleting._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Component deleted", "success");
        setComponents((prev) => prev.filter((c) => c._id !== deleting._id));
        setDeleting(null);
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const updateSpec = (i: number, field: "key" | "value", value: string) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.map((s, idx) =>
        idx === i ? { ...s, [field]: value } : s
      ),
    }));
  };

  const addSpec = () =>
    setForm((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: "", value: "" }],
    }));

  const removeSpec = (i: number) =>
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, idx) => idx !== i),
    }));

  const columns: Column<IPCComponent>[] = useMemo(
    () => [
      {
        key: "name",
        name: "Component",
        render: (c) => (
          <div className={styles.cellName}>
            <div className={styles.cellImage}>
              {c.image && (
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="42px"
                  style={{ objectFit: "contain" }}
                />
              )}
            </div>
            <div>
              <div className={styles.cellNameText}>{c.name}</div>
              <div className={styles.cellNameSub}>{c.brand}</div>
            </div>
          </div>
        ),
      },
      { key: "type", name: "Type" },
      { key: "price", name: "Price", render: (c) => formatPrice(c.price) },
      { key: "stock", name: "Stock" },
      {
        key: "actions",
        name: "Actions",
        sortable: false,
        render: (c) => (
          <div className={styles.actionsCell}>
            <button
              className={styles.iconBtn}
              onClick={() => openEdit(c)}
              aria-label="Edit"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 1l3 3-7 7H3v-3l7-7z" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              className={`${styles.iconBtn} ${styles.danger}`}
              onClick={() => setDeleting(c)}
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
              Catalogue / PC Builder
            </span>
          </div>
          <h1 className={styles.pageTitle}>
            The <span className={styles.pageTitleItalic}>parts bin</span>.
          </h1>
          <p className={styles.pageSubtitle}>
            CPUs, GPUs, RAM, storage, motherboards, PSUs, cases, coolers —
            everything the PC Builder pulls from.
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={openCreate}>
          New component
        </button>
      </header>

      <div className={styles.toolbar}>
        <select
          className={styles.filterSelect}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as PCComponentType | "")}
        >
          <option value="">All Types</option>
          {COMPONENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading components…</div>
      ) : (
        <DataTable
          columns={columns}
          data={components}
          emptyMessage="No components yet"
          emptyDescription="Create your first PC component to enable the PC builder."
        />
      )}

      <Modal
        isOpen={creating}
        onClose={closeModal}
        title={editing ? "Edit Component" : "New Component"}
        size="lg"
        footer={
          <>
            <button
              className={styles.secondaryBtn}
              onClick={closeModal}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className={styles.primaryBtn}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className={styles.formGrid}>
          <div className={`${styles.field} ${styles.full}`}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="e.g. AMD Ryzen 9 7950X"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Type</label>
            <select
              className={styles.input}
              value={form.type}
              onChange={(e) =>
                setForm((p) => ({ ...p, type: e.target.value as PCComponentType }))
              }
            >
              {COMPONENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Brand</label>
            <input
              className={styles.input}
              value={form.brand}
              onChange={(e) =>
                setForm((p) => ({ ...p, brand: e.target.value }))
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Price (₹)</label>
            <input
              type="number"
              className={styles.input}
              value={form.price}
              onChange={(e) =>
                setForm((p) => ({ ...p, price: e.target.value }))
              }
              min={0}
              step="0.01"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Stock</label>
            <input
              type="number"
              className={styles.input}
              value={form.stock}
              onChange={(e) =>
                setForm((p) => ({ ...p, stock: e.target.value }))
              }
              min={0}
            />
          </div>
          <div className={`${styles.field} ${styles.full}`}>
            <label className={styles.label}>Image</label>
            <ImageUploader
              images={form.image ? [form.image] : []}
              onChange={(imgs) =>
                setForm((p) => ({ ...p, image: imgs[0] || "" }))
              }
              maxImages={1}
            />
          </div>
          <div className={`${styles.field} ${styles.full}`}>
            <label className={styles.label}>Specifications</label>
            {form.specifications.map((spec, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  gap: "var(--space-2)",
                  marginBottom: "var(--space-2)",
                }}
              >
                <input
                  className={styles.input}
                  placeholder="Spec name"
                  value={spec.key}
                  onChange={(e) => updateSpec(i, "key", e.target.value)}
                />
                <input
                  className={styles.input}
                  placeholder="Value"
                  value={spec.value}
                  onChange={(e) => updateSpec(i, "value", e.target.value)}
                />
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => removeSpec(i)}
                  aria-label="Remove spec"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={addSpec}
              style={{ marginTop: "var(--space-2)", width: "fit-content" }}
            >
              + Add specification
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete component"
        footer={
          <>
            <button
              className={styles.secondaryBtn}
              onClick={() => setDeleting(null)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className={styles.primaryBtn}
              style={{ background: "var(--color-error)" }}
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting…" : "Delete"}
            </button>
          </>
        }
      >
        <p>
          Delete <strong>{deleting?.name}</strong> from the catalog?
        </p>
      </Modal>
    </>
  );
}
