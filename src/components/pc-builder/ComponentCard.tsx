"use client";

import Image from "next/image";
import { IPCComponent } from "@/types";
import { formatPrice } from "@/lib/utils";
import styles from "./ComponentCard.module.css";

interface ComponentCardProps {
  component: IPCComponent;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export default function ComponentCard({
  component,
  isSelected,
  onSelect,
  onRemove,
}: ComponentCardProps) {
  const specEntries = Object.entries(component.specifications || {}).slice(0, 3);

  return (
    <article
      className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
    >
      <div className={styles.imageWrap}>
        {component.image ? (
          <Image
            src={component.image}
            alt={component.name}
            fill
            sizes="120px"
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholder}>No image</div>
        )}
      </div>
      <div className={styles.body}>
        <span className={styles.brand}>{component.brand}</span>
        <h3 className={styles.name}>{component.name}</h3>
        {specEntries.length > 0 && (
          <div className={styles.specs}>
            {specEntries.map(([k, v]) => (
              <span key={k} className={styles.spec}>
                <span className={styles.specKey}>{k}:</span> {v}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className={styles.right}>
        <div className={styles.price}>{formatPrice(component.price)}</div>
        {isSelected ? (
          <button className={styles.removeBtn} onClick={onRemove}>
            Remove
          </button>
        ) : (
          <button
            className={styles.selectBtn}
            onClick={onSelect}
            disabled={component.stock === 0}
          >
            {component.stock === 0 ? "Out of stock" : "Select"}
          </button>
        )}
      </div>
    </article>
  );
}
