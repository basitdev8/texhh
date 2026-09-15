import Link from "next/link";
import HeroBanner from "@/components/storefront/HeroBanner";
import ProductCard from "@/components/storefront/ProductCard";
import CategoryCard from "@/components/storefront/CategoryCard";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import PCComponent from "@/models/PCComponent";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/utils";
import type { IProduct, ICategory } from "@/types";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/** A small number of image-led destinations, not an exhaustive taxonomy. */
const MAX_HOME_CATEGORIES = 6;

async function getHomeData() {
  try {
    await dbConnect();
    const settings = await getSettings();

    const selectionIds = [
      ...(settings.heroProductId ? [settings.heroProductId] : []),
      ...settings.homeFeaturedProductIds,
    ];

    const [selectedRaw, legacyFeaturedRaw, categoriesRaw, recentProductsRaw, componentCount] =
      await Promise.all([
        selectionIds.length > 0
          ? Product.find({ _id: { $in: selectionIds }, isActive: true })
              .populate("category", "name slug")
              .lean()
          : Promise.resolve([]),
        !settings.homeFeatureSelectionConfigured
          ? Product.find({ isActive: true, featured: true })
              .populate("category", "name slug")
              .sort({ createdAt: -1 })
              .limit(8)
              .lean()
          : Promise.resolve([]),
        Category.find({ isActive: true }).limit(MAX_HOME_CATEGORIES).lean(),
        Product.find({ isActive: true })
          .populate("category", "name slug")
          .sort({ createdAt: -1 })
          .limit(8)
          .lean(),
        PCComponent.countDocuments({ isActive: true }),
      ]);

    const categoryIds = categoriesRaw.map((c) => c._id);
    const counts = await Promise.all(
      categoryIds.map((id) => Product.countDocuments({ category: id, isActive: true }))
    );
    const categories = categoriesRaw.map((c, i) => ({
      ...c,
      productCount: counts[i],
    }));

    const selected = JSON.parse(JSON.stringify(selectedRaw)) as IProduct[];
    const selectedById = new Map(selected.map((product) => [product._id, product]));
    const heroProduct = settings.heroProductId
      ? selectedById.get(settings.heroProductId) ?? null
      : null;
    const popularProducts = settings.homeFeaturedProductIds
      .map((id) => selectedById.get(id))
      .filter((product): product is IProduct => Boolean(product));
    const legacyFeatured = JSON.parse(JSON.stringify(legacyFeaturedRaw)) as IProduct[];
    const recentProducts = JSON.parse(JSON.stringify(recentProductsRaw)) as IProduct[];

    return {
      heroProduct: settings.homeFeatureSelectionConfigured
        ? heroProduct
        : legacyFeatured[0] ?? recentProducts[0] ?? null,
      popularProducts: settings.homeFeatureSelectionConfigured
        ? popularProducts
        : legacyFeatured.slice(0, 8).length > 0
        ? legacyFeatured.slice(0, 8)
        : recentProducts.slice(0, 8),
      categories: JSON.parse(JSON.stringify(categories)) as (ICategory & {
        productCount: number;
      })[],
      componentCount,
      settings,
    };
  } catch {
    return {
      heroProduct: null,
      popularProducts: [],
      categories: [],
      componentCount: 0,
      settings: {
        freeShippingThreshold: 5000,
        shippingBannerText: "Free express shipping on orders over ₹5,000",
        codEnabled: true,
        codMaxOrderAmount: 25000,
      },
    };
  }
}

export default async function HomePage() {
  const { heroProduct, popularProducts, categories, componentCount, settings } =
    await getHomeData();

  return (
    <div className={styles.home}>
      {/* 1. Featured product */}
      <HeroBanner product={heroProduct} />

      {/* 2. Categories */}
      {categories.length > 0 && (
        <section className={styles.section} id="categories" aria-labelledby="categories-heading">
          <div className="container">
            <div className={styles.sectionHead}>
              <h2 id="categories-heading" className={styles.sectionTitle}>
                Shop by category
              </h2>
              <Link href="/products" className={styles.sectionLink}>
                View products
              </Link>
            </div>

            <div className={styles.categoryRow}>
              {categories.map((cat) => (
                <CategoryCard
                  key={cat._id}
                  name={cat.name}
                  slug={cat.slug}
                  image={cat.image || "/placeholder.svg"}
                  productCount={cat.productCount}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. One curated collection */}
      {popularProducts.length > 0 && (
        <section className={styles.section} id="popular-products" aria-labelledby="popular-heading">
          <div className="container">
            <div className={styles.sectionHead}>
              <h2 id="popular-heading" className={styles.sectionTitle}>
                Popular right now
              </h2>
              <Link href="/products" className={styles.sectionLink}>
                View products
              </Link>
            </div>

            <div className={styles.productRow}>
              {popularProducts.map((product) => (
                <ProductCard key={product._id} product={product} discoveryOnly />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. PC Builder campaign */}
      <section className={styles.section} id="pc-builder-feature" aria-labelledby="builder-heading">
        <div className="container">
          <div className={styles.builder}>
            <h2 id="builder-heading" className={styles.builderTitle}>
              Build a PC that fits together
            </h2>
            <p className={styles.builderText}>
              Pick your parts from {componentCount > 0 ? componentCount : "our"} components and
              we check compatibility as you go.
            </p>
            <Link href="/pc-builder" className={styles.builderAction}>
              Start a build
            </Link>
          </div>
        </div>
      </section>

      {/* Reassurance: one slim line, not three cards */}
      <div className={styles.assurance}>
        <div className="container">
          <p className={styles.assuranceLine}>
            <span>
              Free express shipping over {formatPrice(settings.freeShippingThreshold || 5000)}
            </span>
            <span aria-hidden="true">·</span>
            <span>Secure payment</span>
            <span aria-hidden="true">·</span>
            <span>Manufacturer warranty</span>
          </p>
        </div>
      </div>
    </div>
  );
}
