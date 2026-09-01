'use client';

import React, { useState, useMemo } from 'react';
import styles from './DataTable.module.css';

export interface Column<T> {
  name: string;
  key: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  emptyDescription?: string;
  /** Names the horizontally scrollable region for assistive technology. */
  label?: string;
}

export default function DataTable<T extends { _id?: string | unknown }>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data found',
  emptyDescription = 'There are no records to display.',
  label = 'Data table',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable === false) return;
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [data, sortKey, sortDir]);

  if (data.length === 0) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.emptyState}>
          <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <div className={styles.emptyTitle}>{emptyMessage}</div>
          <div className={styles.emptyText}>{emptyDescription}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* The table scrolls sideways on narrow screens, so the region needs a
          name and its own tab stop for keyboard and screen-reader users. */}
      <div
        className={styles.scrollContainer}
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    col.sortable === false || sortKey !== col.key
                      ? "none"
                      : sortDir === "asc"
                        ? "ascending"
                        : "descending"
                  }
                >
                  {col.sortable === false ? (
                    col.name
                  ) : (
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort(col.key, col.sortable)}
                    >
                      {col.name}
                      <span className={`${styles.sortIndicator} ${sortKey === col.key ? styles.sortActive : ''}`} aria-hidden="true">
                        {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, idx) => (
              <tr
                key={(item._id as string) || idx}
                onClick={() => onRowClick?.(item)}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(item);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
                className={onRowClick ? styles.clickableRow : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render
                      ? col.render(item)
                      : ((item as Record<string, unknown>)[col.key] as React.ReactNode) ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
