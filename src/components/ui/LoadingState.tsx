import styles from "./LoadingState.module.css";

interface LoadingStateProps {
  label?: string;
  detail?: string;
  compact?: boolean;
  className?: string;
}

export default function LoadingState({
  label = "Loading",
  detail,
  compact = false,
  className = "",
}: LoadingStateProps) {
  return (
    <div
      className={`${styles.state} ${compact ? styles.compact : ""} ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.mark} aria-hidden="true">
        <span className={styles.ring} />
        <span className={styles.core} />
      </span>
      <span className={styles.copy}>
        <span className={styles.label}>{label}</span>
        {detail && <span className={styles.detail}>{detail}</span>}
      </span>
    </div>
  );
}
