import Link from "next/link";
import Image from "next/image";
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

/* The four choices a build comes down to. Parallel options, not a
   numbered sequence, so they carry no step numerals. */
const BUILD_STEPS = [
  {
    title: "Choose the processor",
    sub: "Intel and AMD, matched to your workload",
  },
  {
    title: "Pair the right GPU",
    sub: "Studio rendering or high frame rates",
  },
  {
    title: "Memory and storage",
    sub: "Sized for now, with room to grow",
  },
  {
    title: "Power and cooling",
    sub: "Quiet, reliable, correctly rated",
  },
];

async function getHomeData() {
  try {
    await dbConnect();
    const [featuredRaw, categoriesRaw, productCount, brands] = await Promise.all([
      Product.find({ isActive: true, featured: true })
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Category.find({ isActive: true }).limit(8).lean(),
      Product.countDocuments({ isActive: true }),
      Product.distinct("brand", { isActive: true }),
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
      productCount,
      brandCount: brands.filter(Boolean).length,
    };
  } catch {
    return { featured: [], categories: [], productCount: 0, brandCount: 0 };
  }
}

export default async function HomePage() {
  const { featured, categories, productCount, brandCount } = await getHomeData();

  /* The hero already carries the first piece, so the edit starts at the
     second one rather than showing the same product twice. */
  const heroProduct = featured[0] ?? null;
  const editProducts = featured.length > 1 ? featured.slice(1, 7) : featured;

  /* Category covers are shot as scenes, so one of them carries the
     statement band better than a product cutout would. */
  const bandImage =
    categories[categories.length - 1]?.image ||
    heroProduct?.images?.[0] ||
    null;

  const ledger: { figure: string; label: string; accent?: boolean }[] = [];
  if (productCount > 0) {
    ledger.push({ figure: String(productCount), label: "Pieces in the edit" });
  }
  if (brandCount > 0) {
    ledger.push({ figure: String(brandCount), label: "Brands represented" });
  }
  ledger.push({ figure: "48h", label: "Express dispatch", accent: true });
  ledger.push({ figure: "2yr", label: "Warranty on everything", accent: true });

  return (
    <>
      <HeroBanner product={heroProduct} />

      {/* Categories as a rail that runs off the edge of the page */}
      <section className={styles.railSection} id="categories">
        <div className="container">
          <Reveal className={styles.railHead}>
            <h2 className={styles.sectionTitle}>
              The <em className={styles.italic}>shelves</em>,
              <br />
              by category.
            </h2>
            <p className={styles.sectionBody}>
              Every category is a tight edit. Nothing is here to fill space.
            </p>
          </Reveal>
        </div>

        {categories.length === 0 ? (
          <div className="container">
            <div className={styles.empty}>
              Categories appear here once the database is seeded.
            </div>
          </div>
        ) : (
          <Reveal delay={100}>
            <div
              className={styles.railScroller}
              role="region"
              aria-label="Shop by category"
            >
              <div className={styles.railTrack}>
                {categories.map((cat, i) => (
                  <div key={cat._id} className={styles.railItem}>
                    <CategoryCard
                      name={cat.name}
                      slug={cat.slug}
                      image={cat.image || "/placeholder.svg"}
                      productCount={cat.productCount}
                      index={i}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        )}
      </section>

      {/* The edit: the heading holds its place while the spread moves */}
      <section className={`${styles.section} container`} id="featured">
        <div className={styles.editLayout}>
          <div className={styles.editAside}>
            <div className={styles.eyebrowRow}>
              <span className={styles.eyebrowLine} />
              <span className={styles.eyebrow}>The edit</span>
            </div>
            <h2 className={styles.sectionTitle}>
              Currently <em className={styles.italic}>obsessed</em>.
            </h2>
            <p className={styles.sectionBody}>
              The pieces our buyers keep coming back to, chosen for material
              honesty and detail.
            </p>
            <Link href="/products" className={styles.sectionLink}>
              Explore the edit
              <span aria-hidden="true">→</span>
            </Link>
            <div className={styles.editProgress} aria-hidden="true">
              <span />
            </div>
          </div>

          {editProducts.length === 0 ? (
            <div className={styles.empty}>
              Featured pieces appear here once the database is seeded.
            </div>
          ) : (
            <div
              className={styles.editSpread}
              role="region"
              aria-label="Featured products"
            >
              {editProducts.map((product, i) => (
                <Reveal
                  key={product._id}
                  delay={(i % 2) * 100}
                  className={styles.spreadItem}
                >
                  <ProductCard product={product} index={i} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* The statement, over a real photograph */}
      <section className={styles.band}>
        {bandImage && (
          <div className={styles.bandMedia} aria-hidden="true">
            <Image
              src={bandImage}
              alt=""
              fill
              sizes="100vw"
              className={styles.bandImage}
            />
          </div>
        )}
        <div className={styles.bandScrim} aria-hidden="true" />
        <div className={`container-tight ${styles.bandInner}`}>
          <Reveal>
            <p className={styles.bandText}>
              We don&apos;t sell everything.
              <br />
              We sell <em>the right thing</em>,
              <br />
              photographed like it matters.
            </p>
          </Reveal>
        </div>
      </section>

      {/* One marquee, the typographic breath before the ink band */}
      <div className={styles.marqueeBlock}>
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
      </div>

      {/* PC Builder */}
      <section className={styles.buildCta}>
        <div className="container">
          <div className={styles.buildCtaInner}>
            <Reveal variant="up" className={styles.buildCtaHeader}>
              <div className={styles.buildCtaEyebrow}>
                <span className={styles.buildCtaEyebrowLine} />
                The PC Builder
              </div>
              <h2 className={styles.buildCtaTitle}>
                Compose
                <br />
                your <em>rig</em>.
              </h2>
              <p className={styles.buildCtaText}>
                Pick each part. Check compatibility as you go. Watch the total
                update in place, then order the whole build as one piece.
              </p>
              <Link href="/pc-builder" className={styles.buildCtaButton}>
                Build a PC
              </Link>
            </Reveal>

            <Reveal variant="up" delay={200}>
              <div className={styles.buildCtaSteps}>
                {BUILD_STEPS.map((step) => (
                  <div key={step.title} className={styles.buildCtaStep}>
                    <div className={styles.buildCtaStepBody}>
                      <span className={styles.buildCtaStepTitle}>
                        {step.title}
                      </span>
                      <span className={styles.buildCtaStepSub}>{step.sub}</span>
                    </div>
                    <span className={styles.buildCtaStepArrow} aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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

      {/* Closing ledger: catalog figures, then the two commitments */}
      <div className="container">
        <Reveal className={styles.ledger}>
          {ledger.map((cell) => (
            <div key={cell.label} className={styles.ledgerCell}>
              <span className={styles.ledgerFigure}>
                {cell.accent ? <em>{cell.figure}</em> : cell.figure}
              </span>
              <span className={styles.ledgerLabel}>{cell.label}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </>
  );
}
