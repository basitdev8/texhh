import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer} id="main-footer">
      <div className={styles.inner}>
        <div className={styles.grid}>
          {/* Column 1: Brand & Assurance */}
          <div className={styles.column}>
            <span className={styles.brandTitle}>TechChasers</span>
            <p className={styles.brandText}>
              Precision electronics, smartphones, computers, and custom PC components.
              Assembled and delivered with care.
            </p>
            <div className={styles.assuranceList}>
              <div className={styles.assuranceItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span>Free express shipping on eligible orders</span>
              </div>
              <div className={styles.assuranceItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Verified secure checkout &amp; payment</span>
              </div>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div className={styles.column}>
            <h3 className={styles.colTitle}>Shop</h3>
            <nav className={styles.links} aria-label="Shop links">
              <Link href="/products" className={styles.link}>
                All Products
              </Link>
              <Link href="/products?category=smartphones" className={styles.link}>
                Smartphones
              </Link>
              <Link href="/products?category=laptops" className={styles.link}>
                Laptops &amp; Computers
              </Link>
              <Link href="/pc-builder" className={styles.link}>
                PC Builder
              </Link>
              <Link href="/products?category=accessories" className={styles.link}>
                Accessories
              </Link>
            </nav>
          </div>

          {/* Column 3: Orders & Support */}
          <div className={styles.column}>
            <h3 className={styles.colTitle}>Orders &amp; Support</h3>
            <nav className={styles.links} aria-label="Support links">
              <Link href="/account" className={styles.link}>
                My Account
              </Link>
              <Link href="/account" className={styles.link}>
                Track Orders
              </Link>
              <Link href="/policies/shipping" className={styles.link}>
                Shipping Policy
              </Link>
              <Link href="/policies/refunds" className={styles.link}>
                Returns &amp; Refunds
              </Link>
              <Link href="/policies/contact" className={styles.link}>
                Contact Support
              </Link>
            </nav>
          </div>

          {/* Column 4: Company & Legal */}
          <div className={styles.column}>
            <h3 className={styles.colTitle}>Company &amp; Legal</h3>
            <nav className={styles.links} aria-label="Legal links">
              <Link href="/policies/terms" className={styles.link}>
                Terms of Service
              </Link>
              <Link href="/policies/privacy" className={styles.link}>
                Privacy Policy
              </Link>
              <Link href="/policies/contact" className={styles.link}>
                Help &amp; FAQ
              </Link>
            </nav>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} TechChasers. All rights reserved.
          </p>
          <div className={styles.bottomLinks}>
            <Link href="/policies/privacy" className={styles.bottomLink}>Privacy</Link>
            <Link href="/policies/terms" className={styles.bottomLink}>Terms</Link>
            <Link href="/policies/shipping" className={styles.bottomLink}>Shipping</Link>
            <Link href="/policies/refunds" className={styles.bottomLink}>Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
