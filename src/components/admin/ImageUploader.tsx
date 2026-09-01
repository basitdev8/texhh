'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from './ImageUploader.module.css';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUploader({ images, onChange, maxImages = 20 }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageDragIndex = useRef<number | null>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remaining = maxImages - images.length;
    if (remaining <= 0) return;

    const toUpload = fileArray.slice(0, remaining);
    setIsUploading(true);

    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.data?.url) uploaded.push(data.data.url);
        }
      }
      if (uploaded.length > 0) {
        onChange([...images, ...uploaded]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [images, maxImages, onChange]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= images.length) return;
    const reordered = [...images];
    const [image] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, image);
    onChange(reordered);
  };

  const handleImageDragStart = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    imageDragIndex.current = index;
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleImageDrop = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    const fromIndex = imageDragIndex.current;
    if (fromIndex !== null) moveImage(fromIndex, index);
    imageDragIndex.current = null;
    setDraggedIndex(null);
  };

  return (
    <div className={styles.uploader}>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg className={styles.dropIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <div className={styles.dropText}>
          Drag & drop images or <span className={styles.dropTextAccent}>browse</span>
        </div>
        <div className={styles.dropHint}>PNG, JPG, WebP up to 5MB • Max {maxImages} images</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className={styles.hiddenInput}
          onChange={handleFileSelect}
        />
      </div>

      {isUploading && (
        <div className={styles.uploading}>
          <div className={styles.spinner} />
          Uploading images...
        </div>
      )}

      {images.length > 0 && (
        <>
          <p className={styles.orderHint}>
            Drag images to change their order. The first image is shown first on the product page.
          </p>
          <div className={styles.previews} role="list" aria-label="Product image order">
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={`${styles.previewItem} ${draggedIndex === i ? styles.previewItemDragging : ''}`}
              draggable
              role="listitem"
              aria-label={`Image ${i + 1} of ${images.length}`}
              onDragStart={(event) => handleImageDragStart(event, i)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleImageDrop(event, i)}
              onDragEnd={() => {
                imageDragIndex.current = null;
                setDraggedIndex(null);
              }}
            >
              <Image
                src={src}
                alt={`Preview ${i + 1}`}
                width={120}
                height={120}
                unoptimized
                className={styles.previewImage}
              />
              <span className={styles.positionBadge}>{i === 0 ? 'Primary' : i + 1}</span>
              <span className={styles.dragHandle} aria-hidden="true">⠿</span>
              <div className={styles.reorderControls}>
                <button
                  type="button"
                  className={styles.reorderBtn}
                  onClick={() => moveImage(i, i - 1)}
                  disabled={i === 0}
                  aria-label={`Move image ${i + 1} earlier`}
                >
                  ←
                </button>
                <button
                  type="button"
                  className={styles.reorderBtn}
                  onClick={() => moveImage(i, i + 1)}
                  disabled={i === images.length - 1}
                  aria-label={`Move image ${i + 1} later`}
                >
                  →
                </button>
              </div>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={(event) => {
                  event.stopPropagation();
                  removeImage(i);
                }}
                aria-label={`Remove image ${i + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
