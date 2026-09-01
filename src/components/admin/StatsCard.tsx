'use client';

import React from 'react';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  variant?: 'default' | 'accent' | 'success' | 'info' | 'warning';
}

export default function StatsCard({
  label,
  value,
  sublabel,
  trend,
  variant = 'default',
}: StatsCardProps) {
  const renderedValue =
    typeof value === 'number'
      ? value.toLocaleString('en-IN')
      : value;

  return (
    <div className={styles.block}>
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
              aria-hidden="true"
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
        }`}
      >
        {renderedValue}
      </div>
      {sublabel && <span className={styles.sublabel}>{sublabel}</span>}
    </div>
  );
}
