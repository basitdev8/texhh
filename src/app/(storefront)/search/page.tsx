import { Suspense } from "react";
import SearchContent from "./SearchContent";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading…</div>}>
      <SearchContent />
    </Suspense>
  );
}
