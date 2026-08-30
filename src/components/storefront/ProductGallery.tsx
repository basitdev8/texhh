"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./ProductGallery.module.css";

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

type Direction = "previous" | "next";

function ArrowIcon({ direction }: { direction: Direction }) {
  const isPrevious = direction === "previous";
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={isPrevious ? "M14.5 5 7.5 12l7 7" : "m9.5 5 7 7-7 7"} />
    </svg>
  );
}

function ZoomIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="10.5" r="5.5" />
      <path d="m15 15 4.5 4.5M10.5 8v5M8 10.5h5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const list = images.length > 0 ? images : ["/placeholder.svg"];
  const [active, setActive] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const touchStartX = useRef<number | null>(null);
  const activeThumb = useRef<HTMLButtonElement | null>(null);
  const current = list[active] || list[0];
  const imageCount = list.length;
  const hasMultiple = imageCount > 1;

  const selectImage = useCallback((index: number) => {
    const nextIndex = (index + imageCount) % imageCount;
    setActive(nextIndex);
    setZoom(1);
    requestAnimationFrame(() => {
      activeThumb.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    });
  }, [imageCount]);

  useEffect(() => {
    setActive((currentIndex) => Math.min(currentIndex, imageCount - 1));
  }, [imageCount]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLightboxOpen(false);
      if (event.key === "ArrowLeft") selectImage(active - 1);
      if (event.key === "ArrowRight") selectImage(active + 1);
      if (event.key === "+" || event.key === "=") setZoom(2);
      if (event.key === "-") setZoom(1);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [active, isLightboxOpen, selectImage]);

  function move(direction: Direction) {
    selectImage(active + (direction === "next" ? 1 : -1));
  }

  function handleMainKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!hasMultiple) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move("previous");
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move("next");
    }
  }

  function handlePointerMove(event: React.MouseEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  }

  return (
    <div className={styles.gallery} onKeyDown={handleMainKeyDown}>
      <div
        className={styles.mainImage}
        onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          const startX = touchStartX.current;
          const endX = event.changedTouches[0]?.clientX;
          touchStartX.current = null;
          if (startX === null || endX === undefined || Math.abs(endX - startX) < 45 || !hasMultiple) return;
          move(endX < startX ? "next" : "previous");
        }}
      >
        <button
          type="button"
          className={styles.mainImageButton}
          onClick={() => setIsLightboxOpen(true)}
          onMouseMove={handlePointerMove}
          aria-label={`Zoom image ${active + 1} of ${list.length}`}
        >
          <Image
            src={current}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 600px"
            className={styles.image}
            style={{ transformOrigin: zoomOrigin }}
            priority
          />
          <span className={styles.zoomHint} aria-hidden="true"><ZoomIcon /> Zoom</span>
        </button>

        {hasMultiple && (
          <>
            <button type="button" className={`${styles.navButton} ${styles.navPrevious}`} onClick={() => move("previous")} aria-label="Previous product image">
              <ArrowIcon direction="previous" />
            </button>
            <button type="button" className={`${styles.navButton} ${styles.navNext}`} onClick={() => move("next")} aria-label="Next product image">
              <ArrowIcon direction="next" />
            </button>
            <span className={styles.counter} aria-live="polite">{active + 1} / {list.length}</span>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className={styles.thumbRail} aria-label="Product images">
          {list.map((src, index) => (
            <button
              type="button"
              key={`${src}-${index}`}
              ref={index === active ? activeThumb : null}
              className={`${styles.thumb} ${index === active ? styles.thumbActive : ""}`}
              onClick={() => selectImage(index)}
              aria-label={`View image ${index + 1} of ${list.length}`}
              aria-current={index === active ? "true" : undefined}
            >
              <Image src={src} alt="" fill sizes="96px" className={styles.thumbImage} />
            </button>
          ))}
        </div>
      )}

      {isLightboxOpen && (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={`${alt} image gallery`} onMouseDown={(event) => { if (event.target === event.currentTarget) setIsLightboxOpen(false); }}>
          <div className={styles.lightboxTopbar}>
            <span>{active + 1} of {list.length}</span>
            <div className={styles.lightboxActions}>
              <button type="button" onClick={() => setZoom((value) => (value === 1 ? 2 : 1))} aria-label={zoom === 1 ? "Zoom in" : "Zoom out"}>
                <ZoomIcon />
                <span>{zoom === 1 ? "Zoom in" : "Zoom out"}</span>
              </button>
              <button type="button" onClick={() => setIsLightboxOpen(false)} aria-label="Close image viewer">
                <CloseIcon />
                <span>Close</span>
              </button>
            </div>
          </div>

          <div className={styles.lightboxStage}>
            <Image
              src={current}
              alt={alt}
              fill
              sizes="100vw"
              className={styles.lightboxImage}
              style={{ transform: `scale(${zoom})`, transformOrigin: zoomOrigin }}
              priority
            />
            {hasMultiple && (
              <>
                <button type="button" className={`${styles.navButton} ${styles.lightboxPrevious}`} onClick={() => move("previous")} aria-label="Previous product image"><ArrowIcon direction="previous" /></button>
                <button type="button" className={`${styles.navButton} ${styles.lightboxNext}`} onClick={() => move("next")} aria-label="Next product image"><ArrowIcon direction="next" /></button>
              </>
            )}
          </div>
          <p className={styles.lightboxHelp}>Use ← → to browse · Click Zoom to inspect · Esc to close</p>
        </div>
      )}
    </div>
  );
}
