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

const BUILD_HIGHLIGHTS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    ),
    title: "1. Select your processor & GPU",
    desc: "Match Intel or AMD platforms with graphics cards tailored to your gaming or creator workload.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    title: "2. Live compatibility validation",
    desc: "Our engine checks socket types, form factors, RAM generations, and power requirements in real time.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    title: "3. One-click checkout",
    desc: "Send all 8 compatible parts to your cart in a single step with unified shipping and tracking.",
  },
];

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
        Category.find({ isActive: true }).limit(8).lean(),
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
      recentProducts: recentProducts.slice(0, 4),
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
      recentProducts: [],
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
  const { heroProduct, popularProducts, recentProducts, categories, componentCount, settings } =
    await getHomeData();

  return (
    <div className={styles.homeContainer}>
      {/* 1. Campaign Hero */}
      <HeroBanner product={heroProduct} />

      {/* 2. Shop by Category */}
      {categories.length > 0 && (
        <section className={styles.section} id="categories" aria-labelledby="categories-heading">
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Browse Catalog</span>
                <h2 id="categories-heading" className={styles.sectionTitle}>
                  Shop by Category
                </h2>
              </div>
              <Link href="/products" className={styles.sectionLink}>
                View all products →
              </Link>
            </div>

            <div className={styles.categoryGrid}>
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

      {/* 3. Popular Products Rail */}
      {popularProducts.length > 0 && (
        <section className={styles.section} id="popular-products" aria-labelledby="popular-heading">
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Top Picks</span>
                <h2 id="popular-heading" className={styles.sectionTitle}>
                  Popular Products
                </h2>
              </div>
              <Link href="/products" className={styles.sectionLink}>
                Explore full catalog →
              </Link>
            </div>

            <div className={styles.productGrid}>
              {popularProducts.map((product) => (
                <ProductCard key={product._id} product={product} discoveryOnly />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. PC Builder Module */}
      <section className={styles.builderSection} id="pc-builder-feature" aria-labelledby="builder-heading">
        <div className="container">
          <div className={styles.builderCard}>
            <div className={styles.builderHeader}>
              <div className={styles.builderHeaderMain}>
                <span className={styles.builderEyebrow}>Interactive PC Configurator</span>
                <h2 id="builder-heading" className={styles.builderTitle}>
                  Build your custom PC with verified compatibility.
                </h2>
                <p className={styles.builderSubtitle}>
                  Choose from {componentCount > 0 ? componentCount : "hundreds of"} processors,
                  graphics cards, motherboards, memory, and cases. Our rule engine validates every
                  part before you buy.
                </p>
                <div className={styles.builderCtaRow}>
                  <Link href="/pc-builder" className={styles.builderCtaBtn}>
                    Start a build
                  </Link>
                  <span className={styles.builderMeta}>8 component slots · instant compatibility check</span>
                </div>
              </div>
            </div>

            <div className={styles.builderHighlights}>
              {BUILD_HIGHLIGHTS.map((item, idx) => (
                <div key={idx} className={styles.highlightItem}>
                  <div className={styles.highlightIcon} aria-hidden="true">
                    {item.icon}
                  </div>
                  <h3 className={styles.highlightTitle}>{item.title}</h3>
                  <p className={styles.highlightDesc}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Confidence Strip */}
      <section className={styles.confidenceSection} aria-label="Customer assurances">
        <div className="container">
          <div className={styles.confidenceGrid}>
            <div className={styles.confidenceItem}>
              <div className={styles.confidenceIcon} aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div className={styles.confidenceText}>
                <h3 className={styles.confidenceTitle}>Free Express Shipping</h3>
                <p className={styles.confidenceDesc}>
                  On orders over {formatPrice(settings.freeShippingThreshold || 5000)}. Delivered within 48–72 hours.
                </p>
              </div>
            </div>

            <div className={styles.confidenceItem}>
              <div className={styles.confidenceIcon} aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className={styles.confidenceText}>
                <h3 className={styles.confidenceTitle}>Secure Payments</h3>
                <p className={styles.confidenceDesc}>
                  Razorpay encrypted gateway supporting all major cards, UPI, netbanking &amp; COD.
                </p>
              </div>
            </div>

            <div className={styles.confidenceItem}>
              <div className={styles.confidenceIcon} aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className={styles.confidenceText}>
                <h3 className={styles.confidenceTitle}>Warranty &amp; Support</h3>
                <p className={styles.confidenceDesc}>
                  Official manufacturer warranty on every genuine product, plus dedicated support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Recently Added / Recommended Rail */}
      {recentProducts.length > 0 && (
        <section className={styles.section} id="recent-products" aria-labelledby="recent-heading">
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Latest Additions</span>
                <h2 id="recent-heading" className={styles.sectionTitle}>
                  Recently Added
                </h2>
              </div>
              <Link href="/products?sort=-createdAt" className={styles.sectionLink}>
                View all new arrivals →
              </Link>
            </div>

            <div className={styles.productGrid}>
              {recentProducts.map((product) => (
                <ProductCard key={product._id} product={product} discoveryOnly />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
