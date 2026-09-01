import Link from "next/link";
import Image from "next/image";
import { formatPrice, getProductSignalRail } from "@/lib/utils";
import type { IProduct } from "@/types";
import styles from "./HeroBanner.module.css";

interface HeroBannerProps {
  product?: IProduct | null;
}

export default function HeroBanner({ product }: HeroBannerProps) {
  const heroImage = product?.images?.[0];
  const signalRail = product ? getProductSignalRail(product.specifications) : null;
  const hasLongTitle = (product?.name.length ?? 0) > 52;
  const description =
    product?.shortDescription && product.shortDescription.trim().length >= 32
      ? product.shortDescription
      : "See the key specifications, current price, and availability at a glance.";

  return (
    <section className={styles.hero} id="hero-banner" aria-label="Featured highlight">
      <div className={`${styles.stage} ${product ? "" : styles.stageEmpty}`}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>
            {product?.brand ? `Featured · ${product.brand}` : "TechChasers"}
          </span>

          <h1 className={`${styles.headline} ${hasLongTitle ? styles.longHeadline : ""}`}>
            {product
              ? product.name
              : "Phones, PCs, and parts—chosen with precision."}
          </h1>

          <p className={styles.subheading}>
            {product
              ? description
              : "Compare the specifications that matter, shop trusted electronics, or build a compatible PC from the ground up."}
          </p>

          {product && (
            <div className={styles.productFacts} aria-label="Featured product details">
              <span className={styles.price}>{formatPrice(product.price)}</span>
              {signalRail && <span className={styles.signalRail}>{signalRail}</span>}
            </div>
          )}

          <div className={styles.ctaRow}>
            <Link href="/products" className={styles.ctaPrimary}>
              Shop products
            </Link>
            <Link href="/pc-builder" className={styles.ctaSecondary}>
              Build a PC
            </Link>
          </div>
        </div>

        {product && (
          <div className={styles.showcase}>
            <Link
              href={`/products/${product.slug}`}
              className={styles.imageLink}
              aria-label={`View ${product.name}`}
            >
              <div className={styles.imageStage}>
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 92vw, (max-width: 1200px) 80vw, 1120px"
                    className={styles.productImage}
                    priority
                  />
                ) : (
                  <div className={styles.fallbackVisual}>{product.brand || "TechChasers"}</div>
                )}
              </div>
              <span className={styles.viewProduct}>
                View featured product
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 13 13 3M6 3h7v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
