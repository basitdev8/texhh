import React from "react";
import styles from "./StatusNotice.module.css";

export interface StatusNoticeProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function StatusNotice({
  variant = "info",
  title,
  children,
  action,
  className = "",
}: StatusNoticeProps) {
  return (
    <div
      className={`${styles.notice} ${styles[variant]} ${className}`}
      role={variant === "error" ? "alert" : "status"}
    >
      <div className={styles.iconWrap} aria-hidden="true">
        {variant === "success" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {variant === "error" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
          </svg>
        )}
        {variant === "warning" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
          </svg>
        )}
        {variant === "info" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" strokeLinecap="round" />
            <line x1="12" y1="8" x2="12.01" y2="8" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div className={styles.content}>
        {title && <h4 className={styles.title}>{title}</h4>}
        <div className={styles.body}>{children}</div>
      </div>
      {action && (
        <button type="button" onClick={action.onClick} className={styles.actionBtn}>
          {action.label}
        </button>
      )}
    </div>
  );
}
