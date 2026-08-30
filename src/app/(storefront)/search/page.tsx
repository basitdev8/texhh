import { Suspense } from "react";
import SearchContent from "./SearchContent";
import LoadingState from "@/components/ui/LoadingState";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className="container">
            <LoadingState label="Opening search" compact />
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
