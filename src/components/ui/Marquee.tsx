"use client";

import React from "react";
import styles from "./Marquee.module.css";

interface MarqueeProps {
  items: string[];
  size?: "large" | "small";
  duration?: number;
  reverse?: boolean;
  separator?: "asterisk" | "dot" | "slash" | "none";
  className?: string;
}

export default function Marquee({
  items,
  size = "large",
  duration = 40,
  reverse = false,
  separator = "asterisk",
  className,
}: MarqueeProps) {
  const sep =
    separator === "asterisk"
      ? "✱"
      : separator === "slash"
      ? "/"
      : separator === "dot"
      ? "•"
      : "";

  const renderTrack = (key: string) => (
    <div
      key={key}
      className={`${styles.track} ${reverse ? styles.reverse : ""}`}
    >
      {items.map((item, i) => (
        <span
          key={`${key}-${i}`}
          className={`${size === "small" ? styles.itemSmall : styles.item}`}
        >
          {item}
          {sep && <span className={styles.divider}>{sep}</span>}
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={`${styles.marquee} ${className || ""}`}
      style={{ ["--duration" as never]: `${duration}s` }}
      aria-hidden="true"
    >
      {renderTrack("a")}
      {renderTrack("b")}
    </div>
  );
}
