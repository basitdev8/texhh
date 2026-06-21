"use client";

import React from "react";
import { IPCBuild, PCComponentType } from "@/types";
import { formatPrice } from "@/lib/utils";
import CompatibilityBadge from "./CompatibilityBadge";
import styles from "./BuildSummary.module.css";

interface BuildSummaryProps {
  build: IPCBuild;
  steps: PCComponentType[];
  onAddToCart: () => void;
}

export default function BuildSummary({
  build,
  steps,
  onAddToCart,
}: BuildSummaryProps) {
  const filled = steps.filter((s) => build[s] !== null).length;
  const progress = (filled / steps.length) * 100;
  const subtotal = steps.reduce(
    (sum, s) => sum + (build[s]?.price ?? 0),
    0
  );

  const compatibilityStatus =
    filled === 0
      ? "warning"
      : filled === steps.length
      ? "compatible"
      : "warning";

  return (
    <aside className={styles.summary} aria-label="Build summary">
      <h3 className={styles.title}>Your Build</h3>
      <p className={styles.subtitle}>
        Selections update live as you choose each part.
      </p>

      <div className={styles.progressWrap}>
        <div className={styles.progressLabel}>
          <span>
            {filled} / {steps.length} parts selected
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className={styles.slots}>
        {steps.map((type) => {
          const part = build[type];
          return (
            <div
              key={type}
              className={`${styles.slot} ${part ? styles.slotFilled : ""}`}
            >
              <div className={styles.slotLeft}>
                <span className={styles.slotType}>{type}</span>
                {part ? (
                  <span className={styles.slotName}>{part.name}</span>
                ) : (
                  <span className={styles.slotEmpty}>Not selected</span>
                )}
              </div>
              {part && (
                <span className={styles.slotPrice}>
                  {formatPrice(part.price)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.compatibility}>
        <CompatibilityBadge
          status={compatibilityStatus}
          label={
            compatibilityStatus === "compatible"
              ? "All parts compatible"
              : `${steps.length - filled} part(s) remaining`
          }
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Total</span>
        <span className={styles.totalPrice}>{formatPrice(subtotal)}</span>
      </div>

      <button
        className={styles.addBtn}
        onClick={onAddToCart}
        disabled={filled === 0}
      >
        {filled === 0
          ? "Select parts to continue"
          : filled < steps.length
          ? `Add ${filled} part(s) to cart`
          : "Add Build to Cart"}
      </button>
    </aside>
  );
}
