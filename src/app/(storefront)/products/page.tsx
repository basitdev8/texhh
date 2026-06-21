import { Suspense } from "react";
import ProductsContent from "./ProductsContent";
import styles from "./products.module.css";

export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return (
    <Suspense
      fallback={<div className={styles.loading}>Loading products…</div>}
    >
      <ProductsContent />
    </Suspense>
  );
}
