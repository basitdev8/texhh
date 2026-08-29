import { Suspense } from "react";
import ProductsContent, { ProductGridLoading } from "./ProductsContent";
import styles from "./products.module.css";

export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className="container">
            <ProductGridLoading />
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
