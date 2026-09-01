"use client";

import React from "react";

export interface RevealProps {
  children: React.ReactNode;
  variant?: "fade" | "up" | "left" | "right" | "scale";
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  once?: boolean;
}

/**
 * Reveal renders content directly without animation gating, ensuring
 * that primary storefront content is immediately accessible to users
 * and assistive technology.
 */
export default function Reveal({
  children,
  className,
  as: Tag = "div",
}: RevealProps) {
  const TagComponent = Tag as React.ElementType;
  return <TagComponent className={className || ""}>{children}</TagComponent>;
}
