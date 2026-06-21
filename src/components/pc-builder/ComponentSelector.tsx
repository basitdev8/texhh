"use client";

import React, { useEffect, useState } from "react";
import { IPCComponent, PCComponentType } from "@/types";
import ComponentCard from "./ComponentCard";
import Select from "@/components/ui/Select";
import styles from "./ComponentSelector.module.css";

interface ComponentSelectorProps {
  type: PCComponentType;
  selected: IPCComponent | null;
  onSelect: (component: IPCComponent | null) => void;
  onPrev?: () => void;
  onNext?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const TYPE_DESCRIPTIONS: Record<PCComponentType, string> = {
  CPU: "Pick the heart of your build — drives every workload.",
  GPU: "Graphics card for gaming, rendering, and creative work.",
  RAM: "Memory determines multitasking headroom and snappiness.",
  Storage: "SSDs and HDDs for your apps, games, and files.",
  Motherboard: "Foundation for every component — pick the right socket.",
  PSU: "Reliable power supply with enough headroom for upgrades.",
  Case: "Choose form factor, airflow, and aesthetics.",
  Cooler: "Keep temperatures in check — air or liquid.",
};

export default function ComponentSelector({
  type,
  selected,
  onSelect,
  onPrev,
  onNext,
  isFirst,
  isLast,
}: ComponentSelectorProps) {
  const [components, setComponents] = useState<IPCComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("price-asc");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/pc-components?type=${type}&limit=50`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setComponents(data.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [type]);

  const sorted = [...components].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={styles.selector}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Choose your {type}</h2>
          <p className={styles.subtitle}>{TYPE_DESCRIPTIONS[type]}</p>
        </div>
        <div className={styles.filters}>
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            options={[
              { label: "Price: Low to High", value: "price-asc" },
              { label: "Price: High to Low", value: "price-desc" },
              { label: "Name (A-Z)", value: "name" },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading {type} options…</div>
      ) : sorted.length === 0 ? (
        <div className={styles.empty}>
          No {type} options available yet. Check back soon.
        </div>
      ) : (
        <div className={styles.list}>
          {sorted.map((c) => (
            <ComponentCard
              key={c._id}
              component={c}
              isSelected={selected?._id === c._id}
              onSelect={() => onSelect(c)}
              onRemove={() => onSelect(null)}
            />
          ))}
        </div>
      )}

      <div className={styles.navRow}>
        <button
          className={styles.navBtn}
          onClick={onPrev}
          disabled={isFirst || !onPrev}
        >
          ← Previous
        </button>
        <button
          className={`${styles.navBtn} ${styles.nextBtn}`}
          onClick={onNext}
          disabled={isLast || !onNext}
        >
          {isLast ? "Finish" : "Next →"}
        </button>
      </div>
    </div>
  );
}
