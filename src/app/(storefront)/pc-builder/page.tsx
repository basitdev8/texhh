"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/components/ui/Toast";
import LoadingState from "@/components/ui/LoadingState";
import { evaluatePcCompatibility } from "@/lib/pcCompatibility";
import { formatPrice } from "@/lib/utils";
import type { IPCBuild, IPCComponent, PCComponentType } from "@/types";
import styles from "./page.module.css";

const STEPS: PCComponentType[] = [
  "CPU",
  "Motherboard",
  "RAM",
  "GPU",
  "Storage",
  "PSU",
  "Case",
  "Cooler",
];

const EMPTY_BUILD: IPCBuild = {
  CPU: null,
  GPU: null,
  RAM: null,
  Storage: null,
  Motherboard: null,
  PSU: null,
  Case: null,
  Cooler: null,
};

const STEP_INFO: Record<PCComponentType, { label: string; desc: string }> = {
  CPU: { label: "Processor (CPU)", desc: "Select an Intel or AMD processor to define your platform and socket type." },
  Motherboard: { label: "Motherboard", desc: "Choose a compatible motherboard matching your CPU socket and case form factor." },
  RAM: { label: "System Memory (RAM)", desc: "Choose memory generation (DDR4 / DDR5) and capacity for your system." },
  GPU: { label: "Graphics Card (GPU)", desc: "Select dedicated graphics tailored for gaming, 3D rendering, or creation." },
  Storage: { label: "Storage (SSD / NVMe)", desc: "High-speed NVMe PCIe storage for OS, games, and large project files." },
  PSU: { label: "Power Supply (PSU)", desc: "Reliable power delivery with sufficient wattage headroom for all components." },
  Case: { label: "Computer Case", desc: "Form factor chassis with appropriate airflow, motherboard fit, and GPU clearance." },
  Cooler: { label: "CPU Cooler", desc: "Air or liquid AIO cooling solution compatible with your CPU socket." },
};

