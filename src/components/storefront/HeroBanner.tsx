import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import type { IProduct } from "@/types";
import styles from "./HeroBanner.module.css";

interface HeroBannerProps {
  product?: IProduct | null;
}

export default function HeroBanner({ product }: HeroBannerProps) {
  const heroImage = product?.images?.[0];

  const plate = (
    <>
      {heroImage ? (
        <Image
          src={heroImage}
          alt={product?.name ?? ""}
          fill
          sizes="(max-width: 1024px) 460px, 40vw"
          className={styles.productImage}
          priority
        />
      ) : (
        <div className={styles.imageOrb} />
      )}
      <div className={styles.imageScrim} aria-hidden="true" />
      {product ? (
        <div className={styles.plate}>
          <span>
            {product.brand && (
              <span className={styles.plateBrand}>{product.brand}</span>
            )}
            <span className={styles.plateName}>{product.name}</span>
          </span>
          <span className={styles.plateMeta}>
            <span className={styles.plateMetaLabel}>From</span>
            <span className={styles.plateMetaValue}>
              {formatPrice(product.price)}
            </span>
          </span>
        </div>
      ) : (
        <span className={styles.plateEmpty}>
          Featured pieces appear here once the catalog is seeded
        </span>
      )}
    </>
  );

  return (
    <section className={styles.hero} id="hero-banner">
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.headlineWrap}>
            <div className={styles.eyebrowRow}>
              <span className={styles.eyebrowLine} />
              <span className={styles.eyebrow}>The premium tech atelier</span>
            </div>

            <h1 className={styles.headline}>
              <span className={styles.line}>
                <span className={styles.lineInner}>Objects of</span>
              </span>
              <span className={styles.line}>
                <span className={`${styles.lineInner} ${styles.italic}`}>
                  quiet
                </span>
              </span>
              <span className={styles.line}>
                <span className={styles.lineInner}>obsession.</span>
              </span>
            </h1>

            <p className={styles.subheading}>
              A tight edit of premium electronics and custom builds, vetted and
              photographed before anything ships.
            </p>

            <div className={styles.ctaRow}>
              <Link href="/products" className={styles.ctaPrimary}>
                Explore the edit
              </Link>
              <Link href="/pc-builder" className={styles.ctaSecondary}>
                Build a PC
              </Link>
            </div>
          </div>

          <div className={styles.visualWrap}>
            <div className={styles.plateTilt}>
              {product ? (
                <Link
                  href={`/products/${product.slug}`}
                  className={styles.imageFrame}
                >
                  {plate}
                </Link>
              ) : (
                <div className={styles.imageFrame}>{plate}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
