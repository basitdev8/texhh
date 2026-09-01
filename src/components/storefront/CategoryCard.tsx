import Link from "next/link";
import Image from "next/image";
import styles from "./CategoryCard.module.css";

interface CategoryCardProps {
  name: string;
  slug: string;
  image: string;
  productCount?: number;
}

export default function CategoryCard({
  name,
  slug,
  image,
  productCount,
}: CategoryCardProps) {
  return (
    <Link
      href={`/products?category=${slug}`}
      className={styles.card}
      aria-label={`Browse ${name} category`}
    >
      <div className={styles.imageWrap}>
        <Image
          src={image || "/placeholder.svg"}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className={styles.image}
        />
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{name}</h3>
        {typeof productCount === "number" && (
          <span className={styles.count}>
            {productCount} {productCount === 1 ? "product" : "products"}
          </span>
        )}
      </div>
    </Link>
  );
}
