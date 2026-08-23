'use client';

import React, { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';
import styles from './ProductForm.module.css';
import type { ICategory } from '@/types';

export interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number | '';
  comparePrice: number | '';
  brand: string;
  category: string;
  stock: number | '';
  featured: boolean;
  tags: string[];
  images: string[];
  specifications: { key: string; value: string }[];
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function ProductForm({ initialData, onSubmit, isSubmitting = false }: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: '',
    comparePrice: '',
    brand: '',
    category: '',
    stock: '',
    featured: false,
    tags: [],
    images: [],
    specifications: [{ key: '', value: '' }],
    ...initialData,
  });

  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'name' && !initialData?.slug) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleToggle = () => {
    setForm((prev) => ({ ...prev, featured: !prev.featured }));
  };

  // Tags
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Specifications
  const addSpec = () => {
    setForm((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }],
    }));
  };

  const updateSpec = (index: number, field: 'key' | 'value', value: string) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const removeSpec = (index: number) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  // Mirrors the API's Zod schema, so a submit cannot be rejected server-side for a
  // rule the form never showed. Failures land on the field, not in a bare toast.
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.slug.trim()) errs.slug = 'Slug is required';
    if (!form.brand.trim()) errs.brand = 'Brand is required';
    if (form.price === '' || form.price <= 0) errs.price = 'Valid price is required';
    if (form.comparePrice !== '' && Number(form.comparePrice) < Number(form.price)) {
      errs.comparePrice = 'Compare price should be higher than the price';
    }
    if (!form.category) errs.category = 'Category is required';
    if (form.stock === '' || form.stock < 0) errs.stock = 'Valid stock is required';
    if (form.shortDescription.trim() && form.shortDescription.trim().length < 5) {
      errs.shortDescription = 'Short description must be at least 5 characters';
    }
    if (form.description.trim() && form.description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Basic Info */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Basic Information</div>
        <div className={styles.grid}>
          <div className={`${styles.field} ${styles.gridFull}`}>
            <label className={styles.label}>
              Product Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="Enter product name"
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Slug <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className={`${styles.input} ${errors.slug ? styles.inputError : ''}`}
              placeholder="product-slug"
            />
            {errors.slug && <span className={styles.errorText}>{errors.slug}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Brand <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="brand"
              value={form.brand}
              onChange={handleChange}
              className={`${styles.input} ${errors.brand ? styles.inputError : ''}`}
              placeholder="Brand name"
            />
            {errors.brand && <span className={styles.errorText}>{errors.brand}</span>}
          </div>

          <div className={`${styles.field} ${styles.gridFull}`}>
            <label className={styles.label}>Short Description</label>
            <input
              type="text"
              name="shortDescription"
              value={form.shortDescription}
              onChange={handleChange}
              className={`${styles.input} ${errors.shortDescription ? styles.inputError : ''}`}
              placeholder="Brief product description (5+ characters, or leave blank)"
            />
            {errors.shortDescription && (
              <span className={styles.errorText}>{errors.shortDescription}</span>
            )}
          </div>

          <div className={`${styles.field} ${styles.gridFull}`}>
            <label className={styles.label}>Full Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              placeholder="Detailed product description (10+ characters, or leave blank)"
            />
            {errors.description && (
              <span className={styles.errorText}>{errors.description}</span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Pricing & Inventory</div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>
              Price (₹) <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleNumberChange}
              className={`${styles.input} ${errors.price ? styles.inputError : ''}`}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            {errors.price && <span className={styles.errorText}>{errors.price}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Compare Price (₹)</label>
            <input
              type="number"
              name="comparePrice"
              value={form.comparePrice}
              onChange={handleNumberChange}
              className={`${styles.input} ${errors.comparePrice ? styles.inputError : ''}`}
              placeholder="0"
              min="0"
              step="1"
            />
            {errors.comparePrice && (
              <span className={styles.errorText}>{errors.comparePrice}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Stock <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleNumberChange}
              className={`${styles.input} ${errors.stock ? styles.inputError : ''}`}
              placeholder="0"
              min="0"
            />
            {errors.stock && <span className={styles.errorText}>{errors.stock}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Category <span className={styles.required}>*</span>
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={`${styles.select} ${errors.category ? styles.inputError : ''}`}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && <span className={styles.errorText}>{errors.category}</span>}
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-5)' }}>
          <div className={styles.toggleWrap}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={form.featured}
                onChange={handleToggle}
              />
              <span className={styles.toggleSlider} />
            </label>
            <span className={styles.toggleLabel}>Featured Product</span>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Product Images</div>
        <ImageUploader
          images={form.images}
          onChange={(imgs) => setForm((prev) => ({ ...prev, images: imgs }))}
        />
      </div>

      {/* Specifications */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Specifications</div>
        {form.specifications.map((spec, i) => (
          <div key={i} className={styles.specRow}>
            <input
              type="text"
              value={spec.key}
              onChange={(e) => updateSpec(i, 'key', e.target.value)}
              className={`${styles.input} ${styles.specInput}`}
              placeholder="Specification name"
            />
            <input
              type="text"
              value={spec.value}
              onChange={(e) => updateSpec(i, 'value', e.target.value)}
              className={`${styles.input} ${styles.specInput}`}
              placeholder="Value"
            />
            <button type="button" className={styles.specRemoveBtn} onClick={() => removeSpec(i)}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className={styles.addBtn} onClick={addSpec}>
          + Add Specification
        </button>
      </div>

      {/* Tags */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Tags</div>
        <div className={styles.field}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className={styles.input}
            placeholder="Type a tag and press Enter"
          />
          {form.tags.length > 0 && (
            <div className={styles.tagsWrap}>
              {form.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button type="button" className={styles.tagRemove} onClick={() => removeTag(tag)}>
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={() => window.history.back()}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