export default function PCBuilderPage() {
  const [currentStep, setCurrentStep] = useState<PCComponentType>("CPU");
  const [build, setBuild] = useState<IPCBuild>(EMPTY_BUILD);
  const [components, setComponents] = useState<IPCComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"price-asc" | "price-desc" | "name">("price-asc");
  // Phones get a bottom summary bar that opens the full build sheet; the
  // desktop aside is hidden at that width so nothing is duplicated.
  const [buildSheetOpen, setBuildSheetOpen] = useState(false);
  const buildSheetTriggerRef = useRef<HTMLButtonElement | null>(null);
  const buildSheetRef = useRef<HTMLDivElement | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useToast();
  const router = useRouter();

  const filledCount = useMemo(
    () => STEPS.filter((s) => build[s] !== null).length,
    [build]
  );
  const progressPercent = (filledCount / STEPS.length) * 100;
  const subtotal = useMemo(
    () => STEPS.reduce((sum, s) => sum + (build[s]?.price ?? 0), 0),
    [build]
  );
  const compatibility = useMemo(() => evaluatePcCompatibility(build), [build]);
  const stepIndex = STEPS.indexOf(currentStep);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/pc-components?type=${currentStep}&limit=50`)
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
  }, [currentStep]);

  const sortedComponents = useMemo(() => {
    const list = [...components];
    list.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [components, sort]);

  const handleSelect = (component: IPCComponent | null) => {
    setBuild((prev) => ({ ...prev, [currentStep]: component }));
  };

  const goToStep = (s: PCComponentType) => {
    setCurrentStep(s);
  };

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) goToStep(STEPS[stepIndex + 1]);
  };

  const handlePrev = () => {
    if (stepIndex > 0) goToStep(STEPS[stepIndex - 1]);
  };

  const handleAddToCart = () => {
    const parts = STEPS.map((s) => build[s]).filter(
      Boolean
    ) as IPCComponent[];
    if (parts.length === 0) {
      showToast("Select at least one component to proceed", "error");
      return;
    }
    if (compatibility.status === "incompatible") {
      showToast("Please resolve compatibility errors before adding to cart", "error");
      return;
    }
    parts.forEach((part) => {
      addItem({
        productId: part._id,
        itemType: "component",
        name: `${part.type}: ${part.name}`,
        price: part.price,
        quantity: 1,
        image: part.image || "/placeholder.svg",
        maxStock: Math.max(1, part.stock),
      });
    });
    showToast(`${parts.length} custom PC parts added to cart`, "success");
    router.push("/cart");
  };

  // The build sheet is a modal surface: Escape closes it, the background does
  // not scroll behind it, and focus returns to the trigger on close.
  useEffect(() => {
    if (!buildSheetOpen) return;
    const trigger = buildSheetTriggerRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuildSheetOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    buildSheetRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [buildSheetOpen]);

  const currentInfo = STEP_INFO[currentStep];

  const renderBuildSummary = (idSuffix: string) => (
    <div className={styles.summaryCard}>
      <div className={styles.summaryHeader}>
        <h3 className={styles.summaryTitle}>Current Build</h3>
        <span className={styles.summaryCount}>
          {filledCount} / {STEPS.length} Parts
        </span>
      </div>

      {/* 8-Part Slot List */}
      <div className={styles.slotList}>
        {STEPS.map((s) => {
          const part = build[s];
          const isActive = s === currentStep;
          return (
            <button
              key={s}
              type="button"
              onClick={() => {
                goToStep(s);
                setBuildSheetOpen(false);
              }}
              className={`${styles.slotRow} ${part ? styles.slotRowFilled : ""} ${isActive ? styles.slotRowActive : ""}`}
              aria-current={isActive ? "step" : undefined}
            >
              <span className={styles.slotMain}>
                <span className={styles.slotType}>{s}</span>
                <span className={styles.slotPartName}>
                  {part ? part.name : "Not selected"}
                </span>
              </span>
              <span className={styles.slotPrice}>
                {part ? formatPrice(part.price) : "\u2014"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Real-time Compatibility Banner */}
      <div
        className={`${styles.compatBanner} ${
          compatibility.status === "compatible"
            ? styles.compatSuccess
            : compatibility.status === "incompatible"
            ? styles.compatError
            : styles.compatWarning
        }`}
        role="status"
        aria-live="polite"
      >
        <div className={styles.compatTitleRow}>
          <span className={styles.compatStatusText}>
            {compatibility.status === "compatible"
              ? "\u2713 All selected parts compatible"
              : compatibility.status === "incompatible"
              ? "\u2715 Compatibility conflict detected"
              : "\u26a0 Compatibility notice"}
          </span>
        </div>

        {compatibility.messages.length > 0 && (
          <ul className={styles.compatList}>
            {compatibility.messages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Total & Action */}
      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Build Total</span>
        <span className={styles.totalAmount}>{formatPrice(subtotal)}</span>
      </div>

      <button
        type="button"
        className={styles.addBuildBtn}
        onClick={handleAddToCart}
        disabled={filledCount === 0 || compatibility.status === "incompatible"}
        id={`builder-add-to-cart${idSuffix}`}
      >
        {filledCount === 0
          ? "Select parts to begin"
          : compatibility.status === "incompatible"
          ? "Resolve conflicts to add"
          : `Add Build to Cart (${filledCount} parts)`}
      </button>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Page Header */}
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <span className={styles.eyebrow}>PC Configurator</span>
            <h1 className={styles.title}>Custom PC Builder</h1>
            <p className={styles.subtitle}>
              Configure your ideal setup with real-time socket, form factor, and wattage validation.
            </p>
          </div>

          <div className={styles.progressCard}>
            <div className={styles.progressRow}>
              <span className={styles.progressLabel}>Configuration Progress</span>
              <span className={styles.progressVal}>
                {filledCount} of {STEPS.length} Selected
              </span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        {/* Step Navigation Rail */}
        <nav className={styles.stepRail} aria-label="Build Steps">
          {STEPS.map((s, i) => {
            const isSelected = build[s] !== null;
            const isActive = s === currentStep;
            return (
              <button
                key={s}
                type="button"
                className={`${styles.stepTab} ${isActive ? styles.stepTabActive : isSelected ? styles.stepTabDone : ""}`}
                onClick={() => goToStep(s)}
                id={`builder-step-${s.toLowerCase()}`}
              >
                <span className={styles.stepIndex}>
                  {isSelected ? "✓" : i + 1}
                </span>
                <span className={styles.stepName}>{s}</span>
              </button>
            );
          })}
        </nav>

        {/* 2-Column Main Builder Layout */}
        <div className={styles.layout}>
          {/* Left Column: Component Picker */}
          <section className={styles.pickerCol} aria-labelledby="picker-heading">
            <div className={styles.stepHeader}>
              <div>
                <h2 id="picker-heading" className={styles.stepTitle}>
                  {currentInfo.label}
                </h2>
                <p className={styles.stepDesc}>{currentInfo.desc}</p>
              </div>

              <div className={styles.sortWrapper}>
                <select
                  className={styles.sortSelect}
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  aria-label={`Sort ${currentStep} components`}
                >
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>

            {/* Component Grid */}
            {loading ? (
              <div className={styles.loadingWrap}>
                <LoadingState label={`Loading ${currentStep} options`} compact />
              </div>
            ) : sortedComponents.length === 0 ? (
              <div className={styles.emptyWrap}>
                <p>No components currently listed for {currentStep}.</p>
              </div>
            ) : (
              <div className={styles.componentGrid}>
                {sortedComponents.map((c) => {
                  const isSelected = build[currentStep]?._id === c._id;
                  const specEntries = Object.entries(c.specifications || {}).slice(0, 3);
                  const isOutOfStock = c.stock <= 0;

                  return (
                    <article
                      key={c._id}
                      className={`${styles.card} ${isSelected ? styles.cardSelected : ""} ${isOutOfStock ? styles.cardOutOfStock : ""}`}
                    >
                      <div className={styles.cardImageWrap}>
                        {isSelected && (
                          <span className={styles.selectedBadge}>Selected</span>
                        )}
                        <Image
                          src={c.image || "/placeholder.svg"}
                          alt={c.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 300px"
                          className={styles.cardImage}
                        />
                      </div>

                      <div className={styles.cardContent}>
                        {c.brand && <span className={styles.cardBrand}>{c.brand}</span>}
                        <h3 className={styles.cardName}>{c.name}</h3>

                        {specEntries.length > 0 && (
                          <div className={styles.cardSignalRail}>
                            {specEntries.map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </div>
                        )}

                        <div className={styles.cardFooter}>
                          <span className={styles.cardPrice}>{formatPrice(c.price)}</span>
                          <button
                            type="button"
                            className={`${styles.selectBtn} ${isSelected ? styles.selectBtnActive : ""}`}
                            onClick={() => !isOutOfStock && handleSelect(isSelected ? null : c)}
                            disabled={isOutOfStock}
                            aria-label={`${isSelected ? "Remove" : "Select"} ${c.name}`}
                          >
                            {isOutOfStock
                              ? "Out of stock"
                              : isSelected
                              ? "Remove"
                              : "Select Part"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Stepper Footer Buttons */}
            <div className={styles.stepNavigation}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={handlePrev}
                disabled={stepIndex === 0}
              >
                ← Previous Step
              </button>
              <button
                type="button"
                className={`${styles.navBtn} ${styles.navBtnNext}`}
                onClick={handleNext}
                disabled={stepIndex >= STEPS.length - 1}
              >
                Next Step →
              </button>
            </div>
          </section>

          {/* Right Column: Sticky Build Summary */}
          <aside className={styles.summaryCol} aria-label="Build Summary">
            {renderBuildSummary("")}
          </aside>
        </div>
      </div>

      {/* Mobile build bar — keeps parts, total, and the final action reachable
          without scrolling past the whole component list. */}
      <div className={styles.mobileBuildBar} data-mobile-action-bar="compact">
        <div className={styles.mobileBuildInner}>
          <span className={styles.mobileBuildMeta}>
            <span className={styles.mobileBuildCount}>
              {filledCount} of {STEPS.length} parts
            </span>
            <span className={styles.mobileBuildTotal}>{formatPrice(subtotal)}</span>
          </span>
          <button
            type="button"
            ref={buildSheetTriggerRef}
            className={styles.mobileBuildBtn}
            onClick={() => setBuildSheetOpen(true)}
            aria-expanded={buildSheetOpen}
          >
            View build
          </button>
        </div>
      </div>

      {buildSheetOpen && (
        <div
          className={styles.sheetBackdrop}
          onClick={() => setBuildSheetOpen(false)}
          role="presentation"
        >
          <div
            ref={buildSheetRef}
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Build summary"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.sheetHead}>
              <span className={styles.sheetHandle} aria-hidden="true" />
              <button
                type="button"
                className={styles.sheetClose}
                onClick={() => setBuildSheetOpen(false)}
                aria-label="Close build summary"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className={styles.sheetBody}>{renderBuildSummary("-sheet")}</div>
          </div>
        </div>
      )}
    </div>
  );
}
