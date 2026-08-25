import type { ReactNode } from "react";
import styles from "./policy.module.css";

interface PolicyLayoutProps {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}

/** Shared shell for the legal pages so they read as one document set. */
export default function PolicyLayout({
  eyebrow,
  title,
  updated,
  children,
}: PolicyLayoutProps) {
  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrowLine} />
          <span className={styles.eyebrow}>{eyebrow}</span>
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Last updated: {updated}</p>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

/** Marks a value the business still has to provide. */
export function Todo({ children }: { children: ReactNode }) {
  return <span className={styles.todo}>[TODO: {children}]</span>;
}

export { styles as policyStyles };
