import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import styles from "./HeroBanner.module.css";

export default function HeroBanner() {
  return (
    <section className={styles.hero} id="hero-banner">
      <div className={styles.inner}>
        <div className={styles.topMeta}>
          <div className={styles.metaLeft}>
            <span className={styles.metaDot} />
            <span>Live · Edition 04 / 2026</span>
          </div>
          <div className={styles.metaRight}>
            <span>Curated in Berlin</span>
            <span>·</span>
            <span>Shipped Worldwide</span>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.headlineWrap}>
            <Reveal variant="up" delay={100}>
              <div className={styles.eyebrowRow}>
                <span className={styles.eyebrowLine} />
                <span className={styles.eyebrow}>The Premium Tech Atelier</span>
              </div>
            </Reveal>

            <Reveal variant="up" delay={200}>
              <h1 className={styles.headline}>
                <span>Objects of</span>
                <span className={styles.italic}>quiet</span>
                <span>obsession.</span>
              </h1>
            </Reveal>

            <Reveal variant="up" delay={400}>
              <p className={styles.subheading}>
                A curated edit of premium electronics, custom PC builds, and
                considered tech — photographed, vetted, and shipped by people
                who care more about the details than the average.
              </p>
            </Reveal>

            <Reveal variant="up" delay={550}>
              <div className={styles.ctaRow}>
                <Link
                  href="/products"
                  className={styles.ctaPrimary}
                  data-cursor-text="Shop"
                >
                  Explore the Edit
                </Link>
                <Link
                  href="/pc-builder"
                  className={styles.ctaSecondary}
                  data-cursor-text="Build"
                >
                  Build a PC
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal variant="scale" delay={300} className={styles.visualWrap}>
            <div className={styles.imageFrame}>
              <div className={styles.imageBadge}>
                <span className={styles.imageBadgeDot} />
                Featured Drop
              </div>
              <div className={styles.imageOrb} />
              <div className={styles.imageCaption}>
                Issue 04
                <br />
                Quiet Materials
              </div>
              <div className={styles.imageStat}>
                <div className={styles.imageStatLabel}>From</div>
                <div className={styles.imageStatValue}>$1,299</div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal variant="up" delay={700}>
          <div className={styles.bottomRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                250<span className={styles.statValueItalic}>+</span>
              </span>
              <span className={styles.statLabel}>
                Pieces curated
                <br />
                this season
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                <span className={styles.statValueItalic}>32</span>
              </span>
              <span className={styles.statLabel}>
                Brands
                <br />
                represented
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                <span className={styles.statValueItalic}>4.9</span>
              </span>
              <span className={styles.statLabel}>
                Average review
                <br />
                from 12,000+ buyers
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                48<span className={styles.statValueItalic}>h</span>
              </span>
              <span className={styles.statLabel}>
                Express shipping
                <br />
                worldwide
              </span>
            </div>
          </div>
        </Reveal>
      </div>

      <div className={styles.scrollHint}>
        <span>Scroll</span>
        <span className={styles.scrollLine} />
      </div>
    </section>
  );
}
