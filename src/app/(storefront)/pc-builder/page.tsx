"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import type { IPCBuild, IPCComponent, PCComponentType } from "@/types";
import styles from "./page.module.css";

const STEPS: PCComponentType[] = [
  "CPU",
  "GPU",
  "RAM",
  "Storage",
  "Motherboard",
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

const STEP_META: Record<PCComponentType, { title: string; sub: string }> = {
  CPU: { title: "The silent engine.", sub: "Pick a processor that matches the workload — work, play, render." },
  GPU: { title: "Where pixels are born.", sub: "Graphics for gaming, creative work, and the occasional render." },
  RAM: { title: "Multitasking, room to breathe.", sub: "Memory determines how fluidly the machine handles your day." },
  Storage: { title: "Where everything lives.", sub: "NVMe SSDs for speed, paired with capacity for your library." },
  Motherboard: { title: "The foundation.", sub: "Socket, chipset, and form factor — match the rest of your parts." },
  PSU: { title: "Quiet, reliable power.", sub: "Headroom for upgrades, efficiency for your bill, silence for your ears." },
  Case: { title: "The shell.", sub: "Choose airflow, form factor, and the material that defines the build." },
  Cooler: { title: "Thermal calm.", sub: "Air for simplicity, liquid for the absolute lowest temperatures." },
};

export default function PCBuilderPage() {
  const [currentStep, setCurrentStep] = useState<PCComponentType>("CPU");
  const [build, setBuild] = useState<IPCBuild>(EMPTY_BUILD);
  const [components, setComponents] = useState<IPCComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"price-asc" | "price-desc" | "name">("price-asc");

  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useToast();
  const router = useRouter();

  const filled = useMemo(
    () => STEPS.filter((s) => build[s] !== null).length,
    [build]
  );
  const progress = (filled / STEPS.length) * 100;
  const subtotal = useMemo(
    () => STEPS.reduce((sum, s) => sum + (build[s]?.price ?? 0), 0),
    [build]
  );
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
      .finally(() => mounted && setLoading(false));
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      showToast("Select at least one part first", "error");
      return;
    }
    parts.forEach((part) => {
      addItem({
        productId: part._id,
        name: `[Build] ${part.type}: ${part.name}`,
        price: part.price,
        quantity: 1,
        image: part.image || "/placeholder.svg",
        maxStock: Math.max(1, part.stock),
      });
    });
    showToast(`${parts.length} build parts added to cart`, "success");
    router.push("/cart");
  };

  const meta = STEP_META[currentStep];
  const stepNum = String(stepIndex + 1).padStart(2, "0");
  const compatible = filled === STEPS.length;

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Editorial header */}
        <header className={styles.header}>
          <div>
            <div className={styles.eyebrowRow}>
              <span className={styles.eyebrowLine} />
              <span className={styles.eyebrow}>Atelier / PC Builder</span>
            </div>
            <h1 className={styles.title}>
              Compose your <span className={styles.titleItalic}>rig</span>.
            </h1>
          </div>
          <div className={styles.headerRight}>
            <p className={styles.headerSubtitle}>
              A guided build session. Pick each part, watch the total breathe,
              check compatibility live — then send the whole thing to your cart
              like a single object.
            </p>
            <div className={styles.headerProgress}>
              <div className={styles.headerProgressTop}>
                <span className={styles.headerProgressLabel}>Progress</span>
                <span className={styles.headerProgressVal}>
                  {filled}
                  <span style={{ color: "var(--color-text-muted)", fontStyle: "normal", fontFamily: "var(--font-body)", fontSize: "var(--text-base)" }}>
                    {" "}/ {STEPS.length}
                  </span>
                </span>
              </div>
              <div className={styles.headerProgressBar}>
                <div
                  className={styles.headerProgressFill}
                  style={{ transform: `scaleX(${progress / 100})` }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Sticky step rail */}
        <div className={styles.stepRail}>
          <div className={styles.stepRailInner}>
            {STEPS.map((s, i) => {
              const done = build[s] !== null;
              const active = s === currentStep;
              return (
                <button
                  key={s}
                  className={`${styles.stepBtn} ${
                    active ? styles.stepActive : done ? styles.stepDone : ""
                  }`}
                  onClick={() => goToStep(s)}
                  data-cursor-text={s}
                >
                  <span className={styles.stepDot}>
                    {done && !active ? "✓" : String(i + 1).padStart(2, "0")}
                  </span>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main layout */}
        <div className={styles.layout}>
          <section>
            {/* Step header */}
            <div className={styles.stepHeader}>
              <div>
                <div className={styles.stepName}>
                  <span className={styles.stepNum}>№{stepNum}</span>
                  <span>{currentStep}</span>
                </div>
                <h2
                  className={styles.stepDescription}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: "var(--text-2xl)",
                    color: "var(--color-ink)",
                    letterSpacing: "-0.02em",
                    margin: "var(--space-3) 0 var(--space-2)",
                    maxWidth: "32rem",
                  }}
                >
                  {meta.title}
                </h2>
                <p className={styles.stepDescription}>{meta.sub}</p>
              </div>
              <div className={styles.stepHeaderRight}>
                <span className={styles.stepCount}>
                  {loading ? "…" : sortedComponents.length}
                </span>
                <span className={styles.stepCountLabel}>options</span>
              </div>
            </div>

            {/* Sort row */}
            <div className={styles.sortRow}>
              <span className={styles.sortLabel}>
                {build[currentStep]
                  ? `Selected · ${build[currentStep]?.name}`
                  : "None selected yet"}
              </span>
              <select
                className={styles.sortSelect}
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                data-cursor-text="Sort"
              >
                <option value="price-asc">Sort: Price ↑</option>
                <option value="price-desc">Sort: Price ↓</option>
                <option value="name">Sort: A → Z</option>
              </select>
            </div>

            {/* Component grid */}
            {loading ? (
              <div className={styles.gridLoading}>
                Loading {currentStep} options…
              </div>
            ) : sortedComponents.length === 0 ? (
              <div className={styles.gridEmpty}>
                No {currentStep} options in the catalogue yet.
              </div>
            ) : (
              <div className={styles.grid}>
                {sortedComponents.map((c, i) => {
                  const selected = build[currentStep]?._id === c._id;
                  const specEntries = Object.entries(c.specifications || {}).slice(0, 3);
                  return (
                    <article
                      key={c._id}
                      className={`${styles.card} ${selected ? styles.cardSelected : ""} ${
                        c.stock === 0 ? styles.outOfStock : ""
                      }`}
                      onClick={() =>
                        c.stock > 0 && handleSelect(selected ? null : c)
                      }
                      data-cursor-text={selected ? "Remove" : "Select"}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles.cardImage}>
                        {selected && (
                          <span className={styles.cardBadge}>
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 10 10"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M2 5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Selected
                          </span>
                        )}
                        <span className={styles.cardNum}>
                          №{String(i + 1).padStart(2, "0")}
                        </span>
                        {c.image && (
                          <Image
                            src={c.image}
                            alt={c.name}
                            fill
                            sizes="(max-width: 1024px) 100vw, 400px"
                            className={styles.cardImageInner}
                            style={{ objectFit: "contain" }}
                          />
                        )}
                      </div>
                      <div className={styles.cardBody}>
                        <span className={styles.cardBrand}>{c.brand}</span>
                        <h3 className={styles.cardName}>{c.name}</h3>
                        {specEntries.length > 0 && (
                          <div className={styles.cardSpecs}>
                            {specEntries.map(([k, v]) => (
                              <span key={k} className={styles.cardSpec}>
                                <span className={styles.cardSpecKey}>
                                  {k}:
                                </span>{" "}
                                {v}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className={styles.cardFooter}>
                          <span className={styles.cardPrice}>
                            {formatPrice(c.price)}
                          </span>
                          <span className={styles.cardAction}>
                            {c.stock === 0
                              ? "Sold out"
                              : selected
                              ? "Remove"
                              : "Select"}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Step nav */}
            <div className={styles.stepNav}>
              <button
                className={styles.stepNavBtn}
                onClick={handlePrev}
                disabled={stepIndex === 0}
                data-cursor-text="Prev"
              >
                ← {stepIndex > 0 ? STEPS[stepIndex - 1] : "Start"}
              </button>
              <button
                className={`${styles.stepNavBtn} ${styles.stepNavNext}`}
                onClick={handleNext}
                disabled={stepIndex >= STEPS.length - 1}
                data-cursor-text="Next"
              >
                {stepIndex < STEPS.length - 1 ? STEPS[stepIndex + 1] : "Done"} →
              </button>
            </div>
          </section>

          {/* Build sheet */}
          <aside className={styles.sheet} aria-label="Build sheet">
            <div className={styles.sheetInner}>
              <div className={styles.sheetHead}>
                <span className={styles.sheetEyebrow}>Build sheet</span>
                <span className={styles.sheetCount}>
                  {filled} / {STEPS.length}
                </span>
              </div>

              <div className={styles.slots}>
                {STEPS.map((s, i) => {
                  const part = build[s];
                  const active = s === currentStep;
                  return (
                    <div
                      key={s}
                      onClick={() => goToStep(s)}
                      className={`${styles.slot} ${part ? styles.slotFilled : ""} ${
                        active ? styles.slotActive : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      data-cursor-text={part ? "Edit" : "Pick"}
                    >
                      <span className={styles.slotNum}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className={styles.slotInfo}>
                        <span className={styles.slotType}>{s}</span>
                        {part ? (
                          <span className={styles.slotName}>{part.name}</span>
                        ) : (
                          <span className={styles.slotEmpty}>not selected</span>
                        )}
                      </div>
                      {part ? (
                        <span className={styles.slotPrice}>
                          {formatPrice(part.price)}
                        </span>
                      ) : (
                        <span className={styles.slotPlaceholder}>—</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div
                className={`${styles.compat} ${compatible ? styles.compatGood : ""}`}
              >
                <span className={styles.compatDot} />
                {compatible
                  ? "All parts compatible · ready to ship"
                  : `${STEPS.length - filled} part${
                      STEPS.length - filled === 1 ? "" : "s"
                    } left to pick`}
              </div>

              <div className={styles.total}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalValue}>
                  <span className={styles.totalValueAccent}>
                    {formatPrice(subtotal)}
                  </span>
                </span>
              </div>

              <button
                className={styles.cta}
                onClick={handleAddToCart}
                disabled={filled === 0}
                data-cursor-text="Cart"
              >
                {filled === 0
                  ? "Pick a part to begin"
                  : filled < STEPS.length
                  ? `Add ${filled} part${filled === 1 ? "" : "s"} to cart`
                  : "Send build to cart"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
