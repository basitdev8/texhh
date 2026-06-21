'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  /** Optional icon — kept for backwards compat but no longer rendered as a tile. */
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  /** Optional variant — accent makes the value italic + copper. */
  variant?: 'default' | 'accent' | 'success' | 'info' | 'warning';
}

export default function StatsCard({
  label,
  value,
  sublabel,
  trend,
  variant = 'default',
}: StatsCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState<string | number>(
    typeof value === 'number' ? 0 : value
  );
  const blockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (blockRef.current) observer.observe(blockRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || typeof value !== 'number') {
      if (isVisible) setDisplayValue(value);
      return;
    }

    const duration = 900;
    const steps = 36;
    const stepTime = duration / steps;
    let current = 0;
    const increment = value / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  // Format the display value with Indian commas if it's a raw number
  const renderedValue =
    typeof displayValue === 'number'
      ? displayValue.toLocaleString('en-IN')
      : displayValue;

  return (
    <div className={styles.block} ref={blockRef}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {trend && (
          <span
            className={`${styles.trend} ${
              trend.isUp ? styles.trendUp : styles.trendDown
            }`}
          >
            <svg
              className={styles.trendIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              {trend.isUp ? (
                <polyline points="18 15 12 9 6 15" />
              ) : (
                <polyline points="6 9 12 15 18 9" />
              )}
            </svg>
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div
        className={`${styles.value} ${
          variant === 'accent' ? styles.valueAccent : ''
        } ${isVisible ? styles.valueAnimated : ''}`}
      >
        {renderedValue}
      </div>
      {sublabel && <span className={styles.sublabel}>{sublabel}</span>}
    </div>
  );
}
