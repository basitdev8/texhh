"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./Cursor.module.css";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const [hovering, setHovering] = useState(false);
  const [label, setLabel] = useState<string>("");
  const mouse = useRef({ x: 0, y: 0 });
  const dot = useRef({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (isTouch) return;

    const move = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const tick = () => {
      // Snappy dot follow
      dot.current.x += (mouse.current.x - dot.current.x) * 0.6;
      dot.current.y += (mouse.current.y - dot.current.y) * 0.6;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dot.current.x}px, ${dot.current.y}px, 0)`;
      }
      if (labelRef.current) {
        labelRef.current.style.transform = `translate3d(${dot.current.x}px, ${dot.current.y}px, 0)`;
      }
      frame.current = requestAnimationFrame(tick);
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const interactive = t.closest(
        "a, button, [role='button'], input, textarea, select, label[for], [data-cursor='hover']"
      ) as HTMLElement | null;
      if (interactive) {
        const text = interactive.getAttribute("data-cursor-text");
        setLabel(text || "");
        setHovering(true);
      } else {
        setHovering(false);
        setLabel("");
      }
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", onOver);
    frame.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", onOver);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div className={styles.cursorWrap} aria-hidden="true">
      <div
        ref={dotRef}
        className={`${styles.dot} ${hovering ? styles.dotHover : ""}`}
      />
      <span
        ref={labelRef}
        className={`${styles.label} ${label ? styles.labelVisible : ""}`}
      >
        {label}
      </span>
    </div>
  );
}
