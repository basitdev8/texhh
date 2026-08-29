import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer} id="main-footer">
      <div className={styles.inner}>
        <div className={styles.topMeta}>
          <span className={styles.topMetaLabel}>
            TechChasers · Edition 04 · 2026
          </span>
          <span className={styles.topMetaItalic}>
            <em>Stay close.</em> Subscribe below.
          </span>
        </div>

        <div className={styles.grid}>
          <div className={styles.column}>
            <span className={styles.colTitle}>The Atelier</span>
            <p className={styles.aboutText}>
              TechChasers is a small studio obsessed with how technology{" "}
              <em>feels</em>. We photograph it, vet it, and ship it like
              an object should be — with quiet care, never on the cheap.
            </p>
            <div className={styles.socials}>
              <a
                href="#"
                className={styles.socialIcon}
                aria-label="Facebook"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              <a
                href="#"
                className={styles.socialIcon}
                aria-label="Twitter"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </a>
              <a
                href="#"
                className={styles.socialIcon}
                aria-label="Instagram"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>

          <div className={styles.column}>
            <span className={styles.colTitle}>Shop</span>
            <nav className={styles.links}>
              <Link href="/products" className={styles.link}>
                All Products
              </Link>
              <Link
                href="/products?category=tws-bluetooth"
                className={styles.link}
              >
                Earbuds
              </Link>
              <Link
                href="/products?category=wireless-headphones"
                className={styles.link}
              >
                Headphones
              </Link>
              <Link
                href="/products?category=smartwatches"
                className={styles.link}
              >
                Smartwatches
              </Link>
              <Link href="/pc-builder" className={styles.link}>
                PC Builder
              </Link>
            </nav>
          </div>

          <div className={styles.column}>
            <span className={styles.colTitle}>Studio</span>
            <nav className={styles.links}>
              <Link href="/policies/contact" className={styles.link}>Contact</Link>
              <Link href="/policies/shipping" className={styles.link}>Shipping</Link>
              <Link href="/policies/refunds" className={styles.link}>Returns &amp; Refunds</Link>
              <Link href="/policies/terms" className={styles.link}>Terms</Link>
              <Link href="/policies/privacy" className={styles.link}>Privacy</Link>
            </nav>
          </div>

          <div className={styles.column}>
            <span className={styles.colTitle}>Help</span>
            <p className={styles.aboutText}>
              Questions about an order, a return, or which parts fit together? Talk to a
              person — we answer with your order number in hand.
            </p>
            <nav className={styles.links}>
              <Link href="/policies/contact" className={styles.link}>
                Contact support
              </Link>
              <Link href="/account" className={styles.link}>
                Track an order
              </Link>
              <Link href="/pc-builder" className={styles.link}>
                Build a PC
              </Link>
            </nav>
          </div>
        </div>

        {/* Huge wordmark — the editorial signature */}
        <div className={styles.wordmark} aria-hidden="true">
          Tech<em>Chasers</em>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} TechChasers — Curated tech for the
            considered.
          </p>
          <div className={styles.bottomLinks}>
            <Link href="/policies/privacy" className={styles.bottomLink}>Privacy</Link>
            <Link href="/policies/terms" className={styles.bottomLink}>Terms</Link>
            <Link href="/policies/refunds" className={styles.bottomLink}>Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
