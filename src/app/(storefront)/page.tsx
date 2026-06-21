import Link from "next/link";
import HeroBanner from "@/components/storefront/HeroBanner";
import ProductCard from "@/components/storefront/ProductCard";
import CategoryCard from "@/components/storefront/CategoryCard";
import Marquee from "@/components/ui/Marquee";
import Reveal from "@/components/ui/Reveal";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import type { IProduct, ICategory } from "@/types";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 60;

async function getHomeData() {
  try {
    await dbConnect();
    const [featuredRaw, categoriesRaw] = await Promise.all([
      Product.find({ isActive: true, featured: true })
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Category.find({ isActive: true }).limit(8).lean(),
    ]);

    const categoryIds = categoriesRaw.map((c) => c._id);
    const counts = await Promise.all(
      categoryIds.map((id) =>
        Product.countDocuments({ category: id, isActive: true })
      )
    );
    const categories = categoriesRaw.map((c, i) => ({
      ...c,
      productCount: counts[i],
    }));

    return {
      featured: JSON.parse(JSON.stringify(featuredRaw)) as IProduct[],
      categories: JSON.parse(JSON.stringify(categories)) as (ICategory & {
        productCount: number;
      })[],
    };
  } catch {
    return { featured: [], categories: [] };
  }
}

export default async function HomePage() {
  const { featured, categories } = await getHomeData();

  return (
    <>
      <HeroBanner />

      {/* Marquee strip — editorial brand declaration */}
      <div className={styles.marqueeStrip}>
        <Marquee
          items={[
            "Curated since 2019",
            "Free 48h shipping",
            "Premium electronics",
            "PC builder atelier",
            "Hand-vetted brands",
            "2-year warranty",
          ]}
          size="small"
          duration={32}
          separator="asterisk"
        />
      </div>

      {/* Categories */}
      <section className={`${styles.section} container`} id="categories">
        <div className={styles.sectionHead}>
          <Reveal variant="up" className={styles.sectionHeadCol}>
            <div className={styles.sectionEyebrowRow}>
              <span className={styles.sectionEyebrowLine} />
              <span className={styles.sectionEyebrow}>
                Browse / Curated Edits
              </span>
            </div>
            <h2 className={styles.sectionTitle}>
              The <em className={styles.italic}>shelves</em>,
              <br />
              by category.
            </h2>
          </Reveal>
          <Reveal variant="up" delay={150} className={styles.sectionHeadCol}>
            <p className={styles.sectionDescription}>
              Every category is treated like a gallery — a tight edit of
              objects we believe in. No filler, no noise. Just the pieces
              worth coveting.
            </p>
            <Link
              href="/products"
              className={styles.sectionLink}
              data-cursor-text="All"
            >
              View entire catalog
              <span>→</span>
            </Link>
          </Reveal>
        </div>

        {categories.length === 0 ? (
          <div className={styles.empty}>
            Categories will appear here once you seed the database.
          </div>
        ) : (
          <div className={styles.categoriesGrid}>
            {categories.slice(0, 4).map((cat, i) => (
              <Reveal key={cat._id} variant="up" delay={i * 100}>
                <CategoryCard
                  name={cat.name}
                  slug={cat.slug}
                  image={cat.image || "/placeholder.svg"}
                  productCount={cat.productCount}
                  index={i}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Quote / editorial statement */}
      <section className={styles.quote}>
        <div className="container-tight">
          <Reveal variant="up">
            <p className={styles.quoteText}>
              We don&apos;t sell <em>everything</em>.
              <br />
              We sell <em>the right thing</em>, photographed
              <br />
              and shipped like an object should be.
            </p>
          </Reveal>
          <Reveal variant="up" delay={200}>
            <p className={styles.quoteCite}>— TechHH Editorial</p>
          </Reveal>
        </div>
      </section>

      {/* Featured products */}
      <section className={`${styles.section} container`} id="featured">
        <div className={styles.sectionHead}>
          <Reveal variant="up" className={styles.sectionHeadCol}>
            <div className={styles.sectionEyebrowRow}>
              <span className={styles.sectionEyebrowLine} />
              <span className={styles.sectionEyebrow}>
                The Edit / Featured Pieces
              </span>
            </div>
            <h2 className={styles.sectionTitle}>
              Currently <em className={styles.italic}>obsessed</em>.
            </h2>
          </Reveal>
          <Reveal variant="up" delay={150} className={styles.sectionHeadCol}>
            <p className={styles.sectionDescription}>
              Eight pieces our buyers can&apos;t stop talking about this
              quarter — chosen for their material honesty, their detail, and
              the way they make ordinary moments feel deliberate.
            </p>
            <Link
              href="/products"
              className={styles.sectionLink}
              data-cursor-text="See"
            >
              See all pieces
              <span>→</span>
            </Link>
          </Reveal>
        </div>

        {featured.length === 0 ? (
          <div className={styles.empty}>
            Featured products will appear here once you seed the database.
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {featured.slice(0, 8).map((product, i) => (
              <Reveal key={product._id} variant="up" delay={(i % 4) * 100}>
                <ProductCard product={product} index={i} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Second marquee — typographic statement */}
      <Marquee
        items={[
          "Built for obsessives",
          "Shot in studio",
          "Shipped worldwide",
          "Made to be kept",
        ]}
        size="large"
        duration={50}
        separator="asterisk"
      />

      {/* PC Builder CTA — dark editorial */}
      <section className={styles.buildCta}>
        <div className="container">
          <div className={styles.buildCtaInner}>
            <Reveal variant="up" className={styles.buildCtaHeader}>
              <div className={styles.buildCtaEyebrow}>
                <span className={styles.buildCtaEyebrowLine} />
                Atelier / PC Builder
              </div>
              <h2 className={styles.buildCtaTitle}>
                Compose
                <br />
                your <em>rig</em>.
              </h2>
              <p className={styles.buildCtaText}>
                Pick each part. Check compatibility live. Watch the price
                breathe. Your dream machine — assembled like an editorial
                spread, ordered like a single piece.
              </p>
              <Link
                href="/pc-builder"
                className={styles.buildCtaButton}
                data-cursor-text="Start"
              >
                Begin Atelier
              </Link>
            </Reveal>

            <Reveal variant="up" delay={200}>
              <div className={styles.buildCtaSteps}>
                {[
                  {
                    n: "01",
                    title: "Choose the processor",
                    sub: "Intel · AMD · the silent engine",
                  },
                  {
                    n: "02",
                    title: "Pair the right GPU",
                    sub: "NVIDIA · AMD · curated for studio + gaming",
                  },
                  {
                    n: "03",
                    title: "Memory & storage",
                    sub: "Tuned for your workload, sized for the future",
                  },
                  {
                    n: "04",
                    title: "Power & cooling",
                    sub: "Reliable. Quiet. Engineered to last",
                  },
                ].map((step) => (
                  <div key={step.n} className={styles.buildCtaStep}>
                    <span className={styles.buildCtaStepNum}>{step.n}</span>
                    <div className={styles.buildCtaStepBody}>
                      <span className={styles.buildCtaStepTitle}>
                        {step.title}
                      </span>
                      <span className={styles.buildCtaStepSub}>
                        {step.sub}
                      </span>
                    </div>
                    <span
                      className={styles.buildCtaStepArrow}
                      aria-hidden="true"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 6h8M7 3l3 3-3 3"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="container">
        <div className={styles.trustStrip}>
          {[
            {
              icon: (
                <svg
                  className={styles.trustIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="6" width="14" height="12" rx="1" />
                  <path d="M16 9h4l2 3v6h-6V9z" />
                  <circle cx="6" cy="19" r="2" />
                  <circle cx="18" cy="19" r="2" />
                </svg>
              ),
              label: "48h Shipping",
              sub: "Express worldwide on every order over $100.",
            },
            {
              icon: (
                <svg
                  className={styles.trustIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              ),
              label: "2-Year Warranty",
              sub: "Every piece backed by our atelier, no asterisk.",
            },
            {
              icon: (
                <svg
                  className={styles.trustIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 12l3 3 5-6" />
                </svg>
              ),
              label: "Hand-vetted",
              sub: "We test every piece before it ships from the studio.",
            },
            {
              icon: (
                <svg
                  className={styles.trustIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-7.6-4.7L3 21l1.7-1.9A8.5 8.5 0 0 1 21 11.5z" />
                </svg>
              ),
              label: "Studio Concierge",
              sub: "Real humans on chat — usually a builder, never a bot.",
            },
          ].map((item, i) => (
            <Reveal key={item.label} variant="up" delay={i * 100}>
              <div className={styles.trustItem}>
                {item.icon}
                <span className={styles.trustLabel}>{item.label}</span>
                <span className={styles.trustSub}>{item.sub}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
