import Link from "next/link";
import Image from "next/image";
import styles from "./CategoryCard.module.css";

interface CategoryCardProps {
  name: string;
  slug: string;
  image: string;
  productCount: number;
  index?: number;
}

export default function CategoryCard({
  name,
  slug,
  image,
  productCount,
  index,
}: CategoryCardProps) {
  const indexLabel =
    typeof index === "number" ? String(index + 1).padStart(2, "0") : "";

  return (
    <Link
      href={`/products?category=${slug}`}
      className={styles.card}
      aria-label={`Browse ${name}`}
    >
      <div className={styles.imageWrap}>
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={styles.image}
        />
        {indexLabel && <span className={styles.number}>№ {indexLabel}</span>}
        <div className={styles.overlayInfo}>
          <h3 className={styles.name}>{name}</h3>
          <span className={styles.arrowCircle} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 11L11 3M11 3H5M11 3V9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
      <div className={styles.bottomMeta}>
        <span>Category</span>
        <span className={styles.count}>
          {productCount} {productCount === 1 ? "piece" : "pieces"}
        </span>
      </div>
    </Link>
  );
}
