"use client";

import React, { useEffect, useRef, useState } from "react";

type RevealVariant = "fade" | "up" | "left" | "right" | "scale";

interface RevealProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  once?: boolean;
}

export default function Reveal({
  children,
  variant = "up",
  delay,
  className,
  as: Tag = "div",
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const TagComponent = Tag as React.ElementType;
  return (
    <TagComponent
      ref={ref}
      data-reveal={variant}
      data-reveal-delay={delay}
      className={`${visible ? "is-visible" : ""} ${className || ""}`}
    >
      {children}
    </TagComponent>
  );
}
