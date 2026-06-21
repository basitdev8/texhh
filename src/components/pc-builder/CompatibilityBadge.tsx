import styles from "./CompatibilityBadge.module.css";

interface CompatibilityBadgeProps {
  status: "compatible" | "warning" | "incompatible";
  label?: string;
}

export default function CompatibilityBadge({
  status,
  label,
}: CompatibilityBadgeProps) {
  const defaultLabel = {
    compatible: "Compatible",
    warning: "Check Compatibility",
    incompatible: "Incompatible",
  }[status];

  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {status === "compatible" && "✓"}
      {status === "warning" && "!"}
      {status === "incompatible" && "✕"}
      <span>{label ?? defaultLabel}</span>
    </span>
  );
}
