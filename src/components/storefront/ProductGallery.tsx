"use client";

import React, { useState } from "react";
import Image from "next/image";
import styles from "./ProductGallery.module.css";

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : ["/placeholder.svg"];
  const current = list[active] || list[0];

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImage}>
        {current ? (
          <Image
            src={current}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className={styles.image}
            priority
          />
        ) : (
          <div className={styles.placeholder}>No image available</div>
        )}
      </div>
      {list.length > 1 && (
        <div className={styles.thumbs}>
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              className={`${styles.thumb} ${i === active ? styles.thumbActive : ""}`}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={src}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                sizes="120px"
                className={styles.thumbImage}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
