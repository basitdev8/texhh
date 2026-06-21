import styles from "./Badge.module.css";

interface BadgeProps {
  variant?: "success" | "error" | "warning" | "info" | "neutral";
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = "neutral",
  children,
  className,
}: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className || ""}`}>
      {children}
    </span>
  );
}
