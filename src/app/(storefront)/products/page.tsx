import { Suspense } from "react";
import type { Metadata } from "next";
import ProductsContent, { ProductGridLoading } from "./ProductsContent";
import styles from "./products.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop premium electronics",
  description: "Browse TechChasers' curated electronics, components, and considered tech objects.",
  alternates: { canonical: "/products" },
};

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
