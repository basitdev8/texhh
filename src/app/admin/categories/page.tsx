"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import DataTable, { Column } from "@/components/admin/DataTable";
import Modal from "@/components/ui/Modal";
import ImageUploader from "@/components/admin/ImageUploader";
import { useToast } from "@/components/ui/Toast";
import type { ICategory } from "@/types";
import styles from "../admin.module.css";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ICategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ICategory | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const fetchCategories = () => {
    setLoading(true);
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setImage("");
    setCreating(true);
  };

  const openEdit = (cat: ICategory) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description);
    setImage(cat.image);
    setCreating(true);
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast("Name is required", "error");
      return;
    }
    setSubmitting(true);
    try {
      const url = editing
        ? `/api/categories/${editing._id}`
        : "/api/categories";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, image }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(editing ? "Category updated" : "Category created", "success");
        closeModal();
        fetchCategories();
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
      const res = await fetch(`/api/categories/${deleting._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Category deleted", "success");
        setCategories((prev) => prev.filter((c) => c._id !== deleting._id));
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

  const columns: Column<ICategory>[] = useMemo(
    () => [
      {
        key: "name",
        name: "Category",
        render: (c) => (
          <div className={styles.cellName}>
            <div className={styles.cellImage}>
              {c.image && (
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="42px"
                  style={{ objectFit: "cover" }}
                />
              )}
            </div>
            <div>
              <div className={styles.cellNameText}>{c.name}</div>
              <div className={styles.cellNameSub}>/{c.slug}</div>
            </div>
          </div>
        ),
      },
      {
        key: "description",
        name: "Description",
        render: (c) => c.description || "—",
      },
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
              Catalogue / {categories.length} categor{categories.length === 1 ? "y" : "ies"}
            </span>
          </div>
          <h1 className={styles.pageTitle}>Categories</h1>
          <p className={styles.pageSubtitle}>
            Organize storefront browsing with clear names, images, and descriptions.
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={openCreate}>
          New category
        </button>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading categories…</div>
      ) : (
        <DataTable
          columns={columns}
          data={categories}
          emptyMessage="No categories yet"
          emptyDescription="Create your first category to start organizing products."
        />
      )}

      <Modal
        isOpen={creating}
        onClose={closeModal}
        title={editing ? "Edit Category" : "New Category"}
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
        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Image</label>
          <ImageUploader
            images={image ? [image] : []}
            onChange={(imgs) => setImage(imgs[0] || "")}
            maxImages={1}
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete category"
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
          Are you sure you want to delete <strong>{deleting?.name}</strong>?
          Products in this category will need to be reassigned.
        </p>
      </Modal>
    </>
  );
}
