import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import type { IProduct } from "@/types";
import styles from "./HeroBanner.module.css";

interface HeroBannerProps {
  product?: IProduct | null;
}

/**
 * One featured product per viewport: the image carries the moment, the copy
 * stays to a title, one line, the price, and two actions.
 */
export default function HeroBanner({ product }: HeroBannerProps) {
  const heroImage = product?.images?.[0];
  const hasLongTitle = (product?.name.length ?? 0) > 40;
  const supportingLine =
    product?.shortDescription && product.shortDescription.trim().length >= 24
      ? product.shortDescription
      : null;

  return (
    <section className={styles.hero} id="hero-banner" aria-label="Featured product">
      <div className={`${styles.stage} ${product ? "" : styles.stageEmpty}`}>
        <div className={styles.copy}>
          <h1 className={`${styles.headline} ${hasLongTitle ? styles.headlineLong : ""}`}>
            {product ? product.name : "Electronics, computers, and PC parts."}
          </h1>

          <p className={styles.support}>
            {product
              ? supportingLine ?? "Featured this week at TechChasers."
              : "Shop the catalog or build a compatible PC."}
          </p>

          {product && (
            <p className={styles.price}>{formatPrice(product.price)}</p>
          )}

          <div className={styles.actions}>
            {product ? (
              <>
                <Link href={`/products/${product.slug}`} className={styles.primary}>
                  Shop
                </Link>
                <Link href="/products" className={styles.secondary}>
                  View products
                </Link>
              </>
            ) : (
              <>
                <Link href="/products" className={styles.primary}>
                  Shop
                </Link>
                <Link href="/pc-builder" className={styles.secondary}>
                  Start a build
                </Link>
              </>
            )}
          </div>
        </div>

        {product && (
          <div className={styles.media}>
            {heroImage ? (
              <Image
                src={heroImage}
                alt={product.name}
                fill
                sizes="(max-width: 900px) 92vw, 60vw"
                className={styles.image}
                priority
              />
            ) : (
              <span className={styles.imageFallback}>{product.brand || "TechChasers"}</span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
